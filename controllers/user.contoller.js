const UserModel = require("../models/user.model");
const express = require("express");
const app = express();
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const cloudinary = require("cloudinary").v2

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_KEY,
    api_secret : process.env.CLOUD_SECRET
})

let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.APP_EMAIL,
        pass: process.env.APP_PASSWORD
    }
});

const registerUser = async (req, res) => {
    const { firstname, lastname, password, email, tag, photo } = req.body;
    try {
        const saltround = await bcryptjs.genSalt(10);
        const hashPass = await bcryptjs.hash(password, saltround);

        const verificationCode = Math.floor(1000000 + Math.random() * 9000000).toString()

        const number = `${Math.ceil(Math.random() * 10000000)}`.padStart(7, "0")
        const generatedAccount = `AUG${number}`

        // const image = await cloudinary.uploader.upload(photo, {resource_type: "image"})

        const user = await UserModel.create({
            firstname,
            lastname,
            email,
            password: hashPass,
            verificationCode,
            accountNumber: generatedAccount,
            // public_id: image.public_id
        });

        const token = await jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "2h", algorithm: "HS256" },
        );


        let mailOptions = {
            from: process.env.APP_EMAIL,
            // to: 'Tipheisaac007@gmail.com',
            bcc : ["Tipheisaac007@gmail.com", "Theferanmisaac@gmail.com"],
            subject: `Welcome to AugBank ${firstname}`,
            text: `Welcome to August Bank, where transaction is made easy, your account number is ${user.accountNumber}`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });


        res.status(201).send({
            message: "user created successfully",
            data: {
                firstname,
                lastname,
                email,
                token,
                role: user.role,
                tag: tag ? tag : null,
                accountNumber: generatedAccount,
                balance: user.balance,
                // photo: user.profilePicture.secure_url
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).send({
                message: "Email or tag already exists",
            });
        } else {
            console.log(error);

            res.status(400).send({
                message: "User cannot be created at this time",
            });
        }
    }
};

const registerOperator = async (req, res) => {
    const {
        firstname,
        lastname,
        password,
        email,
        tag
    } = req.body;
    try {
        const saltround = await bcryptjs.genSalt(10);
        const hashPass = await bcryptjs.hash(password, saltround);

        const user = await UserModel.create({
            firstname,
            lastname,
            email,
            password: hashPass,
            role: "operator"
        });

        const token = await jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "10m", algorithm: "HS256" },
        );

        res.status(201).send({
            message: "Operator created successfully",
            data: {
                firstname,
                lastname,
                email,
                role: user.role,
                tag: tag ? tag : null,
                token
            },
        });
    } catch (error) {
        if (error.code === 11000) {
            res.status(400).send({
                message: "Operator already exists",
            });
        } else {
            console.log(error);

            res.status(400).send({
                message: "Operator cannot be created at this time",
            });
        }
    }
};

const getUser = async (req, res) => {
    const { id } = req.user;
    try {
        const user = await UserModel.findById(id)


        if (!user) {
            res.status(400).send({
                message: "User not found",
            });
        }


        res.status(200).send({
            message: "User profile fetched successfully",
            date: user
        });
    } catch (error) {

        console.log(error);

        res.status(404).send({
            message: "User cannot be fetched at this time",
        });
    }
};

