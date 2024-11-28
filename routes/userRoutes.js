import {
  createUser,
  getUser,
  updateUser,
  deleteUser,
} from "../modules/user/controller/userController.js";
import express from "express";
import {
  ensureAuthenticated,
  checkPermission,
} from "../middlewares/authValidator.js";
import { upload, multerErrorHandling } from "../middlewares/upload.js";

const Router = express.Router();

Router.post("/register-user", createUser);

Router.get(
  "/user-profile/:id",
  ensureAuthenticated,
  checkPermission("view_own_profile"),
  getUser
);

Router.put(
  "/user-profile/update/:id",
  ensureAuthenticated,
  checkPermission("update_own_profile"),
  upload.single("profileImage"),
  multerErrorHandling,
  updateUser
);

Router.delete(
  "/user/delete/:id",
  ensureAuthenticated,
  checkPermission("delete_user"),
  deleteUser
);

export default Router;
