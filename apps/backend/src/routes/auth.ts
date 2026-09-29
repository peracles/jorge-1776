import { Router, type Router as RouterType } from "express";
import { register, login, logout } from "../controllers/auth.js";

const router: RouterType = Router();

router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/logout", logout);

export default router;
