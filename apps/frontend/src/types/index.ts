export interface User {
  id: string;
  fullName: string;
  email: string;
  balance: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
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
