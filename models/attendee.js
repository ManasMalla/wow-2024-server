const mongoose = require("mongoose");

const attendeeSchema = new mongoose.Schema({
  payment_utr: {
    required: true,
    type: String,
  },
  tshirt_size: {
    required: true,
    type: String,
    enum: ["S", "M", "L", "XL", "XXL"],
  },
  team_id: {
    required: true,
    type: String,
  },
  accommodation: {
    required: true,
    type: Boolean,
  },
  agenda_domain: {
    required: true,
    type: [String],
    enum: ["android", "flutter", "web", "cloud", "ml"],
  },
  uid: {
    required: true,
    type: String,
  },
  phone_number: {
    required: true,
    type: String,
  },
  is_confirmed: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("attendee", attendeeSchema);
