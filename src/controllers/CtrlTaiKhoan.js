const TaiKhoan = require('../models/TaiKhoan');
const NhanVien = require('../models/NhanVien');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

module.exports = {
    index: (req, res) => {
        res.render('manager/login');
    },
    dangNhap: async (req, res) => {
        try {
            const { tenDangNhap, matKhau, idNhanVien } = req.body;
            const taiKhoan = await TaiKhoan.findOne({
                where: {
                    tenDangNhap: tenDangNhap,
                    matKhau: crypto.createHash('md5').update(matKhau).digest('hex')
                }
            });
            if(taiKhoan){
                taiKhoan.update({
                    trangThai: 1
                })
                // Xác định vai trò của tài khoản
                let vaiTro = taiKhoan.idNhanVien === null ? 'Quản lý' : 'Nhân viên';
                if(vaiTro === 'Nhân viên'){
                    const nhanVien = await NhanVien.findByPk(taiKhoan.idNhanVien);
                    vaiTro = nhanVien.chucVu === 0 ? 'Phục vụ' : 'Đầu bếp';
                }
                // Tạo payload cho JWT 
                const payload = {
                    tenDangNhap: taiKhoan.tenDangNhap,
                    matKhau: taiKhoan.matKhau,
                    vaiTro: vaiTro,
                    idNhanVien: taiKhoan.idNhanVien
                };
                // Tạo JWT không có thời hạn
                const token = jwt.sign(payload, process.env.JWT_SECRET, {
                    expiresIn: '30m'
                });
                
                // Lưu token vào cookie
                res.cookie('AuthTokenManager', token, {
                    maxAge: 1000 * 60 * 30, // 30 phút
                    httpOnly: true,
                    sameSite: 'strict'
                });
                return res.json({ status: true, link: vaiTro === 'Quản lý' ? '/manager/thong-ke' : '/manager/trang-chu' });
            }
            else{
                return res.json({ status: false });
            }
        } catch (error) {
            console.error('Lỗi khi tìm tài khoản:', error);
            throw error;
        }
    },
    kiemTraTruyCap: (req, res, next) => {
        try{
            const token = req.cookies.AuthTokenManager;
            if(!token){
                return res.redirect('/manager/login');
            }
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
                if(err){
                    res.clearCookie('AuthTokenManager');
                    return res.redirect('/manager/login');
                }
                const token = jwt.sign({
                    idNhanVien: decoded.idNhanVien,
                    tenDangNhap: decoded.tenDangNhap,
                    matKhau: decoded.matKhau,
                    vaiTro: decoded.vaiTro
                }, process.env.JWT_SECRET, {
                    expiresIn: '30m'
                });
                res.cookie('AuthTokenManager', token, {
                    maxAge: 1000 * 60 * 30, // 30 phút
                    httpOnly: true,
                    sameSite: 'strict'
                });
                res.locals.taiKhoan = decoded;
                next()
            });
        } catch (error) {
            console.error('Lỗi khi kiểm tra đăng nhập:', error);
            throw error;
        }
    },
    dangXuat: (req, res) => {
        const token = req.cookies.AuthTokenManager;
        if(!token){
            res.clearCookie('AuthTokenManager');
            return res.redirect('/manager/login');
        }
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if(err){
                res.clearCookie('AuthTokenManager');
                return res.redirect('/manager/login');
            }
            const taiKhoan = await TaiKhoan.findOne({
                where: {
                    tenDangNhap: decoded.tenDangNhap,
                }
            })
            taiKhoan.update({
                trangThai: 0
            })
        });
        res.clearCookie('AuthTokenManager');
        res.redirect('/manager/login');
    }
}
