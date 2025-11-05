import express from "express";
import {
    getBookings,
    getBookingById,
    createBooking,
    updateBooking,
    updateBookingStatus,
} from "../controllers/bookings.controller";
import { verifyToken } from "../middlewares/auth.middleware";


const router = express.Router();

// app.get("/bookings", verifyToken, getBookings); // Bảo vệ route này bằng middleware xác thực token
router.get("/", getBookings);
router.get("/getBookingById/:id", getBookingById);
router.post("/create", createBooking);
router.put("/update/:id", updateBooking);
router.put("/updateBookingStatus/:id", updateBookingStatus);

export default router;