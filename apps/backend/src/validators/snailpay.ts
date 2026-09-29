import { z } from "zod";

export const snailpaySchema = z.object({
  cardNumber: z.string().length(16, "Card number must be 16 digits"),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, "Expiry date must be MM/YY format"),
  cvv: z.string().length(3, "CVV must be 3 digits"),
  fullName: z.string().min(2, "Full name is required"),
  amount: z.number().positive("Amount must be a positive number"),
  payerId: z.string().min(1, "Payer ID is required"),
  payerEmail: z.string().email("Invalid payer email format"),
});
