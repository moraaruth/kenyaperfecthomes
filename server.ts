import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import https from 'https';
import http from 'http';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { PropertyModel } from './src/models/Property.ts';
import { BookingModel } from './src/models/Booking.ts';
import { InquiryModel } from './src/models/Inquiry.ts';
import { UserModel, USER_ROLES, USER_STATUSES } from './src/models/User.ts';
import { normalizePropertyImages } from './src/lib/cloudinary.ts';
import {
  normalizeEmail,
  isAdminEmail,
  createAdminSessionToken,
  createUserSessionToken,
  verifySessionSignature,
  resolveSession,
  extractToken,
  requireAdminAuth,
  requireAdminOnly,
  SESSION_COOKIE_NAME,
  ADMIN_EMAILS,
  AuthenticatedRequest,
  UserRole,
} from './src/lib/auth.ts';
import {
  hashPassword,
  verifyPassword,
  validatePassword,
  validateName,
  validateEmail,
  isDatabaseReady,
  createResetToken,
  hashResetToken,
  sanitizeUser,
  rateLimit,
} from './src/lib/userAuth.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());

// Serverless (Vercel) never runs startServer(), so connect lazily per request.
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await ensureDatabase();
  } catch (err) {
    console.error('[Database] Lazy connect failed:', err);
  }
  next();
});

// Security: strict admin allowlist verification active
console.log(`[Security] Strict Admin Allowlist Active (${ADMIN_EMAILS.length} authorized accounts configured)`);

// Development Mode: Disable SSL verification for Cloudinary uploads
// WARNING: Only use in development. Never disable SSL verification in production.
if (!isProduction) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  console.log('[Development] SSL verification disabled for local development');
}

// Cloudinary Configuration
const hasCloudinaryCredentials = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinaryCredentials) {
  const config: any = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  };

  // Add insecure agents for development SSL bypass
  if (!isProduction) {
    config.https_agent = new https.Agent({ rejectUnauthorized: false });
    config.http_agent = new http.Agent({ keepAlive: true });
  }

  cloudinary.config(config);
  console.log(`[Cloudinary] Configured for cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
} else {
  console.log(
    '[Cloudinary] Credentials not set in environment. Running with local development upload fallback.'
  );
}

// Multer memory storage for direct streaming to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB max per file
  },
  fileFilter: (_req, file, cb) => {
    // Check MIME type and file extension
    const allowedMime = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
      'image/heic',
      'image/heif',
      'image/avif',
      'application/octet-stream', // Some mobile browsers send HEIC as octet-stream
    ];

    const extension = path.extname(file.originalname).toLowerCase();
    const allowedExts = [
      '.jpg',
      '.jpeg',
      '.png',
      '.webp',
      '.gif',
      '.svg',
      '.heic',
      '.heif',
      '.avif',
    ];

    if (allowedMime.includes(file.mimetype) || allowedExts.includes(extension)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Unsupported file format (${file.mimetype}). Supported formats: JPG, PNG, WEBP, GIF, SVG, HEIC, HEIF, AVIF.`
        )
      );
    }
  },
});

// In-memory fallback if MongoDB URI is not provided or offline
let inMemoryProperties: any[] = [];
let inMemoryBookings: any[] = [];
let inMemoryInquiries: any[] = [];

// Always read live connection state — never stale after ensureDatabase() resolves
const isMongoConnected = () => mongoose.connection.readyState === 1;

// Cached connection promise — reused across serverless invocations in the same container
let _dbConnectionPromise: Promise<void> | null = null;

export async function ensureDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('[Database] MONGODB_URI not set. Running with in-memory storage.');
    return;
  }

  if (!_dbConnectionPromise) {
    _dbConnectionPromise = mongoose
      .connect(mongoUri, { bufferCommands: false })
      .then(() => {
        console.log('[Database] Connected to MongoDB.');
      })
      .catch((err) => {
        _dbConnectionPromise = null;
        console.error('[Database] Connection failed:', err.message);
      });
  }

  await _dbConnectionPromise;
}



// ==========================================
// AUTHENTICATION & AUTHORIZATION ENDPOINTS
// ==========================================

