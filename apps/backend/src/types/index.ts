export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  balance: number;
  createdAt: string;
}

export interface SnailPayChargeRequest {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  fullName: string;
  amount: number;
  payerId: string;
  payerEmail: string;
}

export interface SnailPayChargeResponse {
  id: string;
  status: "approved" | "rejected" | "error";
  statusDetail: string;
  transactionAmount: number;
  dateCreated: string;
  authorizationCode?: string;
  reference: string;
  payerId: string;
  payerEmail: string;
  cardNumber: string;
  cvv: string;
}

export interface Session {
  id: string;
  userId: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  snailId: number;
  amount: number;
  won: boolean;
  date: string;
}