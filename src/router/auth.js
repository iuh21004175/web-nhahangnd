const express = require('express');
const router = express.Router();
const CtrlKhachHang = require('../controllers/CtrlKhachHang');
// Đăng nhập với Google
router.get('/google', CtrlKhachHang.googleAuth);
// Callback sau khi đăng nhập thành công
router.get('/google/callback', CtrlKhachHang.googleCallback);
// Đăng nhập với Facebook
router.get('/facebook', CtrlKhachHang.facebookAuth);
// Callback sau khi đăng nhập thành công
router.get('/facebook/callback', CtrlKhachHang.facebookCallback);

module.exports = router;