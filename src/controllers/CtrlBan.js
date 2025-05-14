const KhuVuc = require('../models/KhuVuc');
const Ban = require('../models/Ban'); 
const sequelize = require('../config/database');
module.exports = {
    index: async (req, res) => {
        res.render('manager/so-do-ban')
    },
    indexBanNhanVien: async (req, res) => {
        res.render('manager/danh-sach-ban')
    },
    layKhuVuc: async (req, res) => {
        try {
            const khuVuc = await KhuVuc.findAll({
                attributes: [
                    'id', 
                    'tenKhuVuc',
                    [sequelize.fn('COUNT', sequelize.col('Bans.id')), 'soBan']
                ],
                include: [{
                    model: Ban,
                    as: 'Bans',
                    attributes: [],
                    required: false
                }],
                group: ['KhuVuc.id', 'tenKhuVuc'],
                order: [['id', 'ASC']]
            });
            return res.json({ status: true, list: khuVuc });
        }
        catch (error) {
            console.log(error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    themKhuVuc: async (req, res) => {
        try {
            const { tenKhuVuc } = req.body;
            const khuVuc = await KhuVuc.create({ tenKhuVuc });
            return res.json({ status: true, obj: khuVuc });
        }
        catch (error) {
            console.log(error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    suaKhuVuc: async (req, res) => {
        try {
            const { id, tenKhuVuc } = req.body;
            const khuVuc = await KhuVuc.findByPk(id);
            if (!khuVuc) {
                return res.json({ status: false, error: 'Khu vực không tồn tại' });
            }
            khuVuc.tenKhuVuc = tenKhuVuc;
            await khuVuc.save();
            return res.json({ status: true, obj: khuVuc });
        }
        catch (error) {
            console.log(error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    layBan: async (req, res) => {
        try {
            if(req.query.idBan) {
                const id = req.query.idBan;
                const ban = await Ban.findOne({
                    include: [{
                        model: KhuVuc,
                        attributes: ['tenKhuVuc']
                    }],
                    where: {
                        id
                    }
                });
                return res.json({ status: true, obj: ban });
            }
            else{
                const ban = await Ban.findAll({
                    include: [{
                        model: KhuVuc,
                        attributes: ['tenKhuVuc']
                    }],
                    order: [['id', 'ASC']]
                });
                return res.json({ status: true, list: ban }); 
            }  
        }
        catch (error) {
            console.log(error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    themBan: async (req, res) => {
        try {
            const { ten, sucChua, idKhuVuc } = req.body;
            let ban = await Ban.create({ ten, sucChua, idKhuVuc });
            ban = ban.toJSON(); // Chuyển đổi đối tượng Sequelize thành đối tượng JSON
            ban.KhuVuc = await KhuVuc.findByPk(idKhuVuc, { attributes: ['tenKhuVuc'] });
            return res.json({ status: true, obj: ban });
        }
        catch (error) {
            console.log(error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    suaBan: async (req, res) => {
        try {
            const { id, ten, sucChua, idKhuVuc, trangThai } = req.body;
            let ban = await Ban.findByPk(id);
            if (!ban) {
                return res.json({ status: false, error: 'Bàn không tồn tại' });
            }
            ban.ten = ten;
            ban.sucChua = sucChua;
            ban.idKhuVuc = idKhuVuc;
            ban.trangThai = trangThai;
            await ban.save();
            ban = ban.toJSON(); // Chuyển đổi đối tượng Sequelize thành đối tượng JSON
            ban.KhuVuc = await KhuVuc.findByPk(idKhuVuc, { attributes: ['tenKhuVuc'] });
            return res.json({ status: true, obj: ban });
        }
        catch (error) {
            console.log(error);
            return res.json({ status: false, error: 'Lỗi server', error });
        }
    },
    updateTrangThaiBan: async (req, res) => {
        const { idBan, newStatus } = req.body; // Lấy idBan và newStatus từ body request
        try {
            const ban = await Ban.findByPk(idBan);
            if (!ban) {
                return res.status(404).json({ status: false, error: 'Bàn không tồn tại' });
            }
            // Cập nhật trạng thái bàn
            ban.trangThai = newStatus;
            req.redis.publish('cap-nhat-trang-thai-ban', JSON.stringify({ 
                id: idBan,
                trangThai: newStatus
            }));
            await ban.save();
            return res.json({ status: true, message: 'Trạng thái bàn đã được cập nhật' });
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái bàn:', error);
            return res.status(500).json({ status: false, error: 'Lỗi server' });
        }
    }
    
  
}
