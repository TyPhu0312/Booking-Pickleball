import express from "express";
import { getPayments, getPaymentById, createPayment, updatePayment, deletePaymentImage } from "../controllers/payments.controller";
import { uploadPaymentImage } from "../config/multer";

const router = express.Router();

router.get("/", getPayments);
router.get("/:id", getPaymentById);
router.post("/create", uploadPaymentImage.single("image"), createPayment);
router.put("/update/:id", uploadPaymentImage.single("image"), updatePayment);
router.delete("/image/:imageId", deletePaymentImage);

export default router;
