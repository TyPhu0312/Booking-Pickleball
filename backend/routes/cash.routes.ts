import express from "express";
import {
  createCashPayment,
  updateCashPayment,
  confirmCashPayment,
  getCashPaymentByBooking,
} from "../controllers/cash.controller";

const router = express.Router();

router.post("/create", createCashPayment);
router.put("/:id", updateCashPayment);
router.post("/:id/confirm", confirmCashPayment);
router.get("/booking/:bookingId", getCashPaymentByBooking);

export default router;
