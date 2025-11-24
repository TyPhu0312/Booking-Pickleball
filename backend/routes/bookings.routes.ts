import express from "express";
import {
    getBookings,
    getBookingById,
    createBooking,
    updateBooking,
    updateBookingStatus,
    getBookingByUserIdOrPhone,
    deleteBooking,
} from "../controllers/bookings.controller";
import { verifyToken } from "../middlewares/auth.middleware";


const router = express.Router();

// app.get("/bookings", verifyToken, getBookings);
router.get("/", getBookings);
router.get("/getBookingById/:id", getBookingById);
router.post("/create", createBooking);
router.put("/update/:id", updateBooking);
router.put("/delete/:id", deleteBooking);
router.put("/updateBookingStatus/:id", updateBookingStatus);
router.get("/getBookingByUserIdOrPhone/:user_id", getBookingByUserIdOrPhone);

export default router;