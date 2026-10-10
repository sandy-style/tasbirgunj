import postModel from "../models/post.js";
import profileModel from "../models/profile.js";
import { v2 as cloudinary } from "cloudinary";

const createPost = async (req, res) => {
  let uploadedImagePublicId = null;

  try {
    // 1. Get authenticated user's ID
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // 2. Check whether the user has a profile
    const profile = await profileModel.findOne({ user: userId });

    if (!profile) {
      return res.status(403).json({
        success: false,
        message: "Please create a profile before posting.",
      });
    }

    // 3. Validate caption
    const caption =
      typeof req.body.caption === "string" ? req.body.caption.trim() : "";

    if (caption.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Caption cannot exceed 2000 characters.",
      });
    }

    // 4. Validate uploaded image
    const image = req.files?.image?.[0];

    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image.",
      });
    }

    // 5. Upload image to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(image.path, {
      resource_type: "image",
      folder: "tasbirgunj/posts",
    });

    const imageUrl = uploadResult.secure_url;
    uploadedImagePublicId = uploadResult.public_id;

    // 6. Save post to MongoDB
    const post = await postModel.create({
      caption,
      image: imageUrl,
      imagePublicId: uploadedImagePublicId,
      author: userId,
    });

    // The database now owns the reference to this uploaded image.
    uploadedImagePublicId = null;

    // 7. Return successful response
    return res.status(201).json({
      success: true,
      message: "Post created successfully.",
      post,
    });
  } catch (error) {
    console.error("Create post error:", error);

    // Clean up the uploaded image if saving the post failed.
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

const getPost = async (req, res) => {
  try {
    const { postId } = req.params;

    // Validate post ID
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID.",
      });
    }

    // Find post
    const post = await postModel.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found.",
      });
    }

    // Fetch only the required profile fields
    const authorData = await profileModel
      .findOne({ user: post.author })
      .select("username name profileImage -_id");
    return res.status(200).json({
      success: true,
      post,
      authorData,
    });
  } catch (error) {
    console.error("Get post error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the post.",
    });
  }
};

const getFeed = async (req, res) => {
  try {
    // Pagination
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      30,
      Math.max(1, parseInt(req.query.limit, 10) || 10),
    );
    const skip = (page - 1) * limit;

    // Fetch posts, newest first
    const posts = await postModel
      .find({})
      .select("-author -imagePublicId")
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      posts,
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
const deletePost = async (req, res) => {
  try {
    // 1. Check authentication
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // 2. Get the post ID from the route parameters
    const { postId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid post ID.",
      });
    }

    // 3. Find the post and verify ownership
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

    // 4. Delete the post from MongoDB
    await postModel.deleteOne({ _id: post._id });

    // 5. Delete its image from Cloudinary
    if (post.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(post.imagePublicId, {
          resource_type: "image",
        });
      } catch (cloudinaryError) {
        console.error("Cloudinary image deletion error:", cloudinaryError);
      }
    }

    // 6. Return success
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
