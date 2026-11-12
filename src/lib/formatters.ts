/**
 * Kenyan Real Estate Currency and Contact Formatters
 */

export function formatKSh(amount: number, compact: boolean = false): string {
  if (!amount || isNaN(amount)) return 'KSh 0';

  if (compact && amount >= 1000000) {
    const inMillions = amount / 1000000;
    // e.g. 6.4M, 8M
    return `KSh ${Number(inMillions.toFixed(1))}M`;
  }

  if (compact && amount >= 1000) {
    const inThousands = amount / 1000;
    return `KSh ${Number(inThousands.toFixed(0))}k`;
  }

  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace('KES', 'KSh');
}

export function formatArea(sqft: number): string {
  if (!sqft) return '0 sq ft';
  return `${sqft.toLocaleString()} sq ft`;
}

export function formatPhone(phone: string): string {
  if (!phone) return '+254 701 029 158';
  return phone;
}

export function generateWhatsAppLink(propertyTitle?: string, propertyUrl?: string): string {
  const basePhone = '254701029158';
  let message = 'Hello Perfect Homes Kenya! I am interested in finding a property.';
  if (propertyTitle) {
    message = `Hello Perfect Homes Kenya! I would like to enquire about: "${propertyTitle}". Please share more details and viewing availability.`;
  }
  return `https://wa.me/${basePhone}?text=${encodeURIComponent(message)}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
