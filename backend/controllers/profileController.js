import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

import postModel from "../models/post.js";
import profileModel from "../models/profile.js";

const MAX_NAME_LENGTH = 60;
const MAX_USERNAME_LENGTH = 20;
const MIN_USERNAME_LENGTH = 3;
const MAX_BIO_LENGTH = 160;

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

// Remove an uploaded image if the corresponding database operation fails.
async function cleanupCloudinaryImage(publicId) {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
  } catch (error) {
    console.error("Cloudinary image cleanup error:", error);
  }
}

// Centralized error handling for controller operations.
function sendControllerError(res, error, context) {
  console.error(`${context}:`, error);

  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern || error.keyValue || {})[0];

    return res.status(409).json({
      success: false,
      message:
        field === "user"
          ? "You have already created a profile."
          : "Username already exists.",
    });
  }

  if (error?.name === "ValidationError") {
    const messages = Object.values(error.errors || {})
      .map((item) => item.message)
      .filter(Boolean);

    return res.status(400).json({
      success: false,
      message: messages.join(" ") || "Please check your profile information.",
    });
  }

  if (error?.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid profile information.",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again later.",
  });
}

// CREATE PROFILE
const createProfile = async (req, res) => {
  let uploadedImagePublicId = null;

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to create a profile.",
      });
    }

    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";

    const username =
      typeof req.body?.username === "string"
        ? req.body.username.trim().toLowerCase()
        : "";

    const bio = typeof req.body?.bio === "string" ? req.body.bio.trim() : "";

    // Required-field validation.
    if (!name || !username) {
      return res.status(400).json({
        success: false,
        message: "Name and username are required.",
      });
    }

    // Name validation.
    if (name.length > MAX_NAME_LENGTH) {
      return res.status(400).json({
        success: false,
        message: "Name cannot exceed 60 characters.",
      });
    }

    // Username validation.
    if (
      username.length < MIN_USERNAME_LENGTH ||
      username.length > MAX_USERNAME_LENGTH ||
      !USERNAME_REGEX.test(username)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Username must be 3–20 characters using lowercase letters, numbers, or underscores.",
      });
    }

    // Bio validation.
    if (bio.length > MAX_BIO_LENGTH) {
      return res.status(400).json({
        success: false,
        message: "Bio cannot exceed 160 characters.",
      });
    }

    // Prevent a user from creating more than one profile.
    const existingProfile = await profileModel.findOne({
      user: userId,
    });

    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: "You have already created a profile.",
        profile: existingProfile,
      });
    }

    // Check username availability.
    const existingUsername = await profileModel.findOne({
      username,
    });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "Username already exists.",
      });
    }

    // Matches upload.fields([{ name: "profileImage", maxCount: 1 }]).
    const profileImage = req.files?.profileImage?.[0];

    let profileImageUrl = "";
    let profileImagePublicId = "";

    if (profileImage) {
      if (!profileImage.path) {
        return res.status(400).json({
          success: false,
          message:
            "The uploaded image has no file path. Check your Multer storage configuration.",
        });
      }

      const uploadResult = await cloudinary.uploader.upload(profileImage.path, {
        resource_type: "image",
        folder: "tasbirgunj/profiles",
      });

      profileImageUrl = uploadResult.secure_url;
      profileImagePublicId = uploadResult.public_id;
      uploadedImagePublicId = uploadResult.public_id;
    }

    const profile = await profileModel.create({
      user: userId,
      name,
      username,
      bio,
      profileImage: profileImageUrl,
      profileImagePublicId,
    });

    // The database operation succeeded. Do not delete this image.
    uploadedImagePublicId = null;

    return res.status(201).json({
      success: true,
      message: "Profile created successfully.",
      profile,
    });
  } catch (error) {
    await cleanupCloudinaryImage(uploadedImagePublicId);

    return sendControllerError(res, error, "Create profile error");
  }
};

// UPDATE PROFILE
const updateProfile = async (req, res) => {
  let uploadedImagePublicId = null;

  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to update your profile.",
      });
    }

    const hasName = typeof req.body?.name === "string";
    const hasBio = typeof req.body?.bio === "string";

    const name = hasName ? req.body.name.trim() : undefined;
    const bio = hasBio ? req.body.bio.trim() : undefined;

    const profileImage = req.files?.profileImage?.[0];

    if (!hasName && !hasBio && !profileImage) {
      return res.status(400).json({
        success: false,
        message: "Update cannot be empty.",
      });
    }

    if (hasName && !name) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty.",
      });
    }

    if (name !== undefined && name.length > MAX_NAME_LENGTH) {
      return res.status(400).json({
        success: false,
        message: "Name cannot exceed 60 characters.",
      });
    }

    if (bio !== undefined && bio.length > MAX_BIO_LENGTH) {
      return res.status(400).json({
        success: false,
        message: "Bio cannot exceed 160 characters.",
      });
    }

    const profile = await profileModel.findOne({
      user: userId,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile does not exist.",
      });
    }

    if (name !== undefined) {
      profile.name = name;
    }

    // An empty string is valid when clearing the bio.
    if (bio !== undefined) {
      profile.bio = bio;
    }

    let oldImagePublicId = "";

    if (profileImage) {
      if (!profileImage.path) {
        return res.status(400).json({
          success: false,
          message:
            "The uploaded image has no file path. Check your Multer storage configuration.",
        });
      }

      // Upload the replacement before deleting the old image.
      const uploadResult = await cloudinary.uploader.upload(profileImage.path, {
        resource_type: "image",
        folder: "tasbirgunj/profiles",
      });

      uploadedImagePublicId = uploadResult.public_id;
      oldImagePublicId = profile.profileImagePublicId || "";

      profile.profileImage = uploadResult.secure_url;
      profile.profileImagePublicId = uploadResult.public_id;
    }

    await profile.save();

    // The profile was saved successfully; retain the new image.
    uploadedImagePublicId = null;

    // Delete the old photo only after the replacement is saved.
    if (oldImagePublicId) {
      await cleanupCloudinaryImage(oldImagePublicId);
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      profile,
    });
  } catch (error) {
    await cleanupCloudinaryImage(uploadedImagePublicId);

    return sendControllerError(res, error, "Update profile error");
  }
};

// GET MY PROFILE
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to view your profile.",
      });
    }

    const profile = await profileModel.findOne({
      user: userId,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found.",
        profileExists: false,
      });
    }

    // This assumes post.author stores the authenticated user's ID.
    const posts = await postModel
      .find({ author: userId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      profileExists: true,
      profile,
      posts,
      totalPosts: posts.length,
    });
  } catch (error) {
    return sendControllerError(res, error, "Get my profile error");
  }
};

// GET ANOTHER USER'S PROFILE
const getOtherProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const profile = await profileModel.findOne({
      user: userId,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found.",
      });
    }

    // This assumes post.author stores the user's ID.
    const posts = await postModel
      .find({ author: userId })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      profile,
      posts,
      totalPosts: posts.length,
    });
  } catch (error) {
    return sendControllerError(res, error, "Get other profile error");
  }
};

export { createProfile, updateProfile, getMyProfile, getOtherProfile };
