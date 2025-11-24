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
import { uploadCourtImage } from "../config/multer";

const router = express.Router();

// router.get("/", verifyToken, getCourts); 
router.get("/", getCourts);
router.get("/getCourtById/:id", getCourtById);
router.post("/create", uploadCourtImage.single("image"), createCourt);
router.put("/update/:id", uploadCourtImage.single("image"), updateCourt);
router.delete("/delete/:id", deleteCourt);
router.get("/getCourtsAvailability", getCourtsAvailability);
router.get("/getAllTheMultiplierOfTheCourtType", getAllTheMultiplierOfTheCourtType);
router.get("/getAvailableCourtsByType/:type", getAvailableCourtsByType);

export default router;
