import express from "express";

import {
  createProfile,
  updateProfile,
  getMyProfile,
  getOtherProfile,
} from "../controllers/profileController.js";

import userAuth from "../middleware/userAuth.js";
import upload from "../middleware/multer.js";

const profileRouter = express.Router();

profileRouter.post(
  "/create-profile",
  userAuth,
  upload.fields([{ name: "profileImage", maxCount: 1 }]),
  createProfile,
);

profileRouter.patch(
  "/update-profile",
  userAuth,
  upload.fields([{ name: "profileImage", maxCount: 1 }]),
  updateProfile,
);

profileRouter.get("/me", userAuth, getMyProfile);

profileRouter.get("/:userId", getOtherProfile);

export default profileRouter;
