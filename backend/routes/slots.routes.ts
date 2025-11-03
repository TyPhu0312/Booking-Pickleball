import express from "express";
import {
    getSlots,
    getSlotById,
    createSlot,
    updateSlot,
    deleteSlot,
    getSlotStatusByDate,
    } from "../controllers/slots.controller";

import { verifyToken } from "../middlewares/auth.middleware";

const router = express.Router();
// router.get("/", verifyToken, getSlots);
router.get("/", getSlots);
router.get("/getSlotById/:id", getSlotById);
router.post("/create", createSlot);
router.put("/update/:id", updateSlot);
router.delete("/delete/:id", deleteSlot);
router.get("/getSlotStatusByDate/:date", getSlotStatusByDate);

export default router;