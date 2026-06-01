const mongoose = require("mongoose");

const careerSchema = new mongoose.Schema({

    fullName: String,

    email: String,

    phone: String,

    position: String,

    experience: String,

    message: String,

    resume: String,

    createdAt: {

        type: Date,

        default: Date.now

    }

});

module.exports = mongoose.model("Career", careerSchema);
