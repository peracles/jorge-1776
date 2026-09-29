import { v4 as uuidv4 } from "uuid";
import type { SnailPayChargeRequest, SnailPayChargeResponse } from "../types/index.js";

const VALID_CARD = "1234123412341234";
const VALID_CVV = "543";
const VALID_EXPIRY = "12/26";

function buildResponse(
  status: SnailPayChargeResponse["status"],
  statusDetail: string,
  req: SnailPayChargeRequest,
): SnailPayChargeResponse {
  return {
    id: `txn_${uuidv4().slice(0, 8)}`,
    status,
    statusDetail,
    transactionAmount: status === "approved" ? req.amount : 0,
    dateCreated: new Date().toISOString(),
    authorizationCode: status === "approved" ? `AUTH${Math.floor(100000 + Math.random() * 900000)}` : undefined,
    reference: `ref_${uuidv4().slice(0, 6)}`,
    payerId: req.payerId,
    payerEmail: req.payerEmail,
    cardNumber: req.cardNumber,
    cvv: req.cvv,
  };
}

export const SnailPayService = {
  processPayment(req: SnailPayChargeRequest, simulateSystemError: boolean): SnailPayChargeResponse {
    if (simulateSystemError) {
      throw Object.assign(new Error("SnailPay service is temporarily unavailable"), { statusCode: 500 });
    }

    if (req.cardNumber !== VALID_CARD) {
      return buildResponse("rejected", "Card declined", req);
    }

    if (req.cvv !== VALID_CVV) {
      return buildResponse("rejected", "Invalid CVV", req);
    }

    if (req.expiryDate !== VALID_EXPIRY) {
      return buildResponse("rejected", "Card expired", req);
    }

    if (req.amount <= 0 || isNaN(req.amount)) {
      return buildResponse("rejected", "Invalid amount", req);
    }

    return buildResponse("approved", "Payment approved successfully", req);
  },
};
