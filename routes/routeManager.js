import userRoutes from "../routes/userRoutes.js";
import authRoutes from "../routes/authRoutes.js";
import adminRoutes from "../routes/adminRoutes.js";
import roleRoutes from "../routes/roleRoutes.js";
import auditLogRoutes from "../routes/auditLogRoutes.js";

const MainRoutes = [
  userRoutes,
  roleRoutes,
  authRoutes,
  adminRoutes,
  auditLogRoutes,
];

export default MainRoutes;
