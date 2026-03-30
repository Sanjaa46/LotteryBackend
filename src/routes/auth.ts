import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware";
import { register, login, verifyOtp, setPassword, refreshToken } from "../controllers/auth.controller";

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/set-password', setPassword);
router.post('/refresh-token', authMiddleware, refreshToken);


export default router;