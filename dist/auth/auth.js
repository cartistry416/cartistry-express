import jwt from 'jsonwebtoken';
//const jwt = require("jsonwebtoken")
const verify = (req, res, next) => {
    // console.log("req: " + req);
    // console.log("next: " + next);
    // console.log("Who called verify?");
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({
                loggedIn: false,
                user: null,
                errorMessage: "Unauthorized"
            });
        }
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        //console.log("verified.userId: " + verified.userId);
        req.userId = verified.userId;
        next();
    }
    catch (err) {
        console.error(err);
        return res.status(401).json({
            loggedIn: false,
            user: null,
            errorMessage: "Unauthorized"
        });
    }
};
const optionalVerify = (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            next();
            return;
        }
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = verified.userId;
        next();
    }
    catch (err) {
        req.userId = null;
        next();
    }
};
const verifyUser = (req) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return null;
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        return decodedToken.userId;
    }
    catch (err) {
        return null;
    }
};
const signToken = (userId) => {
    return jwt.sign({
        userId: userId
    }, process.env.JWT_SECRET);
};
const auth = {
    verify,
    verifyUser,
    signToken,
    optionalVerify
};
// module.exports = auth;
export default auth;
