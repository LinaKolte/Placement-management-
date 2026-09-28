const express = require("express");

const router = express.Router();

const {
	register,
	login,
	googleLogin,
	requestAdminPasswordReset,
	confirmAdminPasswordReset,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/admin/password-reset/request", requestAdminPasswordReset);
router.post("/admin/password-reset/confirm", confirmAdminPasswordReset);

module.exports = router;