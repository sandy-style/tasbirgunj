import mongoose from "mongoose";

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
