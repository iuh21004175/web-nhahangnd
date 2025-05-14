const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const NhanVien = require('./NhanVien');
const LichSu = require('./LichSu');
const LichSuChiTiet = sequelize.define('LichSuChiTiet', {
    id: {
        field: 'id',
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    idLichSu: {
        field: 'id_lich_su',
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    idNhanVien: {
        field: 'id_nhan_vien',
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    thaoTac: {
        field: 'thao_tac',
        type: DataTypes.TEXT,
        allowNull: true
    },
    thoiGian: {
        field: 'thoi_gian',
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'lich_su_chi_tiet',
    timestamps: false
});

LichSuChiTiet.belongsTo(NhanVien, { foreignKey: 'idNhanVien' });
NhanVien.hasMany(LichSuChiTiet, { foreignKey: 'idNhanVien' });

LichSuChiTiet.belongsTo(LichSu, { foreignKey: 'idLichSu' });
LichSu.hasMany(LichSuChiTiet, { foreignKey: 'idLichSu' });
module.exports = LichSuChiTiet;