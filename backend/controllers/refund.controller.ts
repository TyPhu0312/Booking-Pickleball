import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function calculateRefundPercentage(bookingDate: Date): number {
  const now = new Date();
  const hoursRemaining = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursRemaining > 2) return 100;
  if (hoursRemaining > 1) return 80;
  if (hoursRemaining > 0.5) return 50;
  return 0;
}

export const requestCancelBooking = async (req: Request, res: Response) => {
  try {
    const { bookingID } = req.params;
    const { cancel_reason, bank_name, bank_account_number, bank_account_owner } = req.body;

    const booking = await prisma.bookings.findUnique({
      where: { bookingID },
      include: {
        bookingSlots: true,
        payments: true,
      },
    });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy booking" });
    }

    if (booking.status === "CANCELLED" || booking.status === "CANCEL_REQUESTED") {
      return res.status(400).json({ message: "Booking đã bị hủy hoặc đang chờ xử lý" });
    }

    const earliestSlot = booking.bookingSlots.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )[0];

    const refundPercentage = calculateRefundPercentage(new Date(earliestSlot.date));
    const refundAmount = (booking.deposit_amount * refundPercentage) / 100;

    if (refundPercentage === 0) {
      return res.status(400).json({ 
        message: "Không thể hoàn tiền khi hủy sân trong vòng 30 phút trước giờ đặt",
        refundPercentage: 0 
      });
    }

    await prisma.bookings.update({
      where: { bookingID },
      data: { status: "CANCEL_REQUESTED" },
    });

    const payment = booking.payments[0];
    await prisma.payments.update({
      where: { paymentID: payment.paymentID },
      data: {
        refund_amount: refundAmount,
        refund_reason: cancel_reason,
        refund_percentage: refundPercentage,
        refund_status: "PENDING",
        bank_name,
        bank_account_number,
        bank_account_owner,
        refund_date: new Date(),
      },
    });

    res.json({
      message: "Yêu cầu hủy sân thành công",
      refundPercentage,
      refundAmount,
      bookingID,
    });
  } catch (error) {
    console.error("Error requesting cancel:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const getRefundRequests = async (req: Request, res: Response) => {
  try {
    const { status, startDate, endDate } = req.query;

    const whereClause: any = {
      refund_status: status || { not: null },
    };

    if (startDate || endDate) {
      whereClause.refund_date = {};
      if (startDate) whereClause.refund_date.gte = new Date(startDate as string);
      if (endDate) whereClause.refund_date.lte = new Date(endDate as string);
    }

    const refunds = await prisma.payments.findMany({
      where: whereClause,
      include: {
        booking: {
          include: {
            user: true,
            court: true,
            bookingSlots: {
              include: { slot: true },
            },
          },
        },
      },
      orderBy: { refund_date: "desc" },
    });

    res.json(refunds);
  } catch (error) {
    console.error("Error getting refund requests:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const updateRefundStatus = async (req: Request, res: Response) => {
  try {
    const { paymentID } = req.params;
    const { refund_status, admin_note, processed_by, actual_refund } = req.body;

    const payment = await prisma.payments.update({
      where: { paymentID },
      data: {
        refund_status,
        admin_note,
        processed_by,
        refund_amount: actual_refund || undefined,
      },
    });

    if (refund_status === "APPROVED") {
      await prisma.bookings.update({
        where: { bookingID: payment.booking_id },
        data: { status: "CANCELLED" },
      });
    }

    res.json({ message: "Cập nhật trạng thái refund thành công", payment });
  } catch (error) {
    console.error("Error updating refund status:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

export const exportRefundExcel = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const whereClause: any = {
      refund_status: { not: null },
    };

    if (startDate || endDate) {
      whereClause.refund_date = {};
      if (startDate) whereClause.refund_date.gte = new Date(startDate as string);
      if (endDate) whereClause.refund_date.lte = new Date(endDate as string);
    }

    const refunds = await prisma.payments.findMany({
      where: whereClause,
      include: {
        booking: {
          include: {
            user: true,
            court: true,
          },
        },
      },
      orderBy: { refund_date: "desc" },
    });

    const excelData = refunds.map((payment) => {
      const refundDate = payment.refund_date 
        ? new Date(payment.refund_date).toLocaleString('vi-VN', { 
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        : "";

      return {
        "Mã Payment": payment.paymentID,
        "Mã Booking": payment.booking_id,
        "Khách hàng": payment.booking.user?.full_name || "Khách lẻ",
        "SĐT": payment.booking.user?.phone || payment.booking.phone_user,
        "Sân": payment.booking.court?.name || "Chưa phân bổ",
        "Tiền cọc": payment.booking.deposit_amount,
        "% Hoàn": payment.refund_percentage + "%",
        "Số tiền hoàn": payment.refund_amount,
        "Ngân hàng": payment.bank_name,
        "STK": payment.bank_account_number,
        "Chủ TK": payment.bank_account_owner,
        "Lý do hủy": payment.refund_reason,
        "Trạng thái": payment.refund_status,
        "Ngày yêu cầu": refundDate,
        "Người xử lý": payment.processed_by || "",
        "Ghi chú admin": payment.admin_note || "",
      };
    });

    res.json(excelData);
  } catch (error) {
    console.error("Error exporting refund excel:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
