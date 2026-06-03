
require("dotenv").config();

const crypto = require("crypto");

const bcrypt = require("bcryptjs");

const Admin = require("./models/Admin");

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");

const connectDB = require("./config/db");

const Volunteer = require("./models/Volunteer");
const Donation = require("./models/Donation");
const Group = require("./models/Group");

const PDFDocument = require("pdfkit");

const ExcelJS = require("exceljs");

const nodemailer = require("nodemailer");


const flash = require("connect-flash");

const Activity = require("./models/Activity");

const Attendance = require("./models/Attendance");

const Career = require("./models/Career");

const Event = require("./models/Event");

const Gallery = require("./models/Gallery");

const Certificate = require("./models/Certificate");

const QRCode = require("qrcode");

const multer = require("multer");


//=====================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, "public/uploads");

    },

    filename: function (req, file, cb) {

        cb(null, Date.now() + "-" + file.originalname);

    }

});

const upload = multer({

    storage: storage

});

//=====================================

const resumeStorage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, "public/resumes");

    },

    filename: function (req, file, cb) {

        cb(null, Date.now() + "-" + file.originalname);

    }

});

const resumeUpload = multer({

    storage: resumeStorage

});


//==================================
const transporter = nodemailer.createTransport({

    service: "gmail",

    auth: {

        //user: "YOUR_GMAIL@gmail.com",
        user: process.env.EMAIL_USER,

       // pass: "YOUR_APP_PASSWORD"

        pass: process.env.EMAIL_PASS

    }

});


//==================================
connectDB();

const app = express();


app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({

    secret: "ngo-secret-key",

    resave: false,

    saveUninitialized: false

}));

app.use(flash());

app.use((req, res, next) => {

    res.locals.success = req.flash("success");

    res.locals.error = req.flash("error");

    next();

});

app.set("view engine", "ejs");

app.use(express.static("public"));

// ================= ROLE MIDDLEWARE =================

const checkRole = (allowedRoles) => {

    return async (req, res, next) => {

        try {

            const volunteer = await Volunteer.findOne({

                email: req.query.email

            });

            if (!volunteer) {

                return res.send("Volunteer not found");

            }

            if (allowedRoles.includes(volunteer.role)) {

                next();

            } else {

                res.send("Access Denied");

            }

        } catch (error) {

            console.log(error);

            res.send("Role Middleware Error");

        }

    };

};


//==========================================================
const isAdminLoggedIn = (req, res, next) => {

    if (req.session.userId) {

        next();

    } else {

       res.redirect("/login");

    }

};

//=======================================
const allowRoles = (...roles) => {

    return (req, res, next) => {

        if (!req.session.role) {

            return res.redirect("/login");

        }

        if (roles.includes(req.session.role)) {

            next();

        } else {

            return res.send(`

                <!DOCTYPE html>

                <html>

                <head>

                    <title>Access Denied</title>

                    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">

                    <meta http-equiv="refresh" content="2;url=/" />

                </head>

                <body class="bg-light d-flex justify-content-center align-items-center vh-100">

                    <div class="alert alert-danger text-center shadow p-4">

                        <h3>Access Denied</h3>

                        <p>You are not allowed to access this page.</p>

                        <p>Redirecting to Home Page...</p>

                    </div>

                </body>

                </html>

            `);

        }

    };

};

//==========================================================================================
app.get("/", async (req, res) => {

    try {

        const activities = await Activity.find()
        .sort({ createdAt: -1 })
        .limit(10);

        res.render("home", {

            activities

        });

    } catch (error) {

        console.log(error);

        res.send("Error Loading Home Page");

    }

});

app.get("/about", (req, res) => {
    res.render("about");
});

app.get("/contact", (req, res) => {
    res.render("contact");
});
//===================== PROGRAMS =====================

app.get("/programs", (req, res) => {

    res.render("programs");

});

//===================== CAREER =====================
app.get("/career", (req, res) => {

    res.render("career");

});
//==================== apply-career =====================================
app.get("/apply-career", (req, res) => {

    res.render("applyCareer");

});