const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const setSessionCookie = (res: Response, token: string) => {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_MS,
  });
};

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 });
const resetLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10 });

// POST /api/auth/login
// Allowlisted administrator emails sign in by email only (unchanged).
// All other emails must sign in with a password for a database account.
app.post('/api/auth/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const normalized = normalizeEmail(email);

    if (isAdminEmail(normalized)) {
      const token = createAdminSessionToken(normalized, name);
      setSessionCookie(res, token);
      console.log(`[Security] Authorized admin session issued for: ${normalized}`);

      return res.json({
        success: true,
        authorized: true,
        user: {
          email: normalized,
          name: name || (normalized === 'iammoraaruth@gmail.com' ? 'Ruth Moraa' : 'Josiah M.'),
          role: 'admin',
        },
        token,
      });
    }

    if (typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Password is required.' });
    }

    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Account service is temporarily unavailable.' });
    }

    const user = await UserModel.findOne({ email: normalized }).select('+passwordHash');
    const passwordMatches = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !passwordMatches) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'This account is not active. Please contact an administrator.' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = createUserSessionToken({
      id: String(user._id),
      email: user.email,
      name: user.name,
      tokenVersion: user.tokenVersion,
    });
    setSessionCookie(res, token);

    const profile = sanitizeUser(user);
    return res.json({
      success: true,
      authorized: user.role === 'admin' || user.role === 'agent',
      user: profile,
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Authentication service encountered an error' });
  }
});

// POST /api/auth/register
// Public self-registration. Always creates a standard 'user' role account.
app.post('/api/auth/register', registerLimiter, async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    const nameError = validateName(name);
    if (nameError) return res.status(400).json({ error: nameError });
    const emailError = validateEmail(email);
    if (emailError) return res.status(400).json({ error: emailError });
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ error: passwordError });

    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Account service is temporarily unavailable.' });
    }

    const normalized = normalizeEmail(email);
    const taken = isAdminEmail(normalized) || (await UserModel.exists({ email: normalized }));
    if (taken) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = await UserModel.create({
      name: name.trim(),
      email: normalized,
      passwordHash: await hashPassword(password),
      role: 'user',
      status: 'active',
      lastLogin: new Date(),
    });

    const token = createUserSessionToken({
      id: String(user._id),
      email: user.email,
      name: user.name,
      tokenVersion: user.tokenVersion,
    });
    setSessionCookie(res, token);

    return res.status(201).json({ success: true, user: sanitizeUser(user), token });
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// POST /api/auth/forgot-password
// No email provider is configured, so this only records a request.
// An administrator issues the reset link from the Users tab.
app.post('/api/auth/forgot-password', resetLimiter, async (req: Request, res: Response) => {
  const genericResponse = {
    success: true,
    message: 'If an account exists for this email, your reset request has been sent to the administrators.',
  };
  try {
    if (!validateEmail(req.body?.email) && isDatabaseReady()) {
      await UserModel.updateOne(
        { email: normalizeEmail(req.body.email) },
        { $set: { resetRequestedAt: new Date() } }
      );
    }
  } catch (err) {
    console.error('Forgot password error:', err);
  }
  return res.json(genericResponse);
});

// POST /api/auth/reset-password
// Accepts a single-use token issued by an administrator. Stored as a SHA-256 hash.
app.post('/api/auth/reset-password', resetLimiter, async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ error: passwordError });
    if (typeof token !== 'string' || !token) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    }
    if (!isDatabaseReady()) {
      return res.status(503).json({ error: 'Account service is temporarily unavailable.' });
    }

    const user = await UserModel.findOne({
      resetTokenHash: hashResetToken(token),
      resetTokenExpiresAt: { $gt: new Date() },
    }).select('+resetTokenHash +resetTokenExpiresAt +passwordHash');

    if (!user) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired.' });
    }

    user.passwordHash = await hashPassword(password);
    user.resetTokenHash = undefined;
    user.resetTokenExpiresAt = undefined;
    user.resetRequestedAt = undefined;
    user.tokenVersion += 1; // Signs out any existing sessions
    await user.save();

    return res.json({ success: true, message: 'Your password has been reset. You can now sign in.' });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Password reset failed. Please try again.' });
  }
});

