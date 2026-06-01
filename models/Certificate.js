const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema({

    volunteerId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Volunteer"

    },

    certificateId: {

        type: String,

        unique: true

    },

    issueDate: {

        type: Date,

        default: Date.now

    },

    status: {

        type: String,

        default: "Valid"

    }

});

module.exports = mongoose.model(
    "Certificate",
    certificateSchema
);
