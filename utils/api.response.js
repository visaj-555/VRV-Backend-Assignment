//  utils/api.response.js
export const statusCode = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};
export const message = {
  // User
  loginAdmin: "Admin Logged In Successfully",
  otpSuccess: "OTP Verified Successfully",
  passwordChanged: "Password changed successfully",
  resetPassword: "Password reset successfully",
  resetPasswordSend: "Password reset link sent to your mail",
  userCreated: "Registered Successfully",
  userDeleted: "Account deleted successfully",
  userExists: "User already exists",
  userLoggedIn: "Logged in successfully",
  userLoggedOut: "User logged out successfully",
  userNotFound: "User not found",
  userProfileUpdated: "User profile updated successfully",
  userUpdated: "Account updated successfully",
  userView: "User retrieved successfully",
  usersView: "Users retrieved successfully",
  errorLogin: "Error logging in user",
  errorRegisteringUser: "Error registering user",
  errorSendingPasswordResetEmail: "Error sending password reset email",
  errorUserUpdate: "Error updating user profile",
  fileTooLarge: "File size should be less than 1 MB",
  imageValidation: "Please upload a valid image file",
  incorrectOldPassword: "Invalid old password",
  otpExpired: "Expired OTP",
  otpInvalid: "Invalid OTP",
  passwordIncorrect: "Invalid password",
  passwordNotMatch: "Passwords do not match",
  unAuthUser: "Unauthorized User",
  resetPasswordSuccess: "Reset Password Successfully",
  resetPasswordError: "Error Resetting Password",
  authHeaderError: "Authorization header is missing",
  tokenMissing: "Token is missing",
  tokenNotFound: "Token Not Found in the database",

  // Miscellaneous Error
  deleteAuth: "You are unauthorized to delete this account",
  expiredToken: "Invalid or expired token",
  tokenNotMatch: "Unauthorized. Token does not match user",
  tokenVerifyFail: "Token verification failed",
  updateUserError: "An error occurred while updating the profile",
  INTERNAL_SERVER_ERROR: "Something went Wrong",

  //Role Module

  createRole: "Role created successfully",
  getRoles: "Roles fetched successfully",

  // Authorisation Module

  permissionDenied: " You do not have permission to perform this action",
};
