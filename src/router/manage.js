const express = require('express');
const router = express.Router();
const CtrlTaiKhoan = require('../controllers/CtrlTaiKhoan');
const CtrlThongKe = require('../controllers/CtrlThongKe');
const CtrlThucDon = require('../controllers/CtrlThucDon');  
const CtrlNhanVien = require('../controllers/CtrlNhanVien');
const CtrlKho = require('../controllers/CtrlKho');
const CtrlBan = require('../controllers/CtrlBan');
const CtrlChamCong = require('../controllers/CtrlChamCong');
const CtrlXepLich = require('../controllers/CtrlXepLich');
const CtrlTrangChu = require('../controllers/CtrlTrangChuNV');
const CtrlDonHang = require('../controllers/CtrlDonHang');
const CtrlHoTroTrucTuyen = require('../controllers/CtrlHoTroTrucTuyen');
const CtrlDangKyLich = require('../controllers/CtrlDangKyLich');

router.use((req, res, next) => {
    const excludedRoutes = ['/login', '/logout'];
    if (excludedRoutes.includes(req.path)) {
        next(); // ✅ Bỏ qua kiểm tra và chuyển tiếp nếu trong danh sách loại trừ
    }
    else{
        // ✅ Kiểm tra đăng nhập cho các route còn lại
        CtrlTaiKhoan.kiemTraTruyCap(req, res, next);
    }
});
router.get('/login', CtrlTaiKhoan.index);
router.get('/thong-ke', CtrlThongKe.index);
router.get('/danh-muc-mon-an', CtrlThucDon.indexDanhMuc);
router.get('/mon-an', CtrlThucDon.indexMonAn);
router.get('/nhan-vien', CtrlNhanVien.index);
router.get('/danh-muc-nguyen-lieu', CtrlKho.indexDanhMuc);
router.get('/nha-cung-cap', CtrlKho.indexNhaCungCap);
router.get('/nguyen-lieu', CtrlKho.indexNguyenLieu);
router.get('/kho', CtrlKho.indexKho);
router.get('/phieu-nhap', CtrlKho.indexPhieuNhap);
router.get('/phieu-xuat', CtrlKho.indexPhieuXuat);
router.get('/khu-vuc', CtrlBan.indexKhuVuc);
router.get('/ban', CtrlBan.indexBan);
router.get('/cham-cong', CtrlChamCong.index);
router.get('/xep-lich', CtrlXepLich.index);
router.get('/trang-chu', CtrlTrangChu.index);
router.get('/don-hang', CtrlDonHang.index);
router.get('/dang-xuat', CtrlTaiKhoan.dangXuat);
router.get('/ho-tro-truc-tuyen', CtrlHoTroTrucTuyen.index);
router.get('/bao-cao', CtrlThongKe.indexBaoCao);
router.get('/dang-ky-lich-lam-viec', CtrlDangKyLich.index);
router.get('/xem-lich-lam-viec', CtrlDangKyLich.xemLichLamViec);
router.get('/ghi-don-hang', CtrlDonHang.indexGhiDonHang);
router.get('/danh-sach-ban', CtrlBan.indexBanNhanVien);

module.exports = router;