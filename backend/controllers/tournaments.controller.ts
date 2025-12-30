import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

const TOURNAMENTS_PER_PAGE = 10;

export const getTournaments = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const skip = (page - 1) * TOURNAMENTS_PER_PAGE;
        const status = req.query.status as string;
        const search = req.query.search as string;

        const where: any = {};
        
        if (status) {
            where.status = status;
        }
        
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const tournaments = await prisma.tournaments.findMany({
            where,
            skip,
            take: TOURNAMENTS_PER_PAGE,
            orderBy: { createdAt: "desc" },
        });

        const totalTournaments = await prisma.tournaments.count({ where });
        const totalPages = Math.ceil(totalTournaments / TOURNAMENTS_PER_PAGE);

        res.json({ 
            tournaments, 
            totalPages, 
            currentPage: page,
            totalTournaments 
        });
    } catch (error) {
        console.error("Error fetching tournaments:", error);
        res.status(500).json({ error: "Lỗi khi lấy danh sách giải đấu" });
    }
};

export const getAllTournaments = async (req: Request, res: Response) => {
    try {
        const tournaments = await prisma.tournaments.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.json(tournaments);
    } catch (error) {
        console.error("Error fetching all tournaments:", error);
        res.status(500).json({ error: "Lỗi khi lấy danh sách giải đấu" });
    }
};

export const getTournamentById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const tournament = await prisma.tournaments.findUnique({
            where: { tournamentID: id },
        });
        
        if (!tournament) {
            return res.status(404).json({ error: "Không tìm thấy giải đấu" });
        }
        
        res.json(tournament);
    } catch (error) {
        console.error("Error fetching tournament:", error);
        res.status(500).json({ error: "Lỗi khi lấy thông tin giải đấu" });
    }
};

export const getActiveTournaments = async (req: Request, res: Response) => {
    try {
        const tournaments = await prisma.tournaments.findMany({
            where: {
                status: "ONGOING",
            },
            orderBy: { start_day: "asc" },
        });
        
        res.json(tournaments);
    } catch (error) {
        console.error("Error fetching active tournaments:", error);
        res.status(500).json({ error: "Lỗi khi lấy giải đấu đang diễn ra" });
    }
};

export const getUpcomingTournaments = async (req: Request, res: Response) => {
    try {
        const now = new Date();
        
        const tournaments = await prisma.tournaments.findMany({
            where: {
                status: "UPCOMING",
                start_day: { gt: now },
            },
            orderBy: { start_day: "asc" },
        });
        
        res.json(tournaments);
    } catch (error) {
        console.error("Error fetching upcoming tournaments:", error);
        res.status(500).json({ error: "Lỗi khi lấy giải đấu sắp diễn ra" });
    }
};

export const createTournament = async (req: Request, res: Response) => {
    try {
      const { name, start_day, end_day, description, status, max_teams, user_id, phone_user, image } = req.body;
  
      if (!name) {
        return res.status(400).json({ error: "Thiếu tên giải đấu" });
      }

      if (!start_day) {
        return res.status(400).json({ error: "Thiếu ngày diễn ra" });
      }

      if (!status) {
        return res.status(400).json({ error: "Thiếu trạng thái" });
      }

      if (!max_teams) {
        return res.status(400).json({ error: "Thiếu số đội tham gia" });
      }

      if (!user_id && !phone_user) {
        return res.status(400).json({ error: "Thiếu thông tin người tạo" });
      }

      if (max_teams < 2) {
        return res.status(400).json({ error: "Số đội tối thiểu là 2" });
      }

      const userExists = await prisma.users.findUnique({
        where: { userID: user_id }
      });
      
      if (!userExists) {
        return res.status(404).json({ error: "Người dùng không tồn tại" });
      }
  
      const newTournament = await prisma.tournaments.create({
        data: {
          name,
          start_day: new Date(start_day),
          end_day:new Date(end_day),
          description: description || null,
          status,
          max_teams: parseInt(max_teams),
          user_id,
          phone_user: phone_user || null,
          image: image || null,
        },
        include: {
          user: {
            select: {
              userID: true,
              full_name: true,
              phone: true,
            }
          }
        }
      });
  
      res.status(201).json(newTournament);
    } catch (error: any) {
      console.error("Error creating tournament:", error);
      res.status(500).json({ error: "Lỗi khi tạo giải đấu", message: error.message });
    }
  };

