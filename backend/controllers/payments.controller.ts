import { PrismaClient } from "@prisma/client";
import e, { Request, Response } from "express";
import { deleteFile } from "../config/multer";
import path from "path/win32";

const prisma = new PrismaClient();

export const getPayments = async (req: Request, res: Response) => {
    try {
        const payments = await prisma.payments.findMany({
            include: {
                booking: {
                    include: {
                        user: true,
                        court: true,
                        bookingSlots: true,
                    },
                },
                paymentImages: true,
            },
            orderBy: { createdAt: "desc" },
        });
        res.json({ payments });
    } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
export const getPaymentById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const payment = await prisma.payments.findUnique({
            where: { paymentID: id },
            include: {
                booking: {
                    include: {
                        user: true,
                        court: true,
                        bookingSlots: true,
                    },
                },
                paymentImages: true,
            },
        });
        if (!payment) {
            return res.status(404).json({ error: "Payment not found" });
        }
        res.json({ payment });
    } catch (error) {
        console.error("Error fetching payment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const createPayment = async (req: Request, res: Response) => {
    try {
        const { booking_id, payment_method, status, transaction_id, description } = req.body;
        const file = req.file; 
        
        const newPayment = await prisma.payments.create({
            data: {
                booking_id,
                payment_method,
                status,
                transaction_id,
                image: file ? `/uploads/payments/${file.filename}` : null,
                paymentImages: file ? {
                    create: {
                        image_url: `/uploads/payments/${file.filename}`,
                        description: description || "Ảnh cọc ban đầu",
                    },
                } : undefined,
            },
            include: {
                paymentImages: true,
            },
        });
        res.status(201).json({ payment: newPayment });
    } catch (error) {
        console.error("Error creating payment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const updatePayment = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { booking_id, payment_method, status, transaction_id, description } = req.body;
        const existingPayment = await prisma.payments.findUnique({ where: { paymentID: id } });
        if (!existingPayment) {
            return res.status(404).json({ error: "Payment not found" });
        }
        
        const file = req.file;
        let imagePath = existingPayment.image;
        
        if (file) {
            imagePath = `/uploads/payments/${file.filename}`;
        }
        
        const updatedPayment = await prisma.payments.update({
            where: { paymentID: id },
            data: {
                booking_id,
                payment_method,
                status,
                transaction_id,
                image: imagePath, 
                paymentImages: file ? {
                    create: {
                        image_url: `/uploads/payments/${file.filename}`,
                        description: description || `Thanh toán đợt ${new Date().toLocaleDateString('vi-VN')}`,
                    },
                } : undefined,
            },
            include: {
                paymentImages: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        res.json({ payment: updatedPayment });
    } catch (error) {
        console.error("Error updating payment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const deletePaymentImage = async (req: Request, res: Response) => {
    try {
        const { imageId } = req.params;
        
        const paymentImage = await prisma.paymentImages.findUnique({
            where: { imageID: imageId },
        });
        
        if (!paymentImage) {
            return res.status(404).json({ error: "Image not found" });
        }
        
        const imagePath = path.join(process.cwd(), paymentImage.image_url);
        deleteFile(imagePath);
        
        await prisma.paymentImages.delete({
            where: { imageID: imageId },
        });
        
        res.json({ message: "Image deleted successfully" });
    } catch (error) {
        console.error("Error deleting payment image:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};