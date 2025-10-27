import express from "express";
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} from "../controllers/roles.controller";

const router = express.Router();

router.get("/", getRoles);
router.get("/getRoleById/:id", getRoleById);
router.post("/create", createRole);
router.put("/update/:id", updateRole);
router.delete("/delete/:id", deleteRole);

export default router;
