const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const CtrlTaiKhoan = require('../controllers/CtrlTaiKhoan');
const CtrlNhanVien = require('../controllers/CtrlNhanVien');
const CtrlThucDon = require('../controllers/CtrlThucDon');
const CtrlKho = require('../controllers/CtrlKho');
const CtrlKhachHang = require('../controllers/CtrlKhachHang');
const CtrlDonHang = require('../controllers/CtrlDonHang');
const CtrlBan = require('../controllers/CtrlBan');
const CtrlHoTroTrucTuyen = require('../controllers/CtrlHoTroTrucTuyen');
const CtrlThongKe = require('../controllers/CtrlThongKe');
const CtrlDangKyLich = require('../controllers/CtrlDangKyLich');
const CtrlXepLich = require('../controllers/CtrlXepLich');
const sepayController = require('../controllers/sepay.controller');
const CtrlChamCong = require('../controllers/CtrlChamCong');
const CtrlHeSoLuong = require('../controllers/CtrlHeSoLuong');

// Lưu vào bộ nhớ RAM (để upload lên Cloudinary)
const storageMemory = multer.memoryStorage();

// Cấu hình lưu file vào bộ nhớ RAM
const uploadMemory = multer({ storage: storageMemory });

// Cấu hình lưu file vào đĩa (nếu cần lưu lại trên đĩa)
const storageDisk = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../public/img/report');
        
        // Kiểm tra nếu thư mục không tồn tại, tạo thư mục
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);  // Chỉ định thư mục lưu tệp
    },
    filename: function (req, file, cb) {
        // Đặt tên tệp giống như tên gốc, sẽ ghi đè nếu đã tồn tại
        cb(null, file.originalname);  
    }
});

// Cấu hình multer cho lưu vào đĩa
const uploadDisk = multer({ storage: storageDisk });

router.use(express.json({limit: '50mb'}));

