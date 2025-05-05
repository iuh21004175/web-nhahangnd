const NhanVien = require('../models/NhanVien');
const TaiKhoan = require('../models/TaiKhoan');
const crypto = require('crypto');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');
function boDauTiengViet(str) {
    str = str.normalize('NFD')
             .replace(/[\u0300-\u036f]/g, '')
             .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    return str;
}

module.exports = {
    index: (req, res) => {
        res.render('manager/nhan-vien');
    },
    themNhanVien: async (req, res) => {
        try{
            const {ten, gioiTinh, ngaySinh, soDienThoai, diaChi, chucVu, ngayBatDau} = req.body;
            let nhanVien = await NhanVien.create({
                ten,
                gioiTinh,
                ngaySinh,
                soDienThoai,
                diaChi,
                chucVu,
                ngayBatDau
            })
            // Kiểm tra thêm nhân viên thành công chưa
            if(nhanVien){
                // Upload hình ảnh lên Cloudinary
                const uploadToCloudinary = (fileBuffer, publicId) => {
                    return new Promise((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream({
                            folder: 'nhan-vien',
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

                // Tải ảnh và cập nhật lại hình ảnh cho nhân viên
                const hinhAnhUrl = await uploadToCloudinary(req.file.buffer, nhanVien.id);
                await nhanVien.update({ hinhAnh: hinhAnhUrl });
                await nhanVien.reload();
                // Tạo tên đăng nhập: Chuyển tên về không dấu + id (ví dụ: nguyenvana101)
                const tenKhongDau = boDauTiengViet(ten).toLowerCase().replace(/\s+/g, '');
                const tenDangNhap = `${tenKhongDau}${nhanVien.id}`;
        
                // Tạo mật khẩu mặc định (ví dụ: 123456 -> hash bằng MD5)
                const matKhau = crypto.createHash('md5').update('123456').digest('hex');
                await TaiKhoan.create({
                    tenDangNhap,
                    matKhau,
                    idNhanVien: nhanVien.id
                })
                nhanVien = nhanVien.toJSON();
                const taiKhoan = await TaiKhoan.findOne({
                    where: {
                        idNhanVien: nhanVien.id
                    },
                    attributes: ['tenDangNhap']
                });
                nhanVien.TaiKhoan = taiKhoan.toJSON();
                return res.json({status: true, obj: nhanVien});
                
            }
            else{
                return res.json({status: false, error: 'Thêm nhân viên không thành công'});
            }
        }
        catch(error){
            console.error('Lỗi khi thêm nhân viên:', error);
            return res.json({status: false, error: 'Lỗi server: ', error});
        }
    },
    suaNhanVien: async (req, res) => {
        const {id, ten, gioiTinh, ngaySinh, soDienThoai, diaChi, chucVu, trangThai, matKhau} = req.body;
        try{
            let nhanVien = await NhanVien.findByPk(id);
            if(nhanVien){
                await nhanVien.update({
                    ten,
                    gioiTinh,
                    ngaySinh,
                    soDienThoai,
                    diaChi,
                    chucVu,
                    trangThai
                })
                // Kiểm tra có thay đổi mật khẩu không
                if(matKhau){
                    // Cập nhật mật khẩu
                    const matKhauHash = crypto.createHash('md5').update(matKhau).digest('hex');
                    await TaiKhoan.update({
                        matKhau: matKhauHash
                    }, {
                        where: {
                            idNhanVien: id
                        }
                    })
                }
                if(req.file){
                   // Tải ảnh lên Cloudinary (sử dụng Promise để đồng bộ hóa)
                    const uploadToCloudinary = (fileBuffer, publicId) => {
                        return new Promise((resolve, reject) => {
                            const uploadStream = cloudinary.uploader.upload_stream({
                                folder: 'nhan-vien',
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

                    // Tải ảnh và cập nhật lại hình ảnh cho nhân viên
                    const hinhAnhUrl = await uploadToCloudinary(req.file.buffer, id);
                    await nhanVien.update({ hinhAnh: hinhAnhUrl });
                }
                const taiKhoan = await TaiKhoan.findOne({
                    where: {
                        idNhanVien: id
                    },
                    attributes: ['tenDangNhap']
                });
                // Tải lại thông tin mới nhất từ cơ sở dữ liệu
                await nhanVien.reload();
                nhanVien = nhanVien.toJSON();
                nhanVien.TaiKhoan = taiKhoan.toJSON();
                return res.json({status: true, obj: nhanVien});
            }
            else{
                return res.json({status: false, error: 'Nhân viên không tồn tại'});
            }
        }
        catch(error){
            console.error('Lỗi khi sửa nhân viên:', error);
            return res.json({status: false, error: 'Lỗi server: ', error});
        }
    },
    layNhanVien: async (req, res) => {
        if(req.query.id){
            try{
                const nhanVien = await NhanVien.findByPk(req.query.id, {
                    include: {
                        model: TaiKhoan,
                        attributes: ['tenDangNhap'] // Lấy thêm tên đăng nhập
                    }
                });
                return res.json({status: true, obj: nhanVien});
            }
            catch(error){
                console.error('Lỗi khi lấy nhân viên:', error);
                return res.json({status: false, error: 'Lỗi server: ', error});
            }
        }
        else{
            try{
                const nhanVien = await NhanVien.findAll({
                    include: {
                        model: TaiKhoan,
                        attributes: ['tenDangNhap'] // Lấy thêm tên đăng nhập
                    },
                    order: [
                        ['trangThai', 'DESC'], // Trạng thái 1 trước, 0 sau
                        ['ten', 'ASC']          // Sắp xếp tên theo thứ tự A-Z
                    ]
                });
                return res.json({status: true, list: nhanVien});
            }
            catch(error){
                console.error('Lỗi khi lấy nhân viên:', error);
                return res.json({status: false, error: 'Lỗi server: ', error});
            }
        }
        
    },
    layThongTinNhanVien: async (req, res) => {
        const tenDangNhap = res.locals.taiKhoan.tenDangNhap;

        try {
            const taiKhoan = await TaiKhoan.findOne({ where: { tenDangNhap } });
      
            if (!taiKhoan) {
            console.log('Tài khoản không tồn tại');
            return res.json({ status: false, error: 'Tài khoản không tồn tại' });
            }
      
            const id = taiKhoan.idNhanVien;

            const nhanVien = await NhanVien.findAll({
                where: {
                    id  
                },
                attributes: ['id' ,'ten', 'chucVu', 'ngayBatDau', 'ngaySinh', 'soDienThoai', 'diaChi']
            })
            return res.json({status: true, obj: nhanVien});
        }
        catch (error) {
            console.error('Lỗi server:', error);
            res.status(500).json({ error: 'Lỗi server' });
        }
        
    }
}