const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({

    groupName: {
        type: String,
        required: true
    },

    leaderName: {
        type: String,
        required: true
    },

    totalMembers: {
        type: Number,
        required: true
    },

    workDetails: {
        type: String,
        required: true
    },

    members: [

        {

            memberName: String,
            memberPhone: String

        }

    ],

activities: [

    {

        activityText: String,

        activityImage: String,

        createdAt: {

            type: Date,

            default: Date.now

        }

    }

],

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports = mongoose.model("Group", groupSchema);
