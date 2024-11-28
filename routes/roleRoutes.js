import express from "express";
import * as roleController from "../modules/role/controller/roleController.js";
import {
  ensureAuthenticated,
  ensureAdmin,
} from "../middlewares/authValidator.js";

const Router = express.Router();

Router.get(
  "/roles/:id?",
  ensureAuthenticated,
  ensureAdmin,
  roleController.getRoles
);

Router.post(
  "/admin/create-roles",
  ensureAuthenticated,
  ensureAdmin,
  roleController.createRole
);

Router.patch(
  "/admin/update-roles/:id",
  ensureAuthenticated,
  ensureAdmin,
  roleController.updateRole
);

Router.delete(
  "/admin/delete-roles/:id",
  ensureAuthenticated,
  ensureAdmin,
  roleController.deleteRole
);

Router.post(
  "/admin/roles/:id/permissions",
  ensureAuthenticated,
  ensureAdmin,
  roleController.assignPermissions
);

export default Router;
