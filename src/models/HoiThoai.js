const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const KhachHang = require('./KhachHang');

const HoiThoai = sequelize.define('HoiThoai', {
    id: {
        field: 'id',
        type: DataTypes.INTEGER,
        primaryKey: true,
    },
    tieuDe: {
        field: 'tieu_de',
        type: DataTypes.STRING,
        allowNull: true
    },
    noiDungCuoi: {
        field: 'noi_dung_cuoi',
        type: DataTypes.STRING,
        allowNull: true
    },
    thoiGianGuiCuoi: {
        field: 'thoi_gian_gui_cuoi',
        type: DataTypes.DATE,
        allowNull: true
    },
    nguoiGuiCuoi: {
        field: 'nguoi_gui_cuoi',
        type: DataTypes.INTEGER,
        allowNull: true
    },
    soChuaDoc: {
        field: 'so_chua_doc',
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    soChuaDocKhach: {
        field: 'so_chua_doc_khach',
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    dangTraLoi:{
        field: 'dang_tra_loi',
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    
}, {
    tableName: 'hoi_thoai',
    timestamps: false
});
HoiThoai.belongsTo(KhachHang, { foreignKey: 'id' });
KhachHang.hasOne(HoiThoai, { foreignKey: 'id' });

module.exports = HoiThoai;