//===========================
app.post(

    "/career",

    resumeUpload.single("resume"),

    async (req, res) => {

    try {

        const newCareer = new Career({

            fullName: req.body.fullName,

            email: req.body.email,

            phone: req.body.phone,

            position: req.body.position,

            experience: req.body.experience,

            message: req.body.message,

            resume: req.file.filename

        });

        await newCareer.save();

        await transporter.sendMail({

            from: "prabhatsakrigali@gmail.com",

            to: "prabhatsakrigali@gmail.com",

            subject: "New Career Application",

            html: `

                <h2>New Career Application</h2>

                <p><strong>Name:</strong> ${req.body.fullName}</p>

                <p><strong>Email:</strong> ${req.body.email}</p>

                <p><strong>Phone:</strong> ${req.body.phone}</p>

                <p><strong>Position:</strong> ${req.body.position}</p>

            `

        });

        res.redirect("/career");

    } catch (error) {

        console.log(error);

        res.send("Career Application Error");

    }

});

//=======================Register==========================
app.get("/register", isAdminLoggedIn, allowRoles("Admin"), (req, res) => {

    res.render("register");

});

app.post("/register", isAdminLoggedIn, allowRoles("Admin"), async (req, res) => {

    try {

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newAdmin = new Admin({

            email: req.body.email,

            password: hashedPassword

        });

        await newAdmin.save();

         req.flash("success", "Registration Successful");

         res.redirect("/login");

    } catch (error) {

        console.log(error);

        res.send("Register Error");

    }

});

//=====================================Login==========

app.get("/login", (req, res) => {

    res.render("login");

});

app.post("/login", async (req, res) => {

    try {

        // ===== ADMIN LOGIN =====

        const admin = await Admin.findOne({

            email: req.body.email

        });

        if (admin) {

            const isMatch = await bcrypt.compare(

                req.body.password,
                admin.password

            );

            if (!isMatch) {

                return res.render("login", {

                    error: "Wrong Password"

                });

            }

            req.session.userId = admin._id;

            req.session.role = "Admin";

            req.flash("success", "Login Successful");

           return res.redirect("/dashboard");
        }

        // ===== VOLUNTEER LOGIN =====

        const volunteer = await Volunteer.findOne({

            email: req.body.email

        });

        if (!volunteer) {

                req.flash("error", "User Not Found");

               return res.redirect("/login");

        }

        const isMatch = await bcrypt.compare(

            req.body.password,
            volunteer.password

        );

        if (!isMatch) {

                req.flash("error", "Wrong Password");

                 return res.redirect("/login");
        }

        req.session.userId = volunteer._id;

        req.session.role = volunteer.role;

        // ===== ROLE BASED REDIRECT =====

        if (volunteer.role === "Leader") {

            return res.redirect("/groups");

        }

        if (volunteer.role === "Volunteer") {

            return res.redirect("/volunteer");

        }

        if (volunteer.role === "Member") {

            return res.redirect("/");

        }

        res.redirect("/");

    } catch (error) {

        console.log(error);

        res.send("Login Error");

    }

});
// ===================== FORGOT PASSWORD PAGE =====================
app.get("/forgot-password", (req, res) => {
    res.render("forgotPassword");
});

// ================= SEND RESET LINK =================

app.post("/forgot-password", async (req, res) => {

    try {

	let user = await Volunteer.findOne({
	    email: req.body.email
	});

	let userType = "Volunteer";

	if (!user) {

	    user = await Admin.findOne({
            email: req.body.email
	    });

	    userType = "Admin";
	}
	if (!user) {
	    return res.send("Email not found");
	}

        const resetToken = crypto.randomBytes(32).toString("hex");

	user.resetPasswordToken = resetToken;

	user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

	await user.save();

        const resetUrl =  `http://localhost:3000/reset-password/${resetToken}`;

        await transporter.sendMail({

            from: "prabhatsakrigali@gmail.com",

	    to: user.email,

            subject: "Password Reset",

            html: `
                <h2>Password Reset</h2>

                <p>Click below link:</p>

                <a href="${resetUrl}">
                    Reset Password
                </a>
            `
        });

	    res.render("resetLinkSent");

    } catch (error) {

        console.log(error);

        res.send("Forgot Password Error");

    }

});

// ================= RESET PASSWORD PAGE =================

app.get("/reset-password/:token", async (req, res) => {

    try {

        let user = await Volunteer.findOne({

            resetPasswordToken: req.params.token,

            resetPasswordExpire: { $gt: Date.now() }

        });

        if (!user) {

            user = await Admin.findOne({

                resetPasswordToken: req.params.token,

                resetPasswordExpire: { $gt: Date.now() }

            });

        }

        if (!user) {

            return res.send("Invalid or Expired Token");

        }

        res.render("resetPassword", {

            token: req.params.token

        });

    } catch (error) {

        console.log(error);

        res.send("Reset Password Page Error");

    }

});

