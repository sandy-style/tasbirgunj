import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

import postModel from "../models/post.js";
import profileModel from "../models/profile.js";

// CREATE PROFILE
const createProfile = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const username = req.body.username?.trim().toLowerCase();
    const bio = req.body.bio?.trim() || "";

    if (!name || !username) {
      return res.status(400).json({
        success: false,
        message: "Please fill the required details.",
      });
    }

    // Check whether username already exists
    const existingUsername = await profileModel.findOne({ username });

    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: "Username already exists.",
      });
    }

    // Get uploaded profile image
    const profileImage = req.files?.profileImage?.[0];

    let profileImageUrl = "";
    let profileImagePublicId = "";

    // Upload image if provided
    if (profileImage) {
      const uploadResult = await cloudinary.uploader.upload(profileImage.path, {
        resource_type: "image",
      });

      profileImageUrl = uploadResult.secure_url;
      profileImagePublicId = uploadResult.public_id;
    }

    // Create profile
    const profile = await profileModel.create({
      user: req.user.id,
      name,
      username,
      bio,
      profileImage: profileImageUrl,
      profileImagePublicId,
    });

    return res.status(201).json({
      success: true,
      message: "Profile created successfully.",
      profile,
    });
  } catch (error) {
    // MongoDB duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Username already exists.",
      });
    }

    console.error("Create profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

// UPDATE PROFILE
const updateProfile = async (req, res) => {
  try {
    const name = req.body.name !== undefined ? req.body.name.trim() : undefined;

    const bio = req.body.bio !== undefined ? req.body.bio.trim() : undefined;

    const profileImage = req.files?.profileImage?.[0];

    // Make sure something was actually sent
    if (name === undefined && bio === undefined && !profileImage) {
      return res.status(400).json({
        success: false,
        message: "Update cannot be empty.",
      });
    }

    const userId = req.user.id;

    // Find profile belonging to logged-in user
    const profile = await profileModel.findOne({
      user: userId,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile does not exist.",
      });
    }

    // Update name
    if (name !== undefined) {
      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty.",
        });
      }

      profile.name = name;
    }

    // Update bio
    // Empty string is allowed so user can remove their bio
    if (bio !== undefined) {
      profile.bio = bio;
    }

    // Update profile image
    if (profileImage) {
      // Upload new image first
      const uploadResult = await cloudinary.uploader.upload(profileImage.path, {
        resource_type: "image",
      });

      // Delete old image from Cloudinary
      if (profile.profileImagePublicId) {
        await cloudinary.uploader.destroy(profile.profileImagePublicId, {
          resource_type: "image",
        });
      }

      // Save new image information
      profile.profileImage = uploadResult.secure_url;
      profile.profileImagePublicId = uploadResult.public_id;
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      profile,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

// GET MY PROFILE
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await profileModel.findOne({
      user: userId,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found.",
      });
    }

    // Get user's posts
    const posts = await postModel
      .find({
        author: userId,
      })
      .sort({ createdAt: -1 });

    // Count posts
    const totalPosts = await postModel.countDocuments({
      author: userId,
    });

    return res.status(200).json({
      success: true,
      profile,
      posts,
      totalPosts,
    });
  } catch (error) {
    console.error("Get my profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

// GET OTHER USER'S PROFILE
const getOtherProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    // Find profile
    const profile = await profileModel.findOne({
      user: userId,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found.",
      });
    }

    // Get user's posts
    const posts = await postModel
      .find({
        author: userId,
      })
      .sort({ createdAt: -1 });

    // Count posts
    const totalPosts = await postModel.countDocuments({
      author: userId,
    });

    return res.status(200).json({
      success: true,
      profile,
      posts,
      totalPosts,
    });
  } catch (error) {
    console.error("Get other profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again later.",
    });
  }
};

export { createProfile, updateProfile, getMyProfile, getOtherProfile };
