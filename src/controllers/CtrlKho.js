const DanhMucNguyenLieu = require('../models/DanhMucNguyenLieu');
const NhaCungCap = require('../models/NhaCungCap');
const NguyenLieu = require('../models/NguyenLieu');
const PhieuNhap = require('../models/PhieuNhap');
const ChiTietPhieuNhap = require('../models/ChiTietPhieuNhap');
const Kho = require('../models/Kho');
const PhieuXuat = require('../models/PhieuXuat');
const ChiTietPhieuXuat = require('../models/ChiTietPhieuXuat');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');
const { Op } = require("sequelize");
const NhanVien = require('../models/NhanVien');
module.exports = {
    indexDanhMuc: (req, res) => {
        res.render('manager/danh-muc-nguyen-lieu');
    },
    indexNhaCungCap: (req, res) => {
        res.render('manager/nha-cung-cap');
    },
    indexNguyenLieu: (req, res) => {
        res.render('manager/nguyen-lieu');
    },
    indexKho: (req, res) => {
        res.render('manager/kho');
    },
    indexPhieuNhap: (req, res) => {
        res.render('manager/phieu-nhap');
    },
    indexPhieuXuat: (req, res) => {
        res.render('manager/phieu-xuat');
    },
    layDanhMucNguyenLieu: async (req, res) => {
        try{
            const danhMuc = await DanhMucNguyenLieu.findAll();
            return res.json({status: true, list: danhMuc});
        }catch(error){
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server' });
        }
    },
    themDanhMucNguyenLieu: async (req, res) => {
        const { tenDanhMuc } = req.body;
        try{
            const danhMuc = await DanhMucNguyenLieu.create({ tenDanhMuc });
            return res.json({status: true, obj: danhMuc});
        }catch(error){
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server: ', error });
        }
    },
    suaDanhMucNguyenLieu: async (req, res) => {
        const { id, tenDanhMuc } = req.body;
        try{
            const danhMuc = await DanhMucNguyenLieu.findByPk(id);
            if(danhMuc){
                danhMuc.tenDanhMuc = tenDanhMuc;
                await danhMuc.save();
                await danhMuc.reload();
                return res.json({status: true, obj: danhMuc});
            }
            else{
                return res.json({ status: false, error: 'Không tìm thấy danh mục' });
            }
        }catch(error){
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server: ', error });
        }
    },
    layNhaCungCap: async (req, res) => {
        try{
            const ncc = await NhaCungCap.findAll();
            return res.json({status: true, list: ncc});
        }catch(error){
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    themNhaCungCap: async (req, res) => {
        const { ten, soDienThoai, email, diaChi } = req.body;
        try{
            const nhaCungCap = await NhaCungCap.create({ ten, soDienThoai, email, diaChi });
            if(req.file && nhaCungCap){
                // Tải ảnh lên Cloudinary (sử dụng Promise để đồng bộ hóa)
                const uploadToCloudinary = (fileBuffer, publicId) => {
                    return new Promise((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream({
                            folder: 'nha-cung-cap',
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
                const hinhAnhUrl = await uploadToCloudinary(req.file.buffer, nhaCungCap.id);
                await nhaCungCap.update({ hinhAnh: hinhAnhUrl });
                await nhaCungCap.reload();
            }
            return res.json({status: true, obj: nhaCungCap});
        }catch(error){
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    suaNhaCungCap: async (req, res) => {
        const { id, ten, soDienThoai, email, diaChi } = req.body;
        try{
            const nhaCungCap = await NhaCungCap.findByPk(id);
            if(nhaCungCap){
                nhaCungCap.ten = ten;
                nhaCungCap.soDienThoai = soDienThoai;
                nhaCungCap.email = email;
                nhaCungCap.diaChi = diaChi;
                await nhaCungCap.save();
                if(req.file){
                    // Tải ảnh lên Cloudinary (sử dụng Promise để đồng bộ hóa)
                    const uploadToCloudinary = (fileBuffer, publicId) => {
                        return new Promise((resolve, reject) => {
                            const uploadStream = cloudinary.uploader.upload_stream({
                                folder: 'nha-cung-cap',
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
                    nhaCungCap.hinhAnh = hinhAnhUrl;
                }
                await nhaCungCap.reload();
                return res.json({status: true, obj: nhaCungCap});
            }
            else{
                return res.json({ status: false, error: 'Không tìm thấy nhà cung cấp' });
            }
        }catch(error){
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    layNguyenLieu: async (req, res) => {
        try{
            const nguyenLieu = await NguyenLieu.findAll({
                include: [
                    {
                        model: NhaCungCap,
                        attributes: ['ten']
                    },
                    {
                        model: DanhMucNguyenLieu,
                        attributes: ['tenDanhMuc']
                    }
                ],
                order: [['id', 'DESC']]
            });
            return res.json({status: true, list: nguyenLieu});
        }catch(error){
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    themNguyenLieu: async (req, res) => {
        const { ten, donVi, toiThieu, idNhaCungCap, idDanhMuc } = req.body;
        try{
            let nguyenLieu = await NguyenLieu.create({ ten, donVi, toiThieu, idNhaCungCap, idDanhMuc });
            if(nguyenLieu){
                // Tải ảnh lên Cloudinary (sử dụng Promise để đồng bộ hóa)
                const uploadToCloudinary = (fileBuffer, publicId) => {
                    return new Promise((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream({
                            folder: 'nguyen-lieu',
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
                const hinhAnhUrl = await uploadToCloudinary(req.file.buffer, nguyenLieu.id);
                await nguyenLieu.update({ hinhAnh: hinhAnhUrl });
                await nguyenLieu.reload();
                nguyenLieu = nguyenLieu.toJSON();
                const danhMuc = await DanhMucNguyenLieu.findOne({
                    where: { id: nguyenLieu.idDanhMuc },
                    attributes: ['tenDanhMuc']

                });
                nguyenLieu.DanhMucNguyenLieu = danhMuc.toJSON();
                const nhaCungCap = await NhaCungCap.findOne({
                    where: { id: nguyenLieu.idNhaCungCap },
                    attributes: ['ten']
                });
                nguyenLieu.NhaCungCap = nhaCungCap.toJSON();
                return res.json({status: true, obj: nguyenLieu});
            }
            else{
                return res.json({ status: false, error: 'Không tìm thấy nguyên liệu' });
            }
            
        }
        catch(error){
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    suaNguyenLieu: async (req, res) => {
        const { id, ten, donVi, toiThieu, idNhaCungCap, idDanhMuc } = req.body;
        try{
            let nguyenLieu = await NguyenLieu.findByPk(id);
            if(nguyenLieu){
                nguyenLieu.ten = ten;
                nguyenLieu.donVi = donVi;
                nguyenLieu.toiThieu = toiThieu;
                nguyenLieu.idNhaCungCap = idNhaCungCap;
                nguyenLieu.idDanhMuc = idDanhMuc;
                await nguyenLieu.save();
                if(req.file){
                    // Tải ảnh lên Cloudinary (sử dụng Promise để đồng bộ hóa)
                    const uploadToCloudinary = (fileBuffer, publicId) => {
                        return new Promise((resolve, reject) => {
                            const uploadStream = cloudinary.uploader.upload_stream({
                                folder: 'nguyen-lieu',
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
                    nguyenLieu.hinhAnh = hinhAnhUrl;
                }
                await nguyenLieu.reload();
                nguyenLieu = nguyenLieu.toJSON();
                // Lấy danh mục nguyên liệu và nhà cung cấp
                const danhMuc = await DanhMucNguyenLieu.findOne({
                    where: { id: nguyenLieu.idDanhMuc },
                    attributes: ['tenDanhMuc']
                });
                nguyenLieu.DanhMucNguyenLieu = danhMuc.toJSON();
                const nhaCungCap = await NhaCungCap.findOne({
                    where: { id: nguyenLieu.idNhaCungCap },
                    attributes: ['ten']
                });
                nguyenLieu.NhaCungCap = nhaCungCap.toJSON();
                return res.json({status: true, obj: nguyenLieu});
            }
            else{
                return res.json({ status: false, error: 'Không tìm thấy nguyên liệu' });
            }
        }catch(error){
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    layPhieuNhap: async (req, res) => {
        const { startDate, endDate } = req.query;
        try {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0); // Set start time to 00:00:00

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Set end time to 23:59:59
            const phieuNhap = await PhieuNhap.findAll({
                where: {
                    thoiGianNhap: {
                        [Op.between]: [start, end]
                    }
                }
            });
            
            return res.json({ status: true, list: phieuNhap });
        }
        catch (error) {
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    themPhieuNhap: async (req, res) => {
        const { chiTiet, thoiGianNhap, tongTien } = req.body;
        try{
            const phieuNhap = await PhieuNhap.create({
                thoiGianNhap,
                tongTien
            })
            if(phieuNhap){
                chiTiet.forEach(async (item) => {
                    ChiTietPhieuNhap.create({
                        idPhieu: phieuNhap.id,
                        idNguyenLieu: item.idNguyenLieu,
                        soLuong: item.soLuong,
                        gia: item.gia,
                        hanSuDung: item.hanSuDung,
                        ghiChu: item.ghiChu
                    })
                    Kho.create({
                        idPhieu: phieuNhap.id,
                        idNguyenLieu: item.idNguyenLieu,
                        soLuong: item.soLuong,
                        gia: item.gia,
                        hanSuDung: item.hanSuDung,
                        ghiChu: item.ghiChu
                    })
                    const nguyenLieu = await NguyenLieu.findByPk(item.idNguyenLieu);
                    if(nguyenLieu){
                        nguyenLieu.tonKho += item.soLuong;
                        await nguyenLieu.save();
                    }

                });

                return res.json({status: true, obj: phieuNhap});
            }
            else{
                return res.json({ status: false, error: 'Không tìm thấy phiếu nhập' });
            }
            
        }
        catch(error){
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    layNguyenLieuPhieuNhap: async (req, res) => {
        const { id } = req.query;
        try{
            const nguyenLieu = await ChiTietPhieuNhap.findAll({
                where: { idPhieu: id },
                include: [
                    {
                        model: NguyenLieu,
                        attributes: ['ten', 'donVi']
                    }
                ]
            })
            return res.json({status: true, list: nguyenLieu});
        }
        catch(error){
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    layNguyenLieuPhieuXuat: async (req, res) => {
        const { id } = req.query;
        try{
            const nguyenLieu = await ChiTietPhieuXuat.findAll({
                where: { idPhieuXuat: id },
                include: [
                    {
                        model: ChiTietPhieuNhap,
                        attributes: ['idPhieu', 'idNguyenLieu', 'gia'],
                        include: [
                            {
                                model: NguyenLieu,
                                attributes: ['ten', 'donVi']
                            }
                        ]
                    }
                ]
            })
            return res.json({status: true, list: nguyenLieu});
        }
        catch(error){
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    layNguyenLieuKho: async (req, res) => {
        try {
            const nguyenLieu = await Kho.findAll({
                include: [
                    {
                        model: NguyenLieu,
                        attributes: ['ten', 'donVi', 'idDanhMuc'],
                        include: [{
                            model: DanhMucNguyenLieu,
                            attributes: ['tenDanhMuc']
                        }]
                    }
                ]
            })
            return res.json({status: true, list: nguyenLieu});
        }
        catch(error){
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    timKiemPhieuNhap: async (req, res) => {
        const { startDate, endDate, minAmount, maxAmount } = req.query;
        try {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0); // Set start time to 00:00:00

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Set end time to 23:59:59

            const whereClause = {
                thoiGianNhap: {
                    [Op.between]: [start, end]
                }
            };

            if (minAmount) {
            whereClause.tongTien = { ...whereClause.tongTien, [Op.gte]: minAmount };
            }
            if (maxAmount) {
            whereClause.tongTien = { ...whereClause.tongTien, [Op.lte]: maxAmount };
            }

            const phieuNhap = await PhieuNhap.findAll({
                where: whereClause
            });

            return res.json({ status: true, list: phieuNhap });
        } catch (error) {
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    timKiemPhieuXuat: async (req, res) => {
        const { startDate, endDate, minAmount, maxAmount } = req.query;
        try {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0); // Set start time to 00:00:00

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Set end time to 23:59:59

            const whereClause = {
                thoiGianXuat: {
                    [Op.between]: [start, end]
                }
            };

            if (minAmount) {
                whereClause.tongTien = { ...whereClause.tongTien, [Op.gte]: minAmount };
            }
            if (maxAmount) {
                whereClause.tongTien = { ...whereClause.tongTien, [Op.lte]: maxAmount };
            }

            const phieuXuat = await PhieuXuat.findAll({
                where: whereClause
            });

            return res.json({ status: true, list: phieuXuat });
        } catch (error) {
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    layPhieuXuat: async (req, res) => {
        const { startDate, endDate } = req.query;
        try {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0); // Set start time to 00:00:00

            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // Set end time to 23:59:59
            const phieuXuat = await PhieuXuat.findAll({
                where: {
                    thoiGianXuat: {
                        [Op.between]: [start, end]
                    }
                },
                include: [
                    {
                        model: NhanVien,
                        attributes: ['ten'],
                        required: false // Allow null values for idNhanVien
                    }
                ]
            });
            
            return res.json({ status: true, list: phieuXuat });
        }
        catch (error) {
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    themPhieuXuat: async (req, res) => {
        const { thoiGianXuat, tongTien, idNguoiNhan, lyDoXuat, chiTiet } = req.body;
        try{
            const phieuXuat = await PhieuXuat.create({
                thoiGianXuat,
                tongTien,
                idNhanVien: idNguoiNhan,
                lyDo: lyDoXuat
            })
            if(phieuXuat){
                chiTiet.forEach(async (item) => {
                    ChiTietPhieuXuat.create({
                        idPhieuNhap: item.idPhieuNhap,
                        idPhieuXuat: phieuXuat.id,
                        idNguyenLieu: item.idNguyenLieu,
                        soLuong: item.soLuong,
                        ghiChu: item.ghiChu
                    })
                    const kho = await Kho.findOne({
                        where: { idPhieu: item.idPhieuNhap, idNguyenLieu: item.idNguyenLieu }
                    })
                    if(kho && kho.soLuong > item.soLuong){
                        kho.soLuong -= item.soLuong;
                        await kho.save();
                        
                    }
                    else if(kho && kho.soLuong == item.soLuong){
                        kho.destroy();
                    }
                    const nguyenLieu = await NguyenLieu.findByPk(item.idNguyenLieu);
                    if(nguyenLieu){
                        nguyenLieu.tonKho -= item.soLuong;
                        await nguyenLieu.save();
                    }
                });
                phieuXuat = phieuXuat.toJSON();
                const nhanVien = await NhanVien.findOne({
                    where: { id: phieuXuat.idNhanVien },
                    attributes: ['ten']
                });
                phieuXuat.NhanVien = nhanVien.toJSON();
                return res.json({status: true, obj: phieuXuat});
            }
            else{
                return res.json({ status: false, error: 'Không tìm thấy phiếu xuất' });
            }
        }
        catch(error){
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    }
}