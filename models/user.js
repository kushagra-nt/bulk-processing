import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  customProperties: { type: Map, of: String },
  listId: mongoose.Schema.Types.ObjectId
});

const userModel = mongoose.model("users", userSchema);
export default userModel;