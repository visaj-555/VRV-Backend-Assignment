import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "CREATE",
        "READ",
        "UPDATE",
        "DELETE",
        "LOGIN",
        "LOGOUT",
        "PERMISSION_CHECK",
      ], // Added PERMISSION_CHECK
    },
    description: {
      type: String,
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
    },
    additionalInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Function to record a log
const recordAuditLog = async ({
  userId,
  action,
  description,
  ipAddress,
  additionalInfo = {},
}) => {
  try {
    const log = new AuditLogModel({
      userId,
      action,
      description,
      ipAddress,
      additionalInfo,
    });

    await log.save();
    console.log("Audit log recorded:", log);
  } catch (error) {
    console.error("Error recording audit log:", error);
  }
};

const AuditLogModel = mongoose.model("AuditLog", auditLogSchema);

export default AuditLogModel;
