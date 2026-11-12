import { PropertyImage } from '../types';

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'limit' | 'thumb' | 'scale';
  quality?: 'auto' | 'auto:good' | 'auto:best' | 'auto:eco' | number;
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png';
  gravity?: 'auto' | 'center' | 'north' | 'south';
}

/**
 * Builds an optimized Cloudinary delivery URL with automatic format and quality.
 * If the image is not a Cloudinary URL (e.g. local asset during dev),
 * it returns the clean original URL gracefully.
 */
export function getOptimizedImageUrl(
  imageInput: PropertyImage | string | undefined | null,
  options: ImageTransformOptions = {}
): string {
  if (!imageInput) {
    return '/images/property_westlands_apartment_1794311302942.jpg';
  }

  const rawUrl = typeof imageInput === 'string' ? imageInput : imageInput.secureUrl;
  if (!rawUrl) {
    return '/images/property_westlands_apartment_1794311302942.jpg';
  }

  // If this is a Cloudinary URL, inject optimal transformation parameters
  // Cloudinary URL format: https://res.cloudinary.com/<cloud_name>/image/upload/(transforms)/v.../public_id.ext
  if (rawUrl.includes('res.cloudinary.com')) {
    const {
      width,
      height,
      crop = 'fill',
      quality = 'auto',
      format = 'auto',
      gravity = 'auto',
    } = options;

    const transforms: string[] = [`f_${format}`, `q_${quality}`];
    if (width) transforms.push(`w_${width}`);
    if (height) transforms.push(`h_${height}`);
    if (width || height) {
      transforms.push(`c_${crop}`);
      if (crop === 'fill' || crop === 'thumb') {
        transforms.push(`g_${gravity}`);
      }
    }

    const transformString = transforms.join(',');
    return rawUrl.replace('/upload/', `/upload/${transformString}/`);
  }

  return rawUrl;
}

/**
 * Specialized Transformation Presets for Real Estate Views
 */

// Property Card: 4:3 ratio, optimized for grid listing (640x480 max)
export function transformForCard(image: PropertyImage | string): string {
  return getOptimizedImageUrl(image, {
    width: 640,
    height: 480,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
}

// Gallery Main: High definition 16:10 or 16:9 view (1440x900 max)
export function transformForGallery(image: PropertyImage | string): string {
  return getOptimizedImageUrl(image, {
    width: 1440,
    height: 900,
    crop: 'limit',
    quality: 'auto',
    format: 'auto',
  });
}

// Hero banner: Wide cinematic panoramic view (1920x1080)
export function transformForHero(image: PropertyImage | string): string {
  return getOptimizedImageUrl(image, {
    width: 1920,
    height: 1080,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
}

// Mobile Thumbnail: Touch slider thumbnail (160x120)
export function transformForThumbnail(image: PropertyImage | string): string {
  return getOptimizedImageUrl(image, {
    width: 160,
    height: 120,
    crop: 'fill',
    quality: 'auto',
    format: 'auto',
  });
}

/**
 * Normalizes property images array to structured PropertyImage[] objects
 */
export function normalizePropertyImages(images: (PropertyImage | string)[] | undefined): PropertyImage[] {
  if (!images || images.length === 0) {
    return [
      {
        publicId: 'default_property_img',
        secureUrl: '/images/property_westlands_apartment_1794311302942.jpg',
        format: 'jpg',
        resourceType: 'image',
        sortOrder: 0,
        isCover: true,
      },
    ];
  }

  const normalized: PropertyImage[] = images.map((item, index) => {
    if (typeof item === 'string') {
      return {
        publicId: `img_${index}_${Math.random().toString(36).substring(2, 7)}`,
        secureUrl: item,
        format: item.split('.').pop() || 'jpg',
        resourceType: 'image',
        sortOrder: index,
        isCover: index === 0,
      };
    }
    return {
      ...item,
      sortOrder: item.sortOrder ?? index,
      isCover: item.isCover ?? index === 0,
    };
  });

  // Sort by sortOrder ascending
  normalized.sort((a, b) => a.sortOrder - b.sortOrder);

  // Ensure exactly one cover image exists
  const hasCover = normalized.some((img) => img.isCover);
  if (!hasCover && normalized.length > 0) {
    normalized[0].isCover = true;
  }

  return normalized;
}

/**
 * Extracts the primary cover image URL
 */
export function getCoverImageUrl(images: (PropertyImage | string)[] | undefined): string {
  const normalized = normalizePropertyImages(images);
  const cover = normalized.find((img) => img.isCover) || normalized[0];
  return cover ? cover.secureUrl : '/images/property_westlands_apartment_1794311302942.jpg';
}
