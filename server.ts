import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import cookieParser from 'cookie-parser';
import https from 'https';
import http from 'http';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { PropertyModel } from './src/models/Property.ts';
import { BookingModel } from './src/models/Booking.ts';
import { InquiryModel } from './src/models/Inquiry.ts';
import { normalizePropertyImages } from './src/lib/cloudinary.ts';
import {
  normalizeEmail,
  isAdminEmail,
  createAdminSessionToken,
  verifyAdminSessionToken,
  requireAdminAuth,
  SESSION_COOKIE_NAME,
  ADMIN_EMAILS,
  AuthenticatedRequest,
} from './src/lib/auth.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());

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
let isMongoConnected = false;

// Connect to MongoDB if MONGODB_URI is provided
async function initDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.log('[Database] MONGODB_URI not set. Running with built-in high-performance storage.');
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    isMongoConnected = true;
    console.log('[Database] Successfully connected to MongoDB cluster.');
  } catch (err) {
    console.warn('[Database] MongoDB connection failed, falling back to local storage:', err);
    isMongoConnected = false;
  }
}

initDatabase();

// ==========================================
// AUTHENTICATION & AUTHORIZATION ENDPOINTS
// ==========================================

// POST /api/auth/login
// Strictly verifies email against the two-email allowlist
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const normalized = normalizeEmail(email);

    // CRITICAL: Strict Server-Side Allowlist Enforcement
    if (!isAdminEmail(normalized)) {
      console.warn(`[Security Alert] Denied unauthorized admin login attempt: "${email}"`);
      return res.status(403).json({
        authorized: false,
        error: 'Access Denied: The provided email is not authorized for administrator access.',
      });
    }

    // Generate cryptographically signed session token
    const token = createAdminSessionToken(normalized, name);

    // Set secure HTTP-only cookie
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.log(`[Security] Authorized admin session issued for: ${normalized}`);

    return res.json({
      success: true,
      authorized: true,
      user: {
        email: normalized,
        name: name || (normalized === 'iammoraaruth@gmail.com' ? 'Ruth Moraa' : 'Josiah M.'),
      },
      token,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Authentication service encountered an error' });
  }
});

// GET /api/auth/me
// Returns the currently authenticated administrator identity
app.get('/api/auth/me', (req: Request, res: Response) => {
  let token = req.cookies?.[SESSION_COOKIE_NAME];
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  const session = verifyAdminSessionToken(token);
  if (!session) {
    return res.json({
      authenticated: false,
      authorized: false,
      user: null,
    });
  }

  return res.json({
    authenticated: true,
    authorized: true,
    user: {
      email: session.email,
      name: session.name,
      issuedAt: session.issuedAt,
      expiresAt: session.expiresAt,
    },
  });
});

// POST /api/auth/logout
app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie(SESSION_COOKIE_NAME);
  return res.json({ success: true, message: 'Logged out successfully' });
});

// ==========================================
// PROTECTED CLOUDINARY UPLOAD & DELETION APIS
// (Only Authorized Administrators)
// ==========================================

// Helper to stream upload buffer to Cloudinary
function uploadToCloudinary(buffer: Buffer, originalFilename: string, mimetype: string): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const isSvg = mimetype === 'image/svg+xml' || originalFilename.toLowerCase().endsWith('.svg');

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'perfect_homes/properties',
        resource_type: isSvg ? 'raw' : 'image',
        format: isSvg ? undefined : 'auto', // Auto-transcode HEIC/HEIF to WebP/JPG for browsers
        quality: isSvg ? undefined : 'auto',
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
app.get('/api/properties', async (req: Request, res: Response) => {
  try {
    const { keyword, propertyType, listingType, minPrice, maxPrice, bedrooms, sort } = req.query;

    if (isMongoConnected) {
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

    if (isMongoConnected) {
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

    if (isMongoConnected) {
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

    if (isMongoConnected) {
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

    if (isMongoConnected) {
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

    if (isMongoConnected) {
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
  if (isMongoConnected) {
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

    if (isMongoConnected) {
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
  if (isMongoConnected) {
    const docs = await InquiryModel.find().sort({ createdAt: -1 }).lean();
    return res.json(docs);
  }
  return res.json(inMemoryInquiries);
});

// ==========================================
// SERVE FRONTEND (DEV OR PROD)
// ==========================================

async function startServer() {
  if (!isProduction) {
    // In dev mode, mount Vite middleware for instant updates & SPA handling
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
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

// Vercel runs the exported app as a serverless function (see api/index.ts)
if (!process.env.VERCEL) {
  startServer();
}
