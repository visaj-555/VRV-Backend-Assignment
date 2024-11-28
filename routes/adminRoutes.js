import express from "express";
import {
  ensureAuthenticated,
  ensureAdmin,
} from "../middlewares/authValidator.js";
import * as adminController from "../modules/admin/controller/adminController.js";

const router = express.Router();

// User Management Routes
router.get(
  "/admin/view-users/:id?",
  ensureAuthenticated,
  ensureAdmin,
  adminController.getUsers
);

router.post(
  "/admin/create-user",
  ensureAuthenticated,
  ensureAdmin,
  adminController.createUser
);
router.put(
  "/admin/update-user/:id",
  ensureAuthenticated,
  ensureAdmin,
  adminController.updateUser
);
router.delete(
  "/admin/delete-user/:id",
  ensureAuthenticated,
  ensureAdmin,
  adminController.deleteUser
);

export default router;
