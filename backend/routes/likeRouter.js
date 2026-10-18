import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  likePost,
  getLikeCount,
  getLikeStatus,
} from "../controllers/likeController.js";

const likeRouter = express.Router();

// Public: get the total number of likes.
likeRouter.get("/:postId/count", getLikeCount);

// Authenticated: find out whether the current user liked the post.
likeRouter.get("/:postId/status", userAuth, getLikeStatus);

// Authenticated: toggle like/unlike using POST for both actions.
likeRouter.post("/:postId", userAuth, likePost);

export default likeRouter;
