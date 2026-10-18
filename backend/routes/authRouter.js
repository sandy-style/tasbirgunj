import express from "express";
import { rateLimit } from "express-rate-limit";

// ---------- Controllers ----------

import {
  registerUser,
  logUser,
  verifyUser,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
  googleLogin,
} from "../controllers/authController.js";

// ---------- Time constants ----------

const SECOND = 1000;
const MINUTE = 60 * SECOND;

// ---------- Rate limiters ----------

// Login: 20 attempts per minute
const loginLimit = rateLimit({
  windowMs: 1 * MINUTE,
  limit: 20,
  message: {
    success: false,
    message: "Too many login attempts. Please wait a minute.",
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// Registration: 10 attempts per minute
const registerLimit = rateLimit({
  windowMs: 1 * MINUTE,
  limit: 10,
  message: {
    success: false,
    message: "Too many registration attempts. Please wait a minute.",
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// Resend verification email: 3 requests per 2 minutes
const resendLimit = rateLimit({
  windowMs: 2 * MINUTE,
  limit: 3,
  message: {
    success: false,
    message:
      "Please wait 2 minutes before requesting more verification emails.",
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// Verify email: 15 attempts per minute
const verifyLimit = rateLimit({
  windowMs: 1 * MINUTE,
  limit: 15,
  message: {
    success: false,
    message: "Too many verification attempts. Please wait a minute.",
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// Forgot password: 5 requests per 5 minutes
const forgotPasswordLimit = rateLimit({
  windowMs: 5 * MINUTE,
  limit: 5,
  message: {
    success: false,
    message: "Too many password reset requests. Please wait 5 minutes.",
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// Reset password: 10 attempts per minute
const resetPasswordLimit = rateLimit({
  windowMs: 1 * MINUTE,
  limit: 10,
  message: {
    success: false,
    message: "Too many password reset attempts. Please wait a minute.",
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// ---------- Routes ----------

const authRouter = express.Router();

authRouter.post("/auth/register", registerLimit, registerUser);
authRouter.post("/auth/login", loginLimit, logUser);
authRouter.post("/auth/verify", verifyLimit, verifyUser);
authRouter.post("/auth/resend-email", resendLimit, resendVerificationCode);
authRouter.post("/auth/forgot-password", forgotPasswordLimit, forgotPassword);
authRouter.post("/auth/reset-password", resetPasswordLimit, resetPassword);
authRouter.post("/auth/google-login", googleLogin);
export default authRouter;
