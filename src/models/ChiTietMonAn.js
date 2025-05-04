const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MonAn = require('./MonAn');
const NguyenLieu = require('./NguyenLieu');

const ChiTietMonAn = sequelize.define('ChiTietMonAn', {
    idMonAn: {
        field: 'id_mon_an',
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    idNguyenLieu: {
        field: 'id_nguyen_lieu',
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
    },
    dinhLuong: {
        field: 'dinh_luong',
        type: DataTypes.INTEGER,
        allowNull: false
    },
    donVi: {
        field: 'don_vi',
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'chi_tiet_mon_an',
    timestamps: false
});
ChiTietMonAn.belongsTo(MonAn, { foreignKey: 'idMonAn' });
ChiTietMonAn.belongsTo(NguyenLieu, { foreignKey: 'idNguyenLieu' });
MonAn.hasMany(ChiTietMonAn, { foreignKey: 'idMonAn' });
NguyenLieu.hasMany(ChiTietMonAn, { foreignKey: 'idNguyenLieu' });

module.exports = ChiTietMonAn;