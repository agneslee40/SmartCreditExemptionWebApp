import express from "express";
const router = express.Router();

// Test route for matching
router.get("/", (req, res) => {
  res.json({ message: "Matching route working ✅" });
});

export default router;
