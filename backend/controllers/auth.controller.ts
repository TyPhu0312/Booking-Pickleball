import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";


const prisma = new PrismaClient();


export const registerUser = async (req: Request, res: Response) => {
  try {
    const { full_name, phone, password, role_id } = req.body;

    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Số điện thoại không hợp lệ (phải gồm 10 số và bắt đầu bằng 0)" });
    }

    const existingUser = await prisma.users.findUnique({ where: { phone } });
    if (existingUser) {
      return res.status(400).json({ message: "Số điện thoại đã tồn tại" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let finalRoleId = role_id;

    if (!finalRoleId) {
      const totalUsers = await prisma.users.count();

      if (totalUsers === 0) {
        let superadminRole = await prisma.roles.findFirst({
          where: { name: "superadmin" },
        });
        if (!superadminRole) {
          superadminRole = await prisma.roles.create({ data: { name: "superadmin" } });
        }
        finalRoleId = superadminRole.roleID;
      } else if (totalUsers === 1) {
        let adminRole = await prisma.roles.findFirst({
          where: { name: "admin" },
        });
        if (!adminRole) {
          adminRole = await prisma.roles.create({ data: { name: "admin" } });
        }
        finalRoleId = adminRole.roleID;
      } else {
        let customerRole = await prisma.roles.findFirst({
          where: { name: "customer" },
        });
        if (!customerRole) {
          customerRole = await prisma.roles.create({ data: { name: "customer" } });
        }
        finalRoleId = customerRole.roleID;
      }
    }

    const newUser = await prisma.users.create({
      data: {
        full_name,
        password: hashedPassword,
        phone,
        role_id: finalRoleId,
      },
    });

    const token = generateToken({ userId: newUser.userID });

    return res.status(201).json({ message: "Đăng ký thành công", token });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};


export const loginUser = async (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ số điện thoại và mật khẩu" });
    }

    const user = await prisma.users.findUnique({ where: { phone } });
    if (!user) {
      return res.status(400).json({ message: "Sai số điện thoại hoặc mật khẩu" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: "Sai email hoặc mật khẩu" });

    const token = generateToken({ userId: user.userID });

    return res.json({ message: "Đăng nhập thành công", token });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Lỗi server" });
  }
};
