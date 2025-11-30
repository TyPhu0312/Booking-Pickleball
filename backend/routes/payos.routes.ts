import express from "express";
import {
  createPayOSPayment,
  handlePayOSWebhook,
  getPaymentStatus,
  cancelPayOSPayment,
  refundPayment,
  getBookingPayments,
} from "../controllers/payos.controller";

const router = express.Router();

router.post("/create-payos", createPayOSPayment);
router.post("/payos-webhook", handlePayOSWebhook);
router.get("/:id/status", getPaymentStatus);
router.get("/booking/:bookingId", getBookingPayments);
router.post("/:id/cancel", cancelPayOSPayment);
router.post("/:id/refund", refundPayment);

export default router;