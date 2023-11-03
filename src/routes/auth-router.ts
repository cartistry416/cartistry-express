import express from 'express'
const router = express.Router()
import AuthController from '../controllers/auth-controller.js'; 
// const AuthController = require('../controllers/auth-controller.ts')



router.post('/register', AuthController.registerUser)
router.post('/login', AuthController.loginUser)
router.get('/logout', AuthController.logoutUser)
router.get('/loggedIn', AuthController.getLoggedIn)


// module.exports = router

// export {router}
const authRouter = router
export {authRouter}