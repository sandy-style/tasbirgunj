import mongoose from "mongoose";

const likeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

likeSchema.index({ user: 1, post: 1 }, { unique: true });

const likeModel = mongoose.models.Like || mongoose.model("Like", likeSchema);

export default likeModel;
