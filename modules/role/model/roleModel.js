import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true },
  permissions: { type: [String], default: [] },
});

RoleSchema.statics.seedDefaultRoles = async function () {
  try {
    const roles = [
      {
        name: "admin",
        permissions: ["create_user", "delete_user", "view_all_users"],
      },
      { name: "user", permissions: ["view_own_profile", "update_own_profile"] },
    ];

    for (const role of roles) {
      const existingRole = await this.findOne({ name: role.name });
      if (!existingRole) {
        await this.create(role);
        console.log(`Role '${role.name}' created successfully.`);
      }
    }
  } catch (error) {
    console.error("Error while seeding roles:", error);
  }
};

const RoleModel = mongoose.model("Role", RoleSchema);

RoleModel.seedDefaultRoles();

export default RoleModel;
