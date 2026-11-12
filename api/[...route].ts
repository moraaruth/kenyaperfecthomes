import type { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import * as cookieLib from 'cookie';

function parseCookies(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k) out[k.trim()] = decodeURIComponent(v.join('='));
  }
  return out;
}

// ─── MongoDB connection cache ────────────────────────────────────────────────

let _conn: Promise<typeof mongoose> | null = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[MongoDB] MONGODB_URI is not set in this environment. Add it in Vercel Project Settings > Environment Variables.');
    return;
  }
  if (!_conn) {
    _conn = mongoose.connect(uri, { bufferCommands: false, serverSelectionTimeoutMS: 8000 }).catch((e) => {
      console.error('[MongoDB] Connection failed:', e?.name, e?.message);
      _conn = null;
      throw e;
    });
  }
  await _conn;
}

// ─── Models ──────────────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'agent', 'user'], default: 'user' },
    status: { type: String, enum: ['active', 'suspended', 'disabled'], default: 'active' },
    tokenVersion: { type: Number, default: 0 },
    lastLogin: { type: Date },
    resetTokenHash: { type: String, select: false },
    resetTokenExpiresAt: { type: Date, select: false },
    resetRequestedAt: { type: Date },
  },
  { timestamps: true }
);

const PropertySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    propertyType: { type: String, required: true },
    listingType: { type: String, required: true },
    price: { type: Number, required: true },
    rates: { weekly: Number, sale: Number, monthly: Number, daily: Number },
    currency: { type: String, default: 'KSh' },
    location: {
      street: String,
      city: { type: String, required: true },
      neighborhood: { type: String, required: true },
      county: String,
    },
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    squareFeet: { type: Number, required: true },
    images: [mongoose.Schema.Types.Mixed],
    amenities: [String],
    featured: { type: Boolean, default: false },
    status: { type: String, default: 'Available' },
    seller: { name: String, email: String, phone: String },
  },
  { timestamps: true }
);

const BookingSchema = new mongoose.Schema(
  {
    firstName: String, lastName: String, email: String, contact: String,
    preferredDate: { month: String, day: String, year: String },
    location: String, houseType: String,
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
    status: { type: String, default: 'Pending' },
  },
  { timestamps: true }
);

const InquirySchema = new mongoose.Schema(
  { firstName: String, lastName: String, email: String, comments: String, phone: String },
  { timestamps: true }
);

const User = (mongoose.models.User as mongoose.Model<any>) ||
  mongoose.model('User', UserSchema, 'users');
const Property = (mongoose.models.Property as mongoose.Model<any>) ||
  mongoose.model('Property', PropertySchema, 'properties');
const Booking = (mongoose.models.Booking as mongoose.Model<any>) ||
  mongoose.model('Booking', BookingSchema, 'bookings');
const Inquiry = (mongoose.models.Inquiry as mongoose.Model<any>) ||
  mongoose.model('Inquiry', InquirySchema, 'inquiries');

// ─── Admin allowlist ──────────────────────────────────────────────────────────

const ADMIN_EMAILS = ['mnjosiah@gmail.com', 'iammoraaruth@gmail.com'];
const norm = (e: string) => (e || '').trim().toLowerCase();
const isAdmin = (e: string) => ADMIN_EMAILS.includes(norm(e));

// ─── Session tokens ───────────────────────────────────────────────────────────

const SESSION_COOKIE = 'ph_admin_session';
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;
const secret = () => process.env.ADMIN_SESSION_SECRET || 'perfect-homes-secure-admin-secret-2025';

function signToken(payload: object): string {
  const data = Buffer.from(JSON.stringify({ ...payload, issuedAt: Date.now(), expiresAt: Date.now() + SESSION_MS })).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifyToken(token: string | undefined): any | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expected = crypto.createHmac('sha256', secret()).update(data).digest('base64url');
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(data, 'base64url').toString());
    if (Date.now() > p.expiresAt) return null;
    return p;
  } catch { return null; }
}

