import mongoose from "mongoose";
import postModel, { POST_CATEGORIES } from "../models/post.js";
import profileModel from "../models/profile.js";
import { v2 as cloudinary } from "cloudinary";

/* -------------------------------------------------------
   CREATE POST
------------------------------------------------------- */

const createPost = async (req, res) => {
  let uploadedImagePublicId = null;

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // A user must have a profile before creating posts.
    const profile = await profileModel.findOne({
      user: userId,
    });

    if (!profile) {
      return res.status(403).json({
        success: false,
        message: "Please create a profile before posting.",
      });
    }

    const caption =
      typeof req.body.caption === "string" ? req.body.caption.trim() : "";

    if (caption.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Caption cannot exceed 2000 characters.",
      });
    }

    // Category is required and must be from the allowed list.
    const category =
      typeof req.body.category === "string"
        ? req.body.category.trim().toLowerCase()
        : "";

    if (!POST_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Please select a valid post category.",
        allowedCategories: POST_CATEGORIES,
      });
    }

    // Location is optional.
    const location =
      typeof req.body.location === "string" ? req.body.location.trim() : "";

    if (location.length > 120) {
      return res.status(400).json({
        success: false,
        message: "Location cannot exceed 120 characters.",
      });
    }

    const image = req.files?.image?.[0];

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image.",
      });
    }

    // Upload image to Cloudinary.
    const uploadResult = await cloudinary.uploader.upload(image.path, {
      resource_type: "image",
      folder: "tasbirgunj/posts",
    });

    const imageUrl = uploadResult.secure_url;
    uploadedImagePublicId = uploadResult.public_id;

    // Save the post with its category and optional location.
    const post = await postModel.create({
      caption,
      image: imageUrl,
      imagePublicId: uploadedImagePublicId,
      location,
      category,
      author: userId,
    });

    // MongoDB now references the uploaded image.
    uploadedImagePublicId = null;

    return res.status(201).json({
      success: true,
      message: "Post created successfully.",
      post,
      authorData: {
        name: profile.name || "",
        username: profile.username || "",
        profileImage: profile.profileImage || "",
      },
    });
  } catch (error) {
    console.error("Create post error:", error);

    // Clean up an uploaded image if saving the post failed.
    if (uploadedImagePublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedImagePublicId, {
          resource_type: "image",
        });
      } catch (cleanupError) {
        console.error("Cloudinary cleanup error:", cleanupError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong while creating your post.",
    });
  }
};

/* -------------------------------------------------------
   GET SINGLE POST WITH UPLOADER PROFILE
------------------------------------------------------- */

const getPost = async (req, res) => {
  try {
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID.",
      });
    }

    const post = await postModel.findById(postId).lean();

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    const authorData = await profileModel
      .findOne({ user: post.author })
      .select("user username name profileImage -_id")
      .lean();

    return res.status(200).json({
      success: true,
      post,
      authorData: authorData || null,
    });
  } catch (error) {
    console.error("Get post error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the post.",
    });
  }
};

/* -------------------------------------------------------
   GET FEED WITH UPLOADER INFORMATION AND PAGINATION
------------------------------------------------------- */

const getFeed = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const limit = Math.min(
      30,
      Math.max(1, parseInt(req.query.limit, 10) || 10),
    );

    const skip = (page - 1) * limit;

    // Category and location are included.
    // Do not expose the Cloudinary public ID.
    const posts = await postModel
      .find({})
      .select("-imagePublicId")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const authorIds = [
      ...new Set(
        posts
          .map((post) => post.author?.toString())
          .filter((id) => id && mongoose.Types.ObjectId.isValid(id)),
      ),
    ];

    const profiles = authorIds.length
      ? await profileModel
          .find({
            user: { $in: authorIds },
          })
          .select("user username name profileImage -_id")
          .lean()
      : [];

    const profileMap = new Map(
      profiles.map((profile) => [String(profile.user), profile]),
    );

    const enrichedPosts = posts.map((post) => {
      const authorId = String(post.author || "");
      const profile = profileMap.get(authorId);

      return {
        ...post,
        author: {
          _id: authorId,
          name: profile?.name || profile?.username || "Photographer",
          username: profile?.username || "",
          profileImage: profile?.profileImage || "",
        },
      };
    });

    return res.status(200).json({
      success: true,
      posts: enrichedPosts,
      pagination: {
        page,
        limit,
        hasMore: posts.length === limit,
      },
    });
  } catch (error) {
    console.error("Get feed error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching posts.",
    });
  }
};

/* -------------------------------------------------------
   DELETE POST
------------------------------------------------------- */

const deletePost = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID.",
      });
    }

    const post = await postModel.findOne({
      _id: postId,
      author: userId,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found or you are not authorized to delete it.",
      });
    }

    await postModel.deleteOne({ _id: post._id });

    if (post.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(post.imagePublicId, {
          resource_type: "image",
        });
      } catch (cloudinaryError) {
        console.error("Cloudinary image deletion error:", cloudinaryError);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Post deleted successfully.",
    });
  } catch (error) {
    console.error("Delete post error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the post.",
    });
  }
};

export { createPost, getPost, deletePost, getFeed };