// ================= UPDATE NEW PASSWORD =================
app.post("/reset-password/:token", async (req, res) => {

    try {

        let user = await Volunteer.findOne({

            resetPasswordToken: req.params.token,
            resetPasswordExpire: { $gt: Date.now() }

        });

        if (!user) {

            user = await Admin.findOne({

                resetPasswordToken: req.params.token,
                resetPasswordExpire: { $gt: Date.now() }

            });

        }

        if (!user) {

            return res.send("Invalid or Expired Token");

        }

        const hashedPassword = await bcrypt.hash(
            req.body.password,
            10
        );

        user.password = hashedPassword;

        user.resetPasswordToken = undefined;

        user.resetPasswordExpire = undefined;

        await user.save();

        res.send("Password Reset Successful");

    } catch (error) {

        console.log(error);

        res.send("Password Reset Error");

    }

});

//=========================logout==================================
app.get("/logout", (req, res) => {

    req.session.destroy(() => {

        res.redirect("/");

    });

});

//========================Dashboard======================

app.get("/dashboard",  isAdminLoggedIn, allowRoles("Admin"), async (req, res) =>  {

    try {

        const totalVolunteers = await Volunteer.countDocuments();

	const totalLeaders = await Volunteer.countDocuments({

	    role: "Leader"

	});

	const totalMembersRole = await Volunteer.countDocuments({

	    role: "Member"

	});

	const totalVolunteerRole = await Volunteer.countDocuments({

	    role: "Volunteer"

	});

		const activities = await Activity.find()

		.sort({ createdAt: -1 })

		.limit(5);


        const totalDonations = await Donation.countDocuments();

        const donations = await Donation.find();

        let totalAmount = 0;

        donations.forEach((donation) => {

       totalAmount += Number(donation.amount);

       });
		res.render("dashboard", {

		    totalVolunteers,
		    totalDonations,
		    totalAmount,

		    totalLeaders,
		    totalMembersRole,
		    totalVolunteerRole,
                    activities

		});

    } catch (error) {

        console.log(error);

        res.send("Dashboard Error");

    }

});
//=============================== Donate =================================
app.get("/donate", (req, res) => {
    res.render("donate");
});

app.post("/donate", async (req, res) => {

    try {

        const newDonation = new Donation({

            name: req.body.name,
            email: req.body.email,
            amount: req.body.amount

        });

        await newDonation.save();

		await Activity.create({

		    message: `New Donation Received from ${req.body.name}`

		});


        res.redirect("/donate");

    } catch (error) {

        console.log(error);

        res.send("Donation Error");

    }

});
//=================================== DONATIONS PAGE=======================================


app.get("/donations",  isAdminLoggedIn,allowRoles("Admin"), async (req, res) => {
    try {

        const donations = await Donation.find();

        res.render("donations", { donations });

    } catch (error) {

        console.log(error);

        res.send("Error fetching donations");

    }

});


// ================= DELETE DONATION =================
app.get("/delete-donation/:id", async (req, res) => {

  try {

    await Donation.findByIdAndDelete(req.params.id);

    res.redirect("/donations");

  } catch (error) {

    console.log(error);

    res.send("Delete Donation Error");

  }

});

// ================= SEARCH VOLUNTEERS =================

app.get("/search-volunteers", async (req, res) => {

    try {

        const search = req.query.search;

        const volunteers = await Volunteer.find({

            $or: [

                { name: { $regex: search, $options: "i" } },

                { email: { $regex: search, $options: "i" } },

                { phone: { $regex: search, $options: "i" } }

            ]

        });

        let message = "";

        if (volunteers.length === 0) {

            message = "No Volunteer Found";

        }


           res.render("volunteers", {

	    volunteers,
	    message,
	    currentPage: 1,
	    totalPages: 1
        });

    } catch (error) {

        console.log(error);

        res.send("Search Error");

    }

});
//=====================Volunteer============================

app.get("/volunteer", (req, res) => {
    res.render("volunteer");
});


app.post("/volunteer", upload.single("photo"), async (req, res) => {

    try {

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const newVolunteer = new Volunteer({

            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            password: hashedPassword,
            role: req.body.role,
            photo: req.file.filename

        });

        await newVolunteer.save();

			await transporter.sendMail({

			    from: "prabhatsakrigali@gmail.com",

			    to: "prabhatsakrigali@gmail.com",

			    subject: "New Volunteer Added",

			    html: `

			        <h2>New Volunteer Registration</h2>

			        <p><strong>Name:</strong> ${req.body.name}</p>

			        <p><strong>Email:</strong> ${req.body.email}</p>

				<p><strong>Phone:</strong> ${req.body.phone}</p>

			        <p><strong>Role:</strong> ${req.body.role}</p>

			    `

			});

		await Activity.create({

		    message: `New Volunteer Added: ${req.body.name}`

		});

        res.redirect("/volunteer");

    } catch (error) {

        console.log(error);

        res.send("Error");

    }

});

