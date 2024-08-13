const express = require('express');
const { getDetails } = require('../detail');

const router = express.Router();

router.use(express.json());

router.get('/', getDetails);

module.exports = router;
