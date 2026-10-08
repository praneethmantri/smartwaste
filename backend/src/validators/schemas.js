import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const createComplaintSchema = z.object({
  wasteType: z.enum([
    'Wet waste',
    'Dry waste',
    'Plastic waste',
    'E-waste',
    'Mixed waste',
    'Other',
  ]),
  category: z.enum([
    'Garbage not collected',
    'Overflowing dustbin',
    'Illegal dumping',
    'Blocked drainage',
    'Public sanitation issue',
    'Other',
  ]),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).default('MEDIUM'),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  address: z.string().min(3, 'Address is required'),
  serviceZoneId: z.string().optional(),
});

export const updateComplaintStatusSchema = z.object({
  status: z.enum(['SUBMITTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'REOPENED']),
  notes: z.string().optional(),
});

export const assignComplaintSchema = z.object({
  workerId: z.string().uuid('Worker ID must be a valid UUID'),
  serviceZoneId: z.string().optional(),
  notes: z.string().optional(),
});

export const createScheduleSchema = z.object({
  serviceZoneId: z.string().uuid('Zone ID must be a valid UUID'),
  workerId: z.string().uuid().optional().nullable(),
  collectionDate: z.string().or(z.date()),
  collectionTime: z.string().min(3, 'Collection time is required'),
  wasteType: z.string().min(2, 'Waste type is required'),
  vehicleNumber: z.string().optional().nullable(),
});

export const updateScheduleSchema = z.object({
  serviceZoneId: z.string().uuid().optional(),
  workerId: z.string().uuid().optional().nullable(),
  collectionDate: z.string().or(z.date()).optional(),
  collectionTime: z.string().optional(),
  wasteType: z.string().optional(),
  vehicleNumber: z.string().optional().nullable(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
});

export const feedbackSchema = z.object({
  complaintId: z.string().uuid('Complaint ID must be a valid UUID'),
  rating: z.coerce.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  recommendation: z.coerce.boolean().default(true),
  comments: z.string().optional(),
});

export const completionProofSchema = z.object({
  notes: z.string().optional(),
});
