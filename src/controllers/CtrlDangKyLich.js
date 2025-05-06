const TaiKhoan = require('../models/TaiKhoan');
const ChamCong = require('../models/ChamCong');
const HeSoLuong = require('../models/HeSoLuong');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
module.exports = {
    // Trang hiển thị form đăng ký lịch
    index: (req, res) => {
        res.render('manager/dang-ky-lich-lam-viec');
    },
    indexXemLich: (req, res) => {
        res.render('manager/xem-lich-lam-viec');
    },
    dangKyLich: async (req, res) => {
      const { shifts, idNhanVien, week } = req.body;
      if(idNhanVien && week){// Quản lý đăng ký lịch cho nhân viên khác
        try { 
            console.log(week)
            // Phân tách năm và số tuần từ chuỗi định dạng ISO "YYYY-Wnn"
            const [year, weekPart] = week.split('-W');
            const weekNumber = parseInt(weekPart);
            
            // Đảm bảo dữ liệu hợp lệ
            if (!year || isNaN(weekNumber) || weekNumber < 1 || weekNumber > 53) {
                return res.status(400).json({ 
                    status: false, 
                    message: 'Định dạng tuần không hợp lệ. Sử dụng định dạng YYYY-Wnn' 
                });
            }

            // Tính ngày bắt đầu và kết thúc của tuần theo chuẩn ISO 8601
            // Ngày 1: ngày đầu tiên của năm
            const firstDayOfYear = new Date(parseInt(year), 0, 1);
                
            // Tìm ngày thứ 5 đầu tiên của năm (hoặc ngày đầu tiên nếu năm bắt đầu bằng thứ 5)
            const firstThursday = new Date(parseInt(year), 0, 1 + ((11 - firstDayOfYear.getDay()) % 7));
                
            // Tính ngày thứ 2 của tuần ISO (tuần bắt đầu từ thứ 2)
            const targetMonday = new Date(firstThursday);
            targetMonday.setDate(firstThursday.getDate() - 3 + (weekNumber - 1) * 7);
                
            // Tính ngày chủ nhật của tuần ISO
            const targetSunday = new Date(targetMonday);
            targetSunday.setDate(targetMonday.getDate() + 6);
                
            // Format ngày cho Sequelize - cần chuyển sang múi giờ UTC để tránh sai lệch ngày
            const startDateUTC = new Date(Date.UTC(
              targetMonday.getFullYear(), 
              targetMonday.getMonth(), 
              targetMonday.getDate()
            ));
                const endDateUTC = new Date(Date.UTC(
                targetSunday.getFullYear(), 
                targetSunday.getMonth(), 
                targetSunday.getDate(), 
                23, 59, 59
            ));

            await ChamCong.destroy({
                where: {
                    idNhanVien: idNhanVien,
                    ngay: {
                      [Op.gte]: startDateUTC,
                      [Op.lte]: endDateUTC
                    },
                }
            });
            shifts.forEach(async (shift) => {
              const { ngay, caLamViec } = shift;

              await ChamCong.create({
                idNhanVien: idNhanVien,
                ngay,
                tuan: weekNumber,
                caLamViec,
                trangThai: 1,  
              });
            })
            return res.json({
                status: true,
                message: 'Đăng ký lịch làm việc thành công.'
            });
        }
        catch (error) {
            console.error('Lỗi khi lấy lịch làm việc:', error);
            return res.json({ status: false, error: 'Lỗi server: ', error });
        }

      }
      else{
        const token = req.cookies.AuthTokenManager;
        if (!token) {
            return res.status(401).json({ error: 'Chưa đăng nhập' });
        }
        // Giải mã token để lấy thông tin tài khoản
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ error: 'Token không hợp lệ' });
        }

      
        try {
          const taiKhoan = await TaiKhoan.findOne({ where: { tenDangNhap: decoded.tenDangNhap } });
      
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
      }
    },    
      
    // Xem lịch làm việc của người dùng hiện tại
    xemLichLamViec: async (req, res) => {
        
        if (req.query.idNhanVien && req.query.week) {// Quản lý xem lịch của nhân viên khác
            try {
                const week = req.query.week;
                      
                // Phân tách năm và số tuần từ chuỗi định dạng ISO "YYYY-Wnn"
                const [year, weekPart] = week.split('-W');
                const weekNumber = parseInt(weekPart);
                
                // Đảm bảo dữ liệu hợp lệ
                if (!year || isNaN(weekNumber) || weekNumber < 1 || weekNumber > 53) {
                    return res.status(400).json({ 
                        status: false, 
                        message: 'Định dạng tuần không hợp lệ. Sử dụng định dạng YYYY-Wnn' 
                    });
                }

                // Tính ngày bắt đầu và kết thúc của tuần theo chuẩn ISO 8601
                // Ngày 1: ngày đầu tiên của năm
                const firstDayOfYear = new Date(parseInt(year), 0, 1);
                
                // Tìm ngày thứ 5 đầu tiên của năm (hoặc ngày đầu tiên nếu năm bắt đầu bằng thứ 5)
                const firstThursday = new Date(parseInt(year), 0, 1 + ((11 - firstDayOfYear.getDay()) % 7));
                
                // Tính ngày thứ 2 của tuần ISO (tuần bắt đầu từ thứ 2)
                const targetMonday = new Date(firstThursday);
                targetMonday.setDate(firstThursday.getDate() - 3 + (weekNumber - 1) * 7);
                
                // Tính ngày chủ nhật của tuần ISO
                const targetSunday = new Date(targetMonday);
                targetSunday.setDate(targetMonday.getDate() + 6);
                
                // Format ngày cho Sequelize - cần chuyển sang múi giờ UTC để tránh sai lệch ngày
                const startDateUTC = new Date(Date.UTC(
                    targetMonday.getFullYear(), 
                    targetMonday.getMonth(), 
                    targetMonday.getDate()
                ));
                const endDateUTC = new Date(Date.UTC(
                    targetSunday.getFullYear(), 
                    targetSunday.getMonth(), 
                    targetSunday.getDate(), 
                    23, 59, 59
                ));
                const lichLamViec = await ChamCong.findAll({
                    where: {
                        idNhanVien: req.query.idNhanVien,
                        ngay: {
                          [Op.gte]: startDateUTC,
                          [Op.lte]: endDateUTC
                        },
                        trangThai: 1

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
                return res.json({ status: false, error: 'Lỗi server: ', error });
            }
        }
        else{// Nhân viên xem lịch của mình
          const token = req.cookies.AuthTokenManager;
          if (!token) {
              return res.status(401).json({ error: 'Chưa đăng nhập' });
          }
          // Giải mã token để lấy thông tin tài khoản
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (!decoded) {
              return res.status(401).json({ error: 'Token không hợp lệ' });
          }



          try {
              const taiKhoan = await TaiKhoan.findOne({ where: { tenDangNhap: decoded.tenDangNhap } });
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
        }
    },
    layLich: async (req, res) => {
      const token = req.cookies.AuthTokenManager;
      if (!token) {
          return res.status(401).json({ error: 'Chưa đăng nhập' });
      }
      // Giải mã token để lấy thông tin tài khoản
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded) {
          return res.status(401).json({ error: 'Token không hợp lệ' });
      }
      try {
          const taiKhoan = await TaiKhoan.findOne({ where: { tenDangNhap: decoded.tenDangNhap } });
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
