const HoiThoai = require('../models/HoiThoai');
const KhachHang = require('../models/KhachHang');
const TinNhan = require('../models/TinNhan');
const { Op } = require("sequelize");
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
module.exports = {
    index: (req, res) => {
        res.render('manager/ho-tro-truc-tuyen');
    },
    layHoiThoai: async (req, res) => {
        try {    
            if(req.query.id) {
                const id = req.query.id;
                const hoiThoai = await HoiThoai.findOne({
                    include: {
                        model: KhachHang,
                        attributes: ['hoatDong', 'hinhAnh']
                    },
                    where: {
                        id
                    }
                });
                return res.json({status: true, obj: hoiThoai });
            }
            else{
                const hoiThoai = await HoiThoai.findAll({
                    include:{
                        model: KhachHang,
                        attributes: ['hoatDong', 'hinhAnh']
                    },
                    where: {
                        noiDungCuoi: {
                            [Op.not]: null
                        }
                    },
                    order: [['thoiGianGuiCuoi', 'DESC']]
                });
                return res.json({status: true, list: hoiThoai });
            }
        } catch (error) {
            console.error('Lỗi khi lấy hội thoại:', error);
            return res.json({status: false, error: 'Lỗi khi lấy hội thoại', error });
        }
    },
    layTinNhan: async (req, res) => {
        try {
            const page = req.query.page || 1;
            const limit = 15; // Số lượng tin nhắn mỗi trang
            const idHoiThoai = req.query.id;
            const tinNhan = await TinNhan.findAll({
                where: { idHoiThoai },
                order: [['thoiGianGui', 'DESC']],
                limit,
                offset: (page - 1) * limit,
            });
            
            return res.json({status: true, list: tinNhan });
        } catch (error) {
            console.error('Lỗi khi lấy tin nhắn:', error);
            return res.json({status: false, error: 'Lỗi khi lấy tin nhắn', error });
        }
    },
    layIDKhachHang: async (req, res) => {
        const cookieChatID = req.cookies.ChatIDCustomer;
        const token = req.cookies.AuthTokenCustomer;
        if (token){
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET)
                const id = decoded.id;
                const hoiThoai = await HoiThoai.findOne({ where: { id } });
                if (!hoiThoai) {
                    return res.json({status: false, error: 'Hội thoại không tồn tại' });
                }
                return res.json({status: true, id });
            } catch (error) {
                console.error('Lỗi khi lấy ID hội thoại:', error);
                return res.json({status: false, error: 'Lỗi khi lấy ID hội thoại', error });
            }
        }
        else if (cookieChatID) {
            try {
                const decoded = jwt.verify(cookieChatID, process.env.JWT_SECRET)
                return res.json({status: true, id: decoded.id });
            } catch (error) {
                console.error('Lỗi khi lấy ID hội thoại:', error);
                return res.json({status: false, error: 'Lỗi khi lấy ID hội thoại', error });
            }
        }
        else {
            try {
                const khachHang = await KhachHang.create({});
                const ten = `Khách vãng lai - #${khachHang.id}`;
                khachHang.ten = ten;
                await khachHang.save(); // thêm await để chắc chắn đã lưu
            
                const hoiThoai = await HoiThoai.create({ id: khachHang.id, tieuDe: ten });
                const id = hoiThoai.id;
            
                // ---> Phải khai báo now, endOfDay trước
                const now = new Date();
                const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                const maxAge = endOfDay.getTime() - now.getTime();
            
                const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: Math.floor(maxAge / 1000) });
            
                res.cookie('ChatIDCustomer', token, { httpOnly: true, maxAge }); // maxAge tính bằng milliseconds
                return res.json({ status: true, id });
            } catch (error) {
                console.error('Lỗi khi tạo hội thoại mới:', error);
                return res.json({ status: false, error: 'Lỗi khi lấy ID hội thoại', error });
            }
        }
    }
}