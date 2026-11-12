import mongoose, { Schema, Document } from 'mongoose';

export interface IInquiry extends Document {
  firstName: string;
  lastName: string;
  email: string;
  comments: string;
  phone?: string;
  createdAt: Date;
}

const InquirySchema: Schema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    comments: { type: String, required: true },
    phone: { type: String },
  },
  {
    timestamps: true,
  }
);

export const InquiryModel =
  mongoose.models.Inquiry || mongoose.model<IInquiry>('Inquiry', InquirySchema);
