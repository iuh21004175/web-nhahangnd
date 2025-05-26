const KhachHang = require('../models/KhachHang');
const HoiThoai = require('../models/HoiThoai');
const MaXacThuc = require('../models/MaXacThuc');
const MaXacThucEmail = require('../models/MaXacThucEmail');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const sendSMS = require('../services/sms');
const sendEmail = require('../services/smsEmail');
const { Op } = require('sequelize');
const passport = require('../config/passport'); // Import passport từ config
const { Readable } = require('stream');
const cloudinary = require('../config/cloudinary');

const CtrlKhachHang = {
    dangNhap: async (req, res) => {
        const { tenDangNhap, matKhau, luuDangNhap } = req.body;
        try {
            const khachHang = await KhachHang.findOne({
                where: {
                    tenDangNhap,
                    matKhau: crypto.createHash('md5').update(matKhau).digest('hex'),
                    provider: null, // Không có provider nếu đăng nhập bằng tên đăng nhập và mật khẩu
                }
            });
            if (!khachHang) {
                return res.json({ status: false, error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
            }
            res.locals.user = {
                id: khachHang.id,
                ten: khachHang.ten,
                luuDangNhap,
                hinhAnh: khachHang.hinhAnh,
                provider: null, // Không có provider nếu đăng nhập bằng tên đăng nhập và mật khẩu
                accessToken: null // Không có accessToken nếu đăng nhập bằng tên đăng nhập và mật khẩu
            }
            // Tạo token cho khách hàng
            const token = jwt.sign({ 
                id: khachHang.id, 
                ten: khachHang.ten, 
                luuDangNhap, 
                hinhAnh: khachHang.hinhAnh,
                provider: null, // Không có provider nếu đăng nhập bằng tên đăng nhập và mật khẩu
                accessToken: null // Không có accessToken nếu đăng nhập bằng tên đăng nhập và mật khẩu
            }, process.env.JWT_SECRET, { expiresIn: luuDangNhap ? '30d' : '1h' });
            // Lưu token vào cookie
            res.cookie('AuthTokenCustomer', token, {
                httpOnly: true,
                maxAge: luuDangNhap ?  1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60, // 30 ngày hoặc 1 giờ
            });
            // const tokenIDCustomer = req.cookies.ChatIDCustomer;
            // if (tokenIDCustomer) {
                
            //     const decodedIDCustomer = jwt.verify(tokenIDCustomer, process.env.JWT_SECRET);
            //     const khachHangIDCustomer = await KhachHang.findOne({
            //         where: { id: decodedIDCustomer.id }
            //     });
            //     if (khachHangIDCustomer) {
            //         await khachHangIDCustomer.destroy(); // Xóa khách hàng vãng lai
            //     }
            // }
            // Xóa cookie ChatIDCustomer nếu có
            res.clearCookie('ChatIDCustomer');
            // Gọi hàm đăng nhập từ CtrlTaiKhoan
            return res.json({status: true});
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi server' });
        }
    },
    dangKy: async (req, res) => {
        const { ten, gioiTinh, ngaySinh, soDienThoai, tenDangNhap, matKhau } = req.body;
        try {
            const tokenIDCustomer = req.cookies.ChatIDCustomer;
            let khachHang = null;
            if (tokenIDCustomer) {
                const decodedIDCustomer = jwt.verify(tokenIDCustomer, process.env.JWT_SECRET);
                const khachHangIDCustomer = await KhachHang.findOne({
                    where: { id: decodedIDCustomer.id }
                });
                if (khachHangIDCustomer) {
                    khachHangIDCustomer.ten = ten;
                    khachHangIDCustomer.gioiTinh = parseInt(gioiTinh); // Chuyển đổi string sang number
                    khachHangIDCustomer.ngaySinh = ngaySinh;
                    khachHangIDCustomer.soDienThoai = soDienThoai;
                    khachHangIDCustomer.tenDangNhap = tenDangNhap;
                    khachHangIDCustomer.matKhau = crypto.createHash('md5').update(matKhau).digest('hex');
                    khachHangIDCustomer.soDaXacThuc = 1; // Đánh dấu số điện thoại đã được xác thực
                    await khachHangIDCustomer.save()
                    khachHang = await khachHangIDCustomer.reload(); // Tải lại thông tin khách hàng từ cơ sở dữ liệu
                }
            }
            else {
                // Tạo mới khách hàng
                khachHang = await KhachHang.create({
                    ten,
                    gioiTinh: parseInt(gioiTinh), // Chuyển đổi string sang number
                    ngaySinh,
                    soDienThoai,
                    soDaXacThuc: 1, // Đánh dấu số điện thoại đã được xác thực
                    tenDangNhap,
                    matKhau: crypto.createHash('md5').update(matKhau).digest('hex')
                });
                await HoiThoai.create({
                    id: khachHang.id,
                    tieuDe: `${ten}-#${khachHang.id}`,
                });
            }
            
            // Loại bỏ số điện thoại mà tất cả khách hàng chưa xác thực
            await KhachHang.update({
                soDienThoai: '',
            },
            {
                where: {
                    soDienThoai,
                    soDaXacThuc: 0
                }
            })
            
            return res.status(201).json({ status: true});
        } catch (error) {
            console.error(error);
            return res.status(500).json({ status: false, error: 'Lỗi server', error });
        }
    },
    dangXuat: (req, res) => {
        res.clearCookie('AuthTokenCustomer');
        req.logout?.(() => {}); // passport logout nếu dùng session
        res.redirect('/');
    },
    kiemTraTruyCap: (req, res, next) => {
        try {
            const token = req.cookies.AuthTokenCustomer;
            if (!token) {
                return res.redirect('/')
            }
            // Giải mã token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Lưu thông tin vào res.locals.user
            res.locals.user = {
                id: decoded.id,
                ten: decoded.ten,
                luuDangNhap: decoded.luuDangNhap,
                hinhAnh: decoded.hinhAnh,
                provider: decoded.provider || null, // Nếu có provider thì lưu vào đây
                accessToken: decoded.accessToken || null // Nếu có accessToken thì lưu vào đây
            }
            // Kiểm tra luuDangNhap
            if (!decoded.luuDangNhap) {
                // Nếu false, tạo lại cookie với thời gian sống mới
                const newToken = jwt.sign({ 
                    id: decoded.id, 
                    ten: decoded.ten, 
                    luuDangNhap: decoded.luuDangNhap, 
                    hinhAnh: decoded.hinhAnh,
                    provider: decoded.provider || null, // Nếu có provider thì lưu vào đây
                    accessToken: decoded.accessToken || null // Nếu có accessToken thì lưu vào đây
                }, process.env.JWT_SECRET, { expiresIn: '1h' });
                res.cookie('AuthTokenCustomer', newToken, {
                    httpOnly: true,
                    maxAge: 1000 * 60 * 60 // 1 giờ
                });
            }
            next();
        } catch (error) {
            console.error('Lỗi khi kiểm tra đăng nhập:', error);
            return res.redirect('/')
        }
    },
    kiemTraSoDienThoai: async (req, res) => {
        const { soDienThoai } = req.body;
        try {
            const khachHang = await KhachHang.findOne({
                where: {
                    soDienThoai,
                    soDaXacThuc: 1 // Kiểm tra xem số điện thoại đã được xác thực hay chưa
                }
            });
            if (khachHang) {
                return res.json({ status: true });
            } else {
                return res.json({ status: false });
            }
        } catch (error) {
            console.error(error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    kiemTraSoDienThoaiCapNhat: async (req, res) => {
        const { soDienThoai } = req.body;
        try {
            const token = req.cookies.AuthTokenCustomer;
            if (!token) {
                return res.status(401).json({ status: false, error: 'Chưa đăng nhập' });
            }
            // Giải mã token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const khachHang = await KhachHang.findOne({
                where: {
                    soDienThoai,
                    id: {
                        [Op.not]: decoded.id // Lọc ra khách hàng không có id này
                    },
                    soDaXacThuc: 1 // Kiểm tra xem số điện thoại đã được xác thực hay chưa
                }
            });
            if (khachHang) {
                return res.json({ status: true });
            } else {
                return res.json({ status: false });
            }
        } catch (error) {
            console.error(error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    kiemTraEmailCapNhat: async (req, res) => {
        const { email } = req.body;
        try {
            const token = req.cookies.AuthTokenCustomer;
            if (!token) {
                return res.status(401).json({ status: false, error: 'Chưa đăng nhập' });
            }
            // Giải mã token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const khachHang = await KhachHang.findOne({
                where: {
                    email,
                    id: {
                        [Op.not]: decoded.id // Lọc ra khách hàng không có id này
                    },
                    emailDaXacThuc: 1 // Kiểm tra xem email đã được xác thực hay chưa
                }
            });
            if (khachHang) {
                return res.json({ status: true });
            } else {
                return res.json({ status: false });
            }
        } catch (error) {
            console.error(error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    kiemTraTenDangNhap: async (req, res) => {
        const { tenDangNhap } = req.body;
        try {
            const khachHang = await KhachHang.findOne({
                where: {
                    tenDangNhap
                }
            });
            if (khachHang) {
                return res.json({ status: true });
            } else {
                return res.json({ status: false });
            }
        } catch (error) {
            console.error(error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    layThongTinKhachHang: async (req, res) => {
        try {
            const token = req.cookies.AuthTokenCustomer;
            if (!token) {
                return res.status(401).json({ status: false, error: 'Chưa đăng nhập' });
            }
            // Giải mã token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded || !decoded.id) {
                return res.status(401).json({ status: false, error: 'Chưa đăng nhập hoặc token hết hạn' });
            }
            const khachHang = await KhachHang.findOne({
                where: { id: decoded.id }
            });
            return res.json({ status: true, khachHang });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ status: false, error: 'Lỗi server' });
        }
    },
    capNhatThongTinKhachHang: async (req, res) => {
        const {fullName, gender, birthday, phone, email, address} = req.body;
        try{
            const token = req.cookies.AuthTokenCustomer;
            if (!token) {
                return res.status(401).json({ status: false, error: 'Chưa đăng nhập' });
            }
            // Giải mã token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (!decoded || !decoded.id) {
                return res.status(401).json({ status: false, error: 'Chưa đăng nhập hoặc token hết hạn' });
            }
            const khachHang = await KhachHang.findOne({
                where: { id: decoded.id }
            });
            if (!khachHang) {
                return res.status(404).json({ status: false, error: 'Khách hàng không tồn tại' });
            }
            const soDienThoaiCu = khachHang.soDienThoai
            const emailCu = khachHang.email
            // Cập nhật thông tin khách hàng
            khachHang.ten = fullName;
            khachHang.gioiTinh = gender;
            khachHang.ngaySinh = birthday;
            khachHang.soDienThoai = phone;
            khachHang.email = email;
            if(email != emailCu){
                khachHang.emailDaXacThuc = 0
            }
            if(phone != soDienThoaiCu){
                khachHang.soDaXacThuc = 0
            }
            khachHang.diaChi = address ? JSON.stringify(address) : ''; // Chuyển đổi địa chỉ thành chuỗi JSON
            await khachHang.save()
            await khachHang.reload(); // Tải lại thông tin khách hàng từ cơ sở dữ liệu
            res.locals.user = {
                id: khachHang.id,
                ten: khachHang.ten,
                luuDangNhap: decoded.luuDangNhap, // Mặc định là true khi đăng nhập bằng Google
                hinhAnh: khachHang.hinhAnh,
                provider: decoded.provider, // Lưu provider là google
                accessToken: khachHang.accessToken // Lưu accessToken nếu cần thiết
            }
            // Tạo token cho khách hàng
            const newToken = jwt.sign({ 
                id: khachHang.id, 
                ten: khachHang.ten, 
                luuDangNhap: decoded.luuDangNhap, 
                hinhAnh: khachHang.hinhAnh,
                provider: decoded.provider, // Lưu provider là google
                accessToken: khachHang.accessToken // Lưu accessToken nếu cần thiết
            }, process.env.JWT_SECRET, { expiresIn: decoded.luuDangNhap ? '30d' : '1h' });
            // Lưu token vào cookie
            res.cookie('AuthTokenCustomer', newToken, {
                httpOnly: true,
                maxAge: decoded.luuDangNhap ?  1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 // 30 ngày hoặc 1 giờ
            });
            return res.json({ status: true, khachHang });
        }
        catch (error) {
            console.error(error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    guiMaXacThuc: async (req, res) => {
        const { soDienThoai} = req.body;
        try {
            const maXacThuc = Math.floor(100000 + Math.random() * 900000).toString(); // Tạo mã xác thực 6 chữ số
            const thoiGianHetHan = new Date(Date.now() + 2 * 60 * 1000); // Thời gian hết hạn là 5 phút sau

            // Kiểm tra nếu số điện thoại đã tồn tại trong bảng MaXacThuc
            const existingRecord = await MaXacThuc.findOne({
                where: { soDienThoai }
            });

            if (existingRecord) {
                // Cập nhật mã xác thực và thời gian hết hạn
                await existingRecord.update({
                    maXacThuc,
                    thoiGianHetHan
                });
            } else {
                // Lưu mã xác thực mới vào cơ sở dữ liệu
                await MaXacThuc.create({
                    soDienThoai,
                    maXacThuc,
                    thoiGianHetHan
                });
            }

            // Gửi mã xác thực qua SMS
            sendSMS(soDienThoai, `Nhà hàng ND xin chào! Mã xác thực của bạn là: ${maXacThuc}. Vui lòng không chia sẻ mã này cho bất kỳ ai.`);
            return res.json({ status: true });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ status: false, error: 'Lỗi server', error });
        }
    },
    guiMaXacThucEmail: async (req, res) => {
        const {email} = req.body;
        try {
            const maXacThuc = Math.floor(100000 + Math.random() * 900000).toString(); // Tạo mã xác thực 6 chữ số
            const thoiGianHetHan = new Date(Date.now() + 2 * 60 * 1000); // Thời gian hết hạn là 2 phút sau

            // Kiểm tra nếu email đã tồn tại trong bảng MaXacThucEmail
            const existingRecord = await MaXacThucEmail.findOne({
                where: { email }
            });

            if (existingRecord) {
                // Cập nhật mã xác thực và thời gian hết hạn
                await existingRecord.update({
                    maXacThuc,
                    thoiGianHetHan
                });
            } else {
                // Lưu mã xác thực mới vào cơ sở dữ liệu
                await MaXacThucEmail.create({
                    email,
                    maXacThuc,
                    thoiGianHetHan
                });
            }
            const text = `Nhà hàng ND xin chào! Mã xác thực của bạn là: ${maXacThuc}. Vui lòng không chia sẻ mã này cho bất kỳ ai`
            // Gửi mã xác thực qua Email
            await sendEmail(req.authGoogle, email, 'Nhà hàng ND - Mã xác thực của bạn', text);
            return res.json({ status: true });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ status: false, error: 'Lỗi server', error });
        }
    },
    xacThucSoDienThoai: async (req, res) => {
        const { soDienThoai, maXacThuc } = req.body;
        try {
            const maXacThucRecord = await MaXacThuc.findOne({
                where: {
                    soDienThoai,
                    maXacThuc,
                    thoiGianHetHan: {
                        [Op.gt]: new Date() // Kiểm tra xem mã xác thực còn hiệu lực hay không
                    }
                }
            });
            if (!maXacThucRecord) {
                return res.json({ status: false, error: 'Mã xác thực không đúng hoặc đã hết hạn' });
            }
            await KhachHang.update({
                soDaXacThuc: 1 // Đánh dấu số điện thoại đã được xác thực
            }, {
                where: {
                    soDienThoai: soDienThoai
                }
            })
            // Loại bỏ số điện thoại mà tất cả khách hàng chưa xác thực
            await KhachHang.update({
                soDienThoai: '',
            },
            {
                where: {
                    soDienThoai,
                    soDaXacThuc: 0
                }
            })
            return res.json({ status: true });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ status: false, error: 'Lỗi server', error });
        }
    },
    xacThucEmail: async (req, res) => {
        const {email, emailCode} = req.body;
        try {
            const maXacThucRecord = await MaXacThucEmail.findOne({
                where: {
                    email,
                    maXacThuc: emailCode,
                    thoiGianHetHan: {
                        [Op.gt]: new Date() // Kiểm tra xem mã xác thực còn hiệu lực hay không
                    }
                }
            })
            if (!maXacThucRecord) {
                return res.json({ status: false, error: 'Mã xác thực không đúng hoặc đã hết hạn' });
            }
            await KhachHang.update({

                emailDaXacThuc: 1 // Đánh dấu email đã được xác thực
            }, {
                where: {
                    email: email
                }
            })
            // Loại bỏ email mà tất cả khách hàng chưa xác thực
            await KhachHang.update({
                email: '',
            },
            {
                where: {
                    email,
                    emailDaXacThuc: 0
                }
            })
            return res.json({ status: true });
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ status: false, error: 'Lỗi server', error });
        }
    },
    googleAuth: passport.authenticate('google', {
        scope: ['https://www.googleapis.com/auth/plus.login', 
            'https://www.googleapis.com/auth/userinfo.profile', 
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/user.birthday.read',
            'https://www.googleapis.com/auth/user.gender.read'    // ⬅ Thêm dòng này
        ], // Thêm các scope để lấy thêm thông tin người dùng
        prompt: 'consent',             // ⬅ Bắt buộc Google hiện lại hộp thoại xác nhận quyền
        accessType: 'offline'          // ⬅ Lấy cả refresh_token (nếu bạn cần)
    }),
    googleCallback: (req, res, next) => {
        passport.authenticate('google', { failureRedirect: '/' }, (err, user, info) => {
            if (err) {
                console.error('Lỗi xác thực Google:', err); // Ghi log lỗi nếu có
                //return next(err); // Xử lý lỗi nếu có
            }
            if (!user) {
                return res.redirect('/'); // Nếu không có user, chuyển hướng về trang chủ
            }
            // Lưu thông tin người dùng vào session (hoặc cookie)
            req.logIn(user, async (err) => {
                if (err) {
                    console.error('Lỗi khi đăng nhập:', err); // Ghi log lỗi nếu có
                    //return next(err); // Nếu không thể đăng nhập người dùng vào session
                }
                // Lưu thông tin khách hàng vào csdl nều khách hàng chưa đăng ký
                let khachHang = await KhachHang.findOne({
                    where: {
                        [Op.or]: [
                            {
                              providerId: user.id,
                              provider: 'google'
                            },
                            {
                              email: user.email,
                              emailDaXacThuc: 1 // Kiểm tra xem email đã được xác thực hay chưa
                            }
                        ]
                    }

                })
                if (!khachHang) {
                    const tokenIDCustomer = req.cookies.ChatIDCustomer;
                    if (tokenIDCustomer) {
                        const decodedIDCustomer = jwt.verify(tokenIDCustomer, process.env.JWT_SECRET);
                        const khachHangIDCustomer = await KhachHang.findOne({
                            where: { id: decodedIDCustomer.id }
                        });
                        if (khachHangIDCustomer) {
                            khachHangIDCustomer.ten = user.displayName;
                            khachHangIDCustomer.email = user.email
                            khachHangIDCustomer.emailDaXacThuc = 1
                            khachHangIDCustomer.gioiTinh = user.gender == 'male' ? 1 : 0; // Chuyển đổi string sang number
                            khachHangIDCustomer.ngaySinh =  user.birthday ? new Date(user.birthday.year, user.birthday.month - 1, user.birthday.day) : null;
                            khachHangIDCustomer.provider = 'google'
                            khachHangIDCustomer.providerId = user.id
                            khachHangIDCustomer.hinhAnh = user.picture
                            await khachHangIDCustomer.save()
                            khachHang = khachHangIDCustomer
                        }
                    }
                    else{
                        khachHang = await KhachHang.create({
                            ten: user.displayName,
                            email: user.email,
                            emailDaXacThuc: 1, // Đánh dấu email đã được xác thực
                            gioiTinh: user.gender == 'male' ? 1 : 0,
                            ngaySinh: user.birthday ? new Date(user.birthday.year, user.birthday.month - 1, user.birthday.day) : null,
                            provider: 'google',
                            providerId: user.id,
                            hinhAnh: user.picture,
                        })
                    }
                    
                    // Loại bỏ email mà tất cả khách hàng chưa xác thực
                    await KhachHang.update({
                        email: '',
                    },
                    {
                        where: {
                            email: user.email,
                            emailDaXacThuc: 0
                        }
                    })
                    await HoiThoai.create({
                        id: khachHang.id,
                        tieuDe: `${user.displayName}-#${khachHang.id}`,
                    });
                }
                // Tạo token cho khách hàng
                const token = jwt.sign({ 
                    id: khachHang.id, 
                    ten: khachHang.ten, 
                    luuDangNhap: true, 
                    hinhAnh: khachHang.hinhAnh,
                    provider: 'google', // Lưu provider là google
                    accessToken: user.accessToken // Lưu accessToken nếu cần thiết
                }, process.env.JWT_SECRET, { expiresIn:  '30d' });
                // Lưu token vào cookie
                res.cookie('AuthTokenCustomer', token, {
                    httpOnly: true,
                    maxAge:  1000 * 60 * 60 * 24 * 30  // 30 ngày hoặc 1 giờ
                });
                res.locals.user = {
                    id: khachHang.id,
                    ten: khachHang.ten,
                    luuDangNhap: true, // Mặc định là true khi đăng nhập bằng Google
                    hinhAnh: khachHang.hinhAnh,
                    provider: 'google', // Lưu provider là google
                    accessToken: user.accessToken // Lưu accessToken nếu cần thiết
                }
                const tokenIDCustomer = req.cookies.ChatIDCustomer;
                if (tokenIDCustomer) {
                        
                    const decodedIDCustomer = jwt.verify(tokenIDCustomer, process.env.JWT_SECRET);
                    const khachHangIDCustomer = await KhachHang.findOne({
                        where: { id: decodedIDCustomer.id }
                    });
                    if (khachHangIDCustomer) {
                        await khachHangIDCustomer.destroy(); // Xóa khách hàng vãng lai
                    }
                }
                    // Xóa cookie ChatIDCustomer nếu có
                res.clearCookie('ChatIDCustomer');
                // Chuyển hướng người dùng đến trang mong muốn sau khi đăng nhập thành công
                return res.redirect('/'); // Chuyển hướng về trang chủ hoặc trang mong muốn khác
            });
        })(req, res, next); // Gọi hàm middleware Passport authenticate
    },
    facebookAuth: passport.authenticate('facebook', {
        scope: ['public_profile'],
        authType: 'rerequest' 
    }),
    facebookCallback: (req, res, next) => {
        console.log('=== Đã vào facebookCallback ===');
    
        passport.authenticate('facebook', { failureRedirect: '/' }, async (err, user) => {
            if (err) {
                console.error('Lỗi xác thực Facebook:', err);
                return res.redirect('/');
            }
    
            if (!user) {
                return res.redirect('/');
            }
    
            req.logIn(user, async (err) => {
                if (err) {
                    console.error('Lỗi khi đăng nhập:', err);
                    return res.redirect('/');
                }
                let khachHang = await KhachHang.findOne({
                    where: {
                        providerId: user.id,
                        provider: 'facebook'
                    }
                });
    
                if (!khachHang) {
                    const tokenIDCustomer = req.cookies.ChatIDCustomer;
                    if (tokenIDCustomer) {
                        const decodedIDCustomer = jwt.verify(tokenIDCustomer, process.env.JWT_SECRET);
                        const khachHangIDCustomer = await KhachHang.findOne({
                            where: { id: decodedIDCustomer.id }
                        });
                        if (khachHangIDCustomer) {
                            khachHangIDCustomer.ten = user.displayName;
                            khachHangIDCustomer.gioiTinh = 1 // Chuyển đổi string sang number
                            khachHangIDCustomer.provider = 'facebook'
                            khachHangIDCustomer.providerId = user.id
                            khachHangIDCustomer.hinhAnh = user.picture
                            await khachHangIDCustomer.save()
                            khachHang = khachHangIDCustomer
                        }

                    }
                    else{
                        khachHang = await KhachHang.create({
                            ten: user.displayName,
                            gioiTinh: 1,
                            provider: 'facebook',
                            providerId: user.id,
                            hinhAnh: user.picture,
                        });
                        
                        await HoiThoai.create({
                            id: khachHang.id,
                            tieuDe: `${user.displayName}-#${khachHang.id}`,
                        });
                    }
                    
                   
                }
                res.locals.user = {
                    id: khachHang.id,
                    ten: khachHang.ten,
                    luuDangNhap: true,
                    hinhAnh: khachHang.hinhAnh,
                    provider: 'facebook', // Lưu provider là facebook
                    accessToken: user.accessToken // Lưu accessToken nếu cần thiết
                };
        
                const token = jwt.sign({
                    id: khachHang.id,
                    ten: khachHang.ten,
                    luuDangNhap: true,
                    hinhAnh: khachHang.hinhAnh,
                    provider: 'facebook', // Lưu provider là facebook
                    accessToken: user.accessToken // Lưu accessToken nếu cần thiết
                }, process.env.JWT_SECRET, {
                    expiresIn: '30d'
                });
        
                res.cookie('AuthTokenCustomer', token, {
                    httpOnly: true,
                    maxAge: 1000 * 60 * 60 * 24 * 30
                });
                const tokenIDCustomer = req.cookies.ChatIDCustomer;
                if (tokenIDCustomer) {
                        
                    const decodedIDCustomer = jwt.verify(tokenIDCustomer, process.env.JWT_SECRET);
                    const khachHangIDCustomer = await KhachHang.findOne({
                        where: { id: decodedIDCustomer.id }
                     });
                    if (khachHangIDCustomer) {
                        await khachHangIDCustomer.destroy(); // Xóa khách hàng vãng lai
                    }
                }
                    // Xóa cookie ChatIDCustomer nếu có
                res.clearCookie('ChatIDCustomer');
                return res.redirect('/');
            });
        })(req, res, next);
    },
    capNhatAnhDaiDien: async (req, res) => {
        try {
            const token = req.cookies.AuthTokenCustomer;
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const khachHang = await KhachHang.findOne({
                where: { id: decoded.id }
            });
            if (khachHang){
                const uploadToCloudinary = (fileBuffer, publicId) => {
                    return new Promise((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream({
                            folder: 'khach-hang',
                            public_id: publicId,
                            transformation: [
                                { width: 300, height: 300, crop: 'fill' }
                            ]
                        }, (error, result) => {
                            if (error) return reject(error);
                            resolve(result.secure_url);
                        });
                
                        Readable.from(fileBuffer).pipe(uploadStream);
                    });
                };
                // Tải ảnh và cập nhật lại hình ảnh cho khách hàng
                const hinhAnhUrl = await uploadToCloudinary(req.file.buffer, decoded.id);
                khachHang.hinhAnh = hinhAnhUrl;
                await khachHang.save();
                await khachHang.reload(); // Tải lại thông tin khách hàng từ cơ sở dữ liệu
                const newToken = jwt.sign({ 
                    id: khachHang.id, 
                    ten: khachHang.ten, 
                    luuDangNhap: decoded.luuDangNhap, 
                    hinhAnh: khachHang.hinhAnh,
                    provider: khachHang.provider || null, // Nếu có provider thì lưu vào đây
                    accessToken: khachHang.accessToken || null // Nếu có accessToken thì lưu vào đây
                }, process.env.JWT_SECRET, { expiresIn: decoded.luuDangNhap ? '30d' : '1h' });
                // Lưu token vào cookie
                res.cookie('AuthTokenCustomer', newToken, {
                    httpOnly: true,
                    maxAge: decoded.luuDangNhap ?  1000 * 60 * 60 * 24 * 30 : 1000 * 60 * 60 // 30 ngày hoặc 1 giờ
                });
                // Cập nhật lại thông tin khách hàng trong res.locals.user
                res.locals.user = {
                    id: khachHang.id,
                    ten: khachHang.ten,
                    luuDangNhap: decoded.luuDangNhap, // Mặc định là true khi đăng nhập bằng Google
                    hinhAnh: khachHang.hinhAnh,
                    provider: khachHang.provider || null, // Nếu có provider thì lưu vào đây
                    accessToken: khachHang.accessToken || null // Nếu có accessToken thì lưu vào đây
                }
                return res.json({ status: true, hinhAnh: hinhAnhUrl });
            }
            else {
                return res.json({ status: false, error: 'Khách hàng không tồn tại' });
            }
        }
        catch (error) {
            console.error(error);
            return res.status(500).json({ status: false, error: 'Lỗi server', error });
        }
    },
    // Bước 1: Gửi mã xác thực quên mật khẩu (qua tên đăng nhập hoặc số điện thoại)
    guiMaXacThucQuenMatKhau: async (req, res) => {
        const { account } = req.body; // account có thể là tên đăng nhập hoặc số điện thoại
        try {
            // Tìm khách hàng theo tên đăng nhập hoặc số điện thoại
            const khachHang = await KhachHang.findOne({
                where: {
                    [Op.or]: [
                        { tenDangNhap: account },
                        { soDienThoai: account }
                    ],
                    soDaXacThuc: 1 // Chỉ cho phép nếu số điện thoại đã xác thực
                }
            });
            if (!khachHang) {
                return res.json({ status: false, error: 'Không tìm thấy tài khoản hoặc số điện thoại chưa xác thực' });
            }
            const soDienThoai = khachHang.soDienThoai;
            // Tạo mã xác thực
            const maXacThuc = Math.floor(100000 + Math.random() * 900000).toString();
            const thoiGianHetHan = new Date(Date.now() + 2 * 60 * 1000); // 2 phút
    
            // Lưu hoặc cập nhật mã xác thực
            const existing = await MaXacThuc.findOne({ where: { soDienThoai } });
            if (existing) {
                await existing.update({ maXacThuc, thoiGianHetHan });
            } else {
                await MaXacThuc.create({ soDienThoai, maXacThuc, thoiGianHetHan });
            }
    
            // Gửi mã xác thực qua SMS
            sendSMS(soDienThoai, `Nhà hàng ND xin chào! Mã xác thực của bạn là: ${maXacThuc}. Vui lòng không chia sẻ mã này cho bất kỳ ai.`);
            return res.json({ status: true, soDienThoai });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ status: false, error: 'Lỗi server', error });
        }
    },
    // Bước 2: Xác thực mã OTP quên mật khẩu
    xacThucMaQuenMatKhau: async (req, res) => {
        const { soDienThoai, maXacThuc } = req.body;
        try {
            const record = await MaXacThuc.findOne({
                where: {
                    soDienThoai,
                    maXacThuc,
                    thoiGianHetHan: { [Op.gt]: new Date() }
                }
            });
            if (!record) {
                return res.json({ status: false, error: 'Mã xác thực không đúng hoặc đã hết hạn' });
            }
            // Không cần cập nhật gì, chỉ xác thực thành công
            return res.json({ status: true });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ status: false, error: 'Lỗi server', error });
        }
    },
    datLaiMatKhau: async (req, res) => {
        const { soDienThoai, maXacThuc, matKhauMoi } = req.body;
        try {
            // Kiểm tra mã xác thực còn hạn không
            const record = await MaXacThuc.findOne({
                where: {
                    soDienThoai,
                    maXacThuc,
                    thoiGianHetHan: { [Op.gt]: new Date() }
                }
            });
            if (!record) {
                return res.json({ status: false, error: 'Mã xác thực không đúng hoặc đã hết hạn' });
            }
            // Đặt lại mật khẩu mới (mã hóa md5)
            const khachHang = await KhachHang.findOne({ where: { soDienThoai } });
            if (!khachHang) {
                return res.json({ status: false, error: 'Không tìm thấy khách hàng' });
            }
            khachHang.matKhau = crypto.createHash('md5').update(matKhauMoi).digest('hex');
            await khachHang.save();
    
            // Xóa mã xác thực sau khi dùng
            await record.destroy();
    
            return res.json({ status: true });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ status: false, error: 'Lỗi server', error });
        }
    }
};

module.exports = CtrlKhachHang;