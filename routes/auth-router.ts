const express = require('express')
const router = express.Router()
import {AuthController} from '../controllers/auth-controller'; //require('../controllers/auth-controller')

router.post('/register', AuthController.registerUser)
router.post('/login', AuthController.loginUser)
router.get('/logout', AuthController.logoutUser)
router.get('/loggedIn', AuthController.getLoggedIn)


module.exports = router