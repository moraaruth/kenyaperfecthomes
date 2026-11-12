export type PropertyType = 'Apartment' | 'Studio' | 'Villa' | 'Townhouse' | 'Commercial' | 'Penthouse';
export type ListingType = 'Sale' | 'Rent';

export interface PropertyImage {
  publicId: string;
  secureUrl: string;
  format: string;
  resourceType: string;
  width?: number;
  height?: number;
  bytes?: number;
  originalFilename?: string;
  sortOrder: number;
  isCover: boolean;
}

export interface PropertyRates {
  weekly?: number;
  sale?: number;
  monthly?: number;
  daily?: number;
}

export interface SellerInfo {
  name: string;
  email: string;
  phone: string;
}

export interface Property {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  description: string;
  propertyType: PropertyType;
  listingType: ListingType;
  price: number;
  rates?: PropertyRates;
  currency: 'KSh' | 'USD';
  location: {
    street?: string;
    city: string;
    neighborhood: string;
    county?: string;
  };
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  images: (PropertyImage | string)[];
  amenities: string[];
  featured?: boolean;
  status: 'Available' | 'Pending' | 'Sold' | 'Rented';
  seller?: SellerInfo;
  createdAt: string;
  updatedAt?: string;
}

export interface BookingRequest {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  contact: string;
  preferredDate: {
    month: string;
    day: string;
    year: string;
  };
  location: string;
  houseType: string;
  propertyId?: string;
  propertyTitle?: string;
  notes?: string;
  status?: 'Pending' | 'Confirmed' | 'Completed';
  createdAt?: string;
}

export interface ContactMessage {
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  comments: string;
  phone?: string;
  createdAt?: string;
}

export interface SearchFilters {
  keyword: string;
  propertyType: string;
  listingType: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: string;
  location?: string;
}
