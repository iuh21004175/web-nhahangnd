const { Op } = require('sequelize');
const fs = require('fs/promises');
const path = require('path');
const DonHang = require('../models/DonHang');
const KhachHang = require('../models/KhachHang');
const ChiTietDonHang = require('../models/ChiTietDonHang');
const MonAn = require('../models/MonAn');
const DanhMucMonAn = require('../models/DanhMucMonAn');
// hoặc nếu bạn đã export sequelize trực tiếp từ database.js:
const sequelize = require('../config/database');

const KHUNG_GIO = [
    { label: '6-10h', start: 6, end: 10 },
    { label: '10-14h', start: 10, end: 14 },
    { label: '14-16h', start: 14, end: 18 },
    { label: '18-22h', start: 18, end: 22 }
];

// Thêm hàm xử lý vào phần đầu file
async function thongKeTheoDanhMuc(type, value) {
    try {
        // Lấy khoảng thời gian dựa trên loại thống kê và giá trị
        const { start, end } = getTimeRange(type, value);

        // Debug thời gian để đảm bảo đúng khoảng
        console.log("===THỐNG KÊ DANH MỤC===");
        console.log("Type:", type, "Value:", value);
        console.log("Start:", start.toLocaleString());
        console.log("End:", end.toLocaleString());

        // Lấy tất cả đơn hàng trong khoảng thời gian
        const donHangs = await DonHang.findAll({
            where: {
                thoiGianGhi: {
                    [Op.between]: [start, end]
                },
                trangThai: 2 // Chỉ lấy đơn hàng đã thanh toán
            },
            attributes: ['id', 'tongTien', 'thoiGianGhi']
        });

        // In ra thông tin để debug
        console.log(`Tìm thấy ${donHangs.length} đơn hàng trong khoảng thời gian này`);

        // Nếu không có đơn hàng nào, trả về kết quả trống
        if (donHangs.length === 0) {
            return {
                danhMuc: [],
                tongDoanhThu: 0
            };
        }

        // Tính tổng doanh thu từ các đơn hàng
        const tongDoanhThuThucTe = donHangs.reduce((sum, dh) => sum + (dh.tongTien || 0), 0);
        
        // 1. Lấy tất cả chi tiết đơn hàng trong khoảng thời gian với thông tin món ăn và danh mục
        const chiTietDonHangs = await ChiTietDonHang.findAll({
            attributes: ['idDonHang', 'idMonAn', 'soLuong', 'gia'],
            include: [
                {
                    model: MonAn,
                    attributes: ['id', 'ten', 'idDanhMuc'],
                    include: [
                        {
                            model: DanhMucMonAn,
                            attributes: ['id', 'tenDanhMuc']
                        }
                    ]
                },
                {
                    model: DonHang,
                    attributes: ['id', 'tongTien', 'thoiGianGhi'],
                    where: {
                        thoiGianGhi: {
                            [Op.between]: [start, end]
                        },
                        trangThai: 2 // Chỉ lấy đơn hàng đã thanh toán
                    }
                }
            ]
        });
        
        // 2. Tạo map để nhóm theo danh mục
        const danhMucMap = new Map();
        const donHangIds = new Set();
        
        // 3. Xử lý dữ liệu
        let tongGiaTriCoTrongDanhMuc = 0;
        
        chiTietDonHangs.forEach(chiTiet => {
            const danhMuc = chiTiet.MonAn?.DanhMucMonAn;
            
            // Nếu món không có danh mục, bỏ qua
            if (!danhMuc) {
                console.log(`Món ${chiTiet.MonAn?.ten || 'không tên'} không có danh mục`);
                return;
            }
            
            const danhMucId = danhMuc.id;
            const donHangId = chiTiet.idDonHang;
            const soLuong = chiTiet.soLuong;
            
            // QUAN TRỌNG: Sử dụng giá từ ChiTietDonHang, không dùng giá từ MonAn
            const gia = chiTiet.gia;
            
            // tính soLuong * gia
            const doanhThuItem = (soLuong * gia);
            
            tongGiaTriCoTrongDanhMuc += doanhThuItem;
            donHangIds.add(donHangId);
            
            if (!danhMucMap.has(danhMucId)) {
                danhMucMap.set(danhMucId, {
                    idDanhMuc: danhMucId,
                    tenDanhMuc: danhMuc.tenDanhMuc,
                    doanhThu: 0,
                    soLuongMon: 0,
                    donHangIds: new Set()
                });
            }
            
            const danhMucData = danhMucMap.get(danhMucId);
            danhMucData.doanhThu += doanhThuItem;
            danhMucData.soLuongMon += soLuong;
            danhMucData.donHangIds.add(donHangId);
        });
        
        // Điều chỉnh giá trị nếu có sự chênh lệch
        if (danhMucMap.size === 1) {
            const singleCategory = danhMucMap.values().next().value;
            singleCategory.doanhThu = tongDoanhThuThucTe;
        } 
        else if (danhMucMap.size > 1 && tongGiaTriCoTrongDanhMuc > 0 && Math.abs(tongDoanhThuThucTe - tongGiaTriCoTrongDanhMuc) > 10) {
            const adjustmentRatio = tongDoanhThuThucTe / tongGiaTriCoTrongDanhMuc;
            
            for (let [key, value] of danhMucMap.entries()) {
                value.doanhThu = value.doanhThu * adjustmentRatio;
            }
        }
        
        // 4. Chuyển Map thành mảng kết quả
        let result = Array.from(danhMucMap.values()).map(item => ({
            idDanhMuc: item.idDanhMuc,
            tenDanhMuc: item.tenDanhMuc,
            doanhThu: Math.round(item.doanhThu), // Làm tròn
            soLuongDonHang: item.donHangIds.size,
            soLuongMon: item.soLuongMon
        }));
        
        // 5. Sắp xếp theo doanh thu giảm dần
        result = result.sort((a, b) => b.doanhThu - a.doanhThu);
        
        // 7. Thêm tỷ lệ phần trăm dựa trên tổng doanh thu thực tế
        const finalResult = result.map(item => ({
            ...item,
            tyLePhanTram: tongDoanhThuThucTe > 0 
                ? parseFloat(((item.doanhThu / tongDoanhThuThucTe) * 100).toFixed(2)) 
                : 0
        }));
        
        return {
            danhMuc: finalResult,
            tongDoanhThu: tongDoanhThuThucTe
        };
    } catch (error) {
        console.error("Lỗi trong hàm thongKeTheoDanhMuc:", error);
        // Trả về cấu trúc mặc định khi có lỗi
        return {
            danhMuc: [],
            tongDoanhThu: 0,
            error: error.message
        };
    }
}

