import express from "express";
import userAuth from "../middleware/userAuth.js";
import {
  createPost,
  deletePost,
  getFeed,
  getPost,
} from "../controllers/postController.js";
import upload from "../middleware/multer";

const postRouter = express.Router();

postRouter.post(
  "/create-post",
  userAuth,
  upload.fields([{ name: "image", maxCount: 1 }]),
  createPost,
);
postRouter.delete("/delete-post/:postId", userAuth, deletePost);
postRouter.get("/get-post/:postId", getPost);
postRouter.get("/", getFeed);

export default postRouter;