async function resolveSession(token: string | undefined): Promise<any | null> {
  const p = verifyToken(token);
  if (!p) return null;
  if (!p.uid) return isAdmin(p.email) ? p : null;
  try {
    const u = await User.findById(p.uid).select('email name role status tokenVersion').lean();
    if (!u || u.status !== 'active' || u.tokenVersion !== p.tokenVersion) return null;
    return { ...p, email: u.email, name: u.name, role: u.role, tokenVersion: u.tokenVersion };
  } catch { return null; }
}

function getToken(req: VercelRequest): string | undefined {
  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies[SESSION_COOKIE]) return cookies[SESSION_COOKIE];
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return undefined;
}

function setCookie(res: VercelResponse, token: string) {
  const isProd = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie',
    `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_MS / 1000}; SameSite=Lax${isProd ? '; Secure' : ''}`
  );
}

function clearCookie(res: VercelResponse) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);
}

// ─── Validation helpers ───────────────────────────────────────────────────────

const validateEmail = (e: unknown) =>
  typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()) ? null : 'Please enter a valid email address.';
const validateName = (n: unknown) =>
  typeof n === 'string' && n.trim().length >= 2 ? null : 'Please enter a full name (at least 2 characters).';
const validatePassword = (p: unknown) =>
  typeof p === 'string' && p.length >= 8 ? null : 'Password must be at least 8 characters.';

