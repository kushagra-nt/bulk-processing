import mongoose from "mongoose";

const userList = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    customProperties: { type: Map, of: String },
});

const userListModel = mongoose.model("userList", userList);
export default userListModel;