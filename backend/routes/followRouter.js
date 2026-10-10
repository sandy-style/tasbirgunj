import express from "express";
import userAuth from "../middleware/userAuth.js";

import {
  followUser,
  unfollowUser,
  getFollowCounts,
  getFollowers,
  getFollowing,
} from "../controllers/followController.js";

const followRouter = express.Router();

// Public routes
followRouter.get("/:userId/counts", getFollowCounts);
followRouter.get("/:userId/followers", getFollowers);
followRouter.get("/:userId/following", getFollowing);

// Protected routes: login required
followRouter.post("/:userId", userAuth, followUser);
followRouter.delete("/:userId", userAuth, unfollowUser);

export default followRouter;
