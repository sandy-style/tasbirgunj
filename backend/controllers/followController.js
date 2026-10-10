import mongoose from "mongoose";
import followModel from "../models/follow.js";
import profileModel from "../models/profile.js";

// Follow a user
const followUser = async (req, res) => {
  try {
    const followerId = req.user?.id;
    const followingId = req.params.userId;

    if (!followerId) {
      return res.status(401).json({
        success: false,
        message: "Please log in first.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(followingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (String(followerId) === String(followingId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself.",
      });
    }

    const profile = await profileModel.findOne({
      user: followingId,
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    const existingFollow = await followModel.findOne({
      follower: followerId,
      following: followingId,
    });

    if (existingFollow) {
      return res.status(409).json({
        success: false,
        message: "You are already following this user.",
      });
    }

    await followModel.create({
      follower: followerId,
      following: followingId,
    });

    return res.status(201).json({
      success: true,
      message: "User followed successfully.",
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You are already following this user.",
      });
    }

    console.error("Follow error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to follow user.",
    });
  }
};

// Unfollow a user
const unfollowUser = async (req, res) => {
  try {
    const followerId = req.user?.id;
    const followingId = req.params.userId;

    if (!followerId) {
      return res.status(401).json({
        success: false,
        message: "Please log in first.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(followingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (String(followerId) === String(followingId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot unfollow yourself.",
      });
    }

    const follow = await followModel.findOneAndDelete({
      follower: followerId,
      following: followingId,
    });

    if (!follow) {
      return res.status(404).json({
        success: false,
        message: "You are not following this user.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User unfollowed successfully.",
    });
  } catch (error) {
    console.error("Unfollow error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to unfollow user.",
    });
  }
};

// Get follower and following counts
const getFollowCounts = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const profileExists = await profileModel.exists({
      user: userId,
    });

    if (!profileExists) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    const [followers, following] = await Promise.all([
      followModel.countDocuments({ following: userId }),
      followModel.countDocuments({ follower: userId }),
    ]);

    return res.status(200).json({
      success: true,
      counts: {
        followers,
        following,
      },
    });
  } catch (error) {
    console.error("Follow counts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch follow counts.",
    });
  }
};

// Get followers or following list
const getFollowList = async (req, res, type) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const profileExists = await profileModel.exists({
      user: userId,
    });

    if (!profileExists) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      30,
      Math.max(1, parseInt(req.query.limit, 10) || 20),
    );
    const skip = (page - 1) * limit;

    const filter =
      type === "followers" ? { following: userId } : { follower: userId };

    const relationships = await followModel
      .find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit + 1)
      .lean();

    const hasMore = relationships.length > limit;
    const pageRelationships = relationships.slice(0, limit);

    const userIds = pageRelationships.map((relationship) =>
      type === "followers" ? relationship.follower : relationship.following,
    );

    const profiles = await profileModel
      .find({ user: { $in: userIds } })
      .select("user username name profileImage")
      .lean();

    // Keep the list in the same order as the follow relationships
    const profileMap = new Map(
      profiles.map((profile) => [String(profile.user), profile]),
    );

    const users = userIds
      .map((id) => profileMap.get(String(id)))
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      type,
      users,
      pagination: {
        page,
        limit,
        hasMore,
      },
    });
  } catch (error) {
    console.error(`Get ${type} error:`, error);

    return res.status(500).json({
      success: false,
      message: `Failed to fetch ${type}.`,
    });
  }
};

const getFollowers = (req, res) => getFollowList(req, res, "followers");

const getFollowing = (req, res) => getFollowList(req, res, "following");

export {
  followUser,
  unfollowUser,
  getFollowCounts,
  getFollowers,
  getFollowing,
};