//============== GROUP ROUTES =================

app.get("/create-group", (req, res) => {

    res.render("createGroup");

});

app.post("/create-group", async (req, res) => {

    try {

        const newGroup = new Group({

            groupName: req.body.groupName,
            leaderName: req.body.leaderName,
            totalMembers: req.body.totalMembers,
            workDetails: req.body.workDetails

        });

        await newGroup.save();

		await Activity.create({

		    message: `New Group Created: ${req.body.groupName}`

		});

        res.redirect("/groups");

    } catch (error) {

        console.log(error);

        res.send("Error Creating Group");

    }

});
// ================= SEARCH GROUPS =================
app.get("/search-groups", async (req, res) => {

    try {

        const search = req.query.search;

        const groups = await Group.find({

            $or: [

                { groupName: { $regex: search, $options: "i" } },

                { leaderName: { $regex: search, $options: "i" } },

                { workDetails: { $regex: search, $options: "i" } }

            ]

        });

        let message = "";

        if (groups.length === 0) {

            message = "No Group Found";

        }

	res.render("groups", {

	    groups,
	    message,

	    currentPage: 1,

	    totalPages: 1

	});

    } catch (error) {

        console.log(error);

        res.send("Group Search Error");

    }

});
// ================= SEARCH MEMBERS =================

app.get("/search-members", async (req, res) => {

    try {

        const search = req.query.search;

        const groups = await Group.find({

            "members.memberName": {

                $regex: search,
                $options: "i"

            }

        });

        let message = "";

        if (groups.length === 0) {

            message = "No Member Found";

        }
	res.render("groups", {

	    groups,
	    message,

	    currentPage: 1,

	    totalPages: 1

	});


    } catch (error) {

        console.log(error);

        res.send("Member Search Error");

    }

});

//======================================= Grpup ===========================
app.get(

    "/groups",

    allowRoles("Admin", "Leader"),

    async (req, res) => {

    try {

        const page = Number(req.query.page) || 1;

        const limit = 3;

        const skip = (page - 1) * limit;

        const total = await Group.countDocuments();

        const groups = await Group.find()

            .skip(skip)

            .limit(limit);

        const totalPages = Math.ceil(total / limit);

        res.render("groups", {

            groups,

            message: "",

            currentPage: page,

            totalPages

        });

    } catch (error) {

        console.log(error);

        res.send("Error Fetching Groups");

    }

});

//===================================== Edit-group ===============================
app.get("/edit-group/:id", async (req, res) => {

    try {

        const group = await Group.findById(req.params.id);

        res.render("editGroup", { group });

    } catch (error) {

        console.log(error);

        res.send("Edit Group Error");

    }

});

app.post("/update-group/:id", async (req, res) => {

    try {

        await Group.findByIdAndUpdate(req.params.id, {

            groupName: req.body.groupName,

            leaderName: req.body.leaderName,

            totalMembers: req.body.totalMembers,

            workDetails: req.body.workDetails

        });

        res.redirect("/groups");

    } catch (error) {

        console.log(error);

        res.send("Update Group Error");

    }

});

app.get("/delete-group/:id", async (req, res) => {

    try {

        await Group.findByIdAndDelete(req.params.id);

        res.redirect("/groups");

    } catch (error) {

        console.log(error);

        res.send("Delete Group Error");

    }

});

app.post("/add-member/:id", async (req, res) => {

    try {

        await Group.findByIdAndUpdate(

            req.params.id,

            {

                $push: {

                    members: {

				memberName: req.body.memberName,

				memberPhone: req.body.memberPhone

                    }

                }

            }

        );

        res.redirect("/groups");

    } catch (error) {

        console.log(error);

        res.send("Error Adding Member");

    }

});


app.get("/edit-member/:groupId/:memberId", async (req, res) => {

    try {

        const group = await Group.findById(req.params.groupId);

        const member = group.members.id(req.params.memberId);

        res.render("editMember", {

            group,
            member

        });

    } catch (error) {

        console.log(error);

        res.send("Edit Member Page Error");

    }

});

