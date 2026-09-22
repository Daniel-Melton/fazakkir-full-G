import { z } from "zod";

export const leadSchema = z.object({
  fullName: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(150, "Name too long")
    .regex(/^[\p{L}\s'-]+$/u, "Invalid characters in name"),
  email: z.string().email("Invalid email address"),
  countryCode: z.string().regex(/^\+[1-9]\d{0,3}$/, "Invalid country code"),
  phoneNumber: z
    .string()
    .min(6, "Phone number is too short")
    .max(20, "Phone number is too long")
    .regex(/^[\d\s-]+$/, "Invalid phone number format"),
  courseName: z.string().min(2, "Course selection is required"),
  turnstileToken: z.string().min(1, "Captcha verification failed"),
});

export type LeadInput = z.infer<typeof leadSchema>;