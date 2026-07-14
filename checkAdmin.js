const mongoose = require("mongoose");

async function check() {
  try {
    await mongoose.connect("mongodb://localhost:27017/ngo-website");

    const admins = await mongoose.connection.db
      .collection("admins")
      .find({})
      .toArray();

    console.log("===== ADMINS =====");
    console.log(admins);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();	
