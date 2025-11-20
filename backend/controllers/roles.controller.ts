import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const getRoles = async (req: Request, res: Response) => {
    try {
        const roles = await prisma.roles.findMany();
        res.json(roles);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy danh sách vai trò" });
    }
};

export const getRoleById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const role = await prisma.roles.findUnique({ where: { roleID: id } });
        if (!role) return res.status(404).json({ error: "Không tìm thấy vai trò" });
        res.json(role);
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi lấy thông tin vai trò" });
    }
};

export const createRole = async (req: Request, res: Response) => {
    try {
        const { name, description } = req.body;

        const newRole = await prisma.roles.create({
            data: { name, description },
        });

        res.status(201).json(newRole);
    } catch (error: unknown) {
        const err = error as { message?: string };
        console.error("Error creating role:", error);
        res.status(500).json({
            error: "Lỗi khi tạo vai trò",
            message: err.message,
        });
    }
};

export const updateRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const existingRole = await prisma.roles.findUnique({ where: { roleID: id } });
        if (!existingRole) {
            return res.status(404).json({ error: "Không tìm thấy vai trò" });
        }

        const updatedRole = await prisma.roles.update({
            where: { roleID: id },
            data,
        });

        res.json(updatedRole);
    } catch (error: unknown) {
        const err = error as { message?: string };
        console.error("Error updating role:", error);
        res.status(500).json({ error: "Lỗi khi cập nhật vai trò", message: err.message });
    }
};

export const deleteRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.roles.delete({ where: { roleID: id } });
        res.json({ message: "Đã xóa vai trò thành công" });
    } catch (error) {
        res.status(500).json({ error: "Lỗi khi xóa vai trò" });
    }
};
