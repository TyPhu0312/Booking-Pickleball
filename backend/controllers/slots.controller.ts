import { Prisma, PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

export const prisma = new PrismaClient();

export const getSlots = async (req: Request, res: Response) => {
    try {
        const slots = await prisma.slots.findMany({
            orderBy: { start_time: 'asc' },
            include: {
                bookingSlots: true,
            },
        });
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
        const { slot_name, start_time, end_time, price } = req.body;


        const existingSlot = await prisma.slots.findUnique({
            where: { slotID: id },
        });

        if (!existingSlot) {
            return res.status(404).json({ error: "Không tìm thấy khung giờ" });
        }

        const updatedSlot = await prisma.slots.update({
            where: { slotID: id },
            data: { slot_name, start_time, end_time, price },
        });

        res.status(201).json(updatedSlot);
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

interface Slots {
    slotID: string;
    slot_name: string;
    start_time: string;
    end_time: string;
    price: number;
}

export const getSlotStatusByOneDate = async (req: Request, res: Response) => {
    try {
        const { date } = req.params;

        if (!date) {
            return res.status(400).json({ message: "Thiếu tham số date" });
        }

        const formattedDate = date as string;

        const courts = await prisma.courts.groupBy({
            by: ["type"],
            _count: {
                courtID: true,
            },
        });

        const courtCountMap: Record<string, number> = {};
        courts.forEach((c) => {
            courtCountMap[c.type] = c._count.courtID;
        });

        const slots = await prisma.slots.findMany();

        const startOfDay = new Date(`${formattedDate}T00:00:00+07:00`);
        const endOfDay = new Date(`${formattedDate}T23:59:59.999+07:00`);

        const bookingSlots = await prisma.bookingSlots.findMany({
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
                booking: {
                    status: { notIn: ["CANCELLED"] }
                }
            },
            include: {
                booking: true,
            },
        });

        const result = slots.map((slot: Slots) => {
            const slotBookings = bookingSlots.filter((b) => b.slot_id === slot.slotID);

            const bookedCourts = slotBookings.length;

            const availableCourtsByType: Record<string, number> = {};
            Object.keys(courtCountMap).forEach((type) => {
                availableCourtsByType[type] = Math.max(courtCountMap[type] - bookedCourts, 0);
            });

            return {
                slot_id: slot.slotID,
                slot_name: slot.slot_name,
                start_time: slot.start_time,
                end_time: slot.end_time,
                price: slot.price,
                totalCourts: courtCountMap,
                bookedCourts,
                availableCourts: availableCourtsByType,

            };
        });

        return res.json({
            date: formattedDate,
            slots: result,
        });
    } catch (error) {
        console.error("Lỗi khi lấy slot:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

export const getSlotStatusByDate = async (req: Request, res: Response) => {
    try {
        const { start_day, end_day } = req.params;

        if (!start_day || !end_day) {
            return res.status(400).json({ message: "Thiếu tham số date" });
        }

        const startDate = new Date(start_day);
        const endDate = new Date(end_day);

        if (startDate > endDate) {
            return res.status(400).json({ message: "Ngày bắt đầu phải nhỏ hơn ngày kết thúc" });
          }

        const courts = await prisma.courts.groupBy({
            by: ["type"],
            _count: {
                courtID: true,
            },
        });

        const courtCountMap: Record<string, number> = {};
        courts.forEach((c) => {
            courtCountMap[c.type] = c._count.courtID;
        });

        const slots = await prisma.slots.findMany();

        const result: Record<string, any[]> = {};

        for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
            const formattedDate = d.toISOString().split("T")[0];

            const startOfDay = new Date(`${formattedDate}T00:00:00+07:00`);
            const endOfDay = new Date(`${formattedDate}T23:59:59.999+07:00`);

            const bookingSlots = await prisma.bookingSlots.findMany({
                where: {
                    date: {
                        gte: startOfDay,
                        lte: endOfDay,
                    },
                    booking: {
                        status: { notIn: ["CANCELLED"] }
                    }
                },
                include: {
                    booking: true,
                },
            });

            const dailySlots = slots.map((slot: Slots) => {
                const slotBookings = bookingSlots.filter((b) => b.slot_id === slot.slotID);

                const bookedCourts = slotBookings.length;

                const availableCourtsByType: Record<string, number> = {};
                Object.keys(courtCountMap).forEach((type) => {
                    availableCourtsByType[type] = Math.max(courtCountMap[type] - bookedCourts, 0);
                });

                return {
                    slot_id: slot.slotID,
                    slot_name: slot.slot_name,
                    start_time: slot.start_time,
                    end_time: slot.end_time,
                    price: slot.price,
                    totalCourts: courtCountMap,
                    bookedCourts,
                    availableCourts: availableCourtsByType,

                };
            });

            result[formattedDate] = dailySlots;
        }
        return res.json(result);
    } catch (error) {
        console.error("Lỗi khi lấy slot:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};