async function thongKeChiTietDoanhThu(type, value) {
    const { start, end } = getTimeRange(type, value);
    
    // console.log("=== THỐNG KÊ CHI TIẾT DOANH THU ===");
    // console.log("Loại thống kê:", type);
    // console.log("Giá trị:", value);
    // console.log("Thời gian bắt đầu (UTC):", start.toISOString());
    // console.log("Thời gian kết thúc (UTC):", end.toISOString());
    
    // Lấy tất cả đơn hàng trong khoảng thời gian
    const donHangs = await DonHang.findAll({
        where: {
            thoiGianGhi: {
                [Op.between]: [start, end]
            },
            trangThai: 2 // Chỉ lấy đơn hàng đã thanh toán
        },
        attributes: ['id', 'tongTien', 'thoiGianGhi'],
        order: [['thoiGianGhi', 'ASC']]
    });
    
    let chiTiet = [];
    let tongDoanhThu = 0;
    
    if (type === 'day') {
        // Thống kê theo khung giờ trong ngày
        chiTiet = KHUNG_GIO.map(kg => {
            const donHangsTrongKhungGio = donHangs.filter(dh => {
                const hour = new Date(dh.thoiGianGhi).getHours();
                return hour >= kg.start && hour < kg.end;
            });
            
            const soLuongDon = donHangsTrongKhungGio.length;
            const doanhThu = donHangsTrongKhungGio.reduce((sum, dh) => sum + (dh.tongTien || 0), 0);
            tongDoanhThu += doanhThu;
            
            return {
                thoiGian: kg.label,
                soLuongDon,
                doanhThu
            };
        });
    } else if (type === 'week') {
        // Thống kê theo ngày trong tuần
        const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
        
        // Tạo mảng 7 ngày từ thứ 2 đến chủ nhật
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            
            // Lọc đơn hàng cho ngày hiện tại
            const donHangsTrongNgay = donHangs.filter(dh => {
                const orderDate = new Date(dh.thoiGianGhi);
                return orderDate.getDate() === d.getDate() && 
                       orderDate.getMonth() === d.getMonth() && 
                       orderDate.getFullYear() === d.getFullYear();
            });
            
            const soLuongDon = donHangsTrongNgay.length;
            const doanhThu = donHangsTrongNgay.reduce((sum, dh) => sum + (dh.tongTien || 0), 0);
            tongDoanhThu += doanhThu;
            
            chiTiet.push({
                thoiGian: dayNames[i],
                soLuongDon,
                doanhThu
            });
        }
    } else if (type === 'month') {
        // Thống kê theo ngày trong tháng
        const [year, month] = value.split('-').map(Number);
        const daysInMonth = new Date(year, month, 0).getDate();
        
        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month - 1, i);
            
            // Lọc đơn hàng cho ngày hiện tại
            const donHangsTrongNgay = donHangs.filter(dh => {
                const orderDate = new Date(dh.thoiGianGhi);
                return orderDate.getDate() === d.getDate() && 
                       orderDate.getMonth() === d.getMonth() && 
                       orderDate.getFullYear() === d.getFullYear();
            });
            
            const soLuongDon = donHangsTrongNgay.length;
            const doanhThu = donHangsTrongNgay.reduce((sum, dh) => sum + (dh.tongTien || 0), 0);
            tongDoanhThu += doanhThu;
            
            chiTiet.push({
                thoiGian: `Ngày ${i}`,
                soLuongDon,
                doanhThu
            });
        }
    } else if (type === 'year') {
        // Thống kê theo tháng trong năm
        const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
                          "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
        
        for (let i = 0; i < 12; i++) {
            // Lọc đơn hàng cho tháng hiện tại
            const donHangsTrongThang = donHangs.filter(dh => {
                const orderDate = new Date(dh.thoiGianGhi);
                return orderDate.getMonth() === i;
            });
            
            const soLuongDon = donHangsTrongThang.length;
            const doanhThu = donHangsTrongThang.reduce((sum, dh) => sum + (dh.tongTien || 0), 0);
            tongDoanhThu += doanhThu;
            
            chiTiet.push({
                thoiGian: monthNames[i],
                soLuongDon,
                doanhThu
            });
        }
    }
    
    // Tính tỷ lệ % doanh thu
    chiTiet = chiTiet.map(item => ({
        ...item,
        phanTram: tongDoanhThu > 0 ? parseFloat(((item.doanhThu / tongDoanhThu) * 100).toFixed(2)) : 0
    }));
    
    return {
        chiTiet,
        tongDoanhThu
    };
}

