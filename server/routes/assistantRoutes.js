const express = require('express');
const { authenticate, allowRoles } = require('../middleware/auth');
const { chat } = require('../controllers/assistantController');

const router = express.Router();

router.post('/chat', authenticate, allowRoles('student'), chat);

module.exports = router;
