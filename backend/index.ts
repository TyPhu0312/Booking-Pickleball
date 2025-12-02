import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";
import path from "path";

import courts from "./routes/courts.routes";
import roles from "./routes/roles.routes";
import users from "./routes/users.routes";
import auth from "./routes/auth.routes";
import slots from "./routes/slots.routes";
import bookings from "./routes/bookings.routes";
import tournaments from "./routes/tournaments.routes";
import blogs from "./routes/blogs.routes";
import payos from "./routes/payos.routes";
import cash from "./routes/cash.routes";
import { startAutoCancelScheduler } from "./services/scheduler.service";

dotenv.config();

const app: Application = express();
const prisma = new PrismaClient();
const port: number = parseInt(process.env.PORT || "5000", 10);


app.use(cors({
  origin: ["http://localhost:3000"],
  credentials: true,
}));
app.use(express.json());
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.use("/api/courts", courts);
app.use("/api/roles", roles);
app.use("/api/users", users);
app.use("/api/auth", auth);
app.use("/api/slots", slots);
app.use("/api/bookings", bookings);
app.use("/api/tournaments", tournaments);
app.use("/api/blogs", blogs);
app.use("/api/payos", payos);
app.use("/api/cash", cash);

app.listen(port, async () => {
  console.log(`🚀 Server đang chạy tại cổng ${port}`);
  try {
    await prisma.$connect();
    console.log("✅ Database connected");
    
    startAutoCancelScheduler();
  } catch (err) {
    console.error("❌ Error connecting to database:", err);
  }
});
