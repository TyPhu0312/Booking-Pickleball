import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt";
import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";


const prisma = new PrismaClient();


// Đăng ký và đăng nhập người dùng
export const registerUser = async (req: Request, res: Response) => {
    try {
      const { full_name, email, password, role_id } = req.body;
  
      // Kiểm tra user đã tồn tại chưa
      const existingUser = await prisma.users.findUnique({ where: { email } });
      if (existingUser) return res.status(400).json({ message: "Email đã tồn tại" });
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Xác định role
      let finalRoleId = role_id;
  
      if (!finalRoleId) {
        // Kiểm tra xem user đầu tiên chưa
        const totalUsers = await prisma.users.count();
  
        if (totalUsers === 0) {
          // Tài khoản đầu tiên → role admin
          let adminRole = await prisma.roles.findFirst({
            where: { name: "admin" },
          });
          if (!adminRole) {
            adminRole = await prisma.roles.create({ data: { name: "admin" } });
          }
          finalRoleId = adminRole.roleID;
        } else {
          // Các tài khoản khác → role customer
          let customerRole = await prisma.roles.findFirst({
            where: { name: "customer" },
          });
          if (!customerRole) {
            customerRole = await prisma.roles.create({ data: { name: "customer" } });
          }
          finalRoleId = customerRole.roleID;
        }
      }
  
      // Tạo user mới
      const newUser = await prisma.users.create({
        data: {
          full_name,
          password: hashedPassword,
          email,
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
      const { email, password } = req.body;
  
      const user = await prisma.users.findUnique({ where: { email } });
      if (!user) return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
  
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return res.status(400).json({ message: "Sai email hoặc mật khẩu" });
  
      const token = generateToken({ userId: user.userID });
  
      return res.json({ message: "Đăng nhập thành công", token });
    } catch (error) {
      console.error("Login Error:", error);
      return res.status(500).json({ message: "Lỗi server" });
    }
  };
