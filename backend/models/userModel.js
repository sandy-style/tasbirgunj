import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    password: { type: String, required: true },
    profileImage: { type: String },
    bio: { type: String },

    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: "" },

    verificationCodeExpires: { type: Date, default: null },
    lastVerificationEmailAt: { type: Date, default: null },
    resetPasswordToken: { type: String, default: null },
    resetPasswordTokenExpires: { type: Date, default: null },
    lastPasswordResetAt: { type: Date, default: "" },
    lastPasswordResetEmailAt: { type: Date, default: null },

    unVerifiedExpiresAt: {
      type: Date,
      index: {
        expireAfterSeconds: 0,
      },
    },
  },
  { timestamps: true },
);
const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
