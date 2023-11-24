var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// const auth = require('../auth')
import auth from '../auth/auth.js';
import { UserModel } from '../models/user-model.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import querystring from 'querystring';
import https from 'https';
const getLoggedIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let userId = auth.verifyUser(req);
        if (!userId) {
            return res.status(500).json({
                loggedIn: false,
                user: null,
                errorMessage: "???"
            });
        }
        const loggedInUser = yield UserModel.findOne({ _id: userId });
        if (!loggedInUser) {
            return res.status(500).json({
                loggedIn: false,
                user: null,
                errorMessage: "???"
            });
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
        });
    }
    catch (err) {
        // console.log("err: " + err);
        return res.status(500).json(false);
    }
});
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log("loginUser");
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res
                .status(400)
                .json({ errorMessage: "Please enter all required fields." });
        }
        const existingUser = yield UserModel.findOne({ email: email });
        // console.log("existingUser: " + existingUser);
        if (!existingUser) {
            return res
                .status(401)
                .json({
                errorMessage: "Wrong email or password provided."
            });
        }
        // console.log("provided password: " + password);
        const passwordCorrect = yield bcrypt.compare(password, existingUser.passwordHash);
        if (!passwordCorrect) {
            // console.log("Incorrect password");
            return res
                .status(401)
                .json({
                errorMessage: "Wrong email or password provided."
            });
        }
        // LOGIN THE USER
        const token = auth.signToken(existingUser._id);
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: 'None'
        }).status(200).json({
            success: true,
            user: {
                userName: existingUser.userName,
                email: existingUser.email,
                isAdmin: existingUser.isAdmin,
                userId: existingUser._id
            }
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send();
    }
});
const logoutUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.cookie("token", "", {
        httpOnly: true,
        expires: new Date(0),
        secure: true,
        sameSite: "none"
    }).send();
});
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            });
        }
        //console.log("password and password verify match");
        let existingUser = yield UserModel.findOne({ email: email });
        if (existingUser) {
            return res
                .status(400)
                .json({
                success: false,
                errorMessage: "An account with this email address already exists."
            });
        }
        existingUser = yield UserModel.findOne({ userName: userName });
        if (existingUser) {
            return res
                .status(400)
                .json({
                success: false,
                errorMessage: "An account with this username already exists."
            });
        }
        const saltRounds = 10;
        const salt = yield bcrypt.genSalt(saltRounds);
        const passwordHash = yield bcrypt.hash(password, salt);
        //console.log("passwordHash: " + passwordHash);
        const newUser = ({
            userName, email, passwordHash
        });
        const savedUser = new UserModel(newUser);
        yield savedUser.save();
        //console.log("new user saved: " + savedUser._id);
        return res.status(200).json({
            success: true,
            user: {
                userName: savedUser.userName,
                email: savedUser.email,
                isAdmin: savedUser.isAdmin,
                userId: savedUser._id
            }
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send();
    }
});
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    // console.log(body)
    if (!body || !body.newPassword || !body.confirmPassword) {
        return res.status(400).json({ sucess: false, errorMessage: "Body is missing newPassword or confirmPassword" });
    }
    const { newPassword, confirmPassword } = body;
    if (newPassword !== confirmPassword) {
        return res.status(400).json({ sucess: false, errorMessage: "Passwords do not match" });
    }
    if (newPassword.length < 8) {
        return res
            .status(400)
            .json({
            success: false,
            errorMessage: "Please enter a password of at least 8 characters."
        });
    }
    try {
        let userId = auth.verifyUser(req);
        if (!userId) {
            return res.status(500).json({
                loggedIn: false,
                user: null,
                errorMessage: "???"
            });
        }
        const loggedInUser = yield UserModel.findOne({ _id: userId });
        if (!loggedInUser) {
            return res.status(500).json({
                loggedIn: false,
                user: null,
                errorMessage: "???"
            });
        }
        const saltRounds = 10;
        const salt = yield bcrypt.genSalt(saltRounds);
        const passwordHash = yield bcrypt.hash(newPassword, salt);
        loggedInUser.passwordHash = passwordHash;
        yield loggedInUser.save();
        const token = auth.signToken(loggedInUser._id);
        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: true
        }).json({
            loggedIn: true,
            user: {
                userName: loggedInUser.userName,
                email: loggedInUser.email,
                isAdmin: loggedInUser.isAdmin,
                userId
            }
        });
    }
    catch (err) {
        // console.log("err: " + err);
        return res.status(500).json(false);
    }
});
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        const user = yield UserModel.findOne({ email });
        if (!user) {
            return res.status(400).send('User with given email does not exist.');
        }
        const token = crypto.randomBytes(2).toString('hex'); // generates a 4-digit hex token
        const resetToken = yield bcrypt.hash(token, 10);
        const tokenExpiration = new Date(Date.now() + 600000); // token expires in 10 min
        user.resetPasswordToken = resetToken;
        user.resetTokenExpiration = tokenExpiration;
        yield user.save();
        const mailOptions = {
            from: 'cartistry416@gmail.com',
            to: email,
            subject: 'Password Reset Code',
            text: `Here is your password reset code: ${resetToken}`
        };
        const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
        const options = {
            redirect_uri: 'https://main.d2cpsfn3mxqyu2.amplifyapp.com/',
            client_id: process.env.CLIENT_ID,
            response_type: 'code',
            scope: [
                'https://www.googleapis.com/auth/gmail.send'
            ].join(' '),
            access_type: 'offline',
            include_granted_scopes: 'true',
            state: 'state_parameter_passthrough_value' // Should be a random string
        };
        const url = `${rootUrl}?${querystring.stringify(options)}`;
        const postData = querystring.stringify({
            code: 'Your authorization code',
            client_id: 'Your client ID',
            client_secret: 'Your client secret',
            redirect_uri: 'Your redirect URI',
            grant_type: 'authorization_code'
        });
        const options2 = {
            hostname: 'oauth2.googleapis.com',
            port: 443,
            path: '/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        // Make the request
        const req = https.request(options2, (res) => {
            console.log(`statusCode: ${res.statusCode}`);
            res.on('data', (d) => {
                process.stdout.write(d);
                // Here you will get the response which includes the access_token and refresh_token
            });
        });
        req.on('error', (e) => {
            console.error(e);
        });
        // Write the postData to the request body
        req.write(postData);
        req.end();
        // const transporter = nodemailer.createTransport({
        //   service: 'gmail',
        //   auth: {
        //     type: 'OAuth2',
        //     user: 'cartistry416@gmail.com',
        //     pass: process.env.EMAIL_PASS,
        //     clientId: process.env.CLIENT_ID,
        //     clientSecret: process.env.CLIENT_SECRET,
        //   }
        // });
        // await transporter.sendMail(mailOptions, (err, info) =>{
        //   if (err) {
        //     return res.status(500).send();
        //   }
        // });
        res.status(200).json({ url: url });
    }
    catch (error) {
        res.status(500).send('Error in sending email.');
    }
});
// export default AuthController
const AuthController = { getLoggedIn, registerUser, loginUser, logoutUser, resetPassword, forgotPassword };
// export {AuthController}
export default AuthController;
// module.exports = {
//     getLoggedIn,
//     registerUser,
//     loginUser,
//     logoutUser
// }
