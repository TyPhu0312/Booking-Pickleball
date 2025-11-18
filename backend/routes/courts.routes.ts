import express from "express";
import {
  getCourts,
  getCourtById,
  createCourt,
  updateCourt,
  deleteCourt,
  getCourtsAvailability,
  getAllTheMultiplierOfTheCourtType,
  getAvailableCourtsByType,
} from "../controllers/courts.controller";
import { verifyToken } from "../middlewares/auth.middleware";

const router = express.Router();

// router.get("/", verifyToken, getCourts); 
router.get("/", getCourts);
router.get("/getCourtById/:id", getCourtById);
router.post("/create", createCourt);
router.put("/update/:id", updateCourt);
router.delete("/delete/:id", deleteCourt);
router.get("/getCourtsAvailability", getCourtsAvailability);
router.get("/getAllTheMultiplierOfTheCourtType", getAllTheMultiplierOfTheCourtType);
router.get("/getAvailableCourtsByType/:type", getAvailableCourtsByType);

export default router;
