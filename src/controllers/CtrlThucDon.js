const DanhMucMonAn = require('../models/DanhMucMonAn');
const MonAn = require('../models/MonAn');
const ChiTietMonAn = require('../models/ChiTietMonAn');
const NguyenLieu = require('../models/NguyenLieu');
const ChiTietDonHang = require('../models/ChiTietDonHang')
const {Readable} = require('stream');
const cloudinary = require('../config/cloudinary');
const sequelize = require('../config/database');
const QRCode = require('qrcode');

module.exports = {
    index: (req, res) => {
        res.render('manager/thuc-don');
    },
    indexThucDonKhachHang: (req, res) => {
        res.render('customer/thuc-don');
    },
    layDanhMucMonAn: async (req, res) => {
        try{
            const danhMuc = await DanhMucMonAn.findAll();
            return res.json({status: true, list: danhMuc});
        }catch(error){
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server' });
        }
    },
    themDanhMucMonAn: async (req, res) => {
        const { tenDanhMuc } = req.body;
        try{
            const danhMuc = await DanhMucMonAn.create({ tenDanhMuc });
            return res.json({status: true, obj: danhMuc});
        }catch(error){
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server: ', error });
        }
    },
    suaDanhMucMonAn: async (req, res) => {
        const { id, tenDanhMuc } = req.body;
        try{
            const danhMuc = await DanhMucMonAn.findByPk(id);
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
    layMonAn: async (req, res) => {
        try{
            const monAn = await MonAn.findAll({
                order: [['id', 'DESC']],
                include: {
                    model: DanhMucMonAn,
                    attributes: ['tenDanhMuc']
                }
            })
            return res.json({status: true, list: monAn});
        }
        catch(error){
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server' });
        }
    },
    layMonAnTheoLoai: async (req, res) => {
        try {
            const { id } = req.params; // Lấy id từ URL
            const whereClause = id ? { idDanhMuc: id } : {}; // Nếu có id thì tìm món ăn theo idDanhMuc, nếu không có id thì lấy tất cả
            const monAn = await MonAn.findAll({
                where: whereClause,
                order: [['id', 'DESC']],
                include: {
                    model: DanhMucMonAn,
                    attributes: ['tenDanhMuc']
                }
            });
            return res.json({ status: true, list: monAn });
        } catch (error) {
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server' });
        }
    },      
    layMonAnBanChay: async (req, res) => {
        try {
            const chiTietDonHang = await ChiTietDonHang.findAll({
                attributes: [
                    'idMonAn',  // Nhóm theo id món ăn
                    [sequelize.fn('SUM', sequelize.col('so_luong')), 'totalQuantity']  // Tính tổng số lượng món ăn
                ],
                group: ['idMonAn'],  // Nhóm theo id món ăn
                include: {
                    model: MonAn,
                    attributes: ['ten','gia','moTa','hinhAnh'],  // Lấy các thuộc tính của món ăn)']
                },
                order: [['totalQuantity', 'DESC']],  // Sắp xếp theo tổng số lượng
                limit: 3  // Lấy ra 3 món ăn có số lượng lớn nhất
            });
            return res.json({ status: true, list: chiTietDonHang });
        } catch (error) {
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server' });
        }   
    },   
    themMonAn: async (req, res) => {
        const { ten, gia, moTa, idDanhMuc, NguyenLieu } = req.body;
        try{
            const nguyenLieu = JSON.parse(NguyenLieu);
            let monAn = await MonAn.create({ ten, gia, idDanhMuc, moTa });
            if(monAn){
                const uploadToCloudinary = (fileBuffer, publicId) => {
                    return new Promise((resolve, reject) => {
                        const uploadStream = cloudinary.uploader.upload_stream({
                            folder: 'mon-an',
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
                const hinhAnhUrl = await uploadToCloudinary(req.file.buffer, monAn.id);
                await monAn.update({ hinhAnh: hinhAnhUrl });
                await monAn.reload();
                // Tạo chi tiết món ăn
                for(let i = 0; i < nguyenLieu.length; i++){
                    const { idNguyenLieu, dinhLuong, donVi } = nguyenLieu[i];
                    await ChiTietMonAn.create({ idMonAn: monAn.id, idNguyenLieu, dinhLuong, donVi });
                }
                monAn - monAn.toJSON();
                // Thay đổi thuộc tính của đối tượng monAn
                monAn.DanhMucMonAn = DanhMucMonAn.findOne({ 
                    where: { id: monAn.idDanhMuc }, 
                    attributes: ['tenDanhMuc'] 
                });       
                return res.json({status: true, obj: monAn});
            }
            else{
                return res.json({ status: false, error: 'Lỗi server' });
            }
            
        }catch(error){
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server: ', error });
        }
    },
    suaMonAn: async (req, res) => {
        const { id, ten, gia, moTa, idDanhMuc, NguyenLieu } = req.body;
        try{
            const nguyenLieu = JSON.parse(NguyenLieu);
            let monAn = await MonAn.findByPk(id);
            if(monAn){
                monAn.ten = ten;
                monAn.gia = gia;
                monAn.idDanhMuc = idDanhMuc;
                monAn.moTa = moTa;
                if(req.file){
                    const uploadToCloudinary = (fileBuffer, publicId) => {
                        return new Promise((resolve, reject) => {
                            const uploadStream = cloudinary.uploader.upload_stream({
                                folder: 'mon-an',
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
                    monAn.hinhAnh = hinhAnhUrl;
                }
                await monAn.save();
                await monAn.reload();
                // Xóa chi tiết món ăn cũ
                await ChiTietMonAn.destroy({ where: { idMonAn: id } });
                // Tạo chi tiết món ăn mới
                for(let i = 0; i < nguyenLieu.length; i++){
                    const { idNguyenLieu, dinhLuong, donVi } = nguyenLieu[i];
                    await ChiTietMonAn.create({ idMonAn: id, idNguyenLieu, dinhLuong, donVi });
                }
                monAn = monAn.toJSON();
                // Thay đổi thuộc tính của đối tượng monAn
                monAn.DanhMucMonAn = await DanhMucMonAn.findOne({ 
                    where: { id: monAn.idDanhMuc }, 
                    attributes: ['tenDanhMuc'] 
                });

                return res.json({status: true, obj: monAn});
            }
            else{
                return res.json({ status: false, error: 'Không tìm thấy món ăn' });
            }
        }catch(error){
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    layNguyenLieuMonAn: async (req, res) => {
        const { id } = req.query;
        try{
            const nguyenLieu = await ChiTietMonAn.findAll({
                where: { idMonAn: id },
                include: {
                    model: NguyenLieu,
                    attributes: ['ten']
                }
            });
            if(nguyenLieu){
                return res.json({status: true, list: nguyenLieu});
            }
            else{
                return res.json({ status: false, error: 'Không tìm thấy nguyên liệu' });
            }
        }catch(error){
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    layThongTinMonAn: async (req, res) => {
        const idMon = req.query.idMon;
    
        try {
            const monAn = await MonAn.findOne({
                where: { id: idMon },
                include: {
                    model: DanhMucMonAn,
                    attributes: ['tenDanhMuc']
                }
            });
    
            if (monAn) {
                return res.json({ status: true, data: monAn });
            } else {
                return res.json({ status: false, error: 'Không tìm thấy món ăn' });
            }
        } catch (error) {
            console.error('Error:', error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    taoMaQR: async (req, res) => {
        const monAnId = req.params.idMon;
        try {
          // Kiểm tra món ăn có tồn tại không
          const monAn = await MonAn.findByPk(monAnId);
    
          if (!monAn) {
            return res.status(404).json({ error: 'Món ăn không tồn tại' });
          }
    
          // Tạo URL dẫn tới trang chi tiết món ăn
          const baseUrl = 'https://nhahangcnmiuh.io.vn/'; //Đổi thành domain thật 
          const qrContent = `${baseUrl}/chi-tiet-mon-an?idMon=${monAnId}`;
    
          // Tạo mã QR từ URL
          const qrCodeBase64 = await QRCode.toDataURL(qrContent);
    
          res.json({ qrCode: qrCodeBase64 });
        } catch (error) {
          console.error('Lỗi khi tạo mã QR:', error);
          res.status(500).json({ error: 'Lỗi khi tạo mã QR' });
        }
      }
}
