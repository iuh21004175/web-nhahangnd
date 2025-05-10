const DonHang = require('../models/DonHang');
const ChiTietDonHang = require('../models/ChiTietDonHang');
const MonAn = require('../models/MonAn');
const TaiKhoan = require('../models/TaiKhoan');
const moment = require('moment-timezone');
const jwt = require('jsonwebtoken');
const KhachHang = require('../models/KhachHang');
const { Op } = require('sequelize');
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

            // CẬP NHẬT ĐƠN HÀNG CŨ
            if (idDonHang) {
                donHang = await DonHang.findByPk(idDonHang);
                if (!donHang) {
                    return res.status(404).json({ status: false, error: 'Không tìm thấy đơn hàng để cập nhật' });
                }

                console.log('Trạng thái ban đầu của đơn hàng:', donHang.trangThai);

                // Cập nhật thông tin đơn hàng nếu trạng thái chuyển từ 7 -> 2
                if (trangThaiNum === 2 && donHang.trangThai === 7) {
                    await donHang.update({
                        hinhThuc: hinhThucNum,
                        thanhToan: thanhToanNum,
                        trangThai: trangThaiNum,
                        tongTien: tongTienNum
                    });
                } else {
                    await donHang.update({
                        hinhThuc: hinhThucNum,
                        thanhToan: thanhToanNum,
                        tongTien: tongTienNum
                    });
                }

                // Thêm hoặc cập nhật chi tiết món ăn
                if (chiTietDonHang && chiTietDonHang.length > 0) {
                    for (const item of chiTietDonHang) {
                        const idMonAn = parseInt(item.idMonAn);
                        const soLuongThem = parseInt(item.soLuong);

                        // Kiểm tra món có trong đơn hàng chưa
                        const chiTietDangCho = await ChiTietDonHang.findOne({
                            where: {
                                idDonHang,
                                idMonAn,
                                trangThai: 0 // Kiểm tra nếu món này đang ở trạng thái "chờ chế biến"
                            }
                        });

                        if (chiTietDangCho) {
                            // Nếu món đã có trong đơn và đang chờ chế biến
                            
                            await chiTietDangCho.update({
                                soLuong: soLuongThem,
                                thoiGianCapNhat: new Date()
                            });
                        } else {
                            // Nếu món chưa có trong đơn, tạo mới
                            await ChiTietDonHang.create({
                                idDonHang,
                                idMonAn,
                                soLuong: soLuongThem,
                                gia: item.gia,
                                ghiChu: item.ghiChu || '',
                                trangThai: 0,  // Trạng thái mặc định là chờ chế biến
                                thoiGianCapNhat: new Date()
                            });
                        }

                    }
                }

            } else {
                // TẠO ĐƠN HÀNG MỚI
                donHang = await DonHang.create({
                    idNhanVien,
                    idBan,
                    thoiGianGhi,
                    hinhThuc: hinhThucNum,
                    thanhToan: thanhToanNum,
                    trangThai: trangThaiNum,
                    tongTien: tongTienNum
                });

                if (!chiTietDonHang || chiTietDonHang.length === 0) {
                    await donHang.destroy();
                    return res.status(400).json({ status: false, error: 'Đơn hàng không có món ăn nên đã bị xóa' });
                }

                for (const item of chiTietDonHang) {
                    const idMonAn = parseInt(item.idMonAn); // Chuyển đổi sang số nguyên

                    if (isNaN(idMonAn)) {
                        return res.status(400).json({ status: false, error: 'ID món ăn không hợp lệ' });
                    }

                    await ChiTietDonHang.create({
                        idDonHang: donHang.id,
                        idMonAn,
                        soLuong: item.soLuong,
                        gia: item.gia,
                        ghiChu: item.ghiChu || '',
                        trangThai: 0  // Trạng thái mặc định là 0 khi thêm món ăn
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
        const token = req.cookies.AuthTokenCustomer;
        if (!token) {
            return res.redirect('/')
        }
        // Giải mã token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded || !decoded.id) {
            return res.status(401).json({ status: false, error: 'Chưa đăng nhập hoặc token hết hạn' });
        }
        try {
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
    layDonHangQuanLy: async (req, res) => {
        try {
            const { batDau, ketThuc, khachHang, trangThai, thanhToan, hinhThuc, id } = req.query;
            
            console.log('Query params:', { batDau, ketThuc, khachHang, trangThai, thanhToan, hinhThuc, id });
            
            // Xây dựng điều kiện tìm kiếm cho đơn hàng
            const whereCondition = {};
            
            // Lọc theo ID đơn hàng (chỉ khi id có giá trị và không phải chuỗi rỗng)
            if (id.trim() !== '') {
                whereCondition.id = id;
            }
            
            // Lọc theo khoảng thời gian
            if ((batDau && batDau.trim() !== '') || (ketThuc && ketThuc.trim() !== '')) {
                whereCondition.thoiGianGhi = {};
                
                if (batDau && batDau.trim() !== '') {
                    const batDauDate = new Date(batDau);
                    batDauDate.setHours(0, 0, 0, 0);
                    whereCondition.thoiGianGhi[Op.gte] = batDauDate;
                }
                
                if (ketThuc && ketThuc.trim() !== '') {
                    const ketThucDate = new Date(ketThuc);
                    ketThucDate.setHours(23, 59, 59, 999);
                    whereCondition.thoiGianGhi[Op.lte] = ketThucDate;
                }
            }
            
            // Lọc theo trạng thái đơn hàng
            if (trangThai && trangThai.trim() !== '') {
                whereCondition.trangThai = parseInt(trangThai);
            }
            
            // Lọc theo phương thức thanh toán
            if (thanhToan && thanhToan.trim() !== '') {
                whereCondition.thanhToan = parseInt(thanhToan);
            }
            
            // Lọc theo hình thức đặt hàng
            if (hinhThuc && hinhThuc.trim() !== '') {
                whereCondition.hinhThuc = parseInt(hinhThuc);
            }
            
            // Chuẩn bị config cho include
            const includeOptions = [
                {
                    model: ChiTietDonHang,
                    include: [
                        {
                            model: MonAn,
                            attributes: ['id', 'ten', 'hinhAnh']
                        }
                    ]
                }
            ];
            
            // Chỉ áp dụng điều kiện lọc khách hàng nếu có giá trị
            if (khachHang && khachHang.trim() !== '') {
                includeOptions.push({
                    model: KhachHang,
                    attributes: ['id', 'ten', 'soDienThoai'],
                    where: {
                        [Op.or]: [
                            { ten: { [Op.like]: `%${khachHang}%` } },
                            { soDienThoai: { [Op.like]: `%${khachHang}%` } }
                        ]
                    }
                });
            } else {
                // Nếu không có điều kiện lọc khách hàng, vẫn include mà không lọc
                includeOptions.push({
                    model: KhachHang,
                    attributes: ['id', 'ten', 'soDienThoai'],
                    required: false // Quan trọng: không bắt buộc có quan hệ KhachHang
                });
            }
            
            console.log('Điều kiện lọc:', JSON.stringify(whereCondition, null, 2));
            
            // Thực hiện truy vấn với các điều kiện đã xây dựng
            const donHangList = await DonHang.findAll({
                where: whereCondition,
                include: includeOptions,
                order: [['thoiGianGhi', 'DESC']] // Sắp xếp theo thời gian mới nhất
            });
            
            console.log(`Tìm thấy ${donHangList.length} đơn hàng`);
            
            // Tính toán thống kê
            let totalAmount = 0;
            let cancelledOrders = 0;
            let completedOrders = 0;
            let processingOrders = 0;
            
            donHangList.forEach(order => {
                // Đơn hàng hoàn thành (trạng thái 4)
                if (order.trangThai === 4) {
                    completedOrders++;
                    totalAmount += parseFloat(order.tongTien || 0);
                }
                // Đơn hàng đã hủy (trạng thái 5)
                else if (order.trangThai === 5) {
                    cancelledOrders++;
                }
                // Đơn hàng đang xử lý (trạng thái 0, 1, 2, 3)
                else if ([0, 1, 2, 3].includes(order.trangThai)) {
                    processingOrders++;
                }
            });
            
            // Trả về kết quả
            return res.json({
                status: true,
                list: donHangList,
                summary: {
                    totalOrders: donHangList.length,
                    completedOrders,
                    cancelledOrders,
                    processingOrders,
                    totalAmount
                }
            });
            
        } catch (error) {
            console.error('Lỗi khi lấy danh sách đơn hàng:', error);
            return res.status(500).json({
                status: false,
                message: 'Đã xảy ra lỗi khi tải danh sách đơn hàng',
                error: error.message
            });
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
                        attributes: ['id','idDonHang', 'soLuong', 'gia', 'trangThai'], 
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
    },
    layChiTietDonHang: async (req, res) => {
        try {
            const { id } = req.query;
            
            if (!id) {
                return res.status(400).json({
                    status: false,
                    message: 'Thiếu thông tin ID đơn hàng'
                });
            }
            
            // Tìm đơn hàng với thông tin chi tiết
            const donHang = await DonHang.findOne({
                where: { id },
                include: [
                    {
                        model: KhachHang,
                        attributes: ['id', 'ten', 'soDienThoai', 'email', 'diaChi']
                    },
                    {
                        model: ChiTietDonHang,
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
                return res.status(404).json({
                    status: false,
                    message: 'Không tìm thấy đơn hàng'
                });
            }
            
            return res.json({
                status: true,
                order: donHang
            });
            
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
            return res.status(500).json({
                status: false,
                message: 'Đã xảy ra lỗi khi tải chi tiết đơn hàng',
                error: error.message
            });
        }
    },
    layMonDangCho: async (req, res) => { // Lấy danh sách món đang chờ chế biến
        try {
            // Lấy danh sách món trong ngày hôm nay
            const today = new Date();
            const startOfDay = new Date(today.setHours(0, 0, 0, 0));
            const endOfDay = new Date(today.setHours(23, 59, 59, 999));
            const mon = await ChiTietDonHang.findAll({
                where: {
                    trangThai: 0,
                    thoiGianCapNhat: {
                        [Op.between]: [startOfDay, endOfDay]
                    } 
                },
                include: [
                    {
                        model: MonAn,
                        attributes: ['id', 'ten', 'hinhAnh']
                    }
                ]
            });
            return res.json({ status: true, list: mon });
        } catch (error) {
            console.error('Lỗi khi lấy đơn hàng đang chờ:', error);
            return res.status(500).json({ status: false, error: 'Lỗi server' });
        }
    },
    nhanMon: async (req, res) => { // Đầu bếp nhận món
        const { id } = req.body;
        try {
            let mon = await ChiTietDonHang.findOne({
                where: { id },
                include: [
                    {
                        model: MonAn,
                        attributes: ['id', 'ten', 'hinhAnh']
                    }
                ]
            });
            if (!mon) {
                return res.status(404).json({ status: false, error: 'Không tìm thấy món ăn' });
            }
            const token = req.cookies.AuthTokenManager;
            if (!token) {
                return res.status(401).json({ status: false, error: 'Chưa đăng nhập' });
            }
            // Giải mã token để lấy thông tin tài khoản
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded) {
                return res.status(401).json({ status: false, error: 'Token không hợp lệ' });
            }
            mon.trangThai = 1; // Đang chế biến
            mon.thoiGianCapNhat = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
            mon.idNhanVien = decoded.idNhanVien; // Lưu ID nhân viên vào món ăn
            await mon.save();
            await mon.reload(); // Tải lại thông tin món ăn từ cơ sở dữ liệu
            return res.json({ status: true, message: 'Cập nhật thành công', obj: mon });
        } catch (error) {
            console.error('Lỗi khi cập nhật món:', error);
            return res.status(500).json({ status: false, error: 'Lỗi server' });
        }
    },
    layMonDangCheBien: async (req, res) => { // Lấy món đang chế biến
        const token = req.cookies.AuthTokenManager;
        if (!token) {
            return res.status(401).json({ status: false, error: 'Chưa đăng nhập' });
        }
        // Giải mã token để lấy thông tin tài khoản
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return res.status(401).json({ status: false, error: 'Token không hợp lệ' });
        }
        try {
            const mon = await ChiTietDonHang.findOne({
                where: {
                    idNhanVien: decoded.idNhanVien,
                    trangThai: 1
                },
                include: [
                    {
                        model: MonAn,
                        attributes: ['id', 'ten', 'hinhAnh']
                    }
                ]
            });
            return res.json({ status: true, obj: mon });
        } catch (error) {
            console.error('Lỗi khi lấy món đang chế biến:', error);
            return res.status(500).json({ status: false, error: 'Lỗi server' });
        }
    },
    hoanThanhMon: async (req, res) => { // Đầu bếp hoàn thành món
        const { id } = req.body;
        try {
            let mon = await ChiTietDonHang.findOne({
                where: { id },
                include: [
                    {
                        model: MonAn,
                        attributes: ['id', 'ten', 'hinhAnh']
                    }
                ]
            });
            if (!mon) {
                return res.status(404).json({ status: false, error: 'Không tìm thấy món ăn' });
            }
            mon.trangThai = 2; // Hoàn thành
            mon.thoiGianCapNhat = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
            await mon.save();
            return res.json({ status: true, message: 'Cập nhật thành công'});
        } catch (error) {
            console.error('Lỗi khi cập nhật món:', error);
            return res.status(500).json({ status: false, error: 'Lỗi server' });
        }
    },

    guiMon: async (req, res) => { // Đã giao món cho khách
        const { id } = req.body;
        try {
            let mon = await ChiTietDonHang.findOne({
                where: { id }
            });
            if (!mon) {
                return res.status(404).json({ status: false, error: 'Không tìm thấy món ăn' });
            }
            mon.trangThai = 3; // Đã giao
            mon.thoiGianCapNhat = moment().tz('Asia/Ho_Chi_Minh').format('YYYY-MM-DD HH:mm:ss');
            await mon.save();
            console.log('Response JSON:', { status: true, message: 'Cập nhật thành công' });
            return res.json({ status: true, message: 'Cập nhật thành công'});
        } catch (error) {
            console.error('Lỗi khi cập nhật món:', error);
            return res.status(500).json({ status: false, error: 'Lỗi server' });
        }
    }
};
