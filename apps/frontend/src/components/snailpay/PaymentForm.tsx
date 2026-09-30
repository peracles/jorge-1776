import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useAuth } from "../../hooks/useAuth";
import { apiFetch } from "../../lib/api";
import type { SnailPayChargeResponse, User } from "../../types";

const paymentSchema = z.object({
  cardNumber: z.string().length(16, "Card number must be 16 digits"),
  expiryDate: z.string().regex(/^\d{2}\/\d{2}$/, "Expiry date must be MM/YY format"),
  cvv: z.string().length(3, "CVV must be 3 digits"),
  fullName: z.string().min(2, "Full name is required"),
  amount: z.number().positive("Amount must be greater than 0"),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  onSuccess: (amount: number) => void;
  onClose: () => void;
}

export function PaymentForm({ onSuccess, onClose }: PaymentFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, updateUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 100,
    },
  });

  async function onSubmit(data: PaymentFormData) {
    setError(null);
    setLoading(true);
    try {
      const response = await apiFetch<SnailPayChargeResponse>("/snailpay/process", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          payerId: user?.id,
          payerEmail: user?.email,
        }),
      });

      if (response.status === "approved") {
        const updatedUser = await apiFetch<User>("/auth/me");
        updateUser(updatedUser);
        onSuccess(data.amount);
      } else {
        setError(response.statusDetail);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-2 border-[var(--primary)]">
      <CardHeader>
        <CardTitle className="text-[var(--foreground)]">SnailPay Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input id="cardNumber" {...register("cardNumber")} placeholder="1234123412341234" />
            {errors.cardNumber && <p className="text-sm text-red-500">{errors.cardNumber.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input id="expiryDate" {...register("expiryDate")} placeholder="12/26" />
              {errors.expiryDate && <p className="text-sm text-red-500">{errors.expiryDate.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cvv">CVV</Label>
              <Input id="cvv" {...register("cvv")} placeholder="543" />
              {errors.cvv && <p className="text-sm text-red-500">{errors.cvv.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" {...register("fullName")} placeholder="Jorge Perales" />
            {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount ($)</Label>
            <Input id="amount" type="number" step="0.01" {...register("amount", { valueAsNumber: true })} placeholder="100.00" />
            {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Processing..." : "Pay"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
