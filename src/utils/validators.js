import { z } from 'zod';

export const registrationSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().max(100).optional().nullable(),
  country: z.string().min(1, 'Country is required').max(100),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  footPreference: z.enum(['left', 'right'], {
    errorMap: () => ({ message: 'Foot preference must be either left or right' }),
  }),
});
