import * as authController from "../modules/auth/controller/authController.js";

import { ensureAuthenticated } from "../middlewares/authValidator.js";

import express from "express";

import { userLoginValidate } from "../middlewares/userValidator.js";

const Router = express.Router();

Router.post("/user/login", userLoginValidate, authController.loginUser);
Router.post("/user/logout", ensureAuthenticated, authController.logoutUser);

Router.post(
  "/user/changepassword",
  ensureAuthenticated,
  authController.changePassword
);

Router.post("/user/forgot-password", authController.forgotPassword);
Router.post("/user/reset-password", authController.resetPassword);
Router.post("/user/newpassword", authController.newPassword);

export default Router;