// Sửa hàm getTimeRange để đơn giản hóa xử lý múi giờ
function getTimeRange(type, value) {
    let start, end;

    if (type === 'day') {
        // Xử lý ngày - không cần chuyển đổi múi giờ
        const [year, month, day] = value.split('-').map(Number);
        
        // Tạo đối tượng Date ở múi giờ địa phương
        start = new Date(year, month - 1, day, 0, 0, 0, 0);
        end = new Date(year, month - 1, day, 23, 59, 59, 999);
        
        console.log(`Range for day ${value}: ${start.toLocaleString()} to ${end.toLocaleString()}`);
    } 
    else if (type === 'week') {
        // Sử dụng tiêu chuẩn ISO để tính tuần
        const [yearStr, weekStr] = value.split('-W');
        const year = parseInt(yearStr);
        const weekNumber = parseInt(weekStr);
        
        // Triển khai đúng chuẩn ISO 8601
        // Ngày 4/1 luôn nằm trong tuần 1
        const jan4th = new Date(year, 0, 4);
        
        // Tìm thứ Hai của tuần chứa ngày 4/1
        const firstMondayOfYear = new Date(jan4th);
        const dayOfWeek = jan4th.getDay() || 7;
        firstMondayOfYear.setDate(jan4th.getDate() - dayOfWeek + 1);
        
        // Tính ngày thứ Hai của tuần cần tìm
        start = new Date(firstMondayOfYear);
        start.setDate(firstMondayOfYear.getDate() + (weekNumber - 1) * 7);
        start.setHours(0, 0, 0, 0);
        
        // Tính ngày chủ nhật của tuần
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        
        console.log(`Range for week ${value}: ${start.toLocaleString()} to ${end.toLocaleString()}`);
    } 
    else if (type === 'month') {
        const [year, month] = value.split('-').map(Number);
        // Ngày đầu tháng
        start = new Date(year, month - 1, 1, 0, 0, 0, 0);
        // Ngày cuối tháng (ngày 0 của tháng tiếp theo = ngày cuối của tháng hiện tại)
        end = new Date(year, month, 0, 23, 59, 59, 999);
        
        console.log(`Range for month ${value}: ${start.toLocaleString()} to ${end.toLocaleString()}`);
    } 
    else if (type === 'year') {
        const year = parseInt(value);
        start = new Date(year, 0, 1, 0, 0, 0, 0);
        end = new Date(year, 11, 31, 23, 59, 59, 999);
        
        console.log(`Range for year ${value}: ${start.toLocaleString()} to ${end.toLocaleString()}`);
    }

    return { start, end };
}

function getMondayAndSunday(date) {
    const d = new Date(date);
    let day = d.getDay() || 7; // Chuyển chủ nhật (0) thành 7
    
    // Tính ngày thứ 2
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day - 1));
    monday.setHours(0, 0, 0, 0);
    
    // Tính ngày chủ nhật
    const sunday = new Date(d);
    sunday.setDate(d.getDate() + (7 - day));
    sunday.setHours(23, 59, 59, 999);
    
    return { monday, sunday };
}

