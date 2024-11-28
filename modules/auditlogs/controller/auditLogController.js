import AuditLogModel from "../model/auditLogModel.js";
import { statusCode, message } from "../../../utils/api.response.js";
import logger from "../../../utils/logger.js"; // Ensure logger is correctly imported

//=========== FETCH AUDIT LOGS =================//
// Retrieves audit logs for a specific user based on their ID
export const fetchUserAuditLogs = async (req, res) => {
  logger.info("Request received to fetch user audit logs.");

  try {
    const userId = req.query.userId;
    logger.debug(`User ID from request: ${userId}`);

    if (!userId) {
      logger.warn("User ID is missing in the request query.");
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: "userId is required.",
      });
    }

    const logs = await AuditLogModel.find({ userId })
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    if (!logs || logs.length === 0) {
      logger.info(`No logs found for user ID: ${userId}`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: "No logs found for the specified user.",
      });
    }

    logger.info(`Fetched ${logs.length} logs for user ID: ${userId}`);
    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: "User audit logs fetched successfully.",
      data: logs,
    });
  } catch (error) {
    logger.error("Error fetching user audit logs:", error);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};

//=========== FETCH LOGS BY ACTION =================//
// Retrieves audit logs based on a specific action type
export const fetchLogsByAction = async (req, res) => {
  logger.info("Request received to fetch logs by action.");

  try {
    const { action } = req.query;
    logger.debug(`Action filter received: ${action}`);

    const logs = await AuditLogModel.find({ action })
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 });

    if (!logs || logs.length === 0) {
      logger.info(`No logs found for action: ${action}`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: `No logs found for action: ${action}`,
      });
    }

    logger.info(`Fetched ${logs.length} logs for action: ${action}`);
    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: `Logs for action: ${action} fetched successfully.`,
      data: logs,
    });
  } catch (error) {
    logger.error("Error fetching logs by action:", error);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};

//=========== DELETE OLD LOGS =================//
// Deletes audit logs older than a specified number of days
export const deleteOldLogs = async (req, res) => {
  logger.info("Request received to delete old logs.");

  try {
    const { days } = req.query;
    if (!days) {
      logger.warn("Days parameter missing in deleteOldLogs request.");
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: "Days parameter is required.",
      });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await AuditLogModel.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    logger.info(`${result.deletedCount} logs older than ${days} days deleted.`);
    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: `${result.deletedCount} logs older than ${days} days were deleted successfully.`,
    });
  } catch (error) {
    logger.error("Error deleting old logs:", error);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};

//=========== FETCH PAGINATED LOGS =================//
// Retrieves audit logs with pagination
export const fetchPaginatedLogs = async (req, res) => {
  logger.info("Request received to fetch paginated logs.");

  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const logs = await AuditLogModel.find()
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalLogs = await AuditLogModel.countDocuments();
    logger.info(
      `Fetched ${logs.length} logs on page ${page} with limit ${limit}.`
    );

    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: "Paginated audit logs fetched successfully.",
      data: logs,
      meta: {
        total: totalLogs,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching paginated logs:", error);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};
