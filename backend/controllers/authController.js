import userModel from "../models/userModel.js";
import bcrypt from "bcryptjs";
import validator from "validator";
import { verificationEmail, passwordResetEmail } from "../config/sendemail.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// ---------- Time constants ----------

const MINUTE = 60 * 1000;
const DAY = 24 * MINUTE;

const VERIFY_CODE_EXPIRES = 10 * MINUTE;
const VERIFY_EMAIL_COOLDOWN = 2 * MINUTE;

const RESET_TOKEN_EXPIRES = DAY;
const RESET_EMAIL_COOLDOWN = 15 * MINUTE;

// User must wait 15 days after successfully resetting password
const PASSWORD_RESET_COOLDOWN = 15 * DAY;

// ---------- Helpers ----------

// Create JWT
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "60d",
  });
};

// Validate password strength
const validatePassword = (password) => {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }

  if (!/\d/.test(password)) {
    return "Password must contain at least one number.";
  }

  return null;
};

// Generate verification code + hashed version + expiry
const generateVerificationData = async () => {
  const code = crypto.randomInt(100000, 1000000).toString();

  const hashedCode = await bcrypt.hash(code, 8);

  const expiresAt = new Date(Date.now() + VERIFY_CODE_EXPIRES);

  return {
    code,
    hashedCode,
    expiresAt,
  };
};

// ---------- Register ----------

const registerUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.json({
        success: false,
        message: "Please complete all required fields correctly.",
      });
    }

    email = email.trim().toLowerCase();

    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email.",
      });
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      return res.json({
        success: false,
        message: passwordError,
      });
    }

    const emailExists = await userModel.findOne({ email });

    if (emailExists) {
      return res.json({
        success: false,
        message: "Email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { code, hashedCode, expiresAt } = await generateVerificationData();

    const newUser = new userModel({
      email,
      password: hashedPassword,
      verificationCode: hashedCode,
      verificationCodeExpires: expiresAt,
      unVerifiedExpiresAt: new Date(Date.now() + 7 * DAY),
    });

    // Only save cooldown after email is successfully sent
    await verificationEmail(email, code);

    newUser.lastVerificationEmailAt = new Date();

    await newUser.save();

    return res.json({
      success: true,
      message: "Please verify your email.",
      verify: false,
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

// ---------- Login ----------

const logUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.json({
        success: false,
        message: "Please complete all required fields correctly.",
      });
    }

    email = email.trim().toLowerCase();

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "Email does not exist.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Password does not match.",
      });
    }

    // Handle unverified account
    if (!user.isVerified) {
      const codeExpired =
        !user.verificationCodeExpires ||
        user.verificationCodeExpires.getTime() <= Date.now();

      if (codeExpired) {
        if (
          user.lastVerificationEmailAt &&
          Date.now() - user.lastVerificationEmailAt.getTime() <
            VERIFY_EMAIL_COOLDOWN
        ) {
          return res.json({
            success: false,
            message:
              "Email is not verified. Please wait 2 minutes before requesting another verification email.",
            verify: false,
          });
        }

        const { code, hashedCode, expiresAt } =
          await generateVerificationData();

        await verificationEmail(email, code);

        user.verificationCode = hashedCode;
        user.verificationCodeExpires = expiresAt;
        user.lastVerificationEmailAt = new Date();

        await user.save();

        return res.json({
          success: false,
          message:
            "Email is not verified. A new verification email has been sent.",
          verify: false,
        });
      }

      return res.json({
        success: false,
        message:
          "Email is not verified. Please check your mail for the verification code.",
        verify: false,
      });
    }

    const token = createToken(user._id);

    return res.json({
      success: true,
      message: "Login successful.",
      token,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

// ---------- Verify Email ----------

const verifyUser = async (req, res) => {
  try {
    let { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.json({
        success: false,
        message: "Email and verification code are required.",
      });
    }

    email = email.trim().toLowerCase();

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "Email could not be verified.",
      });
    }

    if (user.isVerified) {
      return res.json({
        success: false,
        message: "Email is already verified.",
      });
    }

    if (
      !user.verificationCodeExpires ||
      Date.now() >= user.verificationCodeExpires.getTime()
    ) {
      return res.json({
        success: false,
        message: "Verification code is invalid or expired.",
      });
    }

    const isMatch = await bcrypt.compare(
      verificationCode,
      user.verificationCode,
    );

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Verification code does not match.",
      });
    }

    await userModel.updateOne(
      { _id: user._id },
      {
        $set: {
          isVerified: true,
        },
        $unset: {
          verificationCode: "",
          verificationCodeExpires: "",
          lastVerificationEmailAt: "",
          unVerifiedExpiresAt: "",
        },
      },
    );

    const token = createToken(user._id);

    return res.json({
      success: true,
      token,
      message: "Email is successfully verified.",
    });
  } catch (error) {
    console.error("Verify email error:", error);

    return res.json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

// ---------- Resend Verification Code ----------

const resendVerificationCode = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.json({
        success: false,
        message: "Email is required.",
      });
    }

    email = email.trim().toLowerCase();

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "Email does not exist.",
      });
    }

    if (user.isVerified) {
      return res.json({
        success: false,
        message: "Email is already verified.",
      });
    }

    if (
      user.lastVerificationEmailAt &&
      Date.now() - user.lastVerificationEmailAt.getTime() <
        VERIFY_EMAIL_COOLDOWN
    ) {
      return res.json({
        success: false,
        message: "Please wait 2 minutes.",
      });
    }

    const { code, hashedCode, expiresAt } = await generateVerificationData();

    await verificationEmail(email, code);

    user.verificationCode = hashedCode;
    user.verificationCodeExpires = expiresAt;
    user.lastVerificationEmailAt = new Date();

    await user.save();

    return res.json({
      success: true,
      message: "Verification email has been sent.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);

    return res.json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

// ---------- Forgot Password ----------

const forgotPassword = async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      return res.json({
        success: false,
        message: "Email is required.",
      });
    }

    email = email.trim().toLowerCase();

    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email.",
      });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "User does not exist.",
      });
    }

    // Successful password reset cooldown
    if (
      user.lastPasswordResetAt &&
      Date.now() - user.lastPasswordResetAt.getTime() < PASSWORD_RESET_COOLDOWN
    ) {
      const remaining =
        PASSWORD_RESET_COOLDOWN -
        (Date.now() - user.lastPasswordResetAt.getTime());

      const remainingDays = Math.ceil(remaining / DAY);

      return res.json({
        success: false,
        message: `Please wait ${remainingDays} days before resetting your password again.`,
      });
    }

    // Reset email cooldown
    if (
      user.lastPasswordResetEmailAt &&
      Date.now() - user.lastPasswordResetEmailAt.getTime() <
        RESET_EMAIL_COOLDOWN
    ) {
      const remaining =
        RESET_EMAIL_COOLDOWN -
        (Date.now() - user.lastPasswordResetEmailAt.getTime());

      const remainingMinutes = Math.ceil(remaining / MINUTE);

      return res.json({
        success: false,
        message: `Reset email already sent. Please try again after ${remainingMinutes} minutes.`,
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const resetUrl =
      `${process.env.FRONTEND_URL}` +
      `/user/password-reset?token=${resetToken}`;

    user.resetPasswordToken = hashedToken;

    user.resetPasswordTokenExpires = new Date(Date.now() + RESET_TOKEN_EXPIRES);

    // Only start email cooldown if sending succeeds
    await passwordResetEmail(email, resetUrl);

    user.lastPasswordResetEmailAt = new Date();

    await user.save();

    return res.json({
      success: true,
      message: "Reset email has been sent to your mail.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

// ---------- Reset Password ----------

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.json({
        success: false,
        message: "Invalid attempt.",
      });
    }

    const passwordError = validatePassword(password);

    if (passwordError) {
      return res.json({
        success: false,
        message: passwordError,
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await userModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordTokenExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.json({
        success: false,
        message: "Reset link is invalid or expired.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await userModel.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
          lastPasswordResetAt: new Date(),
        },
        $unset: {
          resetPasswordToken: "",
          resetPasswordTokenExpires: "",
          lastPasswordResetEmailAt: "",
        },
      },
    );

    return res.json({
      success: true,
      message: "Password has been successfully reset.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

export {
  registerUser,
  logUser,
  verifyUser,
  resendVerificationCode,
  forgotPassword,
  resetPassword,
};