async function thongKeTheoKhungGio(type, value) {
    const { start, end } = getTimeRange(type, value);
    
    // Debug thời gian để đảm bảo đúng khoảng
    console.log("===THỐNG KÊ KHUNG GIỜ===");
    console.log("Type:", type, "Value:", value);
    console.log("Start:", start.toLocaleString());
    console.log("End:", end.toLocaleString());
    
    // Lấy tất cả đơn hàng trong khoảng thời gian VỚI TRẠNG THÁI 2
    const donHangs = await DonHang.findAll({
        where: {
            thoiGianGhi: {
                [Op.between]: [start, end]
            },
            trangThai: 2 // Chỉ lấy đơn hàng đã thanh toán
        },
        order: [['thoiGianGhi', 'ASC']]
    });

    console.log(`Tìm thấy ${donHangs.length} đơn hàng trong khoảng thời gian này`);
    
    // In ra tất cả đơn hàng để kiểm tra
    if (donHangs.length > 0) {
        console.log("Chi tiết đơn hàng:");
        donHangs.forEach(dh => {
            console.log(`Đơn hàng ID: ${dh.id}, Thời gian: ${dh.thoiGianGhi}, Tổng tiền: ${dh.tongTien}`);
        });
    }
    
    // Nếu không có đơn hàng nào, trả về mảng với doanh thu bằng 0
    if (donHangs.length === 0) {
        return KHUNG_GIO.map(kg => ({
            label: kg.label,
            start: kg.start,
            end: kg.end,
            totalRevenue: 0,
            totalOrders: 0
        }));
    }

    // Khởi tạo kết quả cho từng khung giờ
    const result = KHUNG_GIO.map(kg => ({
        label: kg.label,
        start: kg.start,
        end: kg.end,
        totalRevenue: 0,
        totalOrders: 0,
        orderIds: [] // Thêm mảng lưu ID đơn hàng để debug
    }));

    // Phân loại đơn hàng vào từng khung giờ
    donHangs.forEach(dh => {
        const orderTime = new Date(dh.thoiGianGhi);
        const hour = orderTime.getHours();
        
        // Debug thông tin giờ
        console.log(`Xử lý đơn hàng ID: ${dh.id}, Giờ: ${hour}`);
        
        // Tìm khung giờ phù hợp
        let found = false;
        for (let i = 0; i < KHUNG_GIO.length; i++) {
            if (hour >= KHUNG_GIO[i].start && hour < KHUNG_GIO[i].end) {
                result[i].totalRevenue += dh.tongTien || 0;
                result[i].totalOrders += 1;
                result[i].orderIds.push(dh.id);
                found = true;
                console.log(`-> Đơn hàng ${dh.id} thuộc khung giờ ${KHUNG_GIO[i].label}`);
                break;
            }
        }
        
        if (!found) {
            console.log(`-> Đơn hàng ${dh.id} không thuộc khung giờ nào!`);
        }
    });

    // In ra kết quả phân loại để debug
    result.forEach(r => {
        console.log(`Khung giờ ${r.label}: ${r.totalOrders} đơn hàng, Doanh thu: ${r.totalRevenue}, IDs: ${r.orderIds.join(', ')}`);
    });

    // Xóa mảng orderIds trước khi trả về kết quả
    return result.map(({ orderIds, ...rest }) => rest);
}

async function getTop5MonBanChay(type, value) {
    const { start, end } = getTimeRange(type, value);

    // Debug thời gian để đảm bảo đúng khoảng
    console.log("===TOP 5 MÓN BÁN CHẠY===");
    console.log("Type:", type, "Value:", value);
    console.log("Start:", start.toLocaleString());
    console.log("End:", end.toLocaleString());

    // Kiểm tra xem có đơn hàng nào trong khoảng thời gian này không
    const countOrders = await DonHang.count({
        where: {
            thoiGianGhi: {
                [Op.between]: [start, end]
            },
            trangThai: 2 // Chỉ lấy đơn hàng đã thanh toán
        }
    });
    
    console.log(`Tìm thấy ${countOrders} đơn hàng trong khoảng thời gian này`);
    
    // Nếu không có đơn hàng nào, trả về mảng trống
    if (countOrders === 0) {
        return [];
    }

    // Sửa lại cách tính tổng doanh thu, chỉ định rõ gia từ bảng ChiTietDonHang
    const top = await ChiTietDonHang.findAll({
        attributes: [
            'idMonAn',
            [sequelize.fn('SUM', sequelize.col('ChiTietDonHang.so_luong')), 'tongSoLuong'],
            [sequelize.fn('SUM', sequelize.literal('ChiTietDonHang.so_luong * ChiTietDonHang.gia')), 'tongDoanhThu']
        ],
        include: [
            {
                model: MonAn,
                attributes: ['ten', 'gia']
            },
            {
                model: DonHang,
                attributes: ['thoiGianGhi'],
                where: {
                    thoiGianGhi: {
                        [Op.between]: [start, end]
                    },
                    trangThai: 2 // Chỉ lấy đơn hàng đã thanh toán
                }
            }
        ],
        group: ['idMonAn', 'MonAn.id', 'MonAn.ten', 'MonAn.gia'],
        order: [[sequelize.literal('tongSoLuong'), 'DESC']],
        limit: 5
    });

    // Chuyển đổi kết quả truy vấn thành đối tượng JavaScript
    const topWithRevenue = top.map(item => {
        return {
            idMonAn: item.idMonAn,
            ten: item.MonAn.ten,
            tongSoLuong: parseInt(item.getDataValue('tongSoLuong'), 10),
            tongDoanhThu: parseInt(item.getDataValue('tongDoanhThu'), 10),
            // Tính giá trung bình
            giatrungbinh: parseInt(item.getDataValue('tongSoLuong')) > 0 
                ? Math.round(parseInt(item.getDataValue('tongDoanhThu')) / parseInt(item.getDataValue('tongSoLuong')))
                : 0
        };
    });

    // Sắp xếp lại theo số lượng giảm dần
    return topWithRevenue.sort((a, b) => b.tongSoLuong - a.tongSoLuong);
}

function getISOWeek(date) {
    // Clone date to avoid modifying the original
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    
    // Get first day of year
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    
    // Calculate full weeks to nearest Thursday
    const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    
    return {
        year: d.getUTCFullYear(),
        week: weekNum
    };
}