const getUserByOperator = async (req, res) => {
    const { id, role } = req.user;
    console.log(role);

    const { userId } = req.params
    try {
        if (role !== "admin" && role !== "operator") {

            res.status(403).send({
                message: "Forbidden resource",
            });
            return;
        }

        const user = await UserModel.findById(userId).populate("accountNumber");

        if (!user) {
            console.log(error);

            res.status(400).send({
                message: "User not found",
            });
            return
        }
        res.status(200).send({
            message: "User profile fetched successfully",
            date: user
        });
    } catch (error) {
        console.log(error);

        res.status(404).send({
            message: "User profile cannot be fetched at this time",
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const isUser = await UserModel.findOne({ email }).select("+password");

        if (!isUser) {
            res.status(400).send({
                message: "Account does not exist",
            });

            return;
        }

        const isMatch = await bcryptjs.compare(password, isUser.password);
        if (!isMatch) {
            res.status(400).send({
                message: "Invalid credentials",
            });

            return;
        }

        // const userData = isUser.toObject();
        // delete userData.password;
        const token = jwt.sign(
            { id: isUser._id, role: isUser.role },
            process.env.JWT_SECRET,
            {
                expiresIn: "5h",
                algorithm: "HS256",
            },
        );

        // res.status(201).send({
        //     message: "Login successful",
        //     data: {
        //         firstname: isUser.firstname,
        //         lastname: isUser.lastname,
        //         email: isUser.email,
        //         token,
        //     },
        // });
        res.status(200).send({
            message: "Login Successful",
            data: {
                firstname: isUser.firstname,
                lastname: isUser.lastname,
                email: isUser.email,
                token,
                tag: isUser.tag ? isUser.tag : null,
                role: isUser.role,
                balance: isUser.balance
            },
        });
    } catch (error) {
        console.log(error);

        res.status(400).send({
            message: "Invalid credentials",
        });
    }
};

const loginOperator = async (req, res) => {
    try {
        const { email, password } = req.body;

        const isOperator = await UserModel.findOne({ email }).select("+password");

        if (!isOperator) {
            res.status(400).send({
                message: "Account does not exist",
            });

            return;
        }

        const isMatch = await bcryptjs.compare(password, isOperator.password);
        if (!isMatch) {
            res.status(400).send({
                message: "Invalid credentials",
            });

            return;
        }

        // const userData = isUser.toObject();
        // delete userData.password;
        const token = jwt.sign(
            { id: isOperator._id, role: isOperator.role },
            process.env.JWT_SECRET,
            {
                expiresIn: "5h",
                algorithm: "HS256",
            },
        );

        // res.status(201).send({
        //     message: "Login successful",
        //     data: {
        //         firstname: isUser.firstname,
        //         lastname: isUser.lastname,
        //         email: isUser.email,
        //         token,
        //     },
        // });
        res.status(200).send({
            message: "Login Successful",
            data: {
                firstname: isOperator.firstname,
                lastname: isOperator.lastname,
                email: isOperator.email,
                token,
                role,
                tag: isOperator.tag ? isOperator.tag : null
            },
        });
    } catch (error) {
        res.status(400).send({
            message: "Invalid credentials",
        });
    }
};

const verifyUser = async (req, res, next) => {
    try {
        const token = req.headers["authorization"].split(" ")[1]
            ? req.headers["authorization"].split(" ")[1]
            : req.headers["authorization"].split(" ")[0];

        const user = await jwt.verify(
            token,
            process.env.JWT_SECRET,
            function (err, decoded) {
                if (err) {
                    console.log(error);

                    res.status(401).send({
                        message: "User unauthorized!",
                    });
                    return;
                }

                req.user = decoded;
                console.log(decoded);

                next();
            },
        );
    } catch (error) {
        console.log(error);

        res.status(401).send({
            message: "User unauthorized!",
        });
        return;
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params;
    const { role } = req.user
    const { firstname, lastname } = req.body
    try {
        if (role !== "operator" && role !== "admin") {
            res.status(403).send({
                message: "Forbidden resource",
            });
            return;
        }

        const allowedUpdate = {
            ...(firstname && { firstname: firstname.trim() }),
            ...(lastname && { lastname: lastname.trim() })
        }

        const updateUser = await UserModel.findByIdAndUpdate({ id }, allowedUpdate, { returnDocument: "after", runValidators })

        if (!updateUser) {
            res.status(400).send({
                message: "Cannot update user at this time",
            });
        }

        res.status(200).send({
            message: "User updated successfully",
        });
    } catch (error) {
        console.log(error);

        res.status(500).send({
            message: "Cannot update user",
        });
        return;
    }
}

const updateUserPassword = async (req, res) => {
    const { id } = req.params;
    const { role } = req.user
    const { currentpassword, newpassword } = req.body
    try {
        if (role !== "operator" && role !== "admin") {
            res.status(403).send({
                message: "Forbidden resource",
            });
            return;
        }

        const allowedUpdate = {
            ...(firstname && { firstname: firstname.trim() }),
            ...(lastname && { lastname: lastname.trim() })
        }

        const updatehashPass = await bcryptjs.hash(password, saltround);

        const updateUser = await UserModel.findByIdAndUpdate({ id }, allowedUpdate, { returnDocument: "after", runValidators })

        if (!updateUser) {
            res.status(400).send({
                message: "Cannot update password at this time",
            });
        }

        res.status(200).send({
            message: "Password updated successfully",
        });
    } catch (error) {
        console.log(error);

        res.status(500).send({
            message: "Cannot update password",
        });
        return;
    }
}

const resolveAccount = async (req, res) => {
    const { accountNumber } = req.params

    try {
        const user = await UserModel.findOne({ accountNumber })
        if (!user) {
            res.status(404).send({
                message: "Account doesn't exit",
            });
            return;
        }

        res.status(200).send({
            message: "Account doesn't exit",
            data: {
                accountname: user.firstname + " " + user.lastname,
                tag: user.tag ? user.tag : null,
                id: user._id
            }
        });

    } catch (error) {
        console.log(error);

        res.status(500).send({
            message: "Cannot resolve account number",
        });
    }
}

module.exports = {
    registerUser,
    loginUser,
    loginOperator,
    getUser,
    verifyUser,
    updateUser,
    getUserByOperator,
    registerOperator,
    resolveAccount,
    updateUserPassword
};
