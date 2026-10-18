import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },

    // Email/password users require a password.
    // Google-only users can exist without one.
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },

    // Google OAuth identity.
    // Do not set a default of null: sparse unique indexing
    // allows multiple users without a Google ID.
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
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
