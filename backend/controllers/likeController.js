import mongoose from "mongoose";
import postModel from "../models/post.js";
import likeModel from "../models/like.js";

// Like or unlike a post
const likePost = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { postId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to like a post.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID.",
      });
    }

    const postExists = await postModel.exists({ _id: postId });

    if (!postExists) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    const existingLike = await likeModel.findOne({
      user: userId,
      post: postId,
    });

    let liked;

    if (existingLike) {
      // Unlike the post
      await likeModel.findByIdAndDelete(existingLike._id);
      liked = false;
    } else {
      // Like the post
      await likeModel.create({
        user: userId,
        post: postId,
      });
      liked = true;
    }

    // Get the updated like count
    const likeCount = await likeModel.countDocuments({
      post: postId,
    });

    return res.status(200).json({
      success: true,
      liked,
      likeCount,
      message: liked
        ? "Post liked successfully."
        : "Post unliked successfully.",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This post is already liked by you.",
      });
    }

    console.error("Like post error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the like.",
    });
  }
};

// Get the like count for a post
const getLikeCount = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID.",
      });
    }

    const postExists = await postModel.exists({ _id: postId });

    if (!postExists) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    const likeCount = await likeModel.countDocuments({
      post: postId,
    });

    return res.status(200).json({
      success: true,
      likeCount,
    });
  } catch (error) {
    console.error("Get like count error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch like count.",
    });
  }
};

export { likePost, getLikeCount };
