import cron from "node-cron";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const startAutoCancelScheduler = () => {
  cron.schedule("*/10 * * * *", async () => {
    try {
      console.log("🕐 Đang kiểm tra các thanh toán hết hạn...");

      const now = new Date();

      const expiredPayments = await prisma.payments.findMany({
        where: {
          status: "PENDING",
          payment_deadline: {
            lte: now,
          },
        },
        include: {
          booking: true,
        },
      });

      for (const payment of expiredPayments) {
        console.log(`⏰ Hủy booking hết hạn: ${payment.booking.bookingID}`);

        await prisma.payments.update({
          where: { paymentID: payment.paymentID },
          data: { status: "EXPIRED" },
        });

        await prisma.bookings.update({
          where: { bookingID: payment.booking.bookingID },
          data: { status: "CANCELLED" },
        });

        console.log(`✅ Đã hủy booking ${payment.booking.bookingID} do hết thời gian thanh toán`);
      }

      if (expiredPayments.length > 0) {
        console.log(`🎯 Đã hủy ${expiredPayments.length} booking hết hạn`);
      }
    } catch (error) {
      console.error("❌ Lỗi trong scheduler tự động hủy:", error);
    }
  });

  console.log("✅ Scheduler tự động hủy đã khởi động (chạy mỗi 10 phút)");
};


export const startAutoUpdateCourtStatus = () => {
    cron.schedule("*/15 * * * *", async () => {
        try {
            console.log("🕐 Đang kiểm tra trạng thái sân...");

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endOfToday = new Date(today);
            endOfToday.setHours(23, 59, 59, 999);

            const activeBookings = await prisma.bookings.findMany({
                where: {
                    status: { in: ['CONFIRMED', 'CHECKED_IN'] },
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
                console.log(`✅ Sân ${courtId} → ${status}`);
            }

            console.log(`✅ Đã kiểm tra ${processedCourts.size} sân`);

        } catch (error) {
            console.error("❌ Lỗi trong scheduler cập nhật trạng thái sân:", error);
        }
    });

    console.log("✅ Scheduler tự động cập nhật trạng thái sân đã khởi động (chạy mỗi 15 phút)");
};