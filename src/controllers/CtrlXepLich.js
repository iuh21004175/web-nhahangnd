const ChamCong = require("../models/ChamCong");
const NhanVien = require("../models/NhanVien");
module.exports = {
    index: (req, res) => {
        res.render('manager/xep-lich');
    },
    layCaLamViec: async (req, res) => {
       if(req.query.week) {
            const week = req.query.week;

            const caLamViec = await ChamCong.findAll({
                where: {
                    tuan: week
                },
                include: [
                    {
                        model: NhanVien,
                        attributes: ['id', 'ten', 'chucVu'],
                    }
                ]
            });
            return res.json({status: true, list: caLamViec});
        }
        return res.json({status: false, message: 'Không tìm thấy tuần'});
    },
    capNhatCa: async (req, res) => {
        const { updates } = req.body;
    
        if (updates.length > 0) {
            try {
                await Promise.all(updates.map(item => {
                    const { id, trangThai } = item;
                    return ChamCong.update(
                        { trangThai },
                        { where: { id } }
                    );
                }));
    
                return res.json({ status: true, message: 'Cập nhật thành công' });
            } catch (error) {
                console.error('Lỗi khi cập nhật:', error);
                return res.status(500).json({ status: false, message: 'Đã xảy ra lỗi khi cập nhật' });
            }
        } else {
            return res.json({ status: false, message: 'Không có thông tin cập nhật' });
        }
    },
    layNgayBatDauCa: async (req, res) => {
        try {
            // Lấy ca chấm công sớm nhất từ CSDL
            const earliestRecord = await ChamCong.findOne({
                order: [['ngay', 'ASC']],
                attributes: ['ngay'] // Chỉ lấy thuộc tính ngày
            });
            
            // Nếu không có bản ghi nào
            if (!earliestRecord) {
                return res.json({
                    status: true,
                    hasRecords: false,
                    message: 'Không có bản ghi chấm công nào trong CSDL'
                });
            }
            
            // Trả về chỉ ngày của bản ghi đầu tiên
            return res.json({
                status: true,
                hasRecords: true,
                firstRecordDate: earliestRecord.ngay
            });
        } catch (error) {
            console.error('Lỗi khi lấy ngày bắt đầu chấm công:', error);
            return res.status(500).json({
                status: false,
                message: 'Đã xảy ra lỗi khi lấy thông tin ngày bắt đầu chấm công'
            });
        }
    }
}