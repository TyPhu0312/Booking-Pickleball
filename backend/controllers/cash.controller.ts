import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createCashPayment = async (req: Request, res: Response) => {
    try {
        const { bookingId, amount, paidAmount } = req.body;

        if (!bookingId || !amount) {
            return res.status(400).json({ 
                error: "Thiếu thông tin bắt buộc",
                message: "bookingId và amount là bắt buộc" 
            });
        }

        const booking = await prisma.bookings.findUnique({
            where: { bookingID: bookingId }
        });

        if (!booking) {
            return res.status(404).json({ error: "Không tìm thấy booking" });
        }

        const payment = await prisma.payments.create({
            data: {
                booking_id: bookingId,
                payment_method: "CASH",
                status: paidAmount >= booking.total_price ? "PAID" : (paidAmount > 0 ? "PARTIALLY_PAID" : "PENDING"),
                paid_amount: paidAmount || 0,
            },
        });

        if (paidAmount >= booking.total_price || paidAmount >= booking.deposit_amount) {
            await prisma.bookings.update({
                where: { bookingID: bookingId },
                data: { status: "CONFIRMED" }
            });
        }

        res.status(201).json({
            message: "Tạo thanh toán tiền mặt thành công",
            payment
        });
    } catch (error) {
        console.error("Error creating cash payment:", error);
        res.status(500).json({ 
            error: "Lỗi khi tạo thanh toán tiền mặt",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export const updateCashPayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { paidAmount, status } = req.body;

        const payment = await prisma.payments.findUnique({
            where: { paymentID: id },
            include: { booking: true }
        });

        if (!payment) {
            return res.status(404).json({ error: "Không tìm thấy thanh toán" });
        }

        if (payment.payment_method !== "CASH") {
            return res.status(400).json({ 
                error: "Thanh toán này không phải là thanh toán tiền mặt" 
            });
        }

        const newPaidAmount = paidAmount !== undefined ? paidAmount : payment.paid_amount;
        const newStatus = status || (newPaidAmount >= payment.booking.total_price ? "PAID" : (newPaidAmount > 0 ? "PARTIALLY_PAID" : "PENDING"));

        const updatedPayment = await prisma.payments.update({
            where: { paymentID: id },
            data: {
                paid_amount: newPaidAmount,
                status: newStatus,
                updatedAt: new Date()
            }
        });

        if (newPaidAmount >= payment.booking.total_price || newPaidAmount >= payment.booking.deposit_amount) {
            await prisma.bookings.update({
                where: { bookingID: payment.booking_id },
                data: { status: "CONFIRMED" }
            });
        }

        res.status(200).json({
            message: "Cập nhật thanh toán thành công",
            payment: updatedPayment
        });
    } catch (error) {
        console.error("Error updating cash payment:", error);
        res.status(500).json({ 
            error: "Lỗi khi cập nhật thanh toán",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export const confirmCashPayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const payment = await prisma.payments.findUnique({
            where: { paymentID: id },
            include: { booking: true }
        });

        if (!payment) {
            return res.status(404).json({ error: "Không tìm thấy thanh toán" });
        }

        if (payment.payment_method !== "CASH") {
            return res.status(400).json({ 
                error: "Thanh toán này không phải là thanh toán tiền mặt" 
            });
        }

        const updatedPayment = await prisma.payments.update({
            where: { paymentID: id },
            data: {
                status: "PAID",
                updatedAt: new Date()
            }
        });

        await prisma.bookings.update({
            where: { bookingID: payment.booking_id },
            data: { status: "CONFIRMED" }
        });

        res.status(200).json({
            message: "Xác nhận thanh toán tiền mặt thành công",
            payment: updatedPayment
        });
    } catch (error) {
        console.error("Error confirming cash payment:", error);
        res.status(500).json({ 
            error: "Lỗi khi xác nhận thanh toán",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};

export const getCashPaymentByBooking = async (req: Request, res: Response) => {
    try {
        const { bookingId } = req.params;

        const payments = await prisma.payments.findMany({
            where: {
                booking_id: bookingId,
                payment_method: "CASH"
            },
            include: {
                booking: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json(payments);
    } catch (error) {
        console.error("Error fetching cash payments:", error);
        res.status(500).json({ 
            error: "Lỗi khi lấy thông tin thanh toán",
            details: error instanceof Error ? error.message : "Unknown error"
        });
    }
};