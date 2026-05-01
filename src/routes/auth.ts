import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { register, login, verifyOtp, setPassword, logout, refreshToken, forgotPassword } from "../controllers/auth.controller.js";

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/set-password', setPassword);
router.post('/logout', authMiddleware, logout)
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword)


export default router;