const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // ✅ Added password field
  isAdmin: { type: Boolean, default: false }, // ✅ Admin flag
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
