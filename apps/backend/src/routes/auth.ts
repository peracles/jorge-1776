import { Router, type Router as RouterType } from "express";
import { register, login } from "../controllers/auth.js";

const router: RouterType = Router();

router.post("/auth/register", register);
router.post("/auth/login", login);

export default router;