app.post("/update-member/:groupId/:memberId", async (req, res) => {

    try {

        const group = await Group.findById(req.params.groupId);

        const member = group.members.id(req.params.memberId);

        member.memberName = req.body.memberName;

        member.memberPhone = req.body.memberPhone;

        await group.save();

        res.redirect("/groups");

    } catch (error) {

        console.log(error);

        res.send("Update Member Error");

    }

});


app.get("/delete-member/:groupId/:memberId", async (req, res) => {

    try {

        const group = await Group.findById(req.params.groupId);

        group.members.pull(req.params.memberId);

        await group.save();

        res.redirect("/groups");

    } catch (error) {

        console.log(error);

        res.send("Delete Member Error");

    }

});

// ================= FILTER BY ROLE =================

app.get("/filter-role", async (req, res) => {

    try {

        const role = req.query.role;

		let volunteers;

		if (role === "All") {

		    volunteers = await Volunteer.find();

		} else {

		    volunteers = await Volunteer.find({

		        role: role

		    });

		}

        let message = "";

        if (volunteers.length === 0) {

            message = "No Volunteer Found";

        }

        res.render("volunteers", {

            volunteers,
            message,

	   currentPage: 1,

            totalPages: 1

        });

    } catch (error) {

        console.log(error);

        res.send("Role Filter Error");

    }

});

//====================================================================

app.get("/volunteers", isAdminLoggedIn, async (req, res) => {

    try {

        const page = Number(req.query.page) || 1;

        const limit = 5;

        const skip = (page - 1) * limit;

        const total = await Volunteer.countDocuments();

        const volunteers = await Volunteer.find()

            .skip(skip)

            .limit(limit);

        const totalPages = Math.ceil(total / limit);

        res.render("volunteers", {

            volunteers,

            message: "",

            currentPage: page,

            totalPages

        });

    } catch (error) {

        console.log(error);

        res.send("Error fetching volunteers");

    }

});

//====================================================================
app.get("/delete-volunteer/:id", async (req, res) => {

    try {

        await Volunteer.findByIdAndDelete(req.params.id);

        res.redirect("/volunteers");

    } catch (error) {

        console.log(error);

        res.send("Delete Error");

    }

});

app.get("/edit-volunteer/:id", async (req, res) => {

    try {

        const volunteer = await Volunteer.findById(req.params.id);

        res.render("editVolunteer", { volunteer });

    } catch (error) {

        console.log(error);

        res.send("Edit Error");

    }

});

app.post("/update-volunteer/:id", upload.single("photo"), async (req, res) => {

    try {

		const updateData = {

		    name: req.body.name,

		    email: req.body.email,

		    phone: req.body.phone

		};

		if (req.file) {

		    updateData.photo = req.file.filename;

		}

		await Volunteer.findByIdAndUpdate(

		    req.params.id,

		    updateData

		);


        res.redirect("/volunteers");

    } catch (error) {

        console.log(error);

        res.send("Update Error");

    }

});

app.post("/add-activity/:id", upload.single("activityImage"),async (req, res) => {

    try {

        const group = await Group.findById(req.params.id);

        group.activities.push({

            activityText: req.body.activityText,

            activityImage: req.file.filename

        });

        await group.save();

        res.redirect("/groups");

    } catch (error) {

        console.log(error);

        res.send("Activity Upload Error");

    }

});

// ================= EXPORT VOLUNTEERS PDF =================

app.get("/export-volunteers-pdf", async (req, res) => {

    try {

        const volunteers = await Volunteer.find();

        const doc = new PDFDocument();

        res.setHeader(

            "Content-Type",
            "application/pdf"

        );

        res.setHeader(

            "Content-Disposition",
            "attachment; filename=volunteers.pdf"

        );

        doc.pipe(res);

        doc.fontSize(20).text(

            "Niwala Foundation Volunteers Report",

            {

                align: "center"

            }

        );

        doc.moveDown();

        volunteers.forEach((volunteer, index) => {

            doc.fontSize(12).text(

                `${index + 1}. ${volunteer.name} | ${volunteer.email} | ${volunteer.role}`

            );

        });

        doc.end();

    } catch (error) {

        console.log(error);

        res.send("PDF Export Error");

    }

});

// ================= EXPORT DONATIONS EXCEL =================

