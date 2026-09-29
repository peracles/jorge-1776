import { Router, type Router as RouterType } from "express";
import { processPayment } from "../controllers/snailpay.js";
import { authenticate } from "../middleware/auth.js";

const router: RouterType = Router();

router.post("/snailpay/process", authenticate, processPayment);

export default router;
