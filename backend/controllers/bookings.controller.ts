import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const getBookings = async (req: Request, res: Response) => {
    try {
        const bookings = await prisma.bookings.findMany({
            include: {
                user: true,
                court: true,
                bookingSlots: {
                    include: {
                        slot: true,
                    },
                },
                payments: true,
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(bookings);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách đặt sân:", error);
        res.status(500).json({ error: "Lỗi khi lấy danh sách đặt sân" });
    }
};


export const getBookingById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const booking = await prisma.bookings.findUnique({
            include: {
                user: true,
                court: true,
                bookingSlots: {
                    include: {
                        slot: true,
                    },
                },
                payments: true,
            },
            where: { bookingID: id }
        });

        if (!booking) return res.status(404).json({ error: "Không tìm thấy đặt sân" });
        res.json(booking);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy thông tin đặt sân" });
    }
}
interface SlotInput {
    booking_id: string
    slot_id: string;
    date: string;
    is_recurring: boolean;
    recurring_day: number | null;
    num_weeks: number | null;
}
export const createBooking = async (req: Request, res: Response) => {
    try {
        const { user_id, phone_user, booking_date, status, total_price, deposit_amount, booking_type, discount, court_type, court_id, note, slots } = req.body;

        const newBooking = await prisma.bookings.create({
            data: { 
                user_id, 
                phone_user, 
                booking_date, 
                status, 
                total_price, 
                deposit_amount, 
                booking_type, 
                discount, 
                note, 
                court_id: court_id || null,
                court_type: court_type || null,
            },
        });
        const newBookingSlots = slots.map((slot: SlotInput) => ({
            booking_id: newBooking.bookingID,
            slot_id: slot.slot_id,
            date: new Date(slot.date),
            is_recurring: slot.is_recurring,
            recurring_day: slot.recurring_day,
            num_weeks: slot.num_weeks,

        }));
        await prisma.bookingSlots.createMany({
            data: newBookingSlots,
        });
        res.status(201).json(newBooking);
    } catch (error: unknown) {
        const err = error as { message?: string; meta?: unknown };
        res.status(500).json({
            error: "Lỗi khi tạo đặt sân",
            message: err.message,
            meta: err.meta,
        });
    }
}
export const updateBooking = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { user_id, booking_date, status, total_price, deposit_amount, booking_type, discount, court_id, note, slots } = req.body;

        const updatedBooking = await prisma.bookings.update({
            where: { bookingID: id },
            data: { user_id, booking_date, status, total_price, deposit_amount, booking_type, court_id, note, discount },
        });

        await prisma.bookingSlots.deleteMany({
            where: { booking_id: id },
        });
        if (slots && Array.isArray(slots)) {
            const newBookingSlots = slots.map((slot: SlotInput) => ({
                booking_id: updatedBooking.bookingID,
                slot_id: slot.slot_id,
                date: new Date(slot.date),
                is_recurring: slot.is_recurring,
                recurring_day: slot.recurring_day ?? null,
                num_weeks: slot.num_weeks,

            }));
            await prisma.bookingSlots.createMany({
                data: newBookingSlots,
            });
        }

        res.json(updatedBooking);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi cập nhật đặt sân" });
    }
}
export const updateBookingStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, courtID, discount } = req.body;
        const booking = await prisma.bookings.findUnique({
            where: { bookingID: id },
        });

        if (!booking) {
            return res.status(404).json({ message: "Không tìm thấy booking" });
        }
        if (status === "CANCELLED" && booking.court_id) {
            await prisma.courts.update({
                where: { courtID: booking.court_id },
                data: { status: "AVAILABLE" },
            });
        }
        else if (status === "COMPLETED" && booking.court_id) {
            await prisma.courts.update({
                where: { courtID: booking.court_id },
                data: { status: "AVAILABLE" },
            });
        }
        else if (status === "CHECKED_IN") {
            await prisma.courts.update({
                where: { courtID: courtID },
                data: { status: "OCCUPIED" },
            });
        }
        else if (courtID) {
            const court = await prisma.courts.findUnique({
                where: { courtID: courtID , status: "AVAILABLE"},
            });

            if (!court) {
                return res.status(404).json({ message: "Không tìm thấy sân" });
            }

            await prisma.bookings.update({
                where: { bookingID: id },
                data: { court_id: courtID },
            });
        }

        const updatedBooking = await prisma.bookings.update({
            where: { bookingID: id },
            data: {
                ...(status && { status }),
                ...(discount !== undefined && { discount: Number(discount) }),
                ...(courtID !== undefined && { court_id: courtID }),
            },
            include: {
                user: true,
                court: true,
                bookingSlots: {
                    include: {
                        slot: true,
                    },
                },
                payments: true,
            },
        });

        res.json(updatedBooking,);
    }
    catch (error) {
        console.error("Lỗi update booking:", error);
        res.status(500).json({ error: "Lỗi khi cập nhật trạng thái đặt sân" });
    }
}

export const getBookingByUserIdOrPhone = async (req: Request, res: Response) => {
    try {
        const { user_id } = req.params;

        if (!user_id) {
            return res.status(400).json({ error: "Vui lòng cung cấp user ID hoặc số điện thoại" });
        }

        const includeConfig = {
            user: true,
            court: true,
            bookingSlots: {
                include: {
                    slot: true,
                },
            },
            payments: true,
        };

        let bookings;

        bookings = await prisma.bookings.findMany({
            where: {
                user_id: user_id,
            },
            include: includeConfig,
            orderBy: { createdAt: "desc" },
        });

        if (!bookings || bookings.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy đặt sân" });
        }

        return res.status(200).json(bookings);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Lỗi khi lấy thông tin đặt sân" });
    }
};


export const deleteBooking = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.bookings.update({
            where: { bookingID: id },
            data: { status: "CANCELLED" }
        });
        res.json({ message: "Đặt sân đã được huỷ" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi huỷ đặt sân" });
    }
}

