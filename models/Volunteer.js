const mongoose = require("mongoose");

const volunteerSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    phone: {
        type: String,
        required: true
    },
    password: {
           type: String,
           required: true
    },

  role: {
    type: String,
    default: "Member"
   },

  photo: {
    type: String
  },

resetPasswordToken: String,
resetPasswordExpire: Date

});

module.exports = mongoose.model("Volunteer", volunteerSchema);
