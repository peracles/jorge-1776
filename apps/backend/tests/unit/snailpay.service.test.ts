import { describe, it, expect } from "vitest";
import { SnailPayService } from "../../src/services/snailpay.js";
import type { SnailPayChargeRequest } from "../../src/types/index.js";

const validRequest: SnailPayChargeRequest = {
  cardNumber: "1234123412341234",
  expiryDate: "12/26",
  cvv: "543",
  fullName: "Jorge Perales",
  amount: 100,
  payerId: "user-123",
  payerEmail: "jorge@test.com",
};

describe("SnailPayService", () => {
  describe("processPayment", () => {
    it("should approve payment with valid card data", () => {
      const result = SnailPayService.processPayment(validRequest, false);
      expect(result.status).toBe("approved");
      expect(result.statusDetail).toBe("Payment approved successfully");
      expect(result.transactionAmount).toBe(100);
      expect(result.authorizationCode).toBeDefined();
    });

    it("should reject payment with wrong card number", () => {
      const request = { ...validRequest, cardNumber: "9999999999999999" };
      const result = SnailPayService.processPayment(request, false);
      expect(result.status).toBe("rejected");
      expect(result.statusDetail).toBe("Card declined");
    });

    it("should reject payment with wrong CVV", () => {
      const request = { ...validRequest, cvv: "999" };
      const result = SnailPayService.processPayment(request, false);
      expect(result.status).toBe("rejected");
      expect(result.statusDetail).toBe("Invalid CVV");
    });

    it("should reject payment with wrong expiry date", () => {
      const request = { ...validRequest, expiryDate: "01/25" };
      const result = SnailPayService.processPayment(request, false);
      expect(result.status).toBe("rejected");
      expect(result.statusDetail).toBe("Card expired");
    });

    it("should reject payment with invalid amount", () => {
      const request = { ...validRequest, amount: -50 };
      const result = SnailPayService.processPayment(request, false);
      expect(result.status).toBe("rejected");
      expect(result.statusDetail).toBe("Invalid amount");
    });

    it("should throw SystemError when simulateSystemError is true", () => {
      expect(() => SnailPayService.processPayment(validRequest, true)).toThrow(
        "SnailPay service is temporarily unavailable"
      );
    });

    it("should generate unique id and reference for each payment", () => {
      const result1 = SnailPayService.processPayment(validRequest, false);
      const result2 = SnailPayService.processPayment(validRequest, false);
      expect(result1.id).not.toBe(result2.id);
      expect(result1.reference).not.toBe(result2.reference);
    });
  });
});
