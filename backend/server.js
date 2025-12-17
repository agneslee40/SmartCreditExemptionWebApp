import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import matchingRoutes from "./routes/matching.js";
import applicationRoutes from "./routes/application.js";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import path from "path";
import sunwayRoutes from "./routes/sunway.js";


dotenv.config();
const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use("/api/matching", matchingRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/users", usersRoutes);
app.use("/uploads", express.static(path.join(process.cwd(), "backend", "uploads")));
app.use("/api/sunway", sunwayRoutes);

// DB TEST ROUTE
import dbTestRoutes from "./routes/testDB.js";
app.use("/api", dbTestRoutes);

// Default route
app.get("/", (req, res) => {
  res.json({ message: "Backend is running!" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});

