import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

export const prisma = new PrismaClient();

export const getSlots = async (req: Request, res: Response) => {
    try {
        const slots = await prisma.slots.findMany();
        res.json(slots);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy danh sách khung giờ" });
    }
}

export const getSlotById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const slot = await prisma.slots.findUnique({ where: { slotID: id } });
        if (!slot) return res.status(404).json({ error: "Không tìm thấy khung giờ" });
        res.json(slot);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy thông tin khung giờ" });
    }
}

export const createSlot = async (req: Request, res: Response) => {
    try {
        const { slot_name, start_time, end_time, price } = req.body;

        if (!slot_name || !start_time || !end_time || !price) {
            return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin." });
        }

        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
            return res.status(400).json({ error: "Thời gian không hợp lệ (định dạng HH:mm)." });
        }
        const newSlot = await prisma.slots.create({
            data: { slot_name, start_time, end_time, price },
        });

        res.status(201).json(newSlot);
    } catch (error: any) {
        res.status(500).json({
            error: "Lỗi khi tạo khung giờ",
            message: error.message,
            meta: error.meta,
        });
    }
}
export const updateSlot = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const existingSlot = await prisma.slots.findUnique({
            where: { slotID: id },
        });

        if (!existingSlot) {
            return res.status(404).json({ error: "Không tìm thấy khung giờ" });
        }

        const updatedSlot = await prisma.slots.update({
            where: { slotID: id },
            data,
        });

        res.json(updatedSlot);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi cập nhật khung giờ" });
    }
}

export const deleteSlot = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const existingSlot = await prisma.slots.findUnique({
            where: { slotID: id },
        });

        if (!existingSlot) {
            return res.status(404).json({ error: "Không tìm thấy khung giờ" });
        }

        await prisma.slots.delete({
            where: { slotID: id },
        });

        res.json({ message: "Xóa khung giờ thành công" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi xóa khung giờ" });
    }
}

export const getSlotStatusByDate = async (req: Request, res: Response) => {
    try {
        // Lấy ngày từ query hoặc mặc định là hôm nay
        const { date } = req.query;
        const targetDate = date ? new Date(date as string) : new Date();
        const formattedDate = targetDate.toISOString().split("T")[0];

        // Tổng số sân
        const totalCourts = await prisma.courts.count();

        // Lấy toàn bộ slot
        const slots = await prisma.slots.findMany();

        // Lấy danh sách bookingSlots theo ngày
        const bookingSlots = await prisma.bookingSlot.findMany({
            where: {
                date: new Date(formattedDate + "T00:00:00.000Z"),
                booking: {
                    status: { notIn: ["CANCELLED"] } // chỉ tính booking hợp lệ
                }
            },
            include: {
                booking: true,
            },
        });

        // Gom nhóm slot
        const result = slots.map((slot) => {
            const slotBookings = bookingSlots.filter((b) => b.slot_id === slot.slotID);

            const bookedCourts = slotBookings.length;
            const availableCourts = Math.max(totalCourts - bookedCourts, 0);

            return {
                slot_id: slot.slotID,
                slot_name: slot.slot_name,
                start_time: slot.start_time,
                end_time: slot.end_time,
                price: slot.price,
                totalCourts,
                bookedCourts,
                availableCourts,
             
            };
        });

        return res.json({
            date: formattedDate,
            totalCourts,
            slots: result,
        });
    } catch (error) {
        console.error("Lỗi khi lấy slot:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};
