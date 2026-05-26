import app from "./app"; // 🔥 MUST
import path from "path";
import express from "express";
const PORT = process.env.PORT || 4000;


app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});