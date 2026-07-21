const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({

    email: {
        type: String,
        required: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
       type: String,
       default: "Admin"
   },

   photo: {
      type: String
    },

	resetPasswordToken: String,
	resetPasswordExpire: Date

});

module.exports = mongoose.model("Admin", adminSchema);
