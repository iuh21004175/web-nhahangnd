const HeSoLuong = require('../models/HeSoLuong');
const ChamCong = require('../models/ChamCong');
module.exports = {

    // Hàm thêm hệ số lương
    themHeSoLuong: async (req, res) => {
        try {
            const { ngay, heSo, ghiChu } = req.body;

            // Kiểm tra nếu ngày và hệ số đã có trong bảng chưa
            const existingRecord = await HeSoLuong.findOne({
                where: { ngay: ngay }
            });

            if (existingRecord) {
                return res.status(400).json({
                    status: false, 
                    message: "Hệ số lương cho ngày này đã tồn tại."
                });
            }

            // Thêm hệ số lương vào bảng HeSoLuong
            const newHeSoLuong = await HeSoLuong.create({
                ngay,
                heSo,
                ghiChu
            });

            return res.status(201).json({
                status: true,  
                message: "Thêm hệ số lương thành công.",
                data: newHeSoLuong
            });

            } catch (error) {
                console.error("Lỗi khi thêm hệ số lương:", error);
                return res.status(500).json({
                    status: false,  
                    message: "Lỗi server khi thêm hệ số lương."
                });
            }
        },
        suaHeSoLuong: async (req, res) => {
            const { id, heSo, ghiChu } = req.body;
            try {
                const heSoLuong = await HeSoLuong.findByPk(id);
                if (!heSoLuong) {
                    return res.json({ status: false, error: 'Không tìm thấy hệ số lương' });
                }
        
                // Cập nhật hệ số
                heSoLuong.heSo = heSo;
                heSoLuong.ghiChu = ghiChu;
                await heSoLuong.save();
                await heSoLuong.reload();
        
                // Cập nhật tất cả bản ghi chấm công có ngày giống
                await ChamCong.update(
                    { heSoLuong: heSo }, // giá trị mới
                    { where: { ngay: heSoLuong.ngay } } // điều kiện ngày trùng
                );
        
                return res.json({ status: true, obj: heSoLuong });
            } catch (error) {
                console.error('Error:', error);
                return res.json({ status: false, error: 'Lỗi server', error });
            }
        }
        ,
    layHeSoLuong: async (req, res) => {
        try {
            // Lấy tất cả hệ số lương từ bảng HeSoLuong
            const heSoLuong = await HeSoLuong.findAll();
    
            // Kiểm tra nếu không tìm thấy hệ số lương nào
            if (heSoLuong.length === 0) {
                return res.status(404).json({
                    status: false,
                    message: "Không có hệ số lương nào trong hệ thống."
                });
            }
    
            // Trả về danh sách hệ số lương
            return res.status(200).json({
                status: true,
                message: "Lấy hệ số lương thành công.",
                data: heSoLuong
            });
    
        } catch (error) {
            console.error("Lỗi khi lấy hệ số lương:", error);
            return res.status(500).json({
                status: false,
                message: "Lỗi server khi lấy hệ số lương."
            });
        }
    },
    
    
};

