// const auth = require('../auth')
import auth from '../auth/auth.js'
import { UserModel, UserDocument } from '../models/user-model.js'

import bcrypt from 'bcryptjs'
// const bcrypt = require('bcryptjs')



const getLoggedIn = async (req, res) => {
    try {
        let userId = auth.verifyUser(req);
        if (!userId) {
            return res.status(500).json({
                loggedIn: false,
                user: null,
                errorMessage: "???"
            })
        }

        const loggedInUser = await UserModel.findOne({ _id: userId });
        if (!loggedInUser) {
            return res.status(500).json({
                loggedIn: false,
                user: null,
                errorMessage: "???"
            })
        }
        // console.log("loggedInUser: " + loggedInUser);

        return res.status(200).json({ 
            loggedIn: true,
            user: {
                userName: loggedInUser.userName,
                email: loggedInUser.email,
                isAdmin: loggedInUser.isAdmin,
                userId
            }
        })
    } catch (err) {
        // console.log("err: " + err);
        return res.status(500).json(false);
    }
}

const loginUser = async (req, res) => {
    // console.log("loginUser");
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res
                .status(400)
                .json({ errorMessage: "Please enter all required fields." });
        }

        const existingUser = await UserModel.findOne({ email: email });
        // console.log("existingUser: " + existingUser);
        if (!existingUser) {
            return res
                .status(401)
                .json({
                    errorMessage: "Wrong email or password provided."
                })
        }

        // console.log("provided password: " + password);
        const passwordCorrect = await bcrypt.compare(password, existingUser.passwordHash);
        if (!passwordCorrect) {
            // console.log("Incorrect password");
            return res
                .status(401)
                .json({
                    errorMessage: "Wrong email or password provided."
                })
        }

        // LOGIN THE USER
        const token = auth.signToken(existingUser._id);
        // console.log(token);

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: true
        }).status(200).json({
            success: true,
            user: {
                userName: existingUser.userName,
                email: existingUser.email,
                isAdmin: existingUser.isAdmin,
                userId: existingUser._id         
            }
        })

    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
}

const logoutUser = async (req, res) => {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
        secure: true,
        sameSite: "none"
    }).send();
}

const registerUser = async (req, res) => {
    try {
        const { userName, email, password, passwordVerify } = req.body;
        //console.log("create user: " + userName + " " + email + " " + password + " " + passwordVerify);
        if (!userName || !email || !password || !passwordVerify) {
            return res
                .status(400)
                .json({ success: false,
                    errorMessage: "Please enter all required fields." });
        }
        //console.log("all fields provided");
        if (password.length < 8) {
            return res
                .status(400)
                .json({
                    success: false,
                    errorMessage: "Please enter a password of at least 8 characters."
                });
        }
        //console.log("password long enough");
        if (password !== passwordVerify) {
            return res
                .status(400)
                .json({
                    success: false,
                    errorMessage: "Please enter the same password twice."
                })
        }
        //console.log("password and password verify match");
        let existingUser = await UserModel.findOne({ email: email });

        if (existingUser) {
            return res
                .status(400)
                .json({
                    success: false,
                    errorMessage: "An account with this email address already exists."
                })
        }
        existingUser = await UserModel.findOne({userName: userName});
        if (existingUser) {
            return res
            .status(400)
            .json({
                success: false,
                errorMessage: "An account with this username already exists."
            })
        }

        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const passwordHash = await bcrypt.hash(password, salt);
        //console.log("passwordHash: " + passwordHash);

        const newUser = ({
            userName, email, passwordHash
        });
        const savedUser = new UserModel(newUser);
        await savedUser.save()
        //console.log("new user saved: " + savedUser._id);

        return res.status(200).json({
            success: true,
            user: {
                userName: savedUser.userName,
                email: savedUser.email,
                isAdmin: savedUser.isAdmin,
                userId: savedUser._id          
            }
        })
    } catch (err) {
        console.error(err);
        res.status(500).send();
    }
}

// export default AuthController
const AuthController = {getLoggedIn, registerUser, loginUser, logoutUser}
// export {AuthController}
export default AuthController

// module.exports = {
//     getLoggedIn,
//     registerUser,
//     loginUser,
//     logoutUser
// }