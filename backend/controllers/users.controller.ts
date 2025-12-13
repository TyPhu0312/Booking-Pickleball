import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";


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

export const changePassword = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Vui lòng nhập đầy đủ thông tin" });
        }

        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            return res.status(400).json({ error: "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, số và ký tự đặc biệt" });
        }

        const user = await prisma.users.findUnique({ where: { userID: id } });
        if (!user) {
            return res.status(404).json({ error: "Không tìm thấy người dùng" });
        }

        const validPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: "Mật khẩu hiện tại không đúng" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await prisma.users.update({
            where: { userID: id },
            data: { password: hashedPassword },
        });

        res.json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi đổi mật khẩu" });
    }
};