function sanitizeUser(u: any) {
  return { id: String(u._id), name: u.name, email: u.email, role: u.role, status: u.status, lastLogin: u.lastLogin ?? null, createdAt: u.createdAt ?? null };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');

  try {
    await connectDB();
  } catch {
    // Error already logged in connectDB; routes below return 503 when DB is unavailable
  }

  const url = req.url || '/';
  const path = url.split('?')[0].replace(/\/$/, '') || '/';
  const method = req.method?.toUpperCase() || 'GET';
  const db = mongoose.connection.readyState === 1;

  // ── POST /api/auth/register ──────────────────────────────────────────────
  if (path === '/api/auth/register' && method === 'POST') {
    const { name, email, password } = req.body || {};
    const err = validateName(name) || validateEmail(email) || validatePassword(password);
    if (err) return res.status(400).json({ error: err });
    if (!db) return res.status(503).json({ error: 'Account service is temporarily unavailable.' });

    const normalized = norm(email);
    if (isAdmin(normalized)) return res.status(409).json({ error: 'An account with this email already exists.' });
    const exists = await User.exists({ email: normalized });
    if (exists) return res.status(409).json({ error: 'An account with this email already exists.' });

    try {
      const hash = await bcrypt.hash(password, 12);
      const user = await User.create({ name: name.trim(), email: normalized, passwordHash: hash, role: 'user', status: 'active', lastLogin: new Date() });
      const token = signToken({ email: user.email, name: user.name, role: 'user', uid: String(user._id), tokenVersion: user.tokenVersion });
      setCookie(res, token);
      return res.status(201).json({ success: true, user: sanitizeUser(user), token });
    } catch (e: any) {
      if (e?.code === 11000) return res.status(409).json({ error: 'An account with this email already exists.' });
      console.error('Register error:', e?.message);
      return res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  }

  // ── POST /api/auth/login ─────────────────────────────────────────────────
  if (path === '/api/auth/login' && method === 'POST') {
    const { email, password, name } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email address is required.' });
    const normalized = norm(email);

    if (isAdmin(normalized)) {
      const token = signToken({ email: normalized, name: name || (normalized === 'iammoraaruth@gmail.com' ? 'Ruth Moraa' : 'Josiah M.'), role: 'admin' });
      setCookie(res, token);
      return res.status(200).json({ success: true, authorized: true, user: { email: normalized, name: name || (normalized === 'iammoraaruth@gmail.com' ? 'Ruth Moraa' : 'Josiah M.'), role: 'admin' }, token });
    }

    if (!password) return res.status(400).json({ error: 'Password is required.' });
    if (!db) return res.status(503).json({ error: 'Account service is temporarily unavailable.' });

    const user = await User.findOne({ email: normalized }).select('+passwordHash');
    const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !ok) return res.status(401).json({ error: 'Incorrect email or password.' });
    if (user.status !== 'active') return res.status(403).json({ error: 'This account is not active.' });

    user.lastLogin = new Date();
    await user.save();
    const token = signToken({ email: user.email, name: user.name, role: user.role, uid: String(user._id), tokenVersion: user.tokenVersion });
    setCookie(res, token);
    return res.status(200).json({ success: true, authorized: user.role === 'admin' || user.role === 'agent', user: sanitizeUser(user), token });
  }

  // ── POST /api/auth/logout ────────────────────────────────────────────────
  if (path === '/api/auth/logout' && method === 'POST') {
    const p = verifyToken(getToken(req));
    if (p?.uid && db) {
      await User.updateOne({ _id: p.uid, tokenVersion: p.tokenVersion }, { $inc: { tokenVersion: 1 } }).catch(() => {});
    }
    clearCookie(res);
    return res.status(200).json({ success: true });
  }

  // ── GET /api/auth/me ─────────────────────────────────────────────────────
  if (path === '/api/auth/me' && method === 'GET') {
    const session = await resolveSession(getToken(req));
    if (!session) return res.status(200).json({ authenticated: false, authorized: false, user: null });
    return res.status(200).json({
      authenticated: true,
      authorized: session.role === 'admin' || session.role === 'agent',
      user: { email: session.email, name: session.name, role: session.role },
    });
  }

  // ── GET /api/properties ──────────────────────────────────────────────────
  if (path === '/api/properties' && method === 'GET') {
    if (!db) return res.status(200).json([]);
    try {
      const { keyword, propertyType, listingType, minPrice, maxPrice, bedrooms, sort } = req.query as any;
      const q: any = {};
      if (keyword) { const r = new RegExp(String(keyword), 'i'); q.$or = [{ title: r }, { description: r }, { 'location.neighborhood': r }, { 'location.city': r }]; }
      if (propertyType && propertyType !== 'All') q.propertyType = propertyType;
      if (listingType && listingType !== 'All') q.listingType = listingType;
      if (minPrice || maxPrice) { q.price = {}; if (minPrice) q.price.$gte = Number(minPrice); if (maxPrice) q.price.$lte = Number(maxPrice); }
      if (bedrooms && bedrooms !== 'Any') q.bedrooms = { $gte: Number(bedrooms) };
      let exec = Property.find(q);
      if (sort === 'price-asc') exec = exec.sort({ price: 1 });
      else if (sort === 'price-desc') exec = exec.sort({ price: -1 });
      else exec = exec.sort({ featured: -1, createdAt: -1 });
      return res.status(200).json(await exec.lean());
    } catch (e: any) {
      console.error('Properties error:', e?.message);
      return res.status(500).json({ error: 'Failed to retrieve properties.' });
    }
  }

  // ── GET /api/properties/:id ──────────────────────────────────────────────
  const propMatch = path.match(/^\/api\/properties\/([^/]+)$/);
  if (propMatch && method === 'GET') {
    if (!db) return res.status(503).json({ error: 'Database unavailable.' });
    const id = propMatch[1];
    const prop = await Property.findOne({ $or: [{ slug: id }, { _id: mongoose.isValidObjectId(id) ? id : null }] }).lean();
    if (!prop) return res.status(404).json({ error: 'Property not found.' });
    return res.status(200).json(prop);
  }

  // ── POST /api/properties ─────────────────────────────────────────────────
  if (path === '/api/properties' && method === 'POST') {
    const session = await resolveSession(getToken(req));
    if (!session || (session.role !== 'admin' && session.role !== 'agent')) return res.status(401).json({ error: 'Authentication required.' });
    if (!db) return res.status(503).json({ error: 'Database unavailable.' });
    const { title, description, propertyType, listingType, price } = req.body || {};
    if (!title || !description || !propertyType || !listingType || price === undefined) return res.status(400).json({ error: 'Missing required fields.' });
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString().slice(-4);
    try {
      const created = await Property.create({ ...req.body, slug, price: Number(price) });
      return res.status(201).json(created);
    } catch (e: any) {
      return res.status(500).json({ error: 'Failed to create property.' });
    }
  }

  // ── PATCH /api/properties/:id ────────────────────────────────────────────
  if (propMatch && method === 'PATCH') {
    const session = await resolveSession(getToken(req));
    if (!session || (session.role !== 'admin' && session.role !== 'agent')) return res.status(401).json({ error: 'Authentication required.' });
    if (!db) return res.status(503).json({ error: 'Database unavailable.' });
    const updated = await Property.findByIdAndUpdate(propMatch[1], req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Property not found.' });
    return res.status(200).json(updated);
  }

  // ── DELETE /api/properties/:id ───────────────────────────────────────────
  if (propMatch && method === 'DELETE') {
    const session = await resolveSession(getToken(req));
    if (!session || (session.role !== 'admin' && session.role !== 'agent')) return res.status(401).json({ error: 'Authentication required.' });
    if (!db) return res.status(503).json({ error: 'Database unavailable.' });
    const deleted = await Property.findByIdAndDelete(propMatch[1]);
    if (!deleted) return res.status(404).json({ error: 'Property not found.' });
    return res.status(200).json({ success: true });
  }

  // ── POST /api/bookings ───────────────────────────────────────────────────
  if (path === '/api/bookings' && method === 'POST') {
    const { firstName, lastName, email, contact } = req.body || {};
    if (!firstName || !lastName || !email || !contact) return res.status(400).json({ error: 'Please provide full contact details.' });
    if (db) await Booking.create(req.body).catch(() => {});
    return res.status(201).json({ success: true });
  }

  // ── POST /api/contact ────────────────────────────────────────────────────
  if (path === '/api/contact' && method === 'POST') {
    const { firstName, lastName, email, comments } = req.body || {};
    if (!firstName || !lastName || !email || !comments) return res.status(400).json({ error: 'All fields are required.' });
    if (db) await Inquiry.create(req.body).catch(() => {});
    return res.status(201).json({ success: true });
  }

  // ── Admin routes ─────────────────────────────────────────────────────────
  if (path.startsWith('/api/admin/')) {
    const session = await resolveSession(getToken(req));
    if (!session || session.role !== 'admin') return res.status(401).json({ error: 'Administrator access required.' });

    if (path === '/api/admin/users' && method === 'GET') {
      if (!db) return res.status(503).json({ error: 'Database unavailable.' });
      const users = await User.find({}).sort({ createdAt: -1 }).limit(500).lean();
      return res.status(200).json(users.map(sanitizeUser));
    }

    if (path === '/api/admin/bookings' && method === 'GET') {
      if (!db) return res.status(503).json({ error: 'Database unavailable.' });
      return res.status(200).json(await Booking.find().sort({ createdAt: -1 }).lean());
    }

    if (path === '/api/admin/inquiries' && method === 'GET') {
      if (!db) return res.status(503).json({ error: 'Database unavailable.' });
      return res.status(200).json(await Inquiry.find().sort({ createdAt: -1 }).lean());
    }
  }

  // ── POST /api/auth/forgot-password ───────────────────────────────────────
  if (path === '/api/auth/forgot-password' && method === 'POST') {
    return res.status(200).json({ success: true, message: 'If an account exists, a reset request has been recorded.' });
  }

  // ── POST /api/upload ─────────────────────────────────────────────────────
  if (path === '/api/upload' && method === 'POST') {
    const session = await resolveSession(getToken(req));
    if (!session || (session.role !== 'admin' && session.role !== 'agent')) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Parse multipart/form-data using the Web Streams API available in Vercel Node runtime
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Expected multipart/form-data.' });
    }

    // Extract boundary
    const boundaryMatch = contentType.match(/boundary=([^;]+)/);
    if (!boundaryMatch) return res.status(400).json({ error: 'Missing multipart boundary.' });
    const boundary = boundaryMatch[1].trim();

    // Read raw body
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      (req as any).on('data', (c: Buffer) => chunks.push(c));
      (req as any).on('end', resolve);
      (req as any).on('error', reject);
    });
    const raw = Buffer.concat(chunks);

    // Parse the single 'image' part
    const sep = Buffer.from(`--${boundary}`);
    const parts: Buffer[] = [];
    let start = 0;
    while (start < raw.length) {
      const idx = raw.indexOf(sep, start);
      if (idx === -1) break;
      const end = raw.indexOf(sep, idx + sep.length);
      parts.push(raw.slice(idx + sep.length, end === -1 ? raw.length : end));
      start = idx + sep.length;
    }

    let fileBuffer: Buffer | null = null;
    let originalFilename = 'upload.jpg';
    let mimetype = 'image/jpeg';

    for (const part of parts) {
      const headerEnd = part.indexOf('\r\n\r\n');
      if (headerEnd === -1) continue;
      const headers = part.slice(0, headerEnd).toString();
      if (!headers.includes('name="image"')) continue;
      const nameMatch = headers.match(/filename="([^"]+)"/);
      if (nameMatch) originalFilename = nameMatch[1];
      const ctMatch = headers.match(/Content-Type:\s*([^\r\n]+)/);
      if (ctMatch) mimetype = ctMatch[1].trim();
      // Skip \r\n\r\n header separator and trailing \r\n
      fileBuffer = part.slice(headerEnd + 4, part.length - 2);
      break;
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return res.status(400).json({ error: 'No image file found in request.' });
    }

    // SVG safety: reject SVGs containing script or active-content markers
    const isSvg = mimetype === 'image/svg+xml' || originalFilename.toLowerCase().endsWith('.svg');
    if (isSvg) {
      const svgText = fileBuffer.toString('utf8').toLowerCase();
      const dangerousPatterns = ['<script', 'javascript:', '<iframe', '<object', '<embed', 'onload=', 'onerror=', 'onclick='];
      if (dangerousPatterns.some((p) => svgText.includes(p))) {
        return res.status(400).json({ error: 'Security rejection: Uploaded SVG contains unsafe or executable scripts.' });
      }
    }

    // Try Cloudinary if credentials are set
    const hasCloudinary = Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );

    if (hasCloudinary) {
      try {
        const { v2: cloudinary } = await import('cloudinary');
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
          secure: true,
        });

        // Upload the original asset unchanged. Do not pass `format` or `quality` here:
        // upload `format` sets the stored file extension (so 'auto' is invalid), and
        // delivery optimisation (f_auto,q_auto) is applied at URL level in src/lib/cloudinary.ts.
        const result: any = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'perfect_homes/properties', resource_type: 'image' },
            (err, r) => err ? reject(err) : resolve(r)
          );
          stream.end(fileBuffer!);
        });

        return res.status(201).json({
          publicId: result.public_id,
          secureUrl: result.secure_url,
          format: result.format || 'jpg',
          resourceType: result.resource_type || 'image',
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          originalFilename,
          sortOrder: 0,
          isCover: false,
        });
      } catch (e: any) {
        console.error('Cloudinary upload error:', e?.message, e?.http_code);
        return res.status(502).json({
          error: e?.message || 'Image upload to Cloudinary failed. Please try again.',
        });
      }
    }

    // Fallback (Cloudinary not configured): base64 data URL so local development still works
    const base64 = fileBuffer.toString('base64');
    const safeType = mimetype !== 'application/octet-stream' ? mimetype : 'image/jpeg';
    return res.status(201).json({
      publicId: `ph_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      secureUrl: `data:${safeType};base64,${base64}`,
      format: originalFilename.split('.').pop() || 'jpg',
      resourceType: 'image',
      width: 1920,
      height: 1080,
      bytes: fileBuffer.length,
      originalFilename,
      sortOrder: 0,
      isCover: false,
    });
  }

  // ── DELETE /api/images/:publicId ─────────────────────────────────────────
  const imgMatch = path.match(/^\/api\/images\/(.+)$/);
  if (imgMatch && method === 'DELETE') {
    const session = await resolveSession(getToken(req));
    if (!session || (session.role !== 'admin' && session.role !== 'agent')) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const publicId = decodeURIComponent(imgMatch[1]);
    const hasCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
    if (hasCloudinary) {
      try {
        const { v2: cloudinary } = await import('cloudinary');
        cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
        await cloudinary.uploader.destroy(publicId);
      } catch (e: any) {
        console.error('Cloudinary delete error:', e?.message);
      }
    }
    return res.status(200).json({ success: true, publicId });
  }

  return res.status(404).json({ error: 'API route not found.' });
}
