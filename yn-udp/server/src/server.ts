import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import dotenv from "dotenv";
import templateRoutes from "./routes/template.routes";
import aiRoutes from "./routes/ai.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));

// API Routes
app.use("/api/templates", templateRoutes);
app.use("/api/ai", aiRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "yn-udp", timestamp: new Date().toISOString() });
});

// Serve client build (for Render deployment — single service)
const clientDistPath = path.join(__dirname, "../../client/dist");
app.use(express.static(clientDistPath));

// SPA fallback — any non-API route serves index.html
app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("❌ Error:", err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

app.listen(PORT, () => {
  console.log(`🎨 YN-UDP Server running on port ${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api`);
});

export default app;
