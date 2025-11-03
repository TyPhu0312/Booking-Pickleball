import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const getCourts = async (req: Request, res: Response) => {
    try {
        const courts = await prisma.courts.findMany();
        res.json(courts);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy danh sách sân" });
    }
};

export const getCourtById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const court = await prisma.courts.findUnique({ where: { courtID: id } });
        if (!court) return res.status(404).json({ error: "Không tìm thấy sân" });
        res.json(court);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy thông tin sân" });
    }
};

export const createCourt = async (req: Request, res: Response) => {
    try {
        const { name, type,  status, image } = req.body;
        console.log("Received court data:", req.body);

        const newCourt = await prisma.courts.create({
            data: { name, type,  status, image },
        });

        console.log("Created new court:", newCourt);
        res.status(201).json(newCourt);
    } catch (error: any) {
        console.error("Error creating court:", error);
        res.status(500).json({
            error: "Lỗi khi tạo sân",
            message: error.message,
            meta: error.meta,
        });
    }
};


export const updateCourt = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;
      
        const existingCourt = await prisma.courts.findUnique({
          where: { courtID: id },
        });
      
        if (!existingCourt) {
          return res.status(404).json({ error: "Không tìm thấy sân" });
        }
      
        const updatedCourt = await prisma.courts.update({
          where: { courtID: id },
          data,
        });
      
        res.json(updatedCourt);
      } catch (error: any) {
        console.error("Error updating court:", error);
        res.status(500).json({ error: "Lỗi khi cập nhật sân", message: error.message });
      }      
};

export const deleteCourt = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.courts.delete({ where: { courtID: id } });
        res.json({ message: "Đã xóa sân thành công" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi xóa sân" });
    }
};