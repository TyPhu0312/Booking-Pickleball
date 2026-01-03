import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const startAutoCancelScheduler = () => {
  cron.schedule("*/1 * * * *", async () => {
    try {
      console.log(" Đang kiểm tra các thanh toán hết hạn...");

      const now = new Date();

      const expiredPayments = await prisma.payments.findMany({
        where: {
          status: "PENDING",
          payment_deadline: {
            lte: now,
          },
        },
      });

      for (const payment of expiredPayments) {
        const booking = await prisma.bookings.findUnique({
          where: { bookingID: payment.booking_id }
        });

        let bookingIdsToCheck: string[] = [];

        if (booking) {
          bookingIdsToCheck.push(booking.bookingID);
          if (booking.parent_booking_id) {
            bookingIdsToCheck.push(booking.parent_booking_id);
          } else {
            const childBookings = await prisma.bookings.findMany({ where: { parent_booking_id: booking.bookingID } });
            if (childBookings.length > 0) {
              bookingIdsToCheck.push(...childBookings.map(b => b.bookingID));
            }
          }
        } else {
          bookingIdsToCheck.push(payment.booking_id);
          const childBookings = await prisma.bookings.findMany({ where: { parent_booking_id: payment.booking_id } });
          if (childBookings.length > 0) {
            bookingIdsToCheck.push(...childBookings.map(b => b.bookingID));
          }
        }

        const existingPaid = await prisma.payments.findFirst({
          where: {
            booking_id: { in: bookingIdsToCheck },
            status: { in: ["PARTIALLY_PAID"] }
          }
        });

        const hasPaidOrPartiallyPaid = !!existingPaid;

        if (hasPaidOrPartiallyPaid) {
          if (payment.order_code) {
            try {
              const PayOS = require("@payos/node");
              const payOS = new PayOS(
                process.env.PAYOS_CLIENT_ID!,
                process.env.PAYOS_API_KEY!,
                process.env.PAYOS_CHECKSUM_KEY!
              );
              await payOS.cancelPaymentLink(payment.order_code);
              console.log(`Đã hủy payment link ${payment.order_code} trên PayOS`);
            } catch (error) {
              console.warn(`Không thể hủy payment link ${payment.order_code}:`, error);
            }
          }

          await prisma.payments.update({ where: { paymentID: payment.paymentID }, data: { status: "EXPIRED" } });
          console.log(`Payment ${payment.paymentID} expired but booking retained because paid amount exists in context.`);
          continue;
        }

        if (payment.order_code) {
          try {
            const PayOS = require("@payos/node");
            const payOS = new PayOS(
              process.env.PAYOS_CLIENT_ID!,
              process.env.PAYOS_API_KEY!,
              process.env.PAYOS_CHECKSUM_KEY!
            );
            
            await payOS.cancelPaymentLink(payment.order_code);
            console.log(`Đã hủy payment link ${payment.order_code} trên PayOS`);
          } catch (error) {
            console.warn(`Không thể hủy payment link ${payment.order_code}:`, error);
          }
        }

        await prisma.payments.update({
          where: { paymentID: payment.paymentID },
          data: { status: "EXPIRED" },
        });

        if (booking) {
          await prisma.bookings.update({
            where: { bookingID: booking.bookingID },
            data: { status: "CANCELLED" },
          });
        } else {
          await prisma.bookings.updateMany({
            where: { parent_booking_id: payment.booking_id },
            data: { status: "CANCELLED" }
          });
        }
      }

      if (expiredPayments.length > 0) {
        console.log(`Đã xử lý ${expiredPayments.length} payment hết hạn (đã đặt trạng thái EXPIRED). Không tự động hủy booking; cho phép tạo lại QR thanh toán.`);
      }
    } catch (error) {
      console.error("Lỗi trong scheduler tự động hủy:", error);
    }
  });

  console.log("Scheduler tự động hủy đã khởi động (chạy mỗi 1 phút)");
};


export const startAutoUpdateCourtStatus = () => {
    cron.schedule("*/5 * * * *", async () => {
        try {
            console.log("Đang kiểm tra trạng thái sân...");

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfToday = new Date(today);
            endOfToday.setHours(23, 59, 59, 999);

            const activeBookings = await prisma.bookings.findMany({
                where: {
                    status: { in: ['CHECKED_IN'] },
                    court_id: { not: null },
                },
                include: {
                    court: true,
                    bookingSlots: {
                        where: {
                            date: {
                                gte: today,
                                lte: endOfToday
                            }
                        },
                        include: { slot: true }
                    }
                }
            });

            const processedCourts = new Map<string, string>();

            for (const booking of activeBookings) {
                if (!booking.court_id || booking.bookingSlots.length === 0) continue;

                const lastSlot = booking.bookingSlots
                    .sort((a, b) => {
                        const timeA = a.slot.end_time.split(':').map(Number);
                        const timeB = b.slot.end_time.split(':').map(Number);
                        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
                    })
                    .pop();

                if (lastSlot) {
                    const [endHour, endMinute] = lastSlot.slot.end_time.split(':').map(Number);
                    const endTime = new Date(today);
                    endTime.setHours(endHour, endMinute, 0, 0);

                    const fifteenMinutesBefore = new Date(endTime.getTime() - 15 * 60 * 1000);

                    let newStatus: string | null = null;

                    if (now >= endTime) {
                        newStatus = 'AVAILABLE';
                        if (booking.status !== 'COMPLETED') {
                            await prisma.bookings.update({
                                where: { bookingID: booking.bookingID },
                                data: { status: 'COMPLETED' }
                            });
                        }
                        console.log(`Booking ${booking.bookingID} đã hoàn thành.`);
                    } else if (now >= fifteenMinutesBefore && now < endTime) {
                        newStatus = 'ALMOST_DONE';
                    }

                    if (newStatus) {
                        if (!processedCourts.has(booking.court_id)) {
                            processedCourts.set(booking.court_id, newStatus);
                        } else if (newStatus === 'ALMOST_DONE') {
                            processedCourts.set(booking.court_id, 'ALMOST_DONE');
                        }
                    }
                }
            }

            for (const [courtId, status] of processedCourts) {
                await prisma.courts.update({
                    where: { courtID: courtId },
                    data: { status: status as any }
                });
                console.log(`Sân ${courtId} → ${status}`);
            }

            console.log(`Đã kiểm tra ${processedCourts.size} sân`);

        } catch (error) {
            console.error("Lỗi trong scheduler cập nhật trạng thái sân:", error);
        }
    });

    console.log("Scheduler tự động cập nhật trạng thái sân đã khởi động (chạy mỗi 5 phút)");
};