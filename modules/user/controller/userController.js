import UserModel from "../model/userModel.js";
import logger from "../../../utils/logger.js";
import { statusCode, message } from "../../../utils/api.response.js";
import RoleModel from "../../role/model/roleModel.js";
import bcrypt from "bcryptjs";
import AuditLogModel from "../../auditlogs/model/auditLogModel.js";

// ===================== CREATE USER =====================
export const createUser = async (req, res) => {
  const { firstName, lastName, phoneNo, email, password, role } = req.body;

  try {
    const roleToAssign = role || "user";

    const assignedRole = await RoleModel.findOne({ name: roleToAssign });

    if (!assignedRole) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: `Role "${roleToAssign}" not found`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new UserModel({
      firstName,
      lastName,
      phoneNo,
      email,
      password: hashedPassword,
      role: assignedRole._id,
    });

    await newUser.save();

    newUser.password = undefined;


    return res.status(statusCode.CREATED).json({
      statusCode: statusCode.CREATED,
      message: message.userCreated,
      data: newUser,
    });
  } catch (error) {
    logger.error("Error creating user:", error);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};

//=========== GET USER BY ID=================//
export const getUser = async (req, res) => {
  try {
    const id = req.params.id;
    const user = await UserModel.findById(id, { password: 0 });

    if (!user) {
      await AuditLogModel.create({
        action: "VIEW_PROFILE",
        description: `Failed to fetch profile. User with ID ${id} not found.`,
        userId: req.user.id,
        ipAddress: req.ip,
      });

      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.userNotFound,
      });
    }

    // Audit log for viewing user profile
    await AuditLogModel.create({
      action: "VIEW_PROFILE",
      description: `User profile viewed for ID: ${id}`,
      userId: req.user.id,
      ipAddress: req.ip,
    });

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.userView,
      data: user,
    });
  } catch (error) {
    logger.error("Error fetching user: ", error);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
      error,
    });
  }
};

//=========== UPDATE USER=================//
export const updateUser = async (req, res) => {
  try {
    if (req.fileValidationError) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: "Please upload a valid image file",
      });
    }

    if (req.fileSizeLimitError) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: "File size should be less than 1 MB.",
      });
    }

    const { firstName, lastName, phoneNo, email } = req.body;
    const profileImage = req.file ? req.file.path : null;

    const user = await UserModel.findById(req.params.id);
    if (!user) {
      await AuditLogModel.create({
        action: "UPDATE_PROFILE",
        description: `Failed to update profile. User with ID ${req.params.id} not found.`,
        userId: req.user.id,
        ipAddress: req.ip,
      });

      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.userNotFound,
      });
    }

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.phoneNo = phoneNo || user.phoneNo;
    user.email = email || user.email;
    if (profileImage) {
      user.profileImage = profileImage;
    }

    await user.save();

    // Audit log for updating profile
    await AuditLogModel.create({
      action: "UPDATE_PROFILE",
      description: `User profile updated for ID: ${req.params.id}`,
      userId: req.user.id,
      ipAddress: req.ip,
    });

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.userProfileUpdated,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNo: user.phoneNo,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    logger.error("Error updating user: ", error);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};

//=========== DELETE USER=================//
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (req.user.id !== userId) {
      return res.status(statusCode.UNAUTHORIZED).json({
        statusCode: statusCode.UNAUTHORIZED,
        message: message.deleteAuth,
      });
    }

    await FixedDepositModel.deleteMany({ userId });

    const deletedUser = await UserModel.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.userNotFound,
      });
    }

    res
      .status(statusCode.OK)
      .json({ statusCode: statusCode.OK, message: message.userDeleted });
  } catch (error) {
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};
