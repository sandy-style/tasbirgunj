import mongoose from "mongoose";
import postModel from "../models/post.js";
import likeModel from "../models/like.js";

const getUserId = (req) =>
  req.user?.id ??
  req.user?._id ??
  req.user?.userId ??
  req.user?.user?.id ??
  req.user?.user?._id ??
  null;

const isValidPostId = (postId) =>
  Boolean(postId && mongoose.Types.ObjectId.isValid(postId));

const getPostLikeCount = (postId) => likeModel.countDocuments({ post: postId });

/* -------------------------------------------------------
   POST /api/like/:postId

   This endpoint toggles like/unlike.
   One user can have only one Like document per post.
------------------------------------------------------- */

const likePost = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { postId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to like a post.",
      });
    }

    if (!isValidPostId(postId)) {
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
      await likeModel.deleteOne({ _id: existingLike._id });
      liked = false;
    } else {
      try {
        await likeModel.create({
          user: userId,
          post: postId,
        });

        liked = true;
      } catch (error) {
        // Handle a concurrent click or the unique index preventing
        // duplicate likes. Re-read the database's actual state.
        if (error.code !== 11000) throw error;

        const currentLike = await likeModel.findOne({
          user: userId,
          post: postId,
        });

        if (currentLike) {
          liked = true;
        } else {
          throw error;
        }
      }
    }

    const likeCount = await getPostLikeCount(postId);

    return res.status(200).json({
      success: true,
      liked,
      likeCount,
      message: liked
        ? "Post liked successfully."
        : "Post unliked successfully.",
    });
  } catch (error) {
    console.error("Like post error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while updating the like.",
    });
  }
};

/* -------------------------------------------------------
   GET /api/like/:postId/count

   Public count, available without login.
------------------------------------------------------- */

const getLikeCount = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!isValidPostId(postId)) {
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

    const likeCount = await getPostLikeCount(postId);

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

/* -------------------------------------------------------
   GET /api/like/:postId/status

   Authenticated status, used to initialize the heart correctly.
------------------------------------------------------- */

const getLikeStatus = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { postId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to check your like status.",
      });
    }

    if (!isValidPostId(postId)) {
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

    const [existingLike, likeCount] = await Promise.all([
      likeModel.exists({
        user: userId,
        post: postId,
      }),
      getPostLikeCount(postId),
    ]);

    return res.status(200).json({
      success: true,
      liked: Boolean(existingLike),
      likeCount,
    });
  } catch (error) {
    console.error("Get like status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch like status.",
    });
  }
};

export { likePost, getLikeCount, getLikeStatus };
