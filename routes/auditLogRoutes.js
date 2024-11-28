import express from "express";
import * as auditLogController from "../modules/auditlogs/controller/auditLogController.js";
import {
  ensureAuthenticated,
  ensureAdmin,
} from "../middlewares/authValidator.js";

const router = express.Router();

router.get(
  "/admin/audit-logs/user/",
  ensureAuthenticated,
  ensureAdmin,
  auditLogController.fetchUserAuditLogs
);

router.get(
  "/admin/audit-logs/action",
  ensureAuthenticated,
  ensureAdmin,
  auditLogController.fetchLogsByAction
);

router.delete(
  "/admin/audit-logs/cleanup",
  ensureAuthenticated,
  ensureAdmin,
  auditLogController.deleteOldLogs
);

router.get(
  "/admin/audit-logs/paginate",
  ensureAuthenticated,
  ensureAdmin,
  auditLogController.fetchPaginatedLogs
);

export default router;
