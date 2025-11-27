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