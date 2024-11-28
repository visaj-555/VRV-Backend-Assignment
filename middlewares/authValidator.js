import jwt from "jsonwebtoken";
import TokenModel from "../modules/auth/model/tokenModel.js";
import UserModel from "../modules/user/model/userModel.js";
import AuditLogModel from "../modules/auditlogs/model/auditLogModel.js";
import { statusCode, message } from "../utils/api.response.js";
import logger from "../utils/logger.js"; // Hypothetical logger utility

//=========== ENSURE AUTHENTICATED =================//
export const ensureAuthenticated = async (req, res, next) => {
  try {
    const bearheader = req.headers["authorization"];
    if (!bearheader) {
      logger.warn("Authorization header missing");
      return res.status(statusCode.UNAUTHORIZED).json({
        statusCode: statusCode.UNAUTHORIZED,
        message: message.expiredToken,
      });
    }

    const token = bearheader.split(" ")[1]; // Extract token
    logger.info("Token extracted from header");

    const is_user = await TokenModel.findOne({ token });
    if (!is_user) {
      logger.warn("Token not found in the database");
      return res.status(statusCode.UNAUTHORIZED).json({
        statusCode: statusCode.UNAUTHORIZED,
        message: message.tokenNotFound,
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRET);
      req.user = { id: decoded.id };
      logger.info(`Token verified successfully for user ID: ${decoded.id}`);
      next();
    } catch (err) {
      logger.error("Token verification failed", err);
      return res.status(statusCode.UNAUTHORIZED).json({
        statusCode: statusCode.UNAUTHORIZED,
        message: message.tokenVerifyFail,
      });
    }
  } catch (error) {
    logger.error("Error in ensureAuthenticated middleware", error);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorFetchingUser,
    });
  }
};

//=========== ENSURE ADMIN =================//
export const ensureAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;
    logger.info(`Admin check for user ID: ${userId}`);

    const user = await UserModel.findById(userId).populate("role");
    if (!user) {
      logger.warn(`User not found for admin check: ${userId}`);
      return res.status(statusCode.UNAUTHORIZED).json({
        message: message.userNotFound,
      });
    }

    const isAdmin = user.role?.name === "admin";
    if (!isAdmin) {
      logger.warn(`User ID: ${userId} does not have admin privileges`);
      return res.status(statusCode.FORBIDDEN).json({
        message: message.adminAccessRequired,
      });
    }

    logger.info(`User ID: ${userId} is an admin`);
    next();
  } catch (error) {
    logger.error("Error in ensureAdmin middleware", error);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      message: message.errorCheckingAdminStatus,
      error: error.message,
    });
  }
};

//=========== CHECK PERMISSION =================//
export const checkPermission = (action) => {
  return async (req, res, next) => {
    try {
      const user = await UserModel.findById(req.user.id).populate("role");

      if (!user) {
        logger.warn(
          `Permission check failed: User not found for ID: ${req.user.id}`
        );
        await AuditLogModel.create({
          action: "PERMISSION_CHECK",
          description: `User not found for ID: ${req.user.id}`,
          userId: req.user.id,
          ipAddress: req.ip,
        });
        return res.status(statusCode.NOT_FOUND).json({
          status: statusCode.NOT_FOUND,
          message: message.userNotFound,
        });
      }

      const hasPermission = user.role?.permissions.includes(action);
      if (!hasPermission) {
        logger.warn(
          `Permission denied for user ID: ${user._id} on action: ${action}`
        );
        await AuditLogModel.create({
          action: "PERMISSION_CHECK",
          description: `Permission '${action}' denied for user ID: ${user._id}`,
          userId: user._id,
          ipAddress: req.ip,
        });
        return res.status(statusCode.FORBIDDEN).json({
          status: statusCode.FORBIDDEN,
          message: message.permissionDenied,
        });
      }

      logger.info(
        `Permission granted for user ID: ${user._id} on action: ${action}`
      );
      await AuditLogModel.create({
        action: "PERMISSION_CHECK",
        description: `Permission '${action}' granted for user ID: ${user._id}`,
        userId: user._id,
        ipAddress: req.ip,
      });

      next();
    } catch (error) {
      logger.error("Error in checkPermission middleware", error);
      return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
        status: statusCode.INTERNAL_SERVER_ERROR,
        message: message.INTERNAL_SERVER_ERROR,
      });
    }
  };
};
