import UserModel from "../../user/model/userModel.js";
import RoleModel from "../../role/model/roleModel.js"; // Assuming role model exists in the role module
import { statusCode, message } from "../../../utils/api.response.js";
import logger from "../../../utils/logger.js";

//=========== FETCH USERS OR USER BY ID =================//
export const getUsers = async (req, res) => {
  const id = req.params.id;
  let page = req.query.page || 1;
  let limit = req.query.limit || 10;
  let offset = (page - 1) * limit;

  try {
    if (id) {
      const user = await UserModel.findById(id)
        .populate("role", "name")
        .select("-password");

      if (!user) {
        logger.warn(`User not found with ID: ${id}`);
        return res.status(statusCode.NOT_FOUND).json({
          statusCode: statusCode.NOT_FOUND,
          message: message.userNotFound,
        });
      }

      return res.status(statusCode.OK).json({
        statusCode: statusCode.OK,
        message: message.userView,
        data: user,
      });
    }

    const users = await UserModel.find({})
      .populate("role", "name")
      .select("-password")
      .skip(offset)
      .limit(limit)
      .exec();

    const usersWithSrNo = users.map((user, index) => ({
      srNo: offset + index + 1,
      user,
    }));

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.usersView,
      data: usersWithSrNo,
      total: await UserModel.countDocuments(),
    });
  } catch (error) {
    logger.error("Error fetching users:", error);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};

//=========== UPDATE USER DETAILS =================//
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("role", "name"); // Populate role field after update

    if (!updatedUser) {
      logger.warn(`User not found with ID: ${id}`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.userNotFound,
      });
    }

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.userUpdated,
      data: updatedUser,
    });
  } catch (error) {
    logger.error("Error updating user:", error);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};

//=========== DELETE USER =================//
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedUser = await UserModel.findByIdAndDelete(id);

    if (!deletedUser) {
      logger.warn(`User not found with ID: ${id}`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.userNotFound,
      });
    }

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.userDeleted,
    });
  } catch (error) {
    logger.error("Error deleting user:", error);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};

//=========== CREATE A NEW USER =================//
export const createUser = async (req, res) => {
  const { firstName, lastName, phoneNo, email, password, role } = req.body;

  try {
    // Check if user exists
    const userExists = await UserModel.findOne({ email });

    if (userExists) {
      logger.warn("Attempted to create a user with an existing email");
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.emailAlreadyExists,
      });
    }

    // Default role to 'user' if no role is provided
    const assignedRole = await RoleModel.findById(role || "user");

    if (!assignedRole) {
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: `Role "${role}" not found`,
      });
    }

    // Create user
    const newUser = new UserModel({
      firstName,
      lastName,
      phoneNo,
      email,
      password, // You should hash password before saving
      role: assignedRole._id,
    });

    await newUser.save();

    res.status(statusCode.CREATED).json({
      statusCode: statusCode.CREATED,
      message: message.userCreated,
      data: newUser,
    });
  } catch (error) {
    logger.error("Error creating user:", error);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};
