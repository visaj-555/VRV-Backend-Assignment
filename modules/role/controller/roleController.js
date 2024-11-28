import RoleModel from "../model/roleModel.js";
import { statusCode, message } from "../../../utils/api.response.js";
import logger from "../../../utils/logger.js";

//=========== CREATE ROLE =================//
export const createRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;

    const existingRole = await RoleModel.findOne({ name });
    if (existingRole) {
      logger.warn(`Role already exists with name: ${name}`);
      return res.status(statusCode.CONFLICT).json({
        statusCode: statusCode.CONFLICT,
        message: message.roleExists,
      });
    }

    const role = await RoleModel.create({ name, permissions });
    res.status(statusCode.CREATED).json({
      statusCode: statusCode.CREATED,
      message: message.createRole,
      data: role,
    });
  } catch (error) {
    logger.error("Error creating role:", error);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};

//=========== UPDATE ROLE =================//
export const updateRole = async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;

  try {
    const role = await RoleModel.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    if (!role) {
      logger.warn(`Role not found with ID: ${id}`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.roleNotFound,
      });
    }

    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.updateRole,
      data: role,
    });
  } catch (error) {
    logger.error("Error updating role:", error);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};

//=========== DELETE ROLE =================//
export const deleteRole = async (req, res) => {
  const id = req.params.id;

  try {
    const deletedRole = await RoleModel.findByIdAndDelete(id);

    if (!deletedRole) {
      logger.warn(`Role not found with ID: ${id}`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.roleNotFound,
      });
    }

    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.deleteRole,
    });
  } catch (error) {
    logger.error("Error deleting role:", error);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};

//=========== ASSIGN PERMISSIONS TO ROLE =================//
export const assignPermissions = async (req, res) => {
  const id = req.params.id;
  const { permissions } = req.body;

  try {
    const role = await RoleModel.findById(id);

    if (!role) {
      logger.warn(`Role not found with ID: ${id}`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.roleNotFound,
      });
    }

    role.permissions = [...new Set([...role.permissions, ...permissions])];
    await role.save();

    return res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.assignPermissions,
      data: role,
    });
  } catch (error) {
    logger.error("Error assigning permissions:", error);
    return res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};

//=========== VIEW ALL ROLES OR ROLE BY ID =================//
export const getRoles = async (req, res) => {
  const id = req.params.id; // Extract ID if provided

  try {
    if (id) {
      // Fetch role by ID
      const role = await RoleModel.findById(id);

      if (!role) {
        logger.warn(`Role not found with ID: ${id}`);
        return res.status(statusCode.NOT_FOUND).json({
          statusCode: statusCode.NOT_FOUND,
          message: message.roleNotFound,
        });
      }

      return res.status(statusCode.OK).json({
        statusCode: statusCode.OK,
        message: message.getRoleById,
        data: role,
      });
    }

    // Fetch all roles
    const roles = await RoleModel.find();
    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.getRoles,
      data: roles,
    });
  } catch (error) {
    logger.error("Error fetching roles:", error);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.INTERNAL_SERVER_ERROR,
    });
  }
};
