import mongoose, { Schema, Document } from 'mongoose';
import { PropertyImage } from '../types';

export interface IProperty extends Document {
  title: string;
  slug: string;
  description: string;
  propertyType: 'Apartment' | 'Studio' | 'Villa' | 'Townhouse' | 'Commercial' | 'Penthouse';
  listingType: 'Sale' | 'Rent';
  price: number;
  rates?: {
    weekly?: number;
    sale?: number;
    monthly?: number;
    daily?: number;
  };
  currency: string;
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
  featured: boolean;
  status: 'Available' | 'Pending' | 'Sold' | 'Rented';
  seller?: {
    name: string;
    email: string;
    phone: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PropertyImageSubSchema = new Schema(
  {
    publicId: { type: String, required: true },
    secureUrl: { type: String, required: true },
    format: { type: String, default: 'jpg' },
    resourceType: { type: String, default: 'image' },
    width: { type: Number },
    height: { type: Number },
    bytes: { type: Number },
    originalFilename: { type: String },
    sortOrder: { type: Number, default: 0 },
    isCover: { type: Boolean, default: false },
  },
  { _id: false }
);

const PropertySchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    propertyType: {
      type: String,
      required: true,
      enum: ['Apartment', 'Studio', 'Villa', 'Townhouse', 'Commercial', 'Penthouse'],
      index: true,
    },
    listingType: {
      type: String,
      required: true,
      enum: ['Sale', 'Rent'],
      index: true,
    },
    price: { type: Number, required: true, min: 0, index: true },
    rates: {
      weekly: { type: Number },
      sale: { type: Number },
      monthly: { type: Number },
      daily: { type: Number },
    },
    currency: { type: String, default: 'KSh' },
    location: {
      street: { type: String },
      city: { type: String, required: true, index: true },
      neighborhood: { type: String, required: true, index: true },
      county: { type: String, default: 'Nairobi' },
    },
    bedrooms: { type: Number, required: true, min: 0 },
    bathrooms: { type: Number, required: true, min: 0 },
    squareFeet: { type: Number, required: true, min: 0 },
    images: [Schema.Types.Mixed],
    amenities: [{ type: String }],
    featured: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: ['Available', 'Pending', 'Sold', 'Rented'],
      default: 'Available',
      index: true,
    },
    seller: {
      name: { type: String },
      email: { type: String },
      phone: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for fast keyword search across title, description, and location
PropertySchema.index({
  title: 'text',
  description: 'text',
  'location.neighborhood': 'text',
  'location.city': 'text',
});

export const PropertyModel =
  mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema);
