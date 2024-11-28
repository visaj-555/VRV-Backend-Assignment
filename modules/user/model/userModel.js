import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    phoneNo: {
      type: Number,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
    },
    role: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
    password: {
      type: String,
    },
    profileImage: {
      type: String,
      default: "default_user.jpg",
    },
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

export default mongoose.model("User", UserSchema);
