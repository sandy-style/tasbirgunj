import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      unique: true,
    },

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
      unique: true,
      lowecase: true,
    },

    profileImage: {
      type: String,
      default: "",
    },

    bio: {
      type: String,
      default: "",
      maxlength: 100,
      trim: true,
    },
    profileImagePublicId: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const profileModel =
  mongoose.models.Profile || mongoose.model("Profile", profileSchema);

export default profileModel;