// GET /api/auth/me
// Returns the currently authenticated identity, re-checked against current account state
app.get('/api/auth/me', async (req: Request, res: Response) => {
  const session = await resolveSession(extractToken(req));
  if (!session) {
    return res.json({
      authenticated: false,
      authorized: false,
      user: null,
    });
  }

  return res.json({
    authenticated: true,
    authorized: session.role === 'admin' || session.role === 'agent',
    user: {
      email: session.email,
      name: session.name,
      role: session.role,
      issuedAt: session.issuedAt,
      expiresAt: session.expiresAt,
    },
  });
});

// POST /api/auth/logout
// Clears the cookie. For database accounts, also bumps tokenVersion so the
// token is rejected everywhere, including copies stored by other clients.
app.post('/api/auth/logout', async (req: Request, res: Response) => {
  try {
    const session = verifySessionSignature(extractToken(req));
    if (session?.uid && isDatabaseReady()) {
      await UserModel.updateOne(
        { _id: session.uid, tokenVersion: session.tokenVersion },
        { $inc: { tokenVersion: 1 } }
      );
    }
  } catch (err) {
    console.error('Logout error:', err);
  }
  res.clearCookie(SESSION_COOKIE_NAME);
  return res.json({ success: true, message: 'Logged out successfully' });
});

// ==========================================
// USER MANAGEMENT (Administrators only)
// ==========================================

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Allowlisted admins always remain available, so the guard only applies when the allowlist is empty.
async function wouldLeaveNoAdmins(excludeId: string): Promise<boolean> {
  if (ADMIN_EMAILS.length > 0) return false;
  const remaining = await UserModel.countDocuments({ role: 'admin', status: 'active', _id: { $ne: excludeId } });
  return remaining === 0;
}

// GET /api/admin/users?search=&role=&status=
app.get('/api/admin/users', requireAdminOnly as any, async (req: Request, res: Response) => {
  try {
    const filter: Record<string, any> = {};
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ name: pattern }, { email: pattern }];
    }
    if (typeof req.query.role === 'string' && (USER_ROLES as readonly string[]).includes(req.query.role)) {
      filter.role = req.query.role;
    }
    if (typeof req.query.status === 'string' && (USER_STATUSES as readonly string[]).includes(req.query.status)) {
      filter.status = req.query.status;
    }

    const users = await UserModel.find(filter).sort({ createdAt: -1 }).limit(500).lean();
    return res.json(users.map(sanitizeUser));
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({ error: 'Failed to load users.' });
  }
});

// POST /api/admin/users
app.post('/api/admin/users', requireAdminOnly as any, async (req: Request, res: Response) => {
  try {
    const { name, email, password, role = 'user', status = 'active' } = req.body;

    const nameError = validateName(name);
    if (nameError) return res.status(400).json({ error: nameError });
    const emailError = validateEmail(email);
    if (emailError) return res.status(400).json({ error: emailError });
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ error: passwordError });
    if (!(USER_ROLES as readonly string[]).includes(role)) return res.status(400).json({ error: 'Invalid role.' });
    if (!(USER_STATUSES as readonly string[]).includes(status)) return res.status(400).json({ error: 'Invalid status.' });

    const normalized = normalizeEmail(email);
    if (isAdminEmail(normalized)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const user = await UserModel.create({
      name: name.trim(),
      email: normalized,
      passwordHash: await hashPassword(password),
      role,
      status,
    });
    return res.status(201).json(sanitizeUser(user));
  } catch (err: any) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    console.error('Create user error:', err);
    return res.status(500).json({ error: 'Failed to create user.' });
  }
});

