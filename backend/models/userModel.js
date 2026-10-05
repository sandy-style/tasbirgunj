import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    verificationCode: {
      type: String,
      default: "",
    },

    verificationCodeExpires: {
      type: Date,
      default: null,
    },

    lastVerificationEmailAt: {
      type: Date,
      default: null,
    },

    resetPasswordToken: {
      type: String,
      default: null,
    },

    resetPasswordTokenExpires: {
      type: Date,
      default: null,
    },

    lastPasswordResetAt: {
      type: Date,
      default: null,
    },

    lastPasswordResetEmailAt: {
      type: Date,
      default: null,
    },

    unVerifiedExpiresAt: {
      type: Date,
      default: null,
      index: {
        expireAfterSeconds: 0,
      },
    },
  },
  {
    timestamps: true,
  },
);

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
