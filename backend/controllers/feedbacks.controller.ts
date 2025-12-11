import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createOrUpdateFeedback = async (req: Request, res: Response) => {
  try {
    const { user_id, court_id, rating, comment, is_anonymous } = req.body;

    if (!user_id || !court_id || !rating) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Rating phải từ 1 đến 5" });
    }

    const hasBooking = await prisma.bookings.findFirst({
      where: {
        user_id,
        court_id,
        status: {
          in: ["COMPLETED"],
        },
      },
    });

    if (!hasBooking) {
      return res.status(403).json({ 
        message: "Bạn chỉ có thể đánh giá sân sau khi đã sử dụng" 
      });
    }

    const existingFeedback = await prisma.feedbacks.findFirst({
      where: {
        user_id,
        court_id,
      },
    });

    let feedback;
    if (existingFeedback) {
      feedback = await prisma.feedbacks.update({
        where: { feedbackID: existingFeedback.feedbackID },
        data: {
          rating,
          comment,
          is_anonymous: is_anonymous ?? existingFeedback.is_anonymous,
        },
        include: {
          user: {
            select: {
              userID: true,
              full_name: true,
            },
          },
        },
      });

      const responseFeedback = {
        ...feedback,
        user: feedback.is_anonymous ? null : feedback.user,
      };

      return res.json({
        message: "Cập nhật đánh giá thành công",
        feedback: responseFeedback,
      });
    } else {
      feedback = await prisma.feedbacks.create({
        data: {
          user_id,
          court_id,
          rating,
          comment,
          is_anonymous: is_anonymous ?? false,
        },
        include: {
          user: {
            select: {
              userID: true,
              full_name: true,
            },
          },
        },
      });

      const responseFeedback = {
        ...feedback,
        user: feedback.is_anonymous ? null : feedback.user,
      };

      return res.json({
        message: "Tạo đánh giá thành công",
        feedback: responseFeedback,
      });
    }
  } catch (error) {
    console.error("Error creating/updating feedback:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const getFeedbacksByCourt = async (req: Request, res: Response) => {
  try {
    const { courtId } = req.params;

    const feedbacks = await prisma.feedbacks.findMany({
      where: { court_id: courtId },
      include: {
        user: {
          select: {
            userID: true,
            full_name: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const feedbacksWithAnonymous = feedbacks.map((feedback) => ({
      ...feedback,
      user: feedback.is_anonymous ? null : feedback.user,
    }));

    const avgRating = feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : 0;

    res.json({
      feedbacks: feedbacksWithAnonymous,
      totalFeedbacks: feedbacks.length,
      averageRating: Math.round(avgRating * 10) / 10,
    });
  } catch (error) {
    console.error("Error getting feedbacks:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const getUserFeedbackForCourt = async (req: Request, res: Response) => {
  try {
    const { userId, courtId } = req.params;

    const feedback = await prisma.feedbacks.findFirst({
      where: {
        user_id: userId,
        court_id: courtId,
      },
      include: {
        user: {
          select: {
            userID: true,
            full_name: true,
          },
        },
      },
    });

    if (!feedback) {
      return res.status(404).json({ message: "Chưa có đánh giá" });
    }

    res.json(feedback);
  } catch (error) {
    console.error("Error getting user feedback:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const checkCanReview = async (req: Request, res: Response) => {
  try {
    const { userId, courtId } = req.params;

    const hasBooking = await prisma.bookings.findFirst({
      where: {
        user_id: userId,
        court_id: courtId,
        status: {
          in: ["COMPLETED"],
        },
      },
    });

    const existingFeedback = await prisma.feedbacks.findFirst({
      where: {
        user_id: userId,
        court_id: courtId,
      },
    });

    res.json({
      canReview: !!hasBooking,
      hasReviewed: !!existingFeedback,
      existingFeedback: existingFeedback || null,
    });
  } catch (error) {
    console.error("Error checking review permission:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const deleteFeedback = async (req: Request, res: Response) => {
  try {
    const { feedbackId } = req.params;
    const { userId } = req.body;

    const feedback = await prisma.feedbacks.findUnique({
      where: { feedbackID: feedbackId },
    });

    if (!feedback) {
      return res.status(404).json({ message: "Không tìm thấy đánh giá" });
    }

    if (feedback.user_id !== userId) {
      return res.status(403).json({ message: "Không có quyền xóa đánh giá này" });
    }

    await prisma.feedbacks.delete({
      where: { feedbackID: feedbackId },
    });

    res.json({ message: "Xóa đánh giá thành công" });
  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const getAllFeedbacks = async (req: Request, res: Response) => {
  try {
    const feedbacks = await prisma.feedbacks.findMany({
      include: {
        user: {
          select: {
            userID: true,
            full_name: true,
          },
        },
        court: {
          select: {
            courtID: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(feedbacks);
  } catch (error) {
    console.error("Error getting all feedbacks:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const getUserFeedbacks = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const feedbacks = await prisma.feedbacks.findMany({
      where: { user_id: userId },
      include: {
        court: {
          select: {
            courtID: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const avgRating = feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
      : 0;

    res.json({
      feedbacks,
      totalFeedbacks: feedbacks.length,
      averageRating: Math.round(avgRating * 10) / 10,
    });
  } catch (error) {
    console.error("Error getting user feedbacks:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const getBookingsWithReviewStatus = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const completedBookings = await prisma.bookings.findMany({
      where: {
        user_id: userId,
        status: "COMPLETED",
        court_id: { not: null },
      },
      include: {
        court: {
          select: {
            courtID: true,
            name: true,
            type: true,
          },
        },
        bookingSlots: {
          include: { slot: true },
          orderBy: { date: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const userFeedbacks = await prisma.feedbacks.findMany({
      where: { user_id: userId },
      select: {
        court_id: true,
        feedbackID: true,
        rating: true,
        comment: true,
        is_anonymous: true,
        createdAt: true,
      },
    });

    const feedbackMap = new Map(
      userFeedbacks.map((fb) => [fb.court_id, fb])
    );

    const bookingsWithReview = completedBookings.map((booking) => ({
      ...booking,
      canReview: true,
      hasReviewed: feedbackMap.has(booking.court_id || ""),
      existingFeedback: feedbackMap.get(booking.court_id || "") || null,
    }));

    res.json(bookingsWithReview);
  } catch (error) {
    console.error("Error getting bookings with review status:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
