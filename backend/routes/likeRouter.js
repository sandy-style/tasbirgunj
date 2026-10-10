import express from "express";
import userAuth from "../middleware/userAuth.js";
import { likePost, getLikeCount } from "../controllers/likeController.js";

const likeRouter = express.Router();

// Get a post's like count
likeRouter.get("/:postId/count", getLikeCount);

// Like or unlike a post (login required)
likeRouter.post("/:postId", userAuth, likePost);

export default likeRouter;
