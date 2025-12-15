import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import { createPaymentLink } from "../services/payos.service";

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
        const { user_id, phone_user, booking_date, status, booking_type, discount, court_type, court_id, note, slots } = req.body;

        const VAT = 0.08;
        const depositRate = booking_type === 'TOURNAMENT' ? 0.5 : booking_type === 'WEEKLY' ? 0.5 : 0.2;
        const discountPercent = discount || (booking_type === 'TOURNAMENT' ? 10 : booking_type === 'WEEKLY' ? 5 : 0);

        const isWeeklyBooking = booking_type === 'WEEKLY';
        const uniqueDates = new Set(slots.map((slot: SlotInput) => slot.date));
        const hasMultipleDates = uniqueDates.size > 1;

        if (!isWeeklyBooking && !hasMultipleDates) {
            const slotDetails = await prisma.slots.findMany({
                where: {
                    slotID: { in: slots.map((s: SlotInput) => s.slot_id) }
                }
            });

            let courtMultiplier = 1;
            if (court_type) {
                const courtTypeData = await prisma.courts.findFirst({
                    where: { type: court_type },
                    select: { multiplier: true }
                });
                courtMultiplier = courtTypeData?.multiplier || 1;
            }

            const basePrice = slotDetails.reduce((sum, slot) => sum + (slot.price * courtMultiplier), 0);
            const discountAmount = basePrice * (discountPercent / 100);
            const priceAfterDiscount = basePrice - discountAmount;
            const vatAmount = priceAfterDiscount * VAT;
            const totalPrice = Math.round(priceAfterDiscount + vatAmount);
            const depositAmount = Math.round(totalPrice * depositRate);

            const newBooking = await prisma.bookings.create({
                data: { 
                    user_id, 
                    phone_user, 
                    booking_date, 
                    status, 
                    total_price: totalPrice, 
                    deposit_amount: depositAmount, 
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
            
            try {
                const paymentLink = await createPaymentLink({
                    amount: depositAmount,
                    description: "Coc dat san",
                    bookingId: newBooking.bookingID,
                    buyerName: newBooking.user_id ? "Khách hàng" : "Khách hàng",
                    buyerPhone: phone_user || "0000000000",
                });
                
                const payment = await prisma.payments.create({
                    data: {
                        booking_id: newBooking.bookingID,
                        payment_method: "PAYOS" as any,
                        status: "PENDING",
                        order_code: paymentLink.orderCode,
                        payment_url: paymentLink.checkoutUrl,
                        qr_code_url: paymentLink.qrCode,
                        payment_link_id: paymentLink.paymentLinkId,
                        payment_deadline: new Date(Date.now() + 3 * 60 * 1000),
                    }
                });
                
                return res.status(201).json({
                    ...newBooking,
                    payment: {
                        paymentId: payment.paymentID,
                        orderCode: paymentLink.orderCode,
                        checkoutUrl: paymentLink.checkoutUrl,
                        qrCode: paymentLink.qrCode,
                        deadline: payment.payment_deadline,
                    }
                });
            } catch (paymentError) {
                console.error("⚠️ Lỗi khi tạo payment link:", paymentError);
                return res.status(201).json(newBooking);
            }
        }

        const slotsByDate = slots.reduce((acc: any, slot: SlotInput) => {
            const dateKey = slot.date;
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(slot);
            return acc;
        }, {});

        const dateKeys = Object.keys(slotsByDate);
        
        const parentBookingId = dateKeys.length > 1 ? `parent-${Date.now()}` : null;
        const createdBookings = [];

        const allSlotIds = slots.map((s: SlotInput) => s.slot_id);
        const slotDetails = await prisma.slots.findMany({
            where: {
                slotID: { in: allSlotIds }
            }
        });

        const slotPriceMap = new Map(slotDetails.map(s => [s.slotID, s.price]));

        let courtMultiplier = 1;
        if (court_type) {
            const courtTypeData = await prisma.courts.findFirst({
                where: { type: court_type },
                select: { multiplier: true }
            });
            courtMultiplier = courtTypeData?.multiplier || 1;
        }

        let totalDepositAllDays = 0;
        let totalPriceAllDays = 0;

        for (const dateKey of dateKeys) {
            const slotsForDate = slotsByDate[dateKey];
            
            const basePriceForThisDate = slotsForDate.reduce((sum: number, slot: SlotInput) => {
                const slotPrice = slotPriceMap.get(slot.slot_id) || 0;
                return sum + (slotPrice * courtMultiplier);
            }, 0);

            const discountAmountForThisDate = basePriceForThisDate * (discountPercent / 100);
            const priceAfterDiscountForThisDate = basePriceForThisDate - discountAmountForThisDate;
            const vatAmountForThisDate = priceAfterDiscountForThisDate * VAT;
            const priceForThisDate = Math.round(priceAfterDiscountForThisDate + vatAmountForThisDate);
            const depositForThisDate = Math.round(priceForThisDate * depositRate);

            totalPriceAllDays += priceForThisDate;
            totalDepositAllDays += depositForThisDate;
            
            const booking = await prisma.bookings.create({
                data: { 
                    parent_booking_id: parentBookingId,
                    user_id, 
                    phone_user, 
                    booking_date: new Date(dateKey), 
                    status, 
                    total_price: priceForThisDate,      
                    deposit_amount: depositForThisDate,
                    booking_type, 
                    discount, 
                    note, 
                    court_id: court_id || null,
                    court_type: court_type || null,
                },
            });

            const bookingSlotsForDate = slotsForDate.map((slot: SlotInput) => ({
                booking_id: booking.bookingID,
                slot_id: slot.slot_id,
                date: new Date(slot.date),
                is_recurring: slot.is_recurring,
                recurring_day: slot.recurring_day,
                num_weeks: slot.num_weeks,
            }));

            await prisma.bookingSlots.createMany({
                data: bookingSlotsForDate,
            });

            createdBookings.push(booking);
        }

        try {
            const firstBookingId = createdBookings[0].bookingID;
            const paymentBookingId = parentBookingId || firstBookingId;
            const depositAmount = parentBookingId ? totalDepositAllDays : createdBookings[0].deposit_amount;
            
            const paymentLink = await createPaymentLink({
                amount: depositAmount,
                description: "Coc dat san",
                bookingId: firstBookingId,
                buyerName: "Khách hàng",
                buyerPhone: phone_user || "0000000000",
            });
            
            const payment = await prisma.payments.create({
                data: {
                    booking_id: paymentBookingId,
                    payment_method: "PAYOS" as any,
                    status: "PENDING",
                    order_code: paymentLink.orderCode,
                    payment_url: paymentLink.checkoutUrl,
                    qr_code_url: paymentLink.qrCode,
                    payment_link_id: paymentLink.paymentLinkId,
                    payment_deadline: new Date(Date.now() + 3 * 60 * 1000),
                }
            });
            
            const paymentInfo = {
                paymentId: payment.paymentID,
                orderCode: paymentLink.orderCode,
                checkoutUrl: paymentLink.checkoutUrl,
                qrCode: paymentLink.qrCode,
                deadline: payment.payment_deadline,
            };
            
            if (createdBookings.length === 1) {
                res.status(201).json({
                    ...createdBookings[0],
                    payment: paymentInfo
                });
            } else {
                res.status(201).json({
                    parent_booking_id: parentBookingId,
                    bookings: createdBookings,
                    total_deposit: totalDepositAllDays,
                    total_price: totalPriceAllDays,
                    message: `Đã tạo ${createdBookings.length} booking cho ${createdBookings.length} ngày`,
                    payment: paymentInfo
                });
            }
        } catch (paymentError) {
            console.error("Lỗi khi tạo payment link:", paymentError);
            if (createdBookings.length === 1) {
                res.status(201).json(createdBookings[0]);
            } else {
                res.status(201).json({
                    parent_booking_id: parentBookingId,
                    bookings: createdBookings,
                    total_deposit: totalDepositAllDays,
                    total_price: totalPriceAllDays,
                    message: `Đã tạo ${createdBookings.length} booking cho ${createdBookings.length} ngày`,
                });
            }
        }
    } catch (error: unknown) {
        const err = error as { message?: string; meta?: unknown };
        console.error("Lỗi khi tạo booking:", err);
        res.status(500).json({
            error: "Lỗi khi tạo đặt sân",
            message: err.message,
            meta: err.meta,
        });
    }
}

//hầu như hàm này không có sử dụng đến
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

export const getGroupedBookings = async (req: Request, res: Response) => {
    try {
        const parentBookings = await prisma.bookings.findMany({
            where: {
                parent_booking_id: null,
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
                childBookings: {
                    include: {
                        bookingSlots: {
                            include: {
                                slot: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        res.json(parentBookings);
    } catch (error) {
        console.error("Lỗi khi lấy grouped bookings:", error);
        res.status(500).json({ error: "Lỗi khi lấy grouped bookings" });
    }
};
