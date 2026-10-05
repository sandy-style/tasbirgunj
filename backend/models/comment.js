import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
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

    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

const commentModel =
  mongoose.models.Comment || mongoose.model("Comment", commentSchema);

export default commentModel;
