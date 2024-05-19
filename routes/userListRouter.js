import { Router } from "express";
import multer from "multer";
import { addUsersThroughCsv, createUserList, addUser, getProcessStatus } from "../controllers/userList.js";

const userListRouter = new Router();

userListRouter.post('/create',createUserList);

userListRouter.post('/add-user',addUser);

// Configure Multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
userListRouter.post('/:listId/add-bulk-users', upload.single('csv-file'),addUsersThroughCsv);

userListRouter.get('/csv-status/:uploadProcessId', getProcessStatus);

export default userListRouter;