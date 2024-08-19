const express = require('express');
const verifyToken = require('../middlewares/verifyToken')
const { addition } = require('../review');

const router = express.Router();

router.use(express.json());

router.post('/addition', verifyToken, addition);

module.exports = router;