async function getFirstOrderTime() {
    const order = await DonHang.findOne({
        where: {
            trangThai: 2 // Chỉ lấy đơn hàng đã thanh toán
        },
        order: [['thoiGianGhi', 'ASC']],
        attributes: ['thoiGianGhi'],
    });
    if (!order) return { day: null, week: null, month: null, year: null };

    const date = new Date(order.thoiGianGhi);

    // Ngày
    const day = date.toISOString().slice(0, 10); // yyyy-mm-dd

    // Tháng
    const month = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`; // yyyy-mm

    // Năm
    const year = date.getFullYear().toString();

    // Tuần ISO
    const { year: weekYear, week } = getISOWeek(date);
    const weekStr = `${weekYear}-W${week.toString().padStart(2, '0')}`; // yyyy-Www

    return { day, week: weekStr, month, year };
}

module.exports = {
    index: (req, res) => {
        res.render('manager/thong-ke');
    },
    indexBaoCao: (req, res) => {
        res.render('manager/report-template', {
            type: req.query.type,
            value: req.query.value
        });
    },
    thongKeTongQuat: async(req, res) => {
        try {
            const { type, value } = req.query; // type: day/week/month/year, value: giá trị tương ứng
            const { start, end } = getTimeRange(type, value);
            
            console.log("=== THỐNG KÊ TỔNG QUÁT ===");
            console.log("Type:", type, "Value:", value);
            console.log("Start:", start.toLocaleString());
            console.log("End:", end.toLocaleString());
            
            // Lấy đơn hàng trong khoảng thời gian CHỈ TRẠNG THÁI 2
            const donHangs = await DonHang.findAll({
                where: {
                    thoiGianGhi: {
                        [Op.between]: [start, end]
                    },
                    trangThai: 2 // Chỉ lấy đơn hàng đã thanh toán
                },
                order: [['thoiGianGhi', 'ASC']]
            });

            console.log(`Tìm thấy ${donHangs.length} đơn hàng trong khoảng thời gian này`);
            
            // Tổng doanh thu
            const totalRevenue = donHangs.reduce((sum, dh) => sum + (dh.tongTien || 0), 0);
            console.log("Tổng doanh thu (tổng quát):", totalRevenue);

            // Tổng số đơn hàng
            const totalOrders = donHangs.length;

            // Giá trị TB/đơn
            const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

            // Khách hàng mới trong khoảng thời gian
            const khachHangMoi = await KhachHang.count({
                where: {
                    createAt: {
                        [Op.between]: [start, end]
                    }
                }
            });

            res.json({
                status: true,
                totalRevenue,
                totalOrders,
                averageOrderValue,
                khachHangMoi,
                timeRange: {
                    start: start.toISOString(),
                    end: end.toISOString(),
                    type,
                    value
                }
            });
        } catch (err) {
            console.error("Lỗi thống kê tổng quát:", err);
            res.status(500).json({ status: false, error: 'Lỗi thống kê', detail: err.message });
        }
    },
    thongKeTheoThoiGian: async (req, res) => {
        try {
            const { type, value } = req.query;

            // Khi type là "day", chúng ta sẽ tìm tuần chứa ngày đó
            if (type === 'day') {
                // Lấy ngày từ request
                const selectedDate = new Date(value);
                
                // Tìm ngày thứ 2 của tuần chứa ngày này - không cần điều chỉnh múi giờ
                const dayOfWeek = selectedDate.getDay() || 7; // Chuyển chủ nhật (0) thành 7
                const monday = new Date(selectedDate);
                monday.setDate(selectedDate.getDate() - (dayOfWeek - 1));
                monday.setHours(0, 0, 0, 0);
                
                // Tìm ngày chủ nhật của tuần
                const sunday = new Date(monday);
                sunday.setDate(monday.getDate() + 6);
                sunday.setHours(23, 59, 59, 999);
                
                // Lấy đơn hàng trong khoảng thời gian của cả tuần VỚI TRẠNG THÁI 2
                const donHangs = await DonHang.findAll({
                    where: {
                        thoiGianGhi: {
                            [Op.between]: [monday, sunday]
                        },
                        trangThai: 2 // Chỉ lấy đơn hàng đã thanh toán
                    },
                    order: [['thoiGianGhi', 'ASC']]
                });
                
                // Tạo mảng 7 ngày từ thứ 2 đến chủ nhật
                const daysOfWeek = [];
                for (let i = 0; i < 7; i++) {
                    const d = new Date(monday);
                    d.setDate(monday.getDate() + i);
                    
                    // Format ngày theo YYYY-MM-DD
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    const formattedDate = `${year}-${month}-${day}`;
                    
                    daysOfWeek.push({ 
                        date: formattedDate,
                        displayDate: `${day}/${month}/${year}`,
                        jsDate: new Date(d)
                    });
                }
                
                // Tính doanh thu từng ngày - đơn giản hóa vì đã theo múi giờ địa phương
                const result = daysOfWeek.map(day => {
                    // Lọc đơn hàng cho ngày hiện tại
                    const dailyOrders = donHangs.filter(dh => {
                        const orderTime = new Date(dh.thoiGianGhi);
                        const orderDate = orderTime.toISOString().split('T')[0]; // YYYY-MM-DD
                        return orderDate === day.date;
                    });
                    
                    const totalRevenue = dailyOrders.reduce((sum, dh) => sum + (dh.tongTien || 0), 0);
                    
                    // Thứ trong tuần
                    const dayOfWeek = day.jsDate.getDay() || 7; // 0 → 7 (chủ nhật)
                    const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
                    const dayName = dayNames[dayOfWeek - 1];
                    
                    return {
                        date: day.date,
                        displayDate: day.displayDate,
                        dayName,
                        totalRevenue,
                        totalOrders: dailyOrders.length
                    };
                });

                // Trả về kết quả
                res.json({
                    status: true,
                    from: monday,
                    to: sunday,
                    days: result
                });
            } 
            else if (type === 'week') {
                // Phần code xử lý cho tuần - giữ nguyên code cũ
                let { start, end } = getTimeRange(type, value);
                
                // Đảm bảo đúng múi giờ cho khoảng thời gian
                // console.log("Thời gian bắt đầu (UTC):", start.toISOString());
                // console.log("Thời gian kết thúc (UTC):", end.toISOString());
                // console.log("Thời gian bắt đầu (Local):", start.toLocaleString());
                // console.log("Thời gian kết thúc (Local):", end.toLocaleString());
                
                // Lấy đơn hàng trong khoảng thời gian VỚI TRẠNG THÁI 2
                const donHangs = await DonHang.findAll({
                    where: {
                        thoiGianGhi: {
                            [Op.between]: [start, end]
                        },
                        trangThai: 2 // Chỉ lấy đơn hàng đã thanh toán
                    },
                    order: [['thoiGianGhi', 'ASC']]
                });
                
                // console.log("Tổng số đơn hàng tìm thấy:", donHangs.length);
                
                // Tạo mảng các ngày từ thứ 2 đến chủ nhật
                const daysOfWeek = [];
                for (let i = 0; i < 7; i++) {
                    const d = new Date(start);
                    d.setDate(start.getDate() + i);
                    
                    // Format ngày theo YYYY-MM-DD
                    const year = d.getFullYear();
                    const month = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    const formattedDate = `${year}-${month}-${day}`;
                    
                    daysOfWeek.push({ 
                        date: formattedDate,
                        displayDate: `${day}/${month}/${year}`,
                        jsDate: new Date(d)
                    });
                }

                // Tính doanh thu từng ngày
                const result = daysOfWeek.map(day => {
                    // Chuyển đổi Date object thành chuỗi YYYY-MM-DD theo múi giờ địa phương
                    const localDate = day.date;
                    
                    // Lọc đơn hàng cho ngày hiện tại
                    const dailyOrders = donHangs.filter(dh => {
                        const orderTime = new Date(dh.thoiGianGhi);
                        const orderYear = orderTime.getFullYear();
                        const orderMonth = String(orderTime.getMonth() + 1).padStart(2, '0');
                        const orderDay = String(orderTime.getDate()).padStart(2, '0');
                        const orderDate = `${orderYear}-${orderMonth}-${orderDay}`;
                        
                        return orderDate === localDate;
                    });
                    
                    const totalRevenue = dailyOrders.reduce((sum, dh) => sum + (dh.tongTien || 0), 0);
                    
                    // console.log("Ngày:", localDate, 
                    //            "Số đơn:", dailyOrders.length, 
                    //            "Doanh thu:", totalRevenue,
                    //            "Đơn hàng IDs:", dailyOrders.map(o => o.id).join(', '));
                    
                    // Thứ trong tuần
                    const dayOfWeek = day.jsDate.getDay() || 7; // 0 → 7 (chủ nhật)
                    const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];
                    const dayName = dayNames[dayOfWeek - 1];
                    
                    return {
                        date: localDate,
                        displayDate: day.displayDate,
                        dayName,
                        totalRevenue,
                        totalOrders: dailyOrders.length
                    };
                });

                res.json({
                    status: true,
                    from: start,
                    to: end,
                    days: result
                });
            } 
            else if (type === 'month') {
                // Lấy khoảng thời gian của tháng
                const { start, end } = getTimeRange(type, value);
                
                // console.log("=== THỐNG KÊ THEO THÁNG ===");
                // console.log("Thời gian bắt đầu tháng (UTC):", start.toISOString());
                // console.log("Thời gian kết thúc tháng (UTC):", end.toISOString());
                // console.log("Thời gian bắt đầu tháng (Local):", start.toLocaleString());
                // console.log("Thời gian kết thúc tháng (Local):", end.toLocaleString());
                
                // Phân tích giá trị tháng để lấy năm và tháng
                const [year, month] = value.split('-').map(Number);
                
                // Tính số ngày trong tháng
                const daysInMonth = new Date(year, month, 0).getDate();
                // console.log(`Số ngày trong tháng ${month}/${year}:`, daysInMonth);
                
                // Lấy đơn hàng trong tháng VỚI TRẠNG THÁI 2
                const donHangs = await DonHang.findAll({
                    where: {
                        thoiGianGhi: {
                            [Op.between]: [start, end]
                        },
                        trangThai: 2 // Chỉ lấy đơn hàng đã thanh toán
                    },
                    order: [['thoiGianGhi', 'ASC']]
                });
                
                // console.log("Tổng số đơn hàng tìm thấy trong tháng:", donHangs.length);
                
                // In ra chi tiết mỗi đơn hàng để debug
                // donHangs.forEach(dh => {
                //     const orderTime = new Date(dh.thoiGianGhi);
                //     console.log("[Tháng] Đơn hàng:", dh.id, 
                //                "Thời gian:", dh.thoiGianGhi, 
                //                "Ngày:", orderTime.getDate(),
                //                "Tổng tiền:", dh.tongTien);
                // });
                
                // Tạo mảng các ngày trong tháng
                const daysOfMonth = [];
                for (let i = 1; i <= daysInMonth; i++) {
                    // Tạo đối tượng Date cho ngày i của tháng
                    const d = new Date(year, month - 1, i);
                    
                    // Format ngày theo YYYY-MM-DD
                    const formattedYear = d.getFullYear();
                    const formattedMonth = String(d.getMonth() + 1).padStart(2, '0');
                    const formattedDay = String(d.getDate()).padStart(2, '0');
                    const formattedDate = `${formattedYear}-${formattedMonth}-${formattedDay}`;
                    
                    daysOfMonth.push({
                        date: formattedDate,
                        displayDate: `${formattedDay}/${formattedMonth}`, // Hiển thị ngày/tháng (vd: 01/04)
                        dayNumber: i, // Số ngày trong tháng (1-31)
                        jsDate: new Date(d)
                    });
                }
                
                // Tính doanh thu từng ngày trong tháng
                const result = daysOfMonth.map(day => {
                    // Lọc đơn hàng cho ngày hiện tại
                    const dailyOrders = donHangs.filter(dh => {
                        const orderTime = new Date(dh.thoiGianGhi);
                        const orderYear = orderTime.getFullYear();
                        const orderMonth = String(orderTime.getMonth() + 1).padStart(2, '0');
                        const orderDay = String(orderTime.getDate()).padStart(2, '0');
                        const orderDate = `${orderYear}-${orderMonth}-${orderDay}`;
                        
                        return orderDate === day.date;
                    });
                    
                    const totalRevenue = dailyOrders.reduce((sum, dh) => sum + (dh.tongTien || 0), 0);
                    
                    // console.log("Ngày:", day.date, 
                    //            "Số đơn:", dailyOrders.length, 
                    //            "Doanh thu:", totalRevenue,
                    //            "Đơn hàng IDs:", dailyOrders.map(o => o.id).join(', '));
                    
                    return {
                        date: day.date,
                        displayDate: day.displayDate,
                        dayNumber: day.dayNumber, // Thêm số ngày vào kết quả
                        totalRevenue,
                        totalOrders: dailyOrders.length
                    };
                });
                
                // Trả về kết quả
                res.json({
                    status: true,
                    from: start,
                    to: end,
                    days: result,
                    year,
                    month,
                    daysInMonth
                });
            }
            else if (type === 'year') {
                // Lấy khoảng thời gian của năm
                const { start, end } = getTimeRange(type, value);
                
                // console.log("=== THỐNG KÊ THEO NĂM ===");
                // console.log("Thời gian bắt đầu năm (UTC):", start.toISOString());
                // console.log("Thời gian kết thúc năm (UTC):", end.toISOString());
                // console.log("Thời gian bắt đầu năm (Local):", start.toLocaleString());
                // console.log("Thời gian kết thúc năm (Local):", end.toLocaleString());
                
                // Lấy năm từ giá trị
                const year = parseInt(value);
                
                // Lấy đơn hàng trong năm VỚI TRẠNG THÁI 2
                const donHangs = await DonHang.findAll({
                    where: {
                        thoiGianGhi: {
                            [Op.between]: [start, end]
                        },
                        trangThai: 2 // Chỉ lấy đơn hàng đã thanh toán
                    },
                    order: [['thoiGianGhi', 'ASC']]
                });
                
                // console.log("Tổng số đơn hàng tìm thấy trong năm:", donHangs.length);
                
                // Tạo mảng dữ liệu cho 12 tháng
                const monthsData = [];
                const monthNames = [
                    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
                    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
                ];
                
                // Khởi tạo dữ liệu cho từng tháng
                for (let i = 1; i <= 12; i++) {
                    // Tạo ngày đầu tháng
                    const monthStart = new Date(year, i - 1, 1, 0, 0, 0, 0);
                    
                    // Tạo ngày cuối tháng (ngày 0 của tháng tiếp theo là ngày cuối của tháng hiện tại)
                    const monthEnd = new Date(year, i, 0, 23, 59, 59, 999);
                    
                    // Format tháng
                    const monthNumber = i;
                    const formattedMonth = String(i).padStart(2, '0');
                    
                    monthsData.push({
                        month: monthNumber,        // Số tháng (1-12)
                        monthName: monthNames[i-1], // Tên tháng
                        displayMonth: `${formattedMonth}/${year}`, // Hiển thị tháng/năm (vd: 04/2025)
                        start: monthStart,
                        end: monthEnd
                    });
                }
                
                // Tính doanh thu từng tháng trong năm
                const result = monthsData.map(month => {
                    // Lọc đơn hàng cho tháng hiện tại
                    const monthlyOrders = donHangs.filter(dh => {
                        const orderTime = new Date(dh.thoiGianGhi);
                        return orderTime >= month.start && orderTime <= month.end;
                    });
                    
                    const totalRevenue = monthlyOrders.reduce((sum, dh) => sum + (dh.tongTien || 0), 0);
                    
                    // console.log("Tháng:", month.month, 
                    //            "Số đơn:", monthlyOrders.length, 
                    //            "Doanh thu:", totalRevenue,
                    //            "Đơn hàng IDs:", monthlyOrders.map(o => o.id).join(', '));
                    
                    return {
                        month: month.month,
                        monthName: month.monthName,
                        displayMonth: month.displayMonth,
                        totalRevenue,
                        totalOrders: monthlyOrders.length
                    };
                });
                
                // Tính tổng doanh thu năm
                const totalYearRevenue = result.reduce((sum, month) => sum + month.totalRevenue, 0);
                const totalYearOrders = result.reduce((sum, month) => sum + month.totalOrders, 0);
                
                // Trả về kết quả
                res.json({
                    status: true,
                    from: start,
                    to: end,
                    months: result,
                    year,
                    totalRevenue: totalYearRevenue,
                    totalOrders: totalYearOrders
                });
            }
        } catch (err) {
            console.error('Lỗi thống kê theo thời gian:', err);
            res.status(500).json({ status: false, error: 'Lỗi thống kê', detail: err.message });
        }
    },
    thongKeKhungGio: async (req, res) => {
        try {
            const { type, value } = req.query; // type: day/week/month/year, value: giá trị tương ứng
            
            // Kiểm tra tham số đầu vào
            if (!type || !value) {
                return res.status(400).json({ 
                    status: false, 
                    error: 'Thiếu tham số', 
                    detail: 'Cần cung cấp type và value' 
                });
            }
            
            const data = await thongKeTheoKhungGio(type, value);
            
            // Tính tổng doanh thu và đơn hàng
            const totalRevenue = data.reduce((sum, item) => sum + item.totalRevenue, 0);
            const totalOrders = data.reduce((sum, item) => sum + item.totalOrders, 0);
            
            res.json({ 
                status: true, 
                data,
                totalRevenue,
                totalOrders,
                type, 
                value
            });
        } catch (err) {
            console.error('Lỗi thống kê theo khung giờ:', err);
            res.status(500).json({ 
                status: false, 
                error: 'Lỗi thống kê khung giờ', 
                detail: err.message 
            });
        }
    },
    top5MonBanChay: async (req, res) => {
        try {
            const { type, value } = req.query; // type: day/week/month/year, value: giá trị tương ứng
            const data = await getTop5MonBanChay(type, value);
            
            // Tính tổng số lượng và doanh thu của top 5
            const tongSoLuong = data.reduce((sum, item) => sum + item.tongSoLuong, 0);
            const tongDoanhThu = data.reduce((sum, item) => sum + item.tongDoanhThu, 0);
            
            res.json({ 
                status: true, 
                data,
                tongSoLuong,
                tongDoanhThu
            });
        } catch (err) {
            console.error('Lỗi lấy top 5 món bán chạy:', err);
            res.status(500).json({ status: false, error: 'Lỗi lấy top 5 món bán chạy', detail: err.message });
        }
    },
    getFirstOrderTime: async (req, res) => {
        try {
            const result = await getFirstOrderTime();
            res.json({ status: true, ...result });
        } catch (err) {
            res.status(500).json({ status: false, error: 'Lỗi lấy thời gian đầu tiên có đơn hàng', detail: err.message });
        }
    },
    thongKeTheoDanhMuc: async (req, res) => {
        try {
            const { type, value } = req.query; // type: day/week/month/year, value: giá trị tương ứng
            
            // Kiểm tra tham số đầu vào
            if (!type || !value) {
                return res.status(400).json({ 
                    status: false, 
                    error: 'Thiếu tham số', 
                    detail: 'Cần cung cấp type và value' 
                });
            }
            
            // Lấy thống kê theo danh mục
            const data = await thongKeTheoDanhMuc(type, value);
            
            // Trả về kết quả
            res.json({
                status: true,
                type,
                value,
                data
            });
        } catch (err) {
            console.error('Lỗi thống kê theo danh mục:', err);
            res.status(500).json({ 
                status: false, 
                error: 'Lỗi thống kê theo danh mục', 
                detail: err.message 
            });
        }
    },
    thongKeChiTietDoanhThu: async (req, res) => {
        try {
            const { type, value } = req.query; // type: day/week/month/year, value: giá trị tương ứng
            
            // Kiểm tra tham số đầu vào
            if (!type || !value) {
                return res.status(400).json({ 
                    status: false, 
                    error: 'Thiếu tham số', 
                    detail: 'Cần cung cấp type và value' 
                });
            }
            
            // Lấy thống kê chi tiết doanh thu
            const data = await thongKeChiTietDoanhThu(type, value);
            
            // Trả về kết quả
            res.json({
                status: true,
                type,
                value,
                data
            });
        } catch (err) {
            console.error('Lỗi thống kê chi tiết doanh thu:', err);
            res.status(500).json({ 
                status: false, 
                error: 'Lỗi thống kê chi tiết doanh thu', 
                detail: err.message 
            });
        }
    },
    xuatBaoCao: async (req, res) => {
        const { files, type, value } = req.body;
        try {
            for (const file of files) {
                const filePath = path.join(__dirname, '../public/img/report', file.name);
                // Đổi tên file
                await fs.writeFile(filePath, file.content, 'utf-8');
            }
            res.json({
                success: true,
                message: 'Lưu báo cáo thành công',
                href: `./bao-cao?type=${type}&value=${value}`,
            });
    
        } catch (err) {
            console.error('Lỗi khi lưu hình ảnh báo cáo:', err);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lưu hình ảnh',
                error: err.message
            });
        }
    }
};