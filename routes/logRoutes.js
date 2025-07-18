// routes/logRoutes.js
const express = require("express");
const router = express.Router();
const Log = require("../models/log");

router.post("/", async (req, res) => {
  try {
    const newLog = new Log(req.body);
    await newLog.save();
    res.status(201).json({ message: "Log saved" });
  } catch (error) {
    res.status(500).json({ message: "Error saving log", error });
  }
});

router.get("/", async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching logs", error });
  }
});

module.exports = router;
