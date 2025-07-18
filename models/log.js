// models/Log.js
const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema({
  user: String,
  action: String,
  timestamp: { type: Date, default: Date.now },
  detail: String,
});

module.exports = mongoose.model("Log", LogSchema);
