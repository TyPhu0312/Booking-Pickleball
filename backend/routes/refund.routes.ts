import express from "express";
import {
  requestCancelBooking,
  getRefundRequests,
  updateRefundStatus,
  exportRefundExcel,
} from "../controllers/refund.controller";

const router = express.Router();

router.post("/request-cancel/:bookingID", requestCancelBooking);

router.get("/requests", getRefundRequests);
router.put("/update-status/:paymentID", updateRefundStatus);
router.get("/export-excel", exportRefundExcel);

export default router;
