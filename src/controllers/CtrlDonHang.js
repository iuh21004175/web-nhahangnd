const DonHang = require('../models/DonHang');
const ChiTietDonHang = require('../models/ChiTietDonHang');
const MonAn = require('../models/MonAn');
const TaiKhoan = require('../models/TaiKhoan');
const moment = require('moment-timezone');
const jwt = require('jsonwebtoken');

module.exports = {
    index: (req, res) => {
        if(res.locals.taiKhoan.vaiTro === 'Quản lý'){
            res.render('manager/don-hang-cho-quan-ly')
        }
        else if(res.locals.taiKhoan.vaiTro === 'Đầu bếp'){
            res.render('manager/don-hang-cho-dau-bep')
        }
        else if(res.locals.taiKhoan.vaiTro === 'Phục vụ'){
            res.render('manager/don-hang-cho-phuc-vu')
        }
        
    },
    indexGhiDonHang:  (req, res) => {
        res.render('manager/ghi-don-hang');
    },
    themDonHang: async (req, res) => {
        let user = null
        const token = req.cookies.AuthTokenCustomer;
        if (token) {
            try {
                // Giải mã token
                user = jwt.verify(token, process.env.JWT_SECRET);
            } catch (err) {
                console.error('Lỗi khi giải mã token:', err);
                return res.status(401).json({ status: false, error: 'Token không hợp lệ' });
            }
        }
        if (!user || !user.id) {
            return res.status(401).json({ status: false, error: 'Chưa đăng nhập hoặc token hết hạn' });
        }
        const { hinhThuc, diaChi, trangThai, tongTien, thanhToan, gioHang, ghiChu } = req.body;

        try {
            const thoiGianGhi = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
            let donHang = await DonHang.create({
                idKhachHang: user.id,
                thoiGianGhi,
                hinhThuc,
                diaChi,
                trangThai,
                tongTien,
                thanhToan
            });

            if (gioHang && gioHang.length > 0) {
                for (const item of gioHang) {
                    await ChiTietDonHang.create({
                        idDonHang: donHang.id,
                        idMonAn: item.id,
                        soLuong: item.quantity,
                        gia: item.price,
                        ghiChu
                    });
                }
            }

            // Nếu trạng thái là "chờ thanh toán" thì thiết lập timeout để xóa sau 5 phút nếu chưa thanh toán
            if (parseInt(trangThai) === 7) {
                setTimeout(async () => {
                    try {
                        const dh = await DonHang.findOne({ where: { id: donHang.id } });
                        if (dh && dh.trangThai === 7) {
                            await ChiTietDonHang.destroy({ where: { idDonHang: dh.id } });
                            await DonHang.destroy({ where: { id: dh.id } });
                            console.log(`⏱️ Đã xóa đơn hàng #${dh.id} do không thanh toán sau 5 phút.`);
                        }
                    } catch (err) {
                        console.error(`❌ Lỗi khi kiểm tra/xóa đơn hàng #${donHang.id}:`, err);
                    }
                }, 5 * 60 * 1000); // 5 phút
            }

            donHang = donHang.toJSON();
            res.json({ status: true, idDonHang: donHang.id });

        } catch (error) {
            console.log(error);
            res.status(500).json({ status: false, error: 'Lỗi server' });
        }
    },

    ghiDonHang: async (req, res) => {
        const { idDonHang, hinhThuc, thanhToan, trangThai, tongTien, chiTietDonHang } = req.body;
        const idBan = req.query.idBan;
    
        const hinhThucNum = parseInt(hinhThuc);
        const trangThaiNum = parseInt(trangThai);
        const tongTienNum = parseFloat(tongTien);
        const thanhToanNum = parseFloat(thanhToan);
        console.log('Trạng thái nhận từ frontend:', trangThaiNum);

        console.log('Dữ liệu nhận được từ frontend:', req.body);
    
        try {
            if (!idBan) {
                return res.status(400).json({ status: false, error: 'Thiếu ID bàn' });
            }
    
            const token = req.cookies.AuthTokenManager;
            if (!token) {
                return res.status(401).json({ error: 'Chưa đăng nhập' });
            }
            // Giải mã token để lấy thông tin tài khoản
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded) {
                return res.status(401).json({ error: 'Token không hợp lệ' });
            }
    
            const taiKhoan = await TaiKhoan.findOne({ where: { tenDangNhap: decoded.tenDangNhap } });
            if (!taiKhoan) {
                return res.status(404).json({ status: false, error: 'Tài khoản không tồn tại' });
            }
    
            const idNhanVien = taiKhoan.idNhanVien;
            const thoiGianGhi = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
    
            let donHang;
    
            if (idDonHang) {
                donHang = await DonHang.findByPk(idDonHang);
                if (!donHang) {
                    return res.status(404).json({ status: false, error: 'Không tìm thấy đơn hàng để cập nhật' });
                }
            
                console.log('Trạng thái ban đầu của đơn hàng:', donHang.trangThai);  // Log trạng thái ban đầu của đơn hàng
            
                // Kiểm tra và cập nhật trạng thái nếu cần
                if (trangThaiNum === 2 && donHang.trangThai === 7) { // Kiểm tra nếu trạng thái là 7 và cần thay đổi thành 2
                    await donHang.update({
                        hinhThuc: hinhThucNum,
                        thanhToan: thanhToanNum,
                        trangThai: trangThaiNum,  // Cập nhật trạng thái thành 2 (đã thanh toán)
                        tongTien: tongTienNum
                    });
            
                    console.log('Đơn hàng sau khi update:', donHang.toJSON());  // Log trạng thái sau khi update
                } else {
                    await donHang.update({
                        hinhThuc: hinhThucNum,
                        thanhToan: thanhToanNum,
                        tongTien: tongTienNum
                    });
                }
            
                // Xóa chi tiết cũ và thêm chi tiết mới
                await ChiTietDonHang.destroy({ where: { idDonHang } });
            
                for (const item of chiTietDonHang) {
                    await ChiTietDonHang.create({
                        idDonHang,
                        idMonAn: item.idMonAn,
                        soLuong: item.soLuong,
                        gia: item.gia,
                        ghiChu: item.ghiChu || ''
                    });
                }
            
            } else {
                donHang = await DonHang.create({
                    idNhanVien,
                    idBan,
                    thoiGianGhi,
                    hinhThuc: hinhThucNum,
                    thanhToan: thanhToanNum,
                    trangThai: trangThaiNum,  // Cập nhật trang thái khi tạo đơn hàng mới
                    tongTien: tongTienNum
                });
            
                for (const item of chiTietDonHang) {
                    await ChiTietDonHang.create({
                        idDonHang: donHang.id,
                        idMonAn: item.idMonAn,
                        soLuong: item.soLuong,
                        gia: item.gia,
                        ghiChu: item.ghiChu || ''
                    });
                }
            }
            
            res.json({ status: true, idDonHang: donHang.id, trangThai: donHang.trangThai });
    
        } catch (error) {
            console.error('Lỗi khi ghi đơn hàng:', error);
            res.status(500).json({ status: false, error: 'Lỗi server', chiTiet: error.message });
        }
    },
    

    getSuccessOrders: async (req, res) => {
        const { id } = req.params;  // Lấy 'id' từ URL params
        try {
            // Nếu có 'id', truy vấn đơn hàng theo 'id' và trạng thái là 2 (Đã thanh toán)
            let successOrders;
            if (id) {
                successOrders = await DonHang.findAll({
                    where: {
                        id: id,  // Truy vấn theo 'id' từ URL
                        trangThai: 2  // Trạng thái 2 là "Đã thanh toán"
                    }
                });
            } else {
                // Nếu không có 'id', lấy tất cả đơn hàng đã thanh toán
                successOrders = await DonHang.findAll({
                    where: {
                        trangThai: 2  // Trạng thái 2 là "Đã thanh toán"
                    }
                });
            }
    
            if (successOrders.length > 0) {
                successOrders.forEach(order => {
                    console.log(`Đơn hàng ${order.id} đã thanh toán thành công.`);
                    
                });
                res.json(successOrders); // Trả về danh sách đơn hàng
            } else {
                console.log('Không có đơn hàng nào thanh toán thành công.');
                res.status(404).json({ message: 'Không có đơn hàng nào thanh toán thành công.' });
            }
        } catch (error) {
            console.error('Lỗi khi lấy đơn hàng thành công:', error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    },
    layDonHang: async (req, res) => {
        try {
            const token = req.cookies.AuthTokenCustomer;
            if (!token) {
                return res.redirect('/')
            }
            // Giải mã token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded || !decoded.id) {
                return res.status(401).json({ status: false, error: 'Chưa đăng nhập hoặc token hết hạn' });
            }
            const donHang = await DonHang.findAll({
                where: {
                    idKhachHang: decoded.id,
                    trangThai: [0, 1, 2, 3, 4, 5, 6]
                },
                order: [['id', 'DESC']],
                include: [
                    {
                        model: ChiTietDonHang,
                        attributes: ['idDonHang', 'soLuong', 'gia'], 
                        include: [
                            {
                                model: MonAn,
                                attributes: ['id', 'ten', 'gia', 'hinhAnh'] 
                            }
                        ]
                    }
                ]
            });
    
            return res.json({ status: true, list: donHang });
        } catch (error) {
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server' });
        }
    },
    huyDonHang: async (req, res) => {
        const id = req.params.id;
        try {
            const donHang = await DonHang.findByPk(id);
            if (!donHang) {
                return res.status(404).json({ status: false, error: 'Không tìm thấy đơn hàng' });
            }
    
            // Chỉ cho phép hủy nếu đơn hàng đang ở trạng thái 1 (đặt thành công) hoặc 2 (đã thanh toán)
            if (![1, 2].includes(donHang.trangThai)) {
                return res.status(400).json({ status: false, error: 'Chỉ có thể hủy đơn hàng chưa xử lý' });
            }
    
            donHang.trangThai = 0; 
            await donHang.save();
    
            res.json({ status: true, message: 'Đơn hàng đã được hủy' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ status: false, error: 'Lỗi server khi hủy đơn hàng' });
        }
    },
    layGhiDonHang: async (req, res) => {
        const idBan = req.query.idBan;
    
        if (!idBan) {
            return res.status(400).json({ status: false, message: 'Thiếu ID bàn' });
        }
    
        try {
            const donHang = await DonHang.findOne({   
                where: {
                    idBan,
                    trangThai: [3, 4, 7]
                },
                include: [
                    {
                        model: ChiTietDonHang,
                        attributes: ['idDonHang', 'soLuong', 'gia'], 
                        include: [
                            {
                                model: MonAn,
                                attributes: ['id', 'ten', 'gia', 'hinhAnh']
                            }
                        ]
                    }
                ]
            });
    
            if (!donHang) {
                return res.json({ status: false, message: 'Không có đơn hàng chờ thanh toán cho bàn này' });
            }
    
            const plainDonHang = donHang.toJSON();  // Chuyển dữ liệu sang JSON
            console.log(plainDonHang);
            return res.json({ status: true, obj: plainDonHang });
        } catch (error) {
            console.error('Lỗi server:', error);
            return res.status(500).json({ status: false, error: 'Lỗi server' });
        }
    },
    layGiaDonHang: async (req, res) => {
        const id = req.query.id;
    
        if (!id) {
            return res.status(400).json({ status: false, message: 'Thiếu tham số id' });
        }
    
        try {
            const donHang = await DonHang.findOne({
                where: { id }
            });
    
            if (!donHang) {
                return res.status(404).json({ status: false, message: 'Không tìm thấy đơn hàng' });
            }
    
            const plainDonHang = donHang.toJSON(); 
            console.log('Đơn hàng:', plainDonHang);
    
            return res.json({ status: true, obj: plainDonHang });
        } catch (error) {
            console.error('Lỗi server:', error);
            return res.status(500).json({ status: false, error: 'Lỗi server' });
        }
    }
     
    
};
