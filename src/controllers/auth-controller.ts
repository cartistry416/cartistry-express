// const auth = require('../auth')
import auth from '../auth/auth.js'
import { UserModel, UserDocument } from '../models/user-model.js'

import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import nodemailer from 'nodemailer';
import querystring from 'querystring'
import https from 'https'
import { google } from 'googleapis';
const { OAuth2 } = google.auth;


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
            },
            likedPosts: existingUser.likedPosts
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

const resetPassword = async (req, res) => {
    const body = req.body
    // console.log(body)
    if (!body|| !body.newPassword || !body.confirmPassword) {
        return res.status(400).json({success: false, errorMessage: "Body is missing newPassword or confirmPassword"})
    }

    const { newPassword, confirmPassword } = body;
    if (newPassword !== confirmPassword) {
        return res.status(400).json({success: false, errorMessage: "Passwords do not match"})
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
        
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        loggedInUser.passwordHash = passwordHash
        await loggedInUser.save()

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
        })
    } catch (err) {
        // console.log("err: " + err);
        return res.status(500).json(false);
    }
}

const requestPasswordToken = async (req, res)=> {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({success: false, errorMessage: "Please provide your email."})
  }
  try {
    const user = await UserModel.findOne({ email: email });
    if (!user) {
      return res.status(400).json({success: false, errorMessage: 'User with given email does not exist.'});
    }

    const token = crypto.randomBytes(2).toString('hex'); // generates a 4-digit hex token
    const resetToken = await bcrypt.hash(token, 10);
    const tokenExpiration = Date.now() + 3600000; // token expires in 10 min

    user.resetPasswordToken = resetToken
    user.resetTokenExpiration = tokenExpiration
    await user.save()
  
    const mailOptions = {
      from: 'cartistry416@gmail.com',
      to: email,
      subject: 'Cartistry One Time Token',
      text: `Dear Map Enthusiast,\nHere is your one time reset code: ${token}`
    };

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
            user: 'cartistry416@gmail.com',
            pass: process.env.EMAIL_PASS
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    await transporter.sendMail(mailOptions, (error, info) => {  
      if (error) {
        console.log(error);
      } else {
        console.log("Message sent: %s", info.messageId);
      }
    });

    return res.status(200).json({success: true, token: token})
  } catch (error) {
    res.status(500).json({success: false, errorMessage: 'Error in sending email.'});
  }
}

const verifyToken = async (req, res) => {
  const { email, token } = req.body
  if (!token) {
    return res.status(400).json({success: false, errorMessage: "Please provide your token."})
  }
  if (!email) {
    return res.status(400).json({success: false, errorMessage: "Please provide your email."})
  }
  try {
    const user = await UserModel.findOne({ email: email });
    const tokenCorrect = await bcrypt.compare(token, user.resetPasswordToken)
    if (!tokenCorrect) {
      return res.status(400).json({success: false, errorMessage: "Incorrect Token."})
    }
    if (Date.now() > user.resetTokenExpiration){
      return res.status(400).json({success: false, errorMessage: "Token is expired."})
    }
    res.status(200).json({success: true})
  } catch (error) {
    res.status(500).json({success: false, errorMessage: 'Error in verifying token.'});
  }
}

const resetForgotPassword = async (req, res) => {
  const body = req.body
  if (!body|| !body.newPassword || !body.confirmPassword) {
      return res.status(400).json({success: false, errorMessage: "Body is missing newPassword or confirmPassword"})
  }

  const { newPassword, confirmPassword } = body;
  if (newPassword !== confirmPassword) {
      return res.status(400).json({success: false, errorMessage: "Passwords do not match"})
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
      if (!body.email) {
          return res.status(500).json({
              loggedIn: false,
              user: null,
              errorMessage: "An unexpected error occured."
          })
      }

      const loggedInUser = await UserModel.findOne({ email: body.email });
      if (!loggedInUser) {
          return res.status(500).json({
              loggedIn: false,
              user: null,
              errorMessage: "???"
          })
      }
      
      const saltRounds = 10;
      const salt = await bcrypt.genSalt(saltRounds);
      const passwordHash = await bcrypt.hash(newPassword, salt);
      loggedInUser.passwordHash = passwordHash
      await loggedInUser.save()

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
              userId: loggedInUser._id
          }
      })
  } catch (err) {
      // console.log("err: " + err);
      return res.status(500).json(false);
  }
}

// export default AuthController
const AuthController = {getLoggedIn, registerUser, loginUser, logoutUser, resetPassword, requestPasswordToken, verifyToken, resetForgotPassword}
// export {AuthController}
export default AuthController

// module.exports = {
//     getLoggedIn,
//     registerUser,
//     loginUser,
//     logoutUser
// }