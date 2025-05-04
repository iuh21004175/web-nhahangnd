const express = require('express');
const router = express.Router();
const CtrlTrangChu = require('../controllers/CtrlTrangChu');
const CtrlKhachHang = require('../controllers/CtrlKhachHang');
const CtrlThucDon = require('../controllers/CtrlThucDon');
const CtrlDonHang = require('../controllers/CtrlDonHang');
const jwt = require('jsonwebtoken');

router.use((req, res, next) => {
    const excludedRoutes = ['/', '/thuc-don', '/gioi-thieu'];
    if (excludedRoutes.includes(req.path)) {
        // Nếu là / thì kiểm tra xem có cookie không
        const token = req.cookies.AuthTokenCustomer;
        // Kiểm tra luồng hiện tại có phải / hay không
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Lưu thông tin vào res.locals.user
            res.locals.user = {
                id: decoded.id,
                ten: decoded.ten,
                luuDangNhap: decoded.luuDangNhap,
                hinhAnh: decoded.hinhAnh,
                provider: decoded.provider,
                accessToken: decoded.accessToken
            }
            // Kiểm tra luuDangNhap
            if (!decoded.luuDangNhap) {
                // Nếu false, tạo lại cookie với thời gian sống mới
                const newToken = jwt.sign({ id: decoded.id, ten: decoded.ten, luuDangNhap: decoded.luuDangNhap, hinhAnh: decoded.hinhAnh }, process.env.JWT_SECRET, { expiresIn: '1h' });
                res.cookie('AuthTokenCustomer', newToken, {
                    httpOnly: true,
                    maxAge: 1000 * 60 * 60 // 1 giờ
                });
            }
        }
        next(); // ✅ Bỏ qua kiểm tra và chuyển tiếp nếu trong danh sách loại trừ
    }
    else{
        //✅ Kiểm tra truy cập cho các route còn lại
        CtrlKhachHang.kiemTraTruyCap(req, res, next);
    }
});




router.get('/', CtrlTrangChu.index)
router.get('/dang-xuat', CtrlKhachHang.dangXuat);
router.get('/thuc-don', CtrlThucDon.indexThucDonKhachHang);
router.get('/gioi-thieu', CtrlTrangChu.indexGioiThieu);
router.get('/don-hang', CtrlTrangChu.indexDonHang);
router.get('/thanh-toan', CtrlTrangChu.indexThanhToan);
router.get('/thanh-toan-online', CtrlTrangChu.indexThanhToanOnline);
router.get('/thong-tin-ca-nhan', CtrlTrangChu.indexThongTinCaNhan)
module.exports = router;