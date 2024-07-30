const express = require('express');
const { join, login } = require('../auth');

const router = express.Router();

router.use(express.json());

router.post('/join', join);
router.post('/login', login);
module.exports = router;
