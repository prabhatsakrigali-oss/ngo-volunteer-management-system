const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },

    amount: {
        type: Number,
        required: true
    }

});

module.exports = mongoose.model("Donation", donationSchema);