// PATCH /api/admin/users/:id  (name, role, status, password)
app.patch('/api/admin/users/:id', requireAdminOnly as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid user id.' });

    const user = await UserModel.findById(id).select('+passwordHash');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const { name, role, status, password } = req.body;
    if (role !== undefined && !(USER_ROLES as readonly string[]).includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }
    if (status !== undefined && !(USER_STATUSES as readonly string[]).includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const nextRole = role ?? user.role;
    const nextStatus = status ?? user.status;
    const isSelf = String(user._id) === req.adminUser?.uid;

    if (isSelf && (nextRole !== 'admin' || nextStatus !== 'active')) {
      return res.status(409).json({ error: 'You cannot remove your own administrator access.' });
    }

    const losesAdmin = user.role === 'admin' && user.status === 'active' && (nextRole !== 'admin' || nextStatus !== 'active');
    if (losesAdmin && (await wouldLeaveNoAdmins(String(user._id)))) {
      return res.status(409).json({ error: 'At least one active administrator must remain.' });
    }

    if (name !== undefined) {
      const nameError = validateName(name);
      if (nameError) return res.status(400).json({ error: nameError });
      user.name = name.trim();
    }

    let invalidateSessions = false;
    if (password !== undefined && password !== '') {
      const passwordError = validatePassword(password);
      if (passwordError) return res.status(400).json({ error: passwordError });
      user.passwordHash = await hashPassword(password);
      invalidateSessions = true;
    }
    if (nextStatus !== user.status) invalidateSessions = true;

    user.role = nextRole;
    user.status = nextStatus;
    if (invalidateSessions) user.tokenVersion += 1;

    await user.save();
    return res.json(sanitizeUser(user));
  } catch (err) {
    console.error('Update user error:', err);
    return res.status(500).json({ error: 'Failed to update user.' });
  }
});

// DELETE /api/admin/users/:id
app.delete('/api/admin/users/:id', requireAdminOnly as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid user id.' });
    if (id === req.adminUser?.uid) {
      return res.status(409).json({ error: 'You cannot delete your own account.' });
    }

    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    if (user.role === 'admin' && user.status === 'active' && (await wouldLeaveNoAdmins(id))) {
      return res.status(409).json({ error: 'At least one active administrator must remain.' });
    }

    await user.deleteOne();
    return res.json({ success: true });
  } catch (err) {
    console.error('Delete user error:', err);
    return res.status(500).json({ error: 'Failed to delete user.' });
  }
});

// POST /api/admin/users/:id/reset-link
// Issues a one-hour, single-use reset link for the administrator to share.
app.post('/api/admin/users/:id/reset-link', requireAdminOnly as any, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid user id.' });

    const user = await UserModel.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const { raw, hash, expiresAt } = createResetToken();
    user.resetTokenHash = hash;
    user.resetTokenExpiresAt = expiresAt;
    user.resetRequestedAt = undefined;
    await user.save();

    const proto = req.get('x-forwarded-proto') || req.protocol;
    const resetUrl = `${proto}://${req.get('host')}/reset-password?token=${raw}`;
    return res.json({ resetUrl, expiresAt });
  } catch (err) {
    console.error('Reset link error:', err);
    return res.status(500).json({ error: 'Failed to create reset link.' });
  }
});

// ==========================================
// PROTECTED CLOUDINARY UPLOAD & DELETION APIS
// (Only Authorized Administrators)
// ==========================================

// Helper to stream upload buffer to Cloudinary
function uploadToCloudinary(buffer: Buffer, originalFilename: string, mimetype: string): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    // SVG is an image format; keep it as resource_type 'image' so it renders via <img> and gets f_auto delivery.
    // Do not pass `format`/`quality` at upload: they are delivery concerns (see src/lib/cloudinary.ts).
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'perfect_homes/properties',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('Cloudinary returned empty result'));
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}

