import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";


const prisma = new PrismaClient();



export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.users.findMany({
            include: { role: true },
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy danh sách người dùng" });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await prisma.users.findUnique({
            where: { userID: id },
            include: { role: true },
        });
        if (!user) return res.status(404).json({ error: "Không tìm thấy người dùng" });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy thông tin người dùng" });
    }
};
export const getUserByPhone = async (req: Request, res: Response) => {
    try {
      const { phone } = req.params; 
  
      if (!phone) {
        return res.status(400).json({ error: "Email không được để trống" });
      }
  
      const user = await prisma.users.findUnique({
        where: { phone },
        include: { role: true }, 
      });
  
      if (!user) {
        return res.status(404).json({ error: "Không tìm thấy người dùng" });
      }
  
      const { password, ...userWithoutPassword } = user;
  
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("getUserByEmail Error:", error);
      res.status(500).json({ error: "Lỗi khi lấy thông tin người dùng" });
    }
  };

export const createUser = async (req: Request, res: Response) => {
    try {
        const { full_name, password, phone, role_id } = req.body;

        const newUser = await prisma.users.create({
            data: {
                full_name,
                password,
                phone,
                role_id,
            },
        });

        res.status(201).json(newUser);
    } catch (error: unknown) {
        const err = error as { message?: string };
        console.error("Error creating user:", error);
        res.status(500).json({
            error: "Lỗi khi tạo người dùng",
            message: err.message,
        });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {full_name, phone, role_id, address, bank_account_number, bank_account_owner, bank_name} = req.body;

        const existingUser = await prisma.users.findUnique({ where: { userID: id } });
        if (!existingUser) {
            return res.status(404).json({ error: "Không tìm thấy người dùng" });
        }

        const updatedUser = await prisma.users.update({
            where: { userID: id },
            data : {
                full_name,
                phone,
                role_id,
                address,
                bank_account_number,
                bank_account_owner,
                bank_name
            }
            ,
        });

        res.json(updatedUser);
    } catch (error: unknown) {
        const err = error as { message?: string };
        console.error("Error updating user:", error);
        res.status(500).json({ error: "Lỗi khi cập nhật người dùng", message: err.message });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.users.delete({ where: { userID: id } });
        res.json({ message: "Đã xóa người dùng thành công" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi xóa người dùng" });
    }
};
