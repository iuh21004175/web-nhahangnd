const TaiKhoan = require('../models/TaiKhoan');
const ChamCong = require('../models/ChamCong');
const HeSoLuong = require('../models/HeSoLuong');

module.exports = {
    // Trang hiển thị form đăng ký lịch
    index: (req, res) => {
        res.render('manager/dang-ky-lich-lam-viec');
    },
    xemLichLamViec: (req, res) => {
        res.render('manager/xem-lich-lam-viec');
    },
    dangKyLich: async (req, res) => {
      const { shifts } = req.body;
      const tenDangNhap = res.locals.taiKhoan.tenDangNhap;
    
      try {
        const taiKhoan = await TaiKhoan.findOne({ where: { tenDangNhap } });
    
        if (!taiKhoan) {
          console.log('Tài khoản không tồn tại');
          return res.json({ status: false, error: 'Tài khoản không tồn tại' });
        }
    
        const idNhanVien = taiKhoan.idNhanVien;
    
        // Xóa các ca làm việc cũ trong tuần được đăng ký
        await ChamCong.destroy({
          where: {
            idNhanVien,
            tuan: shifts[0].tuan
          }
        });
    
        // Lặp qua từng ca làm việc để thêm vào bảng ChamCong
        for (let shift of shifts) {
          const { ngay, tuan, caLamViec, trangThai } = shift;
    
          // Tìm hệ số lương từ bảng HeSoLuong
          const heSoLuongRecord = await HeSoLuong.findOne({ where: { ngay } });
    
          // Nếu có hệ số lương, lấy ra; nếu không có thì sử dụng hệ số mặc định 1.0
          const heSoLuong = heSoLuongRecord ? heSoLuongRecord.he_so : 1.0;
    
          // Thêm vào bảng ChamCong (Không cần truyền cột id vì nó auto-increment)
          await ChamCong.create({
            idNhanVien,
            ngay,
            tuan,
            caLamViec,
            trangThai: 0,  
            heSoLuong
          });
        }
    
        return res.json({
          status: true,
          message: 'Đăng ký lịch làm việc thành công.'
        });
      } catch (error) {
        console.error('Lỗi khi đăng ký lịch:', error);
        return res.json({
          status: false,
          error: 'Lỗi server',
          detail: error
        });
      }
    },    
      
    // Xem lịch làm việc của người dùng hiện tại
    indexXemLich: async (req, res) => {
        const tenDangNhap = res.locals.taiKhoan.tenDangNhap;


        try {
            const taiKhoan = await TaiKhoan.findOne({ where: { tenDangNhap } });
            if (!taiKhoan) {
                return res.json({ status: false, error: 'Tài khoản không tồn tại' });
            }
    
            const idNhanVien = taiKhoan.idNhanVien;

            const lichLamViec = await ChamCong.findAll({
              where: {
                  idNhanVien  
              },
              order: [['ngay', 'ASC']],
              attributes: ['ngay', 'tuan', 'caLamViec']
          });
  
            res.json({
                status: true,
                list: lichLamViec
            });
              
    
        } catch (error) {
            console.error('Lỗi khi lấy lịch làm việc:', error);
            res.status(500).json({ error: 'Lỗi server' });
        }
    },
    layLich: async (req, res) => {
      const tenDangNhap = res.locals.taiKhoan.tenDangNhap;


      try {
          const taiKhoan = await TaiKhoan.findOne({ where: { tenDangNhap } });
          if (!taiKhoan) {
              return res.json({ status: false, error: 'Tài khoản không tồn tại' });
          }
  
          const idNhanVien = taiKhoan.idNhanVien;

          const lichLamViec = await ChamCong.findAll({
            where: {
                idNhanVien,
                trangThai: [1,2,3]
            },
            order: [['ngay', 'ASC']],
            attributes: ['ngay', 'tuan', 'caLamViec', 'trangThai']
        });

          res.json({
              status: true,
              list: lichLamViec
          });
            
  
      } catch (error) {
          console.error('Lỗi khi lấy lịch làm việc:', error);
          res.status(500).json({ error: 'Lỗi server' });
      }
  }
};
