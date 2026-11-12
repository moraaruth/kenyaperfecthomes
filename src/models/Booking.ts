import mongoose, { Schema, Document } from 'mongoose';

export interface IBooking extends Document {
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
  status: 'Pending' | 'Confirmed' | 'Completed';
  createdAt: Date;
}

const BookingSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    contact: { type: String, required: true },
    preferredDate: {
      month: { type: String, required: true },
      day: { type: String, required: true },
      year: { type: String, required: true },
    },
    location: { type: String, required: true },
    houseType: { type: String, required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Completed'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

export const BookingModel =
  mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);
