import express from "express";
import { registerUser, loginUser } from "../controllers/auth.controller";
import { verifyToken } from "../middlewares/auth.middleware";


const router = express.Router();
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", verifyToken, (req, res) => {
  res.json({ message: "Đã xác thực!", user: (req as any).user });
});

export default router;