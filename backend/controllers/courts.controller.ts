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
        const { name, type,  status, multiplier, image } = req.body;

        const newCourt = await prisma.courts.create({
            data: { name, type,  status, multiplier, image },
        });

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

export const getCourtsAvailability = async (req: Request, res: Response) => {  
    try {
        const courts = await prisma.courts.findMany({
            where : { status: "AVAILABLE" }
        });
        res.json(courts);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy tình trạng sân" });
    }
}

export const deleteCourt = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.courts.update({
            where: { courtID: id },
            data: { status: "CLOSED" },
        });
        res.json({ message: "Đã xóa sân thành công" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi xóa sân" });
    }
};

export const getAllTheMultiplierOfTheCourtType = async (req: Request, res: Response) => {  
    try {
        const courts = await prisma.courts.groupBy({
            by: ['type'],
            _avg: {
                multiplier: true,
                },
          });
          if (!courts || courts.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy sân nào" });
          }
          const result = courts.map(c => ({
            type: c.type,
            multiplier: c._avg.multiplier
          }));
      
          res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy hệ số nhân" });
    }
}

type CourtType = "INDOOR" | "OUTDOOR";

export const getAvailableCourtsByType = async (req: Request, res: Response) => {
    try {
      const { type } = req.params;
  
      if (!type) {
        return res.status(400).json({ error: "Chưa có loại sân" });
      }
  
      const courts = await prisma.courts.findMany({
        where: {
          type: type as CourtType,
          status: "AVAILABLE", 
        },
      });
  
      if (!courts || courts.length === 0) {
        return res.status(404).json({ error: "Không có sân trống nào" });
      }
  
      res.json(courts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Lỗi khi lấy danh sách sân trống" });
    }
  };
  