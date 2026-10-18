import mongoose from "mongoose";

export const POST_CATEGORIES = [
  "nature",
  "mountains",
  "travel",
  "wildlife",
  "culture",
  "architecture",
  "people",
  "street-photography",
];

const postSchema = new mongoose.Schema(
  {
    caption: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    image: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },

    category: {
      type: String,
      required: true,
      enum: POST_CATEGORIES,
      lowercase: true,
      trim: true,
    },

    imagePublicId: {
      type: String,
      required: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const postModel = mongoose.models.Post || mongoose.model("Post", postSchema);

export default postModel;
