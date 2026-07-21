const bcrypt = require("bcryptjs");
const Admin = require("./models/Admin");

async function seedAdmin() {
    try {
        const adminCount = await Admin.countDocuments();

        if (adminCount > 0) {
            console.log("✅ Admin already exists.");
            return;
        }

        const hashedPassword = await bcrypt.hash("Admin@123", 10);

        await Admin.create({
            email: "admin@ngo.com",
            password: hashedPassword
        });

        console.log("✅ Default Admin Created");
        console.log("Email: admin@ngo.com");
        console.log("Password: Admin@123");

    } catch (err) {
        console.error("❌ Error while seeding admin:", err);
    }
}

module.exports = seedAdmin;