// POST /api/upload (Protected: Requires Verified Admin Auth)
app.post(
  '/api/upload',
  requireAdminAuth as any,
  (upload.single('image') as any),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const originalFilename = file.originalname || 'property-photo.jpg';
      const extension = path.extname(originalFilename).toLowerCase();
      const isSvg = file.mimetype === 'image/svg+xml' || extension === '.svg';

      // SVG Security Validation: Scan for malicious executable script elements
      if (isSvg) {
        const svgText = file.buffer.toString('utf8').toLowerCase();
        const dangerousPatterns = [
          '<script',
          'javascript:',
          '<iframe',
          '<object',
          '<embed',
          'onload=',
          'onerror=',
          'onclick=',
        ];
        for (const pattern of dangerousPatterns) {
          if (svgText.includes(pattern)) {
            return res.status(400).json({
              error: 'Security rejection: Uploaded SVG contains unsafe or executable scripts.',
            });
          }
        }
      }

      // 1. If Cloudinary credentials are configured, perform real Cloudinary upload
      if (hasCloudinaryCredentials) {
        try {
          const result = await uploadToCloudinary(file.buffer, originalFilename, file.mimetype);

          const imageMetadata = {
            publicId: result.public_id,
            secureUrl: result.secure_url,
            format: result.format || extension.replace('.', '') || 'jpg',
            resourceType: result.resource_type || 'image',
            width: result.width,
            height: result.height,
            bytes: result.bytes || file.size,
            originalFilename,
            sortOrder: 0,
            isCover: false,
          };

          return res.status(201).json(imageMetadata);
        } catch (cloudinaryError: any) {
          console.error('[Upload Error - Cloudinary]:', {
            message: cloudinaryError.message,
            http_code: cloudinaryError.http_code,
            statusCode: cloudinaryError.statusCode,
            status: cloudinaryError.status,
            response: cloudinaryError.response?.body,
          });
          // Fall through to fallback if Cloudinary fails
        }
      }

      // 2. Developer fallback when Cloudinary credentials are not set in .env
      const base64Data = file.buffer.toString('base64');
      const mime = file.mimetype && file.mimetype !== 'application/octet-stream' ? file.mimetype : 'image/jpeg';
      const fallbackUrl = `data:${mime};base64,${base64Data}`;

      const simulatedMetadata = {
        publicId: `ph_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        secureUrl: fallbackUrl,
        format: extension.replace('.', '') || 'jpg',
        resourceType: 'image',
        width: 1920,
        height: 1080,
        bytes: file.size,
        originalFilename,
        sortOrder: 0,
        isCover: false,
      };

      return res.status(201).json(simulatedMetadata);
    } catch (err: any) {
      console.error('[Upload Error]:', err);
      return res.status(500).json({
        error: err.message || 'Image upload and processing failed. Please try again.',
      });
    }
  }
);

// DELETE /api/images/:publicId (Protected: Requires Verified Admin Auth)
app.delete('/api/images/:publicId', requireAdminAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { publicId } = req.params;
    if (!publicId) {
      return res.status(400).json({ error: 'Missing publicId' });
    }

    if (hasCloudinaryCredentials) {
      await cloudinary.uploader.destroy(publicId);
      console.log(`[Cloudinary] Asset deleted by admin: ${publicId}`);
    }

    return res.json({ success: true, publicId });
  } catch (err: any) {
    console.error('[Cloudinary Delete Error]:', err);
    return res.status(500).json({ error: 'Failed to delete asset from Cloudinary' });
  }
});

// ==========================================
// PUBLIC PROPERTY DISCOVERY APIS
// (Browsing, Search, and Details are public)
// ==========================================

// GET /api/properties (Public)
// On Vercel, in-memory storage is per container and invisible to other requests,
// so property routes must fail loudly instead of silently losing writes.
const IS_SERVERLESS = Boolean(process.env.VERCEL);
app.use('/api/properties', (_req: Request, res: Response, next: NextFunction) => {
  if (IS_SERVERLESS && !isMongoConnected()) {
    return res.status(503).json({
      error: 'Database not connected. Check MONGODB_URI in Vercel environment variables.',
    });
  }
  next();
});

app.get('/api/properties', async (req: Request, res: Response) => {
  try {
    const { keyword, propertyType, listingType, minPrice, maxPrice, bedrooms, sort } = req.query;

    if (isMongoConnected()) {
      const query: any = {};

      if (keyword) {
        const regex = new RegExp(String(keyword), 'i');
        query.$or = [
          { title: regex },
          { description: regex },
          { 'location.neighborhood': regex },
          { 'location.city': regex },
          { propertyType: regex },
        ];
      }

      if (propertyType && propertyType !== 'All') {
        query.propertyType = propertyType;
      }

      if (listingType && listingType !== 'All') {
        query.listingType = listingType;
      }

      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }

      if (bedrooms && bedrooms !== 'Any') {
        query.bedrooms = { $gte: Number(bedrooms) };
      }

      let queryExec = PropertyModel.find(query);
      if (sort === 'price-asc') queryExec = queryExec.sort({ price: 1 });
      else if (sort === 'price-desc') queryExec = queryExec.sort({ price: -1 });
      else queryExec = queryExec.sort({ featured: -1, createdAt: -1 });

      const properties = await queryExec.lean();
      return res.json(properties);
    }

    // In-memory filter implementation
    let list = [...inMemoryProperties];

    if (keyword) {
      const q = String(keyword).toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.location.neighborhood.toLowerCase().includes(q) ||
          p.location.city.toLowerCase().includes(q) ||
          p.propertyType.toLowerCase().includes(q)
      );
    }

    if (propertyType && propertyType !== 'All') {
      list = list.filter((p) => p.propertyType.toLowerCase() === String(propertyType).toLowerCase());
    }

    if (listingType && listingType !== 'All') {
      list = list.filter((p) => p.listingType.toLowerCase() === String(listingType).toLowerCase());
    }

    if (minPrice) {
      list = list.filter((p) => p.price >= Number(minPrice));
    }

    if (maxPrice) {
      list = list.filter((p) => p.price <= Number(maxPrice));
    }

    if (bedrooms && bedrooms !== 'Any') {
      list = list.filter((p) => p.bedrooms >= Number(bedrooms));
    }

    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    else list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

    return res.json(list);
  } catch (err: any) {
    console.error('Error fetching properties:', err);
    return res.status(500).json({ error: 'Failed to retrieve properties' });
  }
});

// GET /api/properties/:slugOrId (Public)
app.get('/api/properties/:slugOrId', async (req: Request, res: Response) => {
  try {
    const { slugOrId } = req.params;

    if (isMongoConnected()) {
      const property = await PropertyModel.findOne({
        $or: [{ slug: slugOrId }, { _id: mongoose.isValidObjectId(slugOrId) ? slugOrId : null }],
      }).lean();

      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }
      return res.json(property);
    }

    const prop = inMemoryProperties.find((p) => p.slug === slugOrId || p._id === slugOrId || p.id === slugOrId);
    if (!prop) {
      return res.status(404).json({ error: 'Property not found' });
    }
    return res.json(prop);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch property details' });
  }
});

// ==========================================
// PROTECTED ADMINISTRATIVE PROPERTY CRUD
// (Only Authorized Administrators)
// ==========================================

// POST /api/properties (Protected: Create Property)
app.post('/api/properties', requireAdminAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      title,
      description,
      propertyType,
      listingType,
      price,
      rates,
      location,
      bedrooms,
      bathrooms,
      squareFeet,
      images,
      amenities,
      seller,
    } = req.body;

    if (!title || !description || !propertyType || !listingType || price === undefined) {
      return res.status(400).json({ error: 'Missing required property fields' });
    }

    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Date.now().toString().slice(-4);

    const structuredImages = normalizePropertyImages(images);

    const newPropertyData = {
      title,
      slug,
      description,
      propertyType,
      listingType,
      price: Number(price),
      rates: rates || { sale: Number(price) },
      currency: 'KSh',
      location: location || { city: 'Nairobi', neighborhood: 'Westlands' },
      bedrooms: Number(bedrooms) || 1,
      bathrooms: Number(bathrooms) || 1,
      squareFeet: Number(squareFeet) || 500,
      images: structuredImages,
      amenities: Array.isArray(amenities) ? amenities : [],
      featured: false,
      status: 'Available',
      seller: seller || {
        name: req.adminUser?.name || 'Ruth Moraa',
        email: req.adminUser?.email || 'iammoraaruth@gmail.com',
        phone: '+254701029158',
      },
      createdAt: new Date().toISOString(),
    };

    if (isMongoConnected()) {
      const created = await PropertyModel.create(newPropertyData);
      return res.status(201).json(created);
    }

    const createdProp = {
      ...newPropertyData,
      _id: 'prop-' + Date.now(),
      id: 'prop-' + Date.now(),
    };
    inMemoryProperties.unshift(createdProp as any);
    return res.status(201).json(createdProp);
  } catch (err: any) {
    console.error('Error creating property:', err);
    return res.status(500).json({ error: 'Failed to add property' });
  }
});

// PATCH /api/properties/:id (Protected: Update Property)
app.patch('/api/properties/:id', requireAdminAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (isMongoConnected()) {
      const updated = await PropertyModel.findByIdAndUpdate(id, updates, { new: true });
      if (!updated) return res.status(404).json({ error: 'Property not found' });
      return res.json(updated);
    }

    const index = inMemoryProperties.findIndex((p) => p._id === id || p.id === id);
    if (index === -1) return res.status(404).json({ error: 'Property not found' });

    inMemoryProperties[index] = {
      ...inMemoryProperties[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return res.json(inMemoryProperties[index]);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update property' });
  }
});

// DELETE /api/properties/:id (Protected: Delete Property)
app.delete('/api/properties/:id', requireAdminAuth as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (isMongoConnected()) {
      const deleted = await PropertyModel.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: 'Property not found' });
      return res.json({ success: true, message: 'Property deleted successfully' });
    }

    const initialLen = inMemoryProperties.length;
    inMemoryProperties = inMemoryProperties.filter((p) => p._id !== id && p.id !== id);
    if (inMemoryProperties.length === initialLen) {
      return res.status(404).json({ error: 'Property not found' });
    }

    return res.json({ success: true, message: 'Property deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete property' });
  }
});

// ==========================================
// PUBLIC USER SUBMISSIONS
// (Bookings & Inquiries)
// ==========================================

// POST /api/bookings (Public: Book for View)
app.post('/api/bookings', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, contact, preferredDate, location, houseType, propertyId } = req.body;

    if (!firstName || !lastName || !email || !contact) {
      return res.status(400).json({ error: 'Please provide full contact details' });
    }

    const bookingData = {
      firstName,
      lastName,
      email,
      contact,
      preferredDate: preferredDate || { month: 'December', day: '15', year: '2025' },
      location: location || 'Westlands',
      houseType: houseType || 'Apartment',
      propertyId,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };

    if (isMongoConnected()) {
      const doc = await BookingModel.create(bookingData);
      return res.status(201).json({ success: true, booking: doc });
    }

    inMemoryBookings.push({ ...bookingData, _id: 'book-' + Date.now() });
    return res.status(201).json({ success: true, booking: bookingData });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to submit booking' });
  }
});

// GET /api/admin/bookings (Protected: Admin viewing schedule)
app.get('/api/admin/bookings', requireAdminAuth as any, async (_req: AuthenticatedRequest, res: Response) => {
  if (isMongoConnected()) {
    const docs = await BookingModel.find().sort({ createdAt: -1 }).lean();
    return res.json(docs);
  }
  return res.json(inMemoryBookings);
});

// POST /api/contact (Public: Contact Inquiry)
app.post('/api/contact', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, comments, phone } = req.body;
    if (!firstName || !lastName || !email || !comments) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const inquiryData = {
      firstName,
      lastName,
      email,
      comments,
      phone,
      createdAt: new Date().toISOString(),
    };

    if (isMongoConnected()) {
      await InquiryModel.create(inquiryData);
    } else {
      inMemoryInquiries.push({ ...inquiryData, _id: 'inq-' + Date.now() });
    }

    return res.status(201).json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to submit contact message' });
  }
});

// GET /api/admin/inquiries (Protected: Admin inquiries)
app.get('/api/admin/inquiries', requireAdminAuth as any, async (_req: AuthenticatedRequest, res: Response) => {
  if (isMongoConnected()) {
    const docs = await InquiryModel.find().sort({ createdAt: -1 }).lean();
    return res.json(docs);
  }
  return res.json(inMemoryInquiries);
});

// ==========================================
// SERVE FRONTEND (DEV OR PROD)
// ==========================================

async function startServer() {
  const { fileURLToPath } = await import('url');
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  await ensureDatabase();

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Perfect Homes Server] Running on http://0.0.0.0:${PORT}`);
  });
}

export default app;

// Only start the long-running server outside of Vercel serverless
if (!process.env.VERCEL) {
  startServer();
}
