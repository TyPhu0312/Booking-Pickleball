import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createPaymentLink, getPaymentInfo, cancelPaymentLink } from "../services/payos.service";

const prisma = new PrismaClient();

export const createPayOSPayment = async (req: Request, res: Response) => {
  const { bookingId, paymentType } = req.body;
  console.log("🔍 createPayOSPayment called with:", { bookingId, paymentType });
  try {
    const result = await prisma.$transaction(async (tx) => {
      let booking = await tx.bookings.findUnique({
        where: { bookingID: bookingId },
        include: { user: true, court: true },
      });
      
      if (!booking) {
        const childBookings = await tx.bookings.findMany({
          where: { parent_booking_id: bookingId },
          include: { user: true, court: true },
        });
        
        if (childBookings.length > 0) {
          booking = childBookings[0];
          booking.parent_booking_id = bookingId;
        }
      }
      
      if (!booking) {
        throw new Error("Booking không tồn tại");
      }

      const paymentBookingId = booking.parent_booking_id || bookingId;
      const isGroupBooking = !!booking.parent_booking_id;

      const payments = await tx.payments.findMany({
        where: { booking_id: paymentBookingId },
        orderBy: { createdAt: 'desc' }
      });

      const totalPaid = payments.reduce((sum: number, p: any) => {
        if (p.status === "PARTIALLY_PAID" || p.status === "PAID") {
          return sum + (p.paid_amount || 0);
        }
        return sum;
      }, 0);

      let groupTotalPrice = booking.total_price;
      let groupDepositAmount = booking.deposit_amount;
      
      if (isGroupBooking) {
        const groupBookings = await tx.bookings.findMany({
          where: { parent_booking_id: booking.parent_booking_id }
        });
        groupTotalPrice = groupBookings.reduce((sum, b) => sum + b.total_price, 0);
        groupDepositAmount = groupBookings.reduce((sum, b) => sum + b.deposit_amount, 0);
      }

      if (!paymentType || paymentType === "DEPOSIT") {
        const pendingPayment = payments.find((p: any) => p.status === "PENDING");
        if (pendingPayment) {
          const now = new Date();
          const deadline = pendingPayment.payment_deadline ? new Date(pendingPayment.payment_deadline) : now;
          
          if (deadline < now) {
            if (pendingPayment.order_code) {
              try {
                await cancelPaymentLink(pendingPayment.order_code, "Hết hạn thanh toán");
              } catch (error) {
                console.warn("Không thể cancel payment trên PayOS:", error);
              }
            }
            
            await tx.payments.update({
              where: { paymentID: pendingPayment.paymentID },
              data: { status: "EXPIRED" }
            });
            
          } else {
            return {
              success: true,
              paymentId: pendingPayment.paymentID,
              orderCode: pendingPayment.order_code,
              checkoutUrl: pendingPayment.payment_url,
              qrCode: pendingPayment.qr_code_url,
              deadline: pendingPayment.payment_deadline,
              amount: isGroupBooking ? groupDepositAmount : booking.deposit_amount,
              paymentType: "DEPOSIT",
              totalPaid,
              totalPrice: isGroupBooking ? groupTotalPrice : booking.total_price,
              depositAmount: isGroupBooking ? groupDepositAmount : booking.deposit_amount,
              remainingAmount: (isGroupBooking ? groupTotalPrice : booking.total_price) - totalPaid - (isGroupBooking ? groupDepositAmount : booking.deposit_amount),
            };
          }
        }
      } else if (paymentType === "REMAINING") {
        const pendingRemainingPayment = payments.find(
          (p: any) => p.status === "PENDING" && p.paid_amount === 0
        );
        
        if (pendingRemainingPayment) {
          const now = new Date();
          const deadline = pendingRemainingPayment.payment_deadline 
            ? new Date(pendingRemainingPayment.payment_deadline) 
            : now;
          
          if (deadline >= now) {
            const remainingAmount = booking.total_price - (isGroupBooking 
              ? Math.round((totalPaid * booking.total_price) / groupTotalPrice)
              : totalPaid);
            return {
              success: true,
              paymentId: pendingRemainingPayment.paymentID,
              orderCode: pendingRemainingPayment.order_code,
              checkoutUrl: pendingRemainingPayment.payment_url,
              qrCode: pendingRemainingPayment.qr_code_url,
              deadline: pendingRemainingPayment.payment_deadline,
              amount: remainingAmount,
              paymentType: "REMAINING",
              totalPaid: isGroupBooking ? Math.round((totalPaid * booking.total_price) / groupTotalPrice) : totalPaid,
              totalPrice: booking.total_price,
              depositAmount: booking.deposit_amount,
              remainingAmount: 0,
            };
          } else {
            if (pendingRemainingPayment.order_code) {
              try {
                await cancelPaymentLink(pendingRemainingPayment.order_code, "Hết hạn thanh toán");
              } catch (error) {
                console.warn("Không thể cancel payment trên PayOS:", error);
              }
            }
            
            await tx.payments.update({
              where: { paymentID: pendingRemainingPayment.paymentID },
              data: { status: "EXPIRED" }
            });
          }
        }
      }
      
      return { booking, totalPaid, isGroupBooking, groupTotalPrice, groupDepositAmount, paymentBookingId, needsNewPayment: true };
    });

    if (result.success) {
      return res.json(result);
    }

    const { booking, totalPaid, isGroupBooking, groupTotalPrice, groupDepositAmount, paymentBookingId }: any = result;
    
    let amountToPay = 0;
    let description = "";

    if (!paymentType || paymentType === "DEPOSIT") {
      if (totalPaid > 0) {
        return res.status(400).json({ message: "Đặt cọc đã được thanh toán" });
      }
      amountToPay = isGroupBooking ? groupDepositAmount : booking.deposit_amount;
      description = "Coc dat san";
    } else if (paymentType === "REMAINING") {
      if (totalPaid === 0 ) {
        return res.status(400).json({ message: "Cần thanh toán đặt cọc trước khi thanh toán phần còn lại" });
      }
      
      const bookingPaidShare = isGroupBooking 
        ? Math.round((totalPaid * booking.total_price) / groupTotalPrice)
        : totalPaid;
      
      if (bookingPaidShare >= booking.total_price) {
        return res.status(400).json({ message: "Booking này đã được thanh toán đầy đủ" });
      }
      
      amountToPay = booking.total_price - bookingPaidShare;
      description = "Thanh toan con lai";
    }

    const paymentSaveId = (paymentType === "REMAINING") ? bookingId : paymentBookingId;

    const paymentLink = await createPaymentLink({
      amount: amountToPay,
      description,
      bookingId: bookingId,
      buyerName: booking.user ? booking.user.full_name : "Khách hàng",
      buyerPhone: booking.user ? booking.user.phone : "0000000000",
    });

    const payment = await prisma.payments.create({
      data: {
        booking_id: paymentSaveId,
        payment_method: "PAYOS" as any,
        status: "PENDING",
        order_code: paymentLink.orderCode,
        payment_url: paymentLink.checkoutUrl,
        qr_code_url: paymentLink.qrCode,
        payment_link_id: paymentLink.paymentLinkId,
        payment_deadline: new Date(Date.now() +  3 * 60 * 1000),
      }
    });
    
    const bookingPaidShare = isGroupBooking 
      ? Math.round((totalPaid * booking.total_price) / groupTotalPrice)
      : totalPaid;
    
    res.json({
      success: true,
      paymentId: payment.paymentID,
      orderCode: paymentLink.orderCode,
      checkoutUrl: paymentLink.checkoutUrl,
      qrCode: paymentLink.qrCode,
      deadline: payment.payment_deadline,
      amount: amountToPay,
      paymentType: paymentType || "DEPOSIT",
      totalPaid: bookingPaidShare,
      totalPrice: booking.total_price,
      depositAmount: booking.deposit_amount,
      remainingAmount: booking.total_price - bookingPaidShare - amountToPay,
    });
  } catch (error: any) {
    console.error("Lỗi khi tạo liên kết thanh toán PayOS:", error);
    console.error("Chi tiết lỗi:", error.message);
    console.error("Stack trace:", error.stack);
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

    if (payment.status === "EXPIRED" || payment.status === "CANCELLED") {
      console.log(`Từ chối webhook: Payment ${payment.paymentID} đã ${payment.status}`);
      return res.status(400).json({ 
        success: false,
        message: "Payment đã hết hạn hoặc bị hủy" 
      });
    }

    if (payment.booking.status === "CANCELLED") {
      console.log(`Từ chối webhook: Booking ${payment.booking_id} đã bị hủy`);
      return res.status(400).json({ 
        success: false,
        message: "Booking đã bị hủy" 
      });
    }

    const now = new Date();
    if (payment.payment_deadline && new Date(payment.payment_deadline) < now) {
      console.log(`Từ chối webhook: Payment ${payment.paymentID} đã quá hạn`);
      
      await prisma.payments.update({
        where: { paymentID: payment.paymentID },
        data: { status: "EXPIRED" }
      });
      
      return res.status(400).json({ 
        success: false,
        message: "Payment đã quá hạn thanh toán" 
      });
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
      const booking = await prisma.bookings.findUnique({
        where: { bookingID: payment.booking_id }
      });
      
      if (booking) {
        await prisma.bookings.update({
          where: { bookingID: payment.booking_id },
          data: { status: "CONFIRMED" },
        });
      } else {
        const childBookings = await prisma.bookings.findMany({
          where: { parent_booking_id: payment.booking_id }
        });
        
        if (childBookings.length > 0) {
          await prisma.bookings.updateMany({
            where: { parent_booking_id: payment.booking_id },
            data: { status: "CONFIRMED" }
          });
        }
      }
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
    });
    
    if (!payment) {
      return res.status(404).json({ message: "Thanh toán không tồn tại" });
    }

    let isParentBooking = false;
    let childBookings: any[] = [];
    let booking = null;
    
    booking = await prisma.bookings.findUnique({
      where: { bookingID: payment.booking_id },
      include: { court: true }
    });
    
    if (!booking) {
      childBookings = await prisma.bookings.findMany({
        where: { parent_booking_id: payment.booking_id },
        include: { court: true }
      });
      
      if (childBookings.length > 0) {
        isParentBooking = true;
      }
    }

    if (payment.status === "PENDING" && payment.order_code) {
      try {
        const paymentInfo = await getPaymentInfo(payment.order_code);
        
        if (paymentInfo.status === "PAID") {
          const now = new Date();
          
          if (payment.payment_deadline && new Date(payment.payment_deadline) < now) {
            await prisma.payments.update({
              where: { paymentID: id },
              data: { status: "EXPIRED" }
            });
            return res.status(400).json({ 
              success: false,
              message: "Payment đã quá hạn thanh toán",
              status: "EXPIRED"
            });
          }

          if (isParentBooking) {
            const cancelledChild = childBookings.find(b => b.status === "CANCELLED");
            if (cancelledChild) {
              return res.status(400).json({ 
                success: false,
                message: "Có booking trong nhóm đã bị hủy",
                status: "CANCELLED"
              });
            }
          } else if (booking?.status === "CANCELLED") {
            return res.status(400).json({ 
              success: false,
              message: "Booking đã bị hủy",
              status: "CANCELLED"
            });
          }

          let allRelatedPayments: any[] = [];
          
          if (isParentBooking) {
            allRelatedPayments = await prisma.payments.findMany({
              where: { 
                booking_id: payment.booking_id,
                paymentID: { not: payment.paymentID } 
              }
            });
          } else if (booking) {
            if (booking.parent_booking_id) {
              const [ownPayments, parentPayments] = await Promise.all([
                prisma.payments.findMany({
                  where: { 
                    booking_id: payment.booking_id,
                    paymentID: { not: payment.paymentID } 
                  }
                }),
                prisma.payments.findMany({
                  where: { booking_id: booking.parent_booking_id }
                })
              ]);
              allRelatedPayments = [...ownPayments, ...parentPayments];
            } else {
              allRelatedPayments = await prisma.payments.findMany({
                where: { 
                  booking_id: payment.booking_id,
                  paymentID: { not: payment.paymentID } 
                }
              });
            }
          }

          let totalPrice = 0;
          if (isParentBooking) {
            totalPrice = childBookings.reduce((sum, b) => sum + b.total_price, 0);
          } else if (booking) {
            totalPrice = booking.total_price;
          }
          
          let previousPaid = 0;
          if (booking && booking.parent_booking_id) {
            const ownPayments = allRelatedPayments.filter(p => p.booking_id === payment.booking_id);
            const parentPayments = allRelatedPayments.filter(p => p.booking_id === booking.parent_booking_id);
            
            const ownPaid = ownPayments.reduce((sum: number, p: any) => {
              if (p.status === "PARTIALLY_PAID" || p.status === "PAID") {
                return sum + (p.paid_amount || 0);
              }
              return sum;
            }, 0);
            
            const parentPaid = parentPayments.reduce((sum: number, p: any) => {
              if (p.status === "PARTIALLY_PAID" || p.status === "PAID") {
                return sum + (p.paid_amount || 0);
              }
              return sum;
            }, 0);
            
            const groupBookings = await prisma.bookings.findMany({
              where: { parent_booking_id: booking.parent_booking_id }
            });
            const groupTotalPrice = groupBookings.reduce((sum, b) => sum + b.total_price, 0);
            
            const parentPaidShare = Math.round((parentPaid * booking.total_price) / groupTotalPrice);
            previousPaid = ownPaid + parentPaidShare;
          } else {
            previousPaid = allRelatedPayments.reduce((sum: number, p: any) => {
              if (p.status === "PARTIALLY_PAID" || p.status === "PAID") {
                return sum + (p.paid_amount || 0);
              }
              return sum;
            }, 0);
          }

          const currentTotalPaid = previousPaid + paymentInfo.amount;
          const newStatus = currentTotalPaid >= totalPrice ? "PAID" : "PARTIALLY_PAID";

          await prisma.payments.update({
            where: { paymentID: payment.paymentID },
            data: {
              status: newStatus,
              paid_amount: paymentInfo.amount,
              transaction_id: paymentInfo.transactions?.[0]?.reference,
            },
          });

          if (newStatus === "PAID" || newStatus === "PARTIALLY_PAID") {
            if (isParentBooking) {
              const updateResult = await prisma.bookings.updateMany({
                where: { parent_booking_id: payment.booking_id },
                data: { status: "CONFIRMED" }
              });
            } else {
              const updatedBooking = await prisma.bookings.update({
                where: { bookingID: payment.booking_id },
                data: { status: "CONFIRMED" },
              });
            }
          } else {
          }
        }
      } catch (error: any) {
        console.error(`[POLLING] Lỗi khi lấy thông tin từ PayOS:`, {
          message: error.message,
          orderCode: payment.order_code,
          paymentID: payment.paymentID
        });
        console.error(`[POLLING] Stack trace:`, error.stack);
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

    let bookingInfo;
    if (booking) {
      bookingInfo = {
        bookingID: booking.bookingID,
        courtName: booking.court?.name || "Chưa phân bổ",
        totalPrice: booking.total_price,
        depositAmount: booking.deposit_amount,
        status: booking.status,
      };
    } else {
      const childBookings = await prisma.bookings.findMany({
        where: { parent_booking_id: payment.booking_id },
        include: { court: true }
      });
      
      if (childBookings.length > 0) {
        const totalPrice = childBookings.reduce((sum, b) => sum + b.total_price, 0);
        const depositAmount = childBookings.reduce((sum, b) => sum + b.deposit_amount, 0);
        const firstCourt = childBookings.find(b => b.court)?.court;
        
        bookingInfo = {
          bookingID: payment.booking_id,
          courtName: firstCourt?.name || "Nhiều sân",
          totalPrice,
          depositAmount,
          status: childBookings[0].status,
        };
      } else {
        bookingInfo = {
          bookingID: payment.booking_id,
          courtName: "Không xác định",
          totalPrice: 0,
          depositAmount: 0,
          status: "PENDING",
        };
      }
    }

    const remainingAmount = bookingInfo.totalPrice - totalPaid;

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
      booking: bookingInfo
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

    const isGroupBooking = !!booking.parent_booking_id;
    
    let payments: any[] = [];
    if (isGroupBooking) {
      const [ownPayments, parentPayments] = await Promise.all([
        prisma.payments.findMany({
          where: { booking_id: bookingId },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.payments.findMany({
          where: { booking_id: booking.parent_booking_id! },
          orderBy: { createdAt: 'desc' }
        })
      ]);
      payments = [...ownPayments, ...parentPayments];
    } else {
      payments = await prisma.payments.findMany({
        where: { booking_id: bookingId },
        orderBy: { createdAt: 'desc' }
      });
    }

    let groupTotalPrice = booking.total_price;
    let groupDepositAmount = booking.deposit_amount;
    let groupTotalPaid = 0;

    if (isGroupBooking) {
      const groupBookings = await prisma.bookings.findMany({
        where: { parent_booking_id: booking.parent_booking_id }
      });
      
      groupTotalPrice = groupBookings.reduce((sum, b) => sum + b.total_price, 0);
      groupDepositAmount = groupBookings.reduce((sum, b) => sum + b.deposit_amount, 0);
    }

    if (!payments || payments.length === 0) {
      return res.json({
        hasPendingPayment: false,
        hasPartiallyPaid: false,
        totalPaid: 0,
        totalPrice: booking.total_price,
        depositAmount: booking.deposit_amount,
        remainingAmount: booking.total_price,
        payments: [],
        isGroupBooking,
        groupTotalPrice,
        groupDepositAmount,
        groupTotalPaid: 0
      });
    }

    const pendingPayment = payments.find((p: any) => p.status === "PENDING");
    const partiallyPaid = payments.some((p: any) => p.status === "PARTIALLY_PAID");
    
    let bookingPaidShare = 0;
    
    if (isGroupBooking) {
      const ownPayments = payments.filter(p => p.booking_id === bookingId);
      const parentPayments = payments.filter(p => p.booking_id === booking.parent_booking_id);
      
      const ownPaid = ownPayments.reduce((sum: number, p: any) => {
        if (p.status === "PARTIALLY_PAID" || p.status === "PAID") {
          return sum + (p.paid_amount || 0);
        }
        return sum;
      }, 0);
      
      const parentPaid = parentPayments.reduce((sum: number, p: any) => {
        if (p.status === "PARTIALLY_PAID" || p.status === "PAID") {
          return sum + (p.paid_amount || 0);
        }
        return sum;
      }, 0);
      
      const parentPaidShare = Math.round((parentPaid * booking.total_price) / groupTotalPrice);
      bookingPaidShare = ownPaid + parentPaidShare;
      
      groupTotalPaid = payments.reduce((sum: number, p: any) => {
        if (p.status === "PARTIALLY_PAID" || p.status === "PAID") {
          return sum + (p.paid_amount || 0);
        }
        return sum;
      }, 0);
    } else {
      bookingPaidShare = payments.reduce((sum: number, p: any) => {
        if (p.status === "PARTIALLY_PAID" || p.status === "PAID") {
          return sum + (p.paid_amount || 0);
        }
        return sum;
      }, 0);
      groupTotalPaid = bookingPaidShare;
    }

    const remainingAmount = booking.total_price - bookingPaidShare;

    res.json({
      hasPendingPayment: !!pendingPayment,
      hasPartiallyPaid: partiallyPaid,
      pendingPayment: pendingPayment || null,
      totalPaid: bookingPaidShare,
      totalPrice: booking.total_price,
      depositAmount: booking.deposit_amount,
      remainingAmount,
      payments,
      isGroupBooking,
      groupTotalPrice,
      groupDepositAmount,
      groupTotalPaid
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