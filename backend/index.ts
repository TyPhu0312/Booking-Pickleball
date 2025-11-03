import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";
// import routes
import courts from "./routes/courts.routes";
import roles from "./routes/roles.routes";
import users from "./routes/users.routes";
import auth from "./routes/auth.rourtes";
import slots from "./routes/slots.routes";


dotenv.config();

const app: Application = express();
const prisma = new PrismaClient();
const port: number = parseInt(process.env.PORT || "5000", 10);

// Cấu hình middleware
app.use(cors({
  origin: ["http://localhost:3000"],
  credentials: true,
}));
app.use(express.json());
app.use(morgan("dev"));

// ✅ Sử dụng routes
app.use("/api/courts", courts);
app.use("/api/roles", roles);
app.use("/api/users", users);
app.use("/api/auth", auth);
app.use("/api/slots", slots);


// ✅ Khởi động server
app.listen(port, async () => {
  console.log(`🚀 Server đang chạy tại cổng ${port}`);
  try {
    await prisma.$connect();
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ Error connecting to database:", err);
  }
});
