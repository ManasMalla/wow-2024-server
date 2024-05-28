const mongoose = require("mongoose");

const shortlistedUserSchema = new mongoose.Schema({
  uid: {
    required: true,
    type: String,
  },
  first_name: {
    required: true,
    type: String,
  },
  last_name: {
    required: true,
    type: String,
  },
  email: {
    required: true,
    type: String,
  },
});

module.exports = mongoose.model("shortlisted-users", shortlistedUserSchema);