app.get("/export-donations-excel", async (req, res) => {

    try {

        const donations = await Donation.find();

        const workbook = new ExcelJS.Workbook();

        const worksheet = workbook.addWorksheet("Donations");

        worksheet.columns = [

            { header: "Name", key: "name", width: 25 },

            { header: "Email", key: "email", width: 30 },

            { header: "Amount", key: "amount", width: 15 }

        ];

        donations.forEach((donation) => {

            worksheet.addRow({

                name: donation.name,

                email: donation.email,

                amount: donation.amount

            });

        });

        res.setHeader(

            "Content-Type",

            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

        );

        res.setHeader(

            "Content-Disposition",

            "attachment; filename=donations.xlsx"

        );

        await workbook.xlsx.write(res);

        res.end();

    } catch (error) {

        console.log(error);

        res.send("Excel Export Error");

    }

});
//=====================
app.get("/admin-profile", isAdminLoggedIn, async (req, res) => {

    try {

        const admin = await Admin.findById(

            req.session.userId

        );

        const totalVolunteers = await Volunteer.countDocuments();

        const totalGroups = await Group.countDocuments();

        const totalDonations = await Donation.countDocuments();

        res.render("adminProfile", {

            admin,

            totalVolunteers,

            totalGroups,

            totalDonations

        });

    } catch (error) {

        console.log(error);

        res.send("Admin Profile Error");

    }

});

//=====================
app.post(

    "/upload-admin-photo",

    upload.single("photo"),

    async (req, res) => {

    try {

        await Admin.findByIdAndUpdate(

            req.session.userId,

            {

                photo: req.file.filename

            }

        );

        res.redirect("/admin-profile");

    } catch (error) {

        console.log(error);

        res.send("Admin Photo Upload Error");

    }

});

//=============================== career-applications ==========
app.get("/career-applications", isAdminLoggedIn, async (req, res) => {

    try {

        const page = Number(req.query.page) || 1;

        const limit = 5;

        const skip = (page - 1) * limit;

        const total = await Career.countDocuments();

        const careers = await Career.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalPages = Math.ceil(total / limit);

        res.render("careerApplications", {

            careers,

            currentPage: page,

            totalPages

        });

    } catch (error) {

        console.log(error);

        res.send("Career Applications Error");

    }

});


//================================== Attendance ===========
app.get("/attendance", async (req, res) => {

    try {

        const page = parseInt(req.query.page) || 1;

        const limit = 10;

        const skip = (page - 1) * limit;

        const volunteers = await Volunteer.find();

		let filter = {};

		if (req.query.volunteer) {

		    filter.volunteerName = req.query.volunteer;

		}

		if (req.query.month) {

		    const [year, month] = req.query.month.split("-");

		    const startDate = new Date(year, month - 1, 1);

		    const endDate = new Date(year, month, 1);

		    filter.date = {

		        $gte: startDate,

		        $lt: endDate

		    };

		}


		if (req.query.date) {

		    const selectedDate = new Date(req.query.date);

		    const nextDate = new Date(selectedDate);

		    nextDate.setDate(nextDate.getDate() + 1);

		    filter.date = {

		        $gte: selectedDate,

		        $lt: nextDate

		    };

		}

		const attendance = await Attendance.find(filter)
		.sort({ date: -1 })
		.skip(skip)
		.limit(limit);

        const total = await Attendance.countDocuments(filter);

        const totalPages = Math.ceil(total / limit);


//=======================================================================================================================================================

const presentCount = await Attendance.countDocuments({

    ...filter,

    status: "Present"

});

const absentCount = await Attendance.countDocuments({

    ...filter,

    status: "Absent"

});

const leaveCount = await Attendance.countDocuments({

    ...filter,

    status: "Leave"

});

res.render("attendance", {

    volunteers,

    attendance,

    currentPage: page,

    totalPages,

    presentCount,

    absentCount,

    leaveCount

});
 //======================================================================================================================================================

     		    } catch (error) {

			        console.log(error);

			        res.send("Attendance Page Error");

			    }

			});
//==========================================================================================================
app.post("/mark-attendance", async (req, res) => {

    try {

        const volunteer = await Volunteer.findById(req.body.volunteerId);

        if (!volunteer) {

            return res.send("Volunteer Not Found");

        }

        const newAttendance = new Attendance({

            volunteerName: volunteer.name,

            role: volunteer.role,

            status: req.body.status

        });

        await newAttendance.save();

        res.redirect("/attendance");

    } catch (error) {

        console.log(error);

        res.send("Attendance Error");

    }

});



//====================
app.get("/delete-attendance/:id", async (req, res) => {

    try {

        await Attendance.findByIdAndDelete(req.params.id);

        res.redirect("/attendance");

    } catch (error) {

        console.log(error);

        res.send("Delete Attendance Error");

    }

});
// ================= GALLERY PAGE =================

