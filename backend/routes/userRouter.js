import express from "express";
import { rateLimit } from "express-rate-limit";

import {
  registerUser,
  logUser,
  verifyUser,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

// ---------- Time constants ----------

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// ---------- Rate limiters ----------

// Login
const loginLimit = rateLimit({
  windowMs: 30 * MINUTE,
  limit: 10,
  message: {
    success: false,
    message: "Too many login attempts. Please try again later.",
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// Registration
const registerLimit = rateLimit({
  windowMs: 20 * MINUTE,
  limit: 10,
  message: {
    success: false,
    message: "Too many registration attempts. Please try again later.",
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// Resend verification email
const resendLimit = rateLimit({
  windowMs: HOUR,
  limit: 5,
  message: {
    success: false,
    message: "Too many verification email requests. Please try again later.",
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// Verify email code
const verifyLimit = rateLimit({
  windowMs: 10 * MINUTE,
  limit: 10,
  message: {
    success: false,
    message: "Too many verification attempts. Please try again later.",
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// Forgot password
const forgotPasswordLimit = rateLimit({
  windowMs: HOUR,
  limit: 20,
  message: {
    success: false,
    message: "Too many password reset requests. Please try again later.",
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// Reset password
const resetPasswordLimit = rateLimit({
  windowMs: HOUR,
  limit: 10,
  message: {
    success: false,
    message: "Too many password reset attempts. Please try again later.",
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// ---------- Routes ----------

const userRouter = express.Router();

userRouter.post("/register", registerLimit, registerUser);

userRouter.post("/login", loginLimit, logUser);

userRouter.post("/verify", verifyLimit, verifyUser);

userRouter.post("/resend-email", resendLimit, resendVerificationCode);

userRouter.post("/forgot-password", forgotPasswordLimit, forgotPassword);

userRouter.post("/reset-password", resetPasswordLimit, resetPassword);

export default userRouter;
