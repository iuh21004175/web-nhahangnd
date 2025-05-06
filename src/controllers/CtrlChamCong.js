const { Sequelize, Op, fn, col } = require('sequelize');
const TaiKhoan = require('../models/TaiKhoan');
const ChamCong = require('../models/ChamCong');

module.exports = {
    index: (req, res) => {
        res.render('manager/cham-cong');
    },
    indexXemLuong: (req, res) => {
        res.render('manager/xem-luong');
    },
    layLuong: async (req, res) => {
        const token = req.cookies.AuthTokenManager;
        if (!token) {
            return res.status(401).json({ error: 'Chưa đăng nhập' });
        }
        // Giải mã token để lấy thông tin tài khoản
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ error: 'Token không hợp lệ' });
        }

        const { thang, nam } = req.query;
    
        try {
            const taiKhoan = await TaiKhoan.findOne({ where: { tenDangNhap: decoded.tenDangNhap } });
            
            if (!taiKhoan) {
                console.log('Không tìm thấy tài khoản');
                return res.json({ status: false, error: 'Tài khoản không tồn tại' });
            }
    
            const idNhanVien = taiKhoan.idNhanVien;

            const lichLamViec = await ChamCong.findAll({
                where: {
                    idNhanVien,
                    trangThai: 3,
                    [Op.and]: [
                        Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('ngay')), '=', thang),
                        Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('ngay')), '=', nam)
                    ]
                },
                order: [['ngay', 'ASC']],
                attributes: ['ngay', 'tuan', 'caLamViec', 'checkIn', 'checkOut', 'heSoLuong']
            });
    
            // Nếu có dữ liệu, trả về kết quả
            res.json({ status: true, data: lichLamViec });
    
        } catch (error) {
            console.error('Lỗi khi lấy lịch làm việc:', error);
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
}
