import mongoose from "mongoose";
import commentModel from "../models/comment.js";
import postModel from "../models/post.js";
import profileModel from "../models/profile.js";

// Add a comment to a post
const createComment = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { postId } = req.params;
    const text = typeof req.body.text === "string" ? req.body.text.trim() : "";

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to comment.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID.",
      });
    }

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot be empty.",
      });
    }

    if (text.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Comment cannot exceed 500 characters.",
      });
    }

    const [post, profile] = await Promise.all([
      postModel.findById(postId).select("_id"),
      profileModel
        .findOne({ user: userId })
        .select("user username name profileImage")
        .lean(),
    ]);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    const comment = await commentModel.create({
      user: userId,
      post: postId,
      text,
    });

    const commentCount = await commentModel.countDocuments({
      post: postId,
    });

    return res.status(201).json({
      success: true,
      message: "Comment added successfully.",
      comment: {
        ...comment.toObject(),
        author: profile,
      },
      commentCount,
    });
  } catch (error) {
    console.error("Create comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add comment.",
    });
  }
};

// Get comments for a post
const getComments = async (req, res) => {
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

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 20),
    );

    const skip = (page - 1) * limit;

    const [results, totalCount] = await Promise.all([
      commentModel
        .find({ post: postId })
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit + 1)
        .lean(),

      commentModel.countDocuments({ post: postId }),
    ]);

    const hasMore = results.length > limit;
    const comments = results.slice(0, limit);

    const userIds = comments.map((comment) => comment.user);

    const profiles = await profileModel
      .find({ user: { $in: userIds } })
      .select("user username name profileImage")
      .lean();

    const profileMap = new Map(
      profiles.map((profile) => [String(profile.user), profile]),
    );

    const formattedComments = comments.map((comment) => ({
      ...comment,
      author: profileMap.get(String(comment.user)) || null,
    }));

    return res.status(200).json({
      success: true,
      comments: formattedComments,
      commentCount: totalCount,
      pagination: {
        page,
        limit,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Get comments error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch comments.",
    });
  }
};

// Delete your own comment
const deleteComment = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { commentId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in first.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID.",
      });
    }

    const comment = await commentModel.findOneAndDelete({
      _id: commentId,
      user: userId,
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found or you cannot delete it.",
      });
    }

    const commentCount = await commentModel.countDocuments({
      post: comment.post,
    });

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully.",
      commentCount,
    });
  } catch (error) {
    console.error("Delete comment error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete comment.",
    });
  }
};

// Get the comment count for a post
const getCommentCount = async (req, res) => {
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

    const commentCount = await commentModel.countDocuments({
      post: postId,
    });

    return res.status(200).json({
      success: true,
      commentCount,
    });
  } catch (error) {
    console.error("Get comment count error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch comment count.",
    });
  }
};

export { createComment, getComments, deleteComment, getCommentCount };