export const updateTournament = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, start_day, end_day, description, status, max_teams, image } = req.body;

      const exists = await prisma.tournaments.findUnique({
        where: { tournamentID: id}
      });
      
      if (!exists) {
        return res.status(404).json({ error: "Giải đấu không tồn tại" });
      }

      if (max_teams && max_teams < 2) {
        return res.status(400).json({ error: "Số đội tối thiểu là 2" });
      }

      const dataToUpdate: any = {};
      
      if (name !== undefined) dataToUpdate.name = name;
      if (start_day !== undefined) dataToUpdate.start_day = new Date(start_day);
      if (end_day !== undefined) dataToUpdate.end_day = new Date(end_day);
      if (description !== undefined) dataToUpdate.description = description;
      if (status !== undefined) dataToUpdate.status = status;
      if (max_teams !== undefined) dataToUpdate.max_teams = parseInt(max_teams);
      if (image !== undefined) dataToUpdate.image = image;
  
      const updatedTournament = await prisma.tournaments.update({
        where: { tournamentID: id },
        data: dataToUpdate,
        include: {
          user: {
            select: {
              userID: true,
              full_name: true,
              phone: true,
            }
          }
        }
      });
  
      res.json(updatedTournament);
    } catch (error: any) {
      console.error("Error updating tournament:", error);
      res.status(500).json({ error: "Lỗi khi cập nhật giải đấu", message: error.message });
    }
  }
 
export const deleteTournament = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
  
      const existingTournament = await prisma.tournaments.findUnique({
        where: { tournamentID: id },
      });
      
      if (!existingTournament) {
        return res.status(404).json({ error: "Không tìm thấy giải đấu" });
      }

      if (existingTournament.status === "ONGOING") {
        return res.status(400).json({ 
          error: "Không thể xóa giải đấu đang diễn ra",
          suggestion: "Hãy hủy hoặc kết thúc giải đấu trước khi xóa"
        });
      }
  
      await prisma.tournaments.delete({
        where: { tournamentID: id },
      });
  
      res.json({ 
        message: "Xóa giải đấu thành công",
        deletedTournament: {
          tournamentID: existingTournament.tournamentID,
          name: existingTournament.name
        }
      });
    } catch (error: any) {
      console.error("Error deleting tournament:", error);
      res.status(500).json({ error: "Lỗi khi xóa giải đấu", message: error.message });
    }
  };

export const updateTournamentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Thiếu trạng thái" });
    }

    const validStatuses = ["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: "Trạng thái không hợp lệ",
        validStatuses 
      });
    }

    const exists = await prisma.tournaments.findUnique({
      where: { tournamentID: id }
    });

    if (!exists) {
      return res.status(404).json({ error: "Giải đấu không tồn tại" });
    }

    const updatedTournament = await prisma.tournaments.update({
      where: { tournamentID: id },
      data: { status },
    });

    res.json(updatedTournament);
  } catch (error: any) {
    console.error("Error updating tournament status:", error);
    res.status(500).json({ error: "Lỗi khi cập nhật trạng thái", message: error.message });
  }
};

export const getTournamentStats = async (req: Request, res: Response) => {
  try {
    const totalTournaments = await prisma.tournaments.count();
    
    const upcomingCount = await prisma.tournaments.count({
      where: { status: "UPCOMING" }
    });
    
    const ongoingCount = await prisma.tournaments.count({
      where: { status: "ONGOING" }
    });
    
    const completedCount = await prisma.tournaments.count({
      where: { status: "COMPLETED" }
    });
    
    const cancelledCount = await prisma.tournaments.count({
      where: { status: "CANCELLED" }
    });

    res.json({
      total: totalTournaments,
      upcoming: upcomingCount,
      ongoing: ongoingCount,
      completed: completedCount,
      cancelled: cancelledCount,
    });
  } catch (error) {
    console.error("Error fetching tournament stats:", error);
    res.status(500).json({ error: "Lỗi khi lấy thống kê giải đấu" });
  }
};

export const getUpcomingTournamentsByUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const now = new Date();
    
    const tournaments = await prisma.tournaments.findMany({
      where: {
        user_id: userId,
        status: "UPCOMING",
        start_day: { gt: now },
      },
      orderBy: { start_day: "asc" },
    });
    
    res.json(tournaments);
  } catch (error) {
    console.error("Error fetching user's upcoming tournaments:", error);
    res.status(500).json({ error: "Lỗi khi lấy giải đấu sắp diễn ra của người dùng" });
  }
};