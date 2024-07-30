const express = require('express');
const { join, login, logout } = require('../auth');

const router = express.Router();

router.use(express.json());

router.post('/join', join);
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;