app.get("/gallery", async (req, res) => {

    try {

        const gallery = await Gallery.find()
        .sort({ createdAt: -1 });

        res.render("gallery", {

             gallery,

             role: req.session.role

         });

    } catch (error) {

        console.log(error);

        res.send("Gallery Error");

    }

});

// ================= ADD GALLERY PAGE =================

app.get("/add-gallery",  isAdminLoggedIn,allowRoles("Admin"),(req, res) => {

    res.render("addGallery");

});

// ================= SAVE GALLERY IMAGE =================

app.post("/add-gallery",

    isAdminLoggedIn,

    allowRoles("Admin"),

    upload.single("image"),

    async (req, res) => {

    try {

        const newGallery = new Gallery({

            title: req.body.title,

            image: req.file.filename

        });

        await newGallery.save();

        res.redirect("/gallery");

    } catch (error) {

        console.log(error);

        res.send("Gallery Upload Error");

    }

});

// ================= DELETE GALLERY IMAGE =================

app.get(

    "/delete-gallery/:id",

    isAdminLoggedIn,

    allowRoles("Admin"),

    async (req, res) => {

    try {

        await Gallery.findByIdAndDelete(req.params.id);

        res.redirect("/gallery");

    } catch (error) {

        console.log(error);

        res.send("Delete Gallery Error");

    }

});
// ================= ADD EVENT PAGE =================

app.get(

    "/add-event",

    isAdminLoggedIn,

    allowRoles("Admin"),

    (req, res) => {

        res.render("addEvent");

});
// ================= SAVE EVENT =================

app.post(

    "/add-event",

    isAdminLoggedIn,

    allowRoles("Admin"),

    upload.single("banner"),

    async (req, res) => {

    try {

        const newEvent = new Event({

            title: req.body.title,

            description: req.body.description,

            date: req.body.date,

            location: req.body.location,

            banner: req.file.filename

        });

        await newEvent.save();

        await Activity.create({

            message: `New Event Added: ${req.body.title}`

        });

        res.redirect("/events");

    } catch (error) {

        console.log(error);

        res.send("Event Add Error");

    }

});
// ================= EVENTS PAGE =================

app.get("/events", async (req, res) => {

    try {

        const events = await Event.find()

        .sort({ date: 1 });

        res.render("events", {

            events,

            role: req.session.role

        });

    } catch (error) {

        console.log(error);

        res.send("Events Page Error");

    }

});
// ================= DELETE EVENT =================

app.get(

    "/delete-event/:id",

    isAdminLoggedIn,

    allowRoles("Admin"),

    async (req, res) => {

    try {

        await Event.findByIdAndDelete(req.params.id);

        res.redirect("/events");

    } catch (error) {

        console.log(error);

        res.send("Delete Event Error");

    }

});

// ================= VOLUNTEER ID CARD =================

app.get(

    "/volunteer-id/:id",

    isAdminLoggedIn,

    async (req, res) => {

    try {

        const volunteer = await Volunteer.findById(req.params.id);

        if (!volunteer) {

            return res.send("Volunteer Not Found");

        }

        const doc = new PDFDocument({

            size: [400,250],

            margin: 20

        });

        res.setHeader(

            "Content-Type",

            "application/pdf"

        );

        res.setHeader(

            "Content-Disposition",

            `inline; filename=${volunteer.name}-ID.pdf`

        );

        doc.pipe(res);

        // CARD BORDER

        doc.roundedRect(10, 10, 380, 230, 15)

        .stroke();

        // HEADER

        doc.rect(10, 10, 380, 50)

        .fill("#0d6efd");

        doc.fillColor("white")

        .fontSize(22)

        .text(

            "NIWALA FOUNDATION",

            70,

            25

        );

        // RESET COLOR

        doc.fillColor("black");

        // PHOTO

        if (volunteer.photo) {

            doc.image(

                `public/uploads/${volunteer.photo}`,

                25,

                75,

                {

                    width: 90,

                    height: 90

                }

            );

        }

        // ID NUMBER

        const volunteerId = `NF-${volunteer._id.toString().slice(-5)}`;

        // DETAILS

        doc.fontSize(14)

        .text(

            `ID: ${volunteerId}`,

            140,

            75

        );

        doc.text(

            `Name: ${volunteer.name}`,

            140,

            100

        );

        doc.text(

            `Role: ${volunteer.role}`,

            140,

            125

        );

        doc.text(

            `Email: ${volunteer.email}`,

            140,

            150

        );

        doc.text(

            `Phone: ${volunteer.phone}`,

            140,

            175

        );

        // FOOTER

        doc.fontSize(10)

        .fillColor("gray")

        .text(

            "Authorized NGO Volunteer",

            120,

            205

        );

        // SIGNATURE

        doc.fillColor("black")

        .text(

            "Director Signature",

            280,

            205

        );

        doc.end();

    } catch (error) {

        console.log(error);

        res.send("Volunteer ID Error");

    }

});
// ================= FINAL DYNAMIC CERTIFICATE =================

