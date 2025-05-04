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
    }
}