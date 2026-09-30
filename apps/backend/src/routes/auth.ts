import { Router, type Router as RouterType } from "express";
import { register, login, logout, getMe } from "../controllers/auth.js";
import { authenticate } from "../middleware/auth.js";

const router: RouterType = Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.get("/auth/me", authenticate, getMe);

export default router;
