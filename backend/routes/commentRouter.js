import express from "express";
import userAuth from "../middleware/userAuth.js";

import {
  createComment,
  getComments,
  deleteComment,
  getCommentCount,
} from "../controllers/commentController.js";

const commentRouter = express.Router();

commentRouter.get("/:postId/count", getCommentCount);

commentRouter.get("/:postId", getComments);

commentRouter.post("/:postId", userAuth, createComment);

commentRouter.delete("/:commentId", userAuth, deleteComment);

export default commentRouter;
