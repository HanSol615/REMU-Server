const express = require('express');
const verifyToken = require('../middlewares/verifyToken')
const { join, login, logout, changePassword, deleteUser } = require('../auth');

const router = express.Router();

router.use(express.json());

router.post('/join', join);
router.post('/login', login);
router.post('/logout', verifyToken, logout);
router.patch('/changePassword',verifyToken, changePassword);
router.delete('/deleteUser', verifyToken, deleteUser);

module.exports = router;