// API DICH VU GIAO HANG TIET KIEM
router.get("/suggestions", async (req, res) => {
    const { province, district, ward_street, address } = req.query;
  
    const query = new URLSearchParams({
      province,
      district,
      ward_street,
      address: address || "",
    });
  
    try {
      const response = await fetch(
        `https://services.giaohangtietkiem.vn/services/address/getAddressLevel4?${query}`,
        {
          headers: {
            Token: "APITokenSample-ca441e70288cB0515F310742", // thay token thật tại đây
            "X-Client-Source": "PARTNER_CODE", // thay partner code thật nếu cần
          },
        }
      );
  
      const data = await response.json();
      res.json(data);
    } catch (err) {
      console.error("Error fetching address suggestions:", err);
      res.status(500).json({ success: false, message: "Server error" });
    }
});
router.post('/sepay/webhook', sepayController.handleWebhook);
router.post('/dang-nhap', CtrlTaiKhoan.dangNhap);
router.post('/nhan-vien', uploadMemory.single('hinhAnh'), CtrlNhanVien.themNhanVien);
router.get('/nhan-vien', CtrlNhanVien.layNhanVien);
router.put('/nhan-vien', uploadMemory.single('hinhAnh'), CtrlNhanVien.suaNhanVien);
router.get('/danh-muc-mon-an', CtrlThucDon.layDanhMucMonAn);
router.post('/danh-muc-mon-an', CtrlThucDon.themDanhMucMonAn);
router.put('/danh-muc-mon-an', CtrlThucDon.suaDanhMucMonAn);
router.get('/mon-an', CtrlThucDon.layMonAn);
router.get('/mon-an/ban-chay', CtrlThucDon.layMonAnBanChay);
router.get('/mon-an/:id', CtrlThucDon.layMonAnTheoLoai);
router.post('/mon-an', uploadMemory.single('hinhAnh'), CtrlThucDon.themMonAn);
router.put('/mon-an', uploadMemory.single('hinhAnh'), CtrlThucDon.suaMonAn);
router.get('/chi-tiet-mon-an', CtrlThucDon.layChiTietMonAn);
router.get('/danh-muc-nguyen-lieu', CtrlKho.layDanhMucNguyenLieu);
router.post('/danh-muc-nguyen-lieu', CtrlKho.themDanhMucNguyenLieu);
router.put('/danh-muc-nguyen-lieu', CtrlKho.suaDanhMucNguyenLieu);
router.get('/nha-cung-cap', CtrlKho.layNhaCungCap);
router.post('/nha-cung-cap', uploadMemory.single('hinhAnh'), CtrlKho.themNhaCungCap);
router.put('/nha-cung-cap', uploadMemory.single('hinhAnh'), CtrlKho.suaNhaCungCap);
router.get('/nguyen-lieu', CtrlKho.layNguyenLieu);
router.post('/nguyen-lieu', uploadMemory.single('hinhAnh'), CtrlKho.themNguyenLieu);
router.put('/nguyen-lieu', uploadMemory.single('hinhAnh'), CtrlKho.suaNguyenLieu);
router.get('/kho-nguyen-lieu', CtrlKho.layNguyenLieuKho);
router.get('/phieu-nhap', CtrlKho.layPhieuNhap);
router.post('/phieu-nhap', CtrlKho.themPhieuNhap);
router.get('/chi-tiet-phieu-nhap', CtrlKho.layNguyenLieuPhieuNhap);
router.get('/chi-tiet-phieu-xuat', CtrlKho.layNguyenLieuPhieuXuat);
router.get('/tim-kiem-phieu-nhap', CtrlKho.timKiemPhieuNhap);
router.get('/tim-kiem-phieu-xuat', CtrlKho.timKiemPhieuXuat);
router.get('/phieu-xuat', CtrlKho.layPhieuXuat);
router.post('/phieu-xuat', CtrlKho.themPhieuXuat);
router.get('/khu-vuc', CtrlBan.layKhuVuc)
router.post('/khu-vuc', CtrlBan.themKhuVuc);
router.put('/khu-vuc', CtrlBan.suaKhuVuc);
router.get('/ban', CtrlBan.layBan);
router.post('/ban', CtrlBan.themBan);
router.put('/ban', CtrlBan.suaBan);
router.post('/dang-ky', CtrlKhachHang.dangKy);
router.post('/dang-nhap-khach-hang', CtrlKhachHang.dangNhap);
router.post('/kiem-tra-so-dien-thoai', CtrlKhachHang.kiemTraSoDienThoai);
router.post('/kiem-tra-so-dien-thoai-khach-hang-cap-nhat', CtrlKhachHang.kiemTraSoDienThoaiCapNhat);
router.post('/kiem-tra-email-khach-hang-cap-nhat', CtrlKhachHang.kiemTraEmailCapNhat)
router.post('/kiem-tra-ten-dang-nhap', CtrlKhachHang.kiemTraTenDangNhap);
router.post('/gui-ma-xac-thuc', CtrlKhachHang.guiMaXacThuc);
router.post('/gui-ma-xac-thuc-email', CtrlKhachHang.guiMaXacThucEmail);
router.post('/xac-thuc-so-dien-thoai', CtrlKhachHang.xacThucSoDienThoai);
router.post('/xac-thuc-email', CtrlKhachHang.xacThucEmail);
router.post('/cap-nhat-anh-dai-dien', uploadMemory.single('hinhAnh'), CtrlKhachHang.capNhatAnhDaiDien);
router.post('/gui-ma-xac-thuc-quen-mat-khau', CtrlKhachHang.guiMaXacThucQuenMatKhau)
router.post('/xac-thuc-ma-quen-mat-khau', CtrlKhachHang.xacThucMaQuenMatKhau)
router.post('/dat-lai-mat-khau', CtrlKhachHang.datLaiMatKhau);
router.get('/hoi-thoai', CtrlHoTroTrucTuyen.layHoiThoai);
router.get('/tin-nhan', CtrlHoTroTrucTuyen.layTinNhan);
router.get('/lay-id-khach-hang', CtrlHoTroTrucTuyen.layIDKhachHang);
router.get('/lay-thong-tin-khach-hang', CtrlKhachHang.layThongTinKhachHang);
router.put('/cap-nhat-thong-tin-khach-hang', CtrlKhachHang.capNhatThongTinKhachHang);
router.get('/lay-don-hang', CtrlDonHang.layDonHang);
router.put('/huy-don-hang/:id', CtrlDonHang.huyDonHang);
router.get('/thoi-gian-bat-dau-co-don-hang', CtrlThongKe.getFirstOrderTime)
router.get('/thong-ke-tong-quat', CtrlThongKe.thongKeTongQuat)
router.get('/thong-ke-theo-thoi-gian', CtrlThongKe.thongKeTheoThoiGian)
router.get('/thong-ke-theo-khung-gio', CtrlThongKe.thongKeKhungGio)
router.get('/thong-ke-ti-le-theo-danh-muc-mon-an', CtrlThongKe.thongKeTheoDanhMuc)
router.get('/thong-ke-top-5-mon-ban-chay', CtrlThongKe.top5MonBanChay)
router.get('/thong-ke-chi-tiet-doanh-thu', CtrlThongKe.thongKeChiTietDoanhThu)
router.post('/xuat-bao-cao', CtrlThongKe.xuatBaoCao)
router.post('/ghi-don-hang', CtrlDonHang.ghiDonHang);
router.post('/them-lich-lam-viec', CtrlDangKyLich.dangKyLich);
router.get('/lich-lam-viec', CtrlDangKyLich.xemLichLamViec);
router.get('/xem-lich', CtrlDangKyLich.layLich);
router.put('/cap-nhat-trang-thai-ban', CtrlBan.updateTrangThaiBan);
router.get('/don-hang-theo-ban', CtrlDonHang.layGhiDonHang);
router.post('/them-don-hang', CtrlDonHang.themDonHang);
router.get('/ca-lam-viec', CtrlXepLich.layCaLamViec);
router.put('/ca-lam-viec', CtrlXepLich.capNhatCa);
router.get('/luong', CtrlChamCong.layLuong);
router.get('/lay-ngay-bat-dau-ca', CtrlXepLich.layNgayBatDauCa);
router.get('/lay-danh-sach-nhan-chua-co-ca', CtrlXepLich.layNhanVienChuaCoCa);
router.get('/lay-thong-tin-nhan-vien', CtrlNhanVien.layThongTinNhanVien);
router.post('/them-he-so-luong', CtrlHeSoLuong.themHeSoLuong);
router.put('/he-so-luong', CtrlHeSoLuong.suaHeSoLuong);
router.get('/he-so-luong', CtrlHeSoLuong.layHeSoLuong);

module.exports = router;