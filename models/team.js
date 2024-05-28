const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  team_name: {
    required: true,
    type: String,
  },
  team_size: {
    required: true,
    type: Number,
  },
  team_details: {
    required: true,
    type: [{ email: String, team_lead: Boolean }],
  },
  domain: {
    required: true,
    type: String,
    enum: ["mobile", "web", "solution-challenge"],
  },
});

module.exports = mongoose.model("team", teamSchema);
