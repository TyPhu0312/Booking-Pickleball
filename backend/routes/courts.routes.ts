import express from "express";
import {
  getCourts,
  getCourtById,
  createCourt,
  updateCourt,
  deleteCourt,
} from "../controllers/courts.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/", verifyToken, getCourts); // Bảo vệ route này bằng middleware xác thực token
router.get("/", getCourts);
router.get("/getCourtById/:id", getCourtById);
router.post("/create", createCourt);
router.put("/update/:id", updateCourt);
router.delete("/delete/:id", deleteCourt);

export default router;
