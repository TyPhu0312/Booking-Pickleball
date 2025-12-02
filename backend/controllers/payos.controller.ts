import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createPaymentLink, getPaymentInfo, cancelPaymentLink } from "../services/payos.service";

const prisma = new PrismaClient();

export const createPayOSPayment = async (req: Request, res: Response) => {
  const { bookingId, paymentType } = req.body;
  try {
    const booking = await prisma.bookings.findUnique({
      where: { bookingID: bookingId },
      include: { user: true, court: true, payments: true },
    });
    if (!booking) {
      return res.status(404).json({ message: "Booking không tồn tại" });
    }

    const totalPaid = booking.payments.reduce((sum: number, p: any) => {
      if (p.status === "PARTIALLY_PAID" || p.status === "PAID") {
        return sum + (p.paid_amount || 0);
      }
      return sum;
    }, 0);

    if (!paymentType || paymentType === "DEPOSIT") {
      const pendingPayment = booking.payments.find((p: any) => p.status === "PENDING");
      if (pendingPayment) {
        const now = new Date();
        const deadline = pendingPayment.payment_deadline ? new Date(pendingPayment.payment_deadline) : now;
        
        if (deadline < now) {
          
          if (pendingPayment.order_code) {
            try {
              await cancelPaymentLink(pendingPayment.order_code, "Hết hạn thanh toán");
            } catch (error) {
              console.warn("⚠️ Không thể cancel payment trên PayOS:", error);
            }
          }
          
          await prisma.payments.update({
            where: { paymentID: pendingPayment.paymentID },
            data: { status: "EXPIRED" }
          });
          
        } else {
          const minutesLeft = Math.floor((deadline.getTime() - now.getTime()) / 60000);
          return res.status(400).json({ 
            message: `Đã có liên kết thanh toán đang chờ xử lý (còn ${minutesLeft} phút)`,
            existingPaymentId: pendingPayment.paymentID,
            deadline: pendingPayment.payment_deadline
          });
        }
      }
    }
    
    let amountToPay = 0;
    let description = "";

    if (!paymentType || paymentType === "DEPOSIT") {
      if (totalPaid > 0 ) {
        return res.status(400).json({ message: "Đặt cọc đã được thanh toán" });
      }
      amountToPay = booking.deposit_amount;
      description = "Coc dat san";
    } else if (paymentType === "REMAINING") {
      if (totalPaid === 0 ) {
        return res.status(400).json({ message: "Cần thanh toán đặt cọc trước khi thanh toán phần còn lại" });
      }
      if (totalPaid >= booking.total_price) {
        return res.status(400).json({ message: "Booking đã được thanh toán đầy đủ" });
      }
      amountToPay = booking.total_price - totalPaid;
      description = "Thanh toan con lai";
    }
    console.log("📝 Đang tạo payment link với data:", {
      amount: amountToPay,
      description,
      bookingId: booking.bookingID,
      buyerName: booking.user ? booking.user.full_name : "Khách hàng",
      buyerPhone: booking.user ? booking.user.phone : "0000000000",
    });

    const paymentLink = await createPaymentLink({
      amount: amountToPay,
      description,
      bookingId: booking.bookingID,
      buyerName: booking.user ? booking.user.full_name : "Khách hàng",
      buyerPhone: booking.user ? booking.user.phone : "0000000000",
    });

    const payment = await prisma.payments.create({
      data: {
        booking_id: bookingId,
        payment_method: "PAYOS" as any,
        status: "PENDING",
        order_code: paymentLink.orderCode,
        payment_url: paymentLink.checkoutUrl,
        qr_code_url: paymentLink.qrCode,
        payment_link_id: paymentLink.paymentLinkId,
        payment_deadline: new Date(Date.now() + 2 * 60 * 60 * 1000),
      }
    });
    res.json({
      success: true,
      paymentId: payment.paymentID,
      orderCode: paymentLink.orderCode,
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode,
      deadline: payment.payment_deadline,
      amount: amountToPay,
      paymentType: paymentType || "DEPOSIT",
      totalPaid,
      totalPrice: booking.total_price,
      depositAmount: booking.deposit_amount,
      remainingAmount: booking.total_price - totalPaid - amountToPay,
    });
  } catch (error: any) {
    console.error("❌ Lỗi khi tạo liên kết thanh toán PayOS:", error);
    console.error("❌ Chi tiết lỗi:", error.message);
    console.error("❌ Stack trace:", error.stack);
    res.status(500).json({ 
      message: "Lỗi máy chủ khi tạo liên kết thanh toán",
      error: error.message 
    });
  }
};
export const handlePayOSWebhook = async (req: Request, res: Response) => {
  try {
    const { orderCode, amount, reference } = req.body;

    const payment = await prisma.payments.findFirst({
      where: { order_code: Number(orderCode) },
      include: { booking: true },
    });

    if (!payment) {
      return res.status(404).json({ message: "Thanh toán không tồn tại" });
    }

    const currentTotalPaid = (payment.paid_amount || 0) + amount;
    const totalPrice = payment.booking.total_price;

    const newStatus = currentTotalPaid >= totalPrice ? "PAID" : "PARTIALLY_PAID";

    await prisma.payments.update({
      where: { paymentID: payment.paymentID },
      data: {
        status: newStatus,
        paid_amount: amount,
        transaction_id: reference,
      },
    });

    if (newStatus === "PAID") {
      await prisma.bookings.update({
        where: { bookingID: payment.booking_id },
        data: { status: "CONFIRMED" },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Lỗi khi xử lý webhook PayOS:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi xử lý webhook" });
  }
};

export const getPaymentStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const payment = await prisma.payments.findUnique({
      where: { paymentID: id },
      include: { booking: { include: { court: true } } },
    });

    if (!payment) {
      return res.status(404).json({ message: "Thanh toán không tồn tại" });
    }

    if (payment.status === "PENDING" && payment.order_code) {
      try {
        const paymentInfo = await getPaymentInfo(payment.order_code);
        
        if (paymentInfo.status === "PAID") {
          const otherPayments = await prisma.payments.findMany({
            where: { 
              booking_id: payment.booking_id,
              paymentID: { not: payment.paymentID } 
            }
          });

          const previousPaid = otherPayments.reduce((sum: number, p: any) => {
            if (p.status === "PARTIALLY_PAID" || p.status === "PAID") {
              return sum + (p.paid_amount || 0);
            }
            return sum;
          }, 0);

          const currentTotalPaid = previousPaid + paymentInfo.amount;
          const totalPrice = payment.booking.total_price;
          const newStatus = currentTotalPaid >= totalPrice ? "PAID" : "PARTIALLY_PAID";

          console.log("💰 Tính toán:", {
            previousPaid,
            currentPayment: paymentInfo.amount,
            currentTotalPaid,
            totalPrice,
            newStatus
          });

          await prisma.payments.update({
            where: { paymentID: payment.paymentID },
            data: {
              status: newStatus,
              paid_amount: paymentInfo.amount,
              transaction_id: paymentInfo.transactions?.[0]?.reference,
            },
          });

          if (newStatus === "PAID" || newStatus === "PARTIALLY_PAID") {
            await prisma.bookings.update({
              where: { bookingID: payment.booking_id },
              data: { status: "CONFIRMED" },
            });
          }
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin thanh toán từ PayOS:", error);
      }
    }

    const allPayments = await prisma.payments.findMany({
      where: { booking_id: payment.booking_id },
    });

    const totalPaid = allPayments.reduce((sum: number, p: any) => {
      if (p.status === "PARTIALLY_PAID" || p.status === "PAID") {
        return sum + (p.paid_amount || 0);
      }
      return sum;
    }, 0);

    const remainingAmount = payment.booking.total_price - totalPaid;

    res.json({
      paymentId: payment.paymentID,
      status: payment.status,
      amount: payment.paid_amount,
      orderCode: payment.order_code,
      deadLine: payment.payment_deadline,
      qrCodeUrl: payment.qr_code_url,
      paymentUrl: payment.payment_url,
      totalPaid,
      remainingAmount,
      booking: {
        bookingID: payment.booking.bookingID,
        courtName: payment.booking.court.name,
        totalPrice: payment.booking.total_price,
        depositAmount: payment.booking.deposit_amount,
        status: payment.booking.status,
      }
    });
  } catch (error) {
    console.error("Lỗi khi lấy trạng thái thanh toán:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi lấy trạng thái thanh toán" });
  }
};

export const getBookingPayments = async (req: Request, res: Response) => {
  const { bookingId } = req.params;
  try {
      const booking = await prisma.bookings.findUnique({
      where: { bookingID: bookingId }
    });
    if (!booking) {
      return res.status(404).json({ message: "Booking không tồn tại" });
    }
    const payments = await prisma.payments.findMany({
      where: { booking_id: bookingId },
      orderBy: { createdAt: 'desc' }
    });

    if (!payments || payments.length === 0) {
      return res.json({
        hasPendingPayment: false,
        hasPartiallyPaid: false,
        payments: []
      });
    }

    const pendingPayment = payments.find((p: any) => p.status === "PENDING");
    const partiallyPaid = payments.some((p: any) => p.status === "PARTIALLY_PAID");
    
    const totalPaid = payments.reduce((sum: number, p: any) => {
      if (p.status === "PARTIALLY_PAID" || p.status === "PAID") {
        return sum + (p.paid_amount || 0);
      }
      return sum;
    }, 0);

    res.json({
      hasPendingPayment: pendingPayment,
      hasPartiallyPaid: partiallyPaid,
      pendingPayment: pendingPayment || null,
      totalPaid,
      totalPrice: booking?.total_price || 0,
      remainingAmount: (booking?.total_price || 0) - totalPaid,
      payments
    });
  } catch (error) {
    console.error("Lỗi khi lấy payments của booking:", error);
    res.status(500).json({ message: "Lỗi máy chủ" });
  }
};

export const cancelPayOSPayment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const payment = await prisma.payments.findUnique({
      where: { paymentID: id },
    });

    if (!payment) {
      return res.status(404).json({ message: "Thanh toán không tồn tại" });
    }

    if (payment.status === "PAID") {
      return res.status(400).json({ message: "Không thể hủy thanh toán đã được hoàn tất" });
    }

    if (payment.order_code) {
      try {
        await cancelPaymentLink(payment.order_code, reason);
      } catch (error) {
        console.error("Lỗi khi hủy liên kết thanh toán PayOS:", error);
      }
    }

    await prisma.payments.update({
      where: { paymentID: payment.paymentID },
      data: { status: "CANCELLED" },
    });

    await prisma.bookings.update({
      where: { bookingID: payment.booking_id },
      data: { status: "CANCELLED" },
    });

    res.json({ message: "Hủy thanh toán thành công" });
  } catch (error) {
    console.error("Lỗi khi hủy thanh toán:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi hủy thanh toán" });
  }
};

export const refundPayment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { amount, reason } = req.body;
  try {
    const payment = await prisma.payments.findUnique({
      where: { paymentID: id },
    });

    if (!payment) {
      return res.status(404).json({ message: "Thanh toán không tồn tại" });
    }

    if (payment.status !== "PAID" && payment.status !== "PARTIALLY_PAID") {
      return res.status(400).json({ message: "Chỉ có thể hoàn tiền cho các thanh toán đã được hoàn tất hoặc thanh toán một phần" });
    }

    // if (payment.order_code) {
    //   await refundPayment(payment.order_code, amount, reason);
    // }

    await prisma.payments.update({
      where: { paymentID: payment.paymentID },
      data: {
        status: "REFUNDED",
        refund_amount: amount,
        refund_reason: reason,
        refund_date: new Date(),
      },
    });


    res.json({ success: true, message: "Hoàn tiền thành công", refundAmount: amount });
  } catch (error) {
    console.error("Lỗi khi hoàn tiền:", error);
    res.status(500).json({ message: "Lỗi máy chủ khi hoàn tiền" });
  }
};