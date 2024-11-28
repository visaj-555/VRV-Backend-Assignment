import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import TokenModel from "../model/tokenModel.js";
import PasswordResetTokenModel from "../model/passwordResetTokenModel.js";
import nodemailer from "nodemailer";
import UserModel from "../../user/model/userModel.js";
import { statusCode, message } from "../../../utils/api.response.js";
import AuditLogModel from "../../auditlogs/model/auditLogModel.js";
import logger from "../../../utils/logger.js"; // Hypothetical logger utility

// Utility function to generate a random OTP
export const generateOtp = () =>
  Math.floor(1000 + Math.random() * 9000).toString();

//=========== LOGIN USER =================//
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip;

  try {
    logger.info(`Login attempt for email: ${email}`);

    // Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      logger.warn(`Login failed: User not found for email: ${email}`);

      await AuditLogModel.create({
        action: "LOGIN",
        description: `Failed login attempt for email: ${email}. User not found.`,
        ipAddress,
      });

      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.userNotFound,
      });
    }

    // Check password validity
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Login failed: Incorrect password for user ID: ${user._id}`);

      await AuditLogModel.create({
        action: "LOGIN",
        description: `Failed login attempt for user: ${user._id}. Incorrect password.`,
        userId: user._id,
        ipAddress,
      });

      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.passwordIncorrect,
      });
    }

    // Remove previous tokens if any
    await TokenModel.findOneAndDelete({ userId: user._id });

    // Generate a new JWT token
    const token = jwt.sign({ id: user._id }, process.env.SECRET);
    await new TokenModel({ token, userId: user._id }).save();

    logger.info(`Login successful for user ID: ${user._id}`);

    await AuditLogModel.create({
      action: "LOGIN",
      description: `User ${user._id} logged in successfully.`,
      userId: user._id,
      ipAddress,
    });

    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.userLoggedIn,
      data: { token, ...user.toObject(), password: undefined },
    });
  } catch (error) {
    logger.error(`Error logging in user: ${email} - ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorLogin,
    });
  }
};

//=========== LOGOUT USER =================//
export const logoutUser = async (req, res) => {
  try {
    logger.info("Logout attempt initiated");

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      logger.warn("Logout failed: Missing token");
      return res.status(statusCode.UNAUTHORIZED).json({
        statusCode: statusCode.UNAUTHORIZED,
        message: message.tokenMissing,
      });
    }

    const tokenExists = await TokenModel.findOneAndDelete({ token });
    if (!tokenExists) {
      logger.warn("Logout failed: Invalid token");
      return res.status(statusCode.UNAUTHORIZED).json({
        statusCode: statusCode.UNAUTHORIZED,
        message: message.tokenNotFound,
      });
    }

    logger.info("Logout successful");
    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.userLoggedOut,
    });
  } catch (error) {
    logger.error(`Error during logout: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorLogout,
    });
  }
};

//=========== FORGOT PASSWORD =================//
export const forgotPassword = async (req, res) => {
  try {
    logger.info("Password reset request initiated");

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const { email } = req.body;

    // Check if the user exists
    const user = await UserModel.findOne({ email });
    if (!user) {
      logger.warn(`Password reset failed: User not found for email: ${email}`);
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.userNotFound,
      });
    }

    // Generate OTP and save in the database
    const otp = generateOtp();
    await new PasswordResetTokenModel({
      token: otp,
      userId: user._id,
      expires: Date.now() + 3600000, // 1-hour expiration
    }).save();

    // Send OTP via email
    await transporter.sendMail({
      to: email,
      subject: "Password Reset",
      html: `<p>Your OTP: <b>${otp}</b></p>`,
    });

    logger.info(`Password reset OTP sent to email: ${email}`);
    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.resetPasswordSend,
    });
  } catch (error) {
    logger.error(`Error sending password reset email: ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.errorSendingPasswordResetEmail,
    });
  }
};

//=========== CHANGE PASSWORD =================//
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;

    logger.info(`Change password attempt for user ID: ${userId}`);

    // Find the user by ID
    const user = await UserModel.findById(userId);
    if (!user) {
      logger.warn(`Change password failed: User not found for ID: ${userId}`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.userNotFound,
      });
    }

    // Verify the old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      logger.warn(
        `Change password failed: Incorrect old password for user ID: ${userId}`
      );
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.incorrectOldPassword,
      });
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      logger.warn(
        `Change password failed: New passwords do not match for user ID: ${userId}`
      );
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.passwordNotMatch,
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password and invalidate existing tokens
    user.password = hashedPassword;
    await user.save();
    await TokenModel.deleteMany({ userId });

    logger.info(`Password changed successfully for user ID: ${userId}`);
    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.passwordChanged,
    });
  } catch (err) {
    logger.error(
      `Error changing password for user ID: ${req.user.id} - ${err.message}`
    );
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.passwordChangeError,
    });
  }
};

//=========== RESET PASSWORD =================//
export const resetPassword = async (req, res) => {
  try {
    const { otp } = req.body;

    logger.info(`Password reset verification attempt with OTP: ${otp}`);

    // Find the OTP token in the database
    const resetToken = await PasswordResetTokenModel.findOne({ token: otp });

    if (!resetToken) {
      logger.warn(`Password reset failed: Invalid OTP - ${otp}`);
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.otpInvalid,
      });
    }

    // Check if the OTP is expired
    if (resetToken.expires < Date.now()) {
      logger.warn(`Password reset failed: Expired OTP - ${otp}`);
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: "Expired OTP",
      });
    }

    // Find the user associated with the OTP
    const user = await UserModel.findById(resetToken.userId);
    if (!user) {
      logger.warn(`Password reset failed: User not found for OTP: ${otp}`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.userNotFound,
      });
    }

    logger.info(
      `Password reset OTP verified successfully for user ID: ${user._id}`
    );
    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.otpSuccess,
      userId: user._id,
    });
  } catch (error) {
    logger.error(`Error validating OTP: ${otp} - ${error.message}`);
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.resetPasswordError,
    });
  }
};

//=========== NEW PASSWORD =================//
export const newPassword = async (req, res) => {
  try {
    const { userId, newPassword, confirmPassword } = req.body;

    logger.info(`New password attempt for user ID: ${userId}`);

    // Check if the new passwords match
    if (newPassword !== confirmPassword) {
      logger.warn(
        `New password failed: Passwords do not match for user ID: ${userId}`
      );
      return res.status(statusCode.BAD_REQUEST).json({
        statusCode: statusCode.BAD_REQUEST,
        message: message.passwordNotMatch,
      });
    }

    // Find the user by ID
    const user = await UserModel.findById(userId);
    if (!user) {
      logger.warn(`New password failed: User not found for ID: ${userId}`);
      return res.status(statusCode.NOT_FOUND).json({
        statusCode: statusCode.NOT_FOUND,
        message: message.userNotFound,
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    // Remove the OTP token after successful password reset
    await PasswordResetTokenModel.findOneAndDelete({ userId });

    logger.info(`New password set successfully for user ID: ${userId}`);
    res.status(statusCode.OK).json({
      statusCode: statusCode.OK,
      message: message.passwordChanged,
    });
  } catch (error) {
    logger.error(
      `Error setting new password for user ID: ${userId} - ${error.message}`
    );
    res.status(statusCode.INTERNAL_SERVER_ERROR).json({
      statusCode: statusCode.INTERNAL_SERVER_ERROR,
      message: message.passwordChangeError,
    });
  }
};
