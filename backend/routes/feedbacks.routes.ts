import express from "express";
import {
  createOrUpdateFeedback,
  getFeedbacksByCourt,
  getUserFeedbackForCourt,
  checkCanReview,
  deleteFeedback,
  getAllFeedbacks,
  getUserFeedbacks,
  getBookingsWithReviewStatus,
} from "../controllers/feedbacks.controller";

const router = express.Router();

router.post("/", createOrUpdateFeedback);
router.get("/court/:courtId", getFeedbacksByCourt);
router.get("/user/:userId/court/:courtId", getUserFeedbackForCourt);
router.get("/check/:userId/court/:courtId", checkCanReview);
router.get("/user/:userId", getUserFeedbacks);
router.get("/user/:userId/bookings", getBookingsWithReviewStatus);
router.delete("/:feedbackId", deleteFeedback);
router.get("/", getAllFeedbacks);

export default router;
