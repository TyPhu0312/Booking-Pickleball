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
        });

        res.json(bookings);
    } catch (error) {
        console.error("Lỗi khi lấy danh sách đặt sân:", error); // 👈 thêm dòng này
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
const dayMap: Record<number, string> = {
    1: "MONDAY",
    2: "TUESDAY",
    3: "WEDNESDAY",
    4: "THURSDAY",
    5: "FRIDAY",
    6: "SATURDAY",
    7: "SUNDAY",
};

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
        const { user_id, booking_date, status, total_price, deposit_amount, booking_type, discount, slots } = req.body;

        const newBooking = await prisma.bookings.create({
            data: { user_id, booking_date, status, total_price, deposit_amount, booking_type, discount },
        });
        const newBookingSlots = slots.map((slot: SlotInput) => ({
            booking_id: newBooking.bookingID,
            slot_id: slot.slot_id,
            date: new Date(slot.date),
            is_recurring: slot.is_recurring,
            recurring_day: slot.recurring_day ? dayMap[slot.recurring_day] : null,
            num_weeks: slot.num_weeks,

        }));
        await prisma.bookingSlots.createMany({
            data: newBookingSlots,
        });
        res.status(201).json(newBooking);
    } catch (error: any) {
        res.status(500).json({
            error: "Lỗi khi tạo đặt sân",
            message: error.message,
            meta: error.meta,
        });
    }
}
export const updateBooking = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { user_id, booking_date, status, total_price, deposit_amount, booking_type, discount, slots } = req.body;

        const updatedBooking = await prisma.bookings.update({
            where: { bookingID: id },
            data: { user_id, booking_date, status, total_price, deposit_amount, booking_type, discount },
        });

        // không thể update 1 mảng nên cần xoá hết những bookingSlots cũ đi rồi tạo mới
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
        console.log("Cập nhật booking với dữ liệu:", { status, courtID, discount });
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
        else if (courtID) {
            const court = await prisma.courts.findUnique({
                where: { courtID: courtID },
            });

            if (!court) {
                return res.status(404).json({ message: "Không tìm thấy sân" });
            }

            await prisma.courts.update({
                where: { courtID: courtID },
                data: { status: "OCCUPIED" },
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

// không thể xoá booking được do chỉ có thể để trạng thái đã huỷ, không cho xoá trực tiếp
export const deleteBooking = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.bookings.delete({ where: { bookingID: id } });
        res.json({ message: "Đặt sân đã được xóa" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi xóa đặt sân" });
    }
}

