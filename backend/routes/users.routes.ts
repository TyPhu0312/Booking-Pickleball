import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserByPhone,
} from "../controllers/users.controller";

const router = express.Router();


router.get("/", getUsers);
router.get("/getUserById/:id", getUserById);
router.get("/getUserByPhone/:phone", getUserByPhone);
router.post("/create", createUser);
router.put("/update/:id", updateUser);
router.delete("/delete/:id", deleteUser);

export default router;