app.get( "/certificate/:id", isAdminLoggedIn, async (req, res) => {

    try {

        const volunteer = await Volunteer.findById(req.params.id);

        if (!volunteer) {

            return res.send("Volunteer Not Found");

        }

        const PDFDocument = require("pdfkit");

        const doc = new PDFDocument({

            layout: "landscape",

            size: "A4",

            margin: 0

        });

        // CERTIFICATE ID

        const certId = volunteer._id
            .toString()
            .slice(-5)
            .toUpperCase();

		let certificate = await Certificate.findOne({

		    volunteerId: volunteer._id

		});

		if (!certificate) {

		    certificate = await Certificate.create({

		        volunteerId: volunteer._id,

		        certificateId: certId

		    });

		}

	        const baseUrl = process.env.BASE_URL;

		console.log("Host =", req.get("host"));
		console.log("Protocol =", req.protocol);

		const qrData = `${baseUrl}/verify/${certId}`;

                console.log("QR URL =", qrData);

		const qrImage = await QRCode.toDataURL(qrData);

        // CURRENT DATE

        const currentDate = new Date().toDateString();

        res.setHeader(

            "Content-Type",

            "application/pdf"

        );

        res.setHeader(

            "Content-Disposition",

            `inline; filename=${volunteer.name}-certificate.pdf`

        );

        doc.pipe(res);

        // =====================================================
        // TEMPLATE IMAGE
        // =====================================================

        doc.image(

            "public/certificates/certificate-template.png",

            0,

            0,

            {

                width: 842,

                height: 595

            }

        );

        // =====================================================
        // CERTIFICATE ID
        // =====================================================

		doc.fontSize(14)

		.fillColor("black")

		.text(

		    certId,

		    645,

		    83,

		    {

		        width: 95,

		        align: "center"

		    }

		);

        // =====================================================
        // VOLUNTEER PHOTO
        // =====================================================

        if (volunteer.photo) {

            doc.image(

                `public/uploads/${volunteer.photo}`,

               58,

               190,

                {

	            fit: [85,125],

	            align: "center",

	            valign: "center"

                }

            );

        }

		// =====================================================
		// NAME BACKGROUND
		// =====================================================

		doc.roundedRect(

		    255,

		    272,

		    320,

		    32,

		    5

		)

		.fillOpacity(0.75)

		.fillAndStroke(

		    "white",

		    "white"

		);

		doc.fillOpacity(1);

		// =====================================================
		// VOLUNTEER NAME
		// =====================================================

		doc.font("Helvetica-Bold");

		doc.fontSize(32);

		doc.fillColor("#7a4b00");

		doc.text(

		    volunteer.name,

		    230,

		    272,

		    {

		        width: 380,

		        align: "center"

		    }

		);

        // =====================================================
        // ROLE
        // =====================================================

        doc.fontSize(15)

        .fillColor("white")

        .text(

            volunteer.role.toUpperCase(),

            345,

            371,

            {

                width: 120,

                align: "center"

            }

        );

        // =====================================================
        // DATE
        // =====================================================

        doc.fontSize(12)

        .fillColor("black")

        .text(

            currentDate,

            95,

            529

        );

		// =====================================================
		// QR CODE
		// =====================================================

		doc.image(

		    qrImage,

		    50,

		    350,

		    {

		        width: 90,

		        height: 90

		    }

		);

        doc.end();

    } catch (error) {

        console.log(error);

        res.send("Certificate Error");

    }

});

// =====================================================
// CERTIFICATE VERIFICATION
// =====================================================

app.get(

    "/verify/:certificateId",

    async (req, res) => {

    try {

        const certificate = await Certificate.findOne({

            certificateId: req.params.certificateId

        }).populate("volunteerId");

        if (!certificate) {

            return res.send(

                "<h1>Invalid Certificate</h1>"

            );

        }

        res.render(

            "verify-certificate",

            {

                certificate

            }

        );

    } catch (error) {

        console.log(error);

        res.send(

            "Verification Error"

        );

    }

});


//========================================================
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

