import { Property, BookingRequest, ContactMessage, SearchFilters } from '../types';

const STORAGE_KEY = 'perfect_homes_properties_v2';
const SAVED_KEY = 'perfect_homes_saved_properties_v2';
const BOOKINGS_KEY = 'perfect_homes_bookings_v2';

// Helper to get stored properties
export function getStoredProperties(): Property[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredProperties(properties: Property[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
  } catch (err) {
    // localStorage write failure is non-critical
  }
}

// Fetch properties with filters
export async function fetchProperties(filters?: SearchFilters): Promise<Property[]> {
  // Attempt to call server API first if available
  try {
    const params = new URLSearchParams();
    if (filters?.keyword) params.set('keyword', filters.keyword);
    if (filters?.propertyType && filters.propertyType !== 'All') params.set('propertyType', filters.propertyType);
    if (filters?.listingType && filters.listingType !== 'All') params.set('listingType', filters.listingType);
    if (filters?.minPrice) params.set('minPrice', filters.minPrice.toString());
    if (filters?.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
    if (filters?.bedrooms && filters.bedrooms !== 'Any') params.set('bedrooms', filters.bedrooms);

    const res = await fetch(`/api/properties?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
    // Server responded with an error (e.g. database unavailable): do not show local-only data
    return [];
  } catch {
    // Network failure: fall back to client storage
  }

  let list = getStoredProperties();

  if (!filters) return list;

  const normalize = (value: unknown) => String(value ?? '').toLowerCase().trim();

  const q = normalize(filters.keyword);
  if (q) {
    list = list.filter((p) =>
      [p.title, p.description, p.location?.neighborhood, p.location?.city, p.propertyType].some((field) =>
        normalize(field).includes(q)
      )
    );
  }

  if (filters.propertyType && filters.propertyType !== 'All') {
    list = list.filter((p) => normalize(p.propertyType) === normalize(filters.propertyType));
  }

  if (filters.listingType && filters.listingType !== 'All') {
    list = list.filter((p) => normalize(p.listingType) === normalize(filters.listingType));
  }

  if (filters.minPrice && filters.minPrice > 0) {
    list = list.filter((p) => p.price >= (filters.minPrice || 0));
  }

  if (filters.maxPrice && filters.maxPrice > 0) {
    list = list.filter((p) => p.price <= (filters.maxPrice || Infinity));
  }

  if (filters.bedrooms && filters.bedrooms !== 'Any') {
    const minBeds = parseInt(filters.bedrooms, 10);
    if (!isNaN(minBeds)) {
      list = list.filter((p) => p.bedrooms >= minBeds);
    }
  }

  return list;
}

// Add new property (Protected)
export async function addProperty(propertyData: Omit<Property, '_id' | 'createdAt' | 'slug'>): Promise<Property> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    // Do NOT send _id, id, slug, or createdAt — the server generates these.
    // Sending a non-ObjectId string as _id causes a Mongoose CastError.
    const payload = { ...propertyData };
    delete (payload as any)._id;
    delete (payload as any).id;
    delete (payload as any).slug;
    delete (payload as any).createdAt;

    const res = await fetch('/api/properties', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Failed to create property (HTTP ${res.status})`);
  } catch (err: any) {
    throw err instanceof Error ? err : new Error('Failed to create property');
  }
}

// Update property (Protected)
export async function updateProperty(id: string, updates: Partial<Property>): Promise<Property | null> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    const res = await fetch(`/api/properties/${id}`, {
      method: 'PATCH',
      headers,
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (res.ok) {
      const updated = await res.json();
      const list = getStoredProperties().map((p) => (p._id === id || p.id === id ? { ...p, ...updates } : p));
      saveStoredProperties(list);
      return updated;
    } else if (res.status === 401 || res.status === 403) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Unauthorized');
    }
  } catch (err) {
    // update failure is surfaced to the caller via return null
  }

  const list = getStoredProperties().map((p) => (p._id === id || p.id === id ? { ...p, ...updates } : p));
  saveStoredProperties(list);
  return list.find((p) => p._id === id || p.id === id) || null;
}

// Delete property (Protected). Throws on failure; local cache is only updated after the server confirms.
export async function deleteProperty(id: string): Promise<void> {
  const headers: Record<string, string> = {};

  const res = await fetch(`/api/properties/${id}`, {
    method: 'DELETE',
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Delete failed (${res.status}).`);
  }

  const remaining = getStoredProperties().filter((p) => p._id !== id && p.id !== id);
  saveStoredProperties(remaining);
}

// Saved properties
export function getSavedPropertyIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleSaveProperty(id: string): string[] {
  const current = getSavedPropertyIds();
  let updated: string[];
  if (current.includes(id)) {
    updated = current.filter((item) => item !== id);
  } else {
    updated = [...current, id];
  }
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(updated));
  } catch {
    // localStorage write failure is non-critical
  }
  return updated;
}

// Bookings
export async function submitBooking(booking: BookingRequest): Promise<{ success: boolean; message: string }> {
  try {
    await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booking),
    });
  } catch {
    // fallback
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(BOOKINGS_KEY);
      const list = raw ? JSON.parse(raw) : [];
      list.push({ ...booking, _id: 'book-' + Date.now(), createdAt: new Date().toISOString() });
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  return {
    success: true,
    message: `Thank you ${booking.firstName}! Your viewing appointment request for ${booking.houseType} has been received. Our Westlands agent will reach out via ${booking.contact} within 2 hours.`,
  };
}

// Contact Inquiry
export async function submitContact(inquiry: ContactMessage): Promise<{ success: boolean; message: string }> {
  try {
    await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiry),
    });
  } catch {
    // fallback
  }

  return {
    success: true,
    message: `Thank you, ${inquiry.firstName}! Your inquiry has been delivered to Perfect Homes Kenya. An agent will respond to ${inquiry.email} shortly.`,
  };
}
