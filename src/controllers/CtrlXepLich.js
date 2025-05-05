const ChamCong = require("../models/ChamCong");
const NhanVien = require("../models/NhanVien");
const { Op } = require('sequelize');

module.exports = {
    index: (req, res) => {
        res.render('manager/xep-lich');
        },
        layCaLamViec: async (req, res) => {
            if (req.query.week) {
                try {
                    const week = req.query.week;
                    
                    // Phân tách năm và số tuần từ chuỗi định dạng ISO "YYYY-Wnn"
                    const [year, weekPart] = week.split('-W');
                    const weekNumber = parseInt(weekPart);
                    
                    // Đảm bảo dữ liệu hợp lệ
                    if (!year || isNaN(weekNumber) || weekNumber < 1 || weekNumber > 53) {
                        return res.status(400).json({ 
                            status: false, 
                            message: 'Định dạng tuần không hợp lệ. Sử dụng định dạng YYYY-Wnn' 
                        });
                    }

                    // Tính ngày bắt đầu và kết thúc của tuần theo chuẩn ISO 8601
                    // Ngày 1: ngày đầu tiên của năm
                    const firstDayOfYear = new Date(parseInt(year), 0, 1);
                    
                    // Tìm ngày thứ 5 đầu tiên của năm (hoặc ngày đầu tiên nếu năm bắt đầu bằng thứ 5)
                    const firstThursday = new Date(parseInt(year), 0, 1 + ((11 - firstDayOfYear.getDay()) % 7));
                    
                    // Tính ngày thứ 2 của tuần ISO (tuần bắt đầu từ thứ 2)
                    const targetMonday = new Date(firstThursday);
                    targetMonday.setDate(firstThursday.getDate() - 3 + (weekNumber - 1) * 7);
                    
                    // Tính ngày chủ nhật của tuần ISO
                    const targetSunday = new Date(targetMonday);
                    targetSunday.setDate(targetMonday.getDate() + 6);
                    
                    // Format ngày cho Sequelize - cần chuyển sang múi giờ UTC để tránh sai lệch ngày
                    const startDateUTC = new Date(Date.UTC(
                        targetMonday.getFullYear(), 
                        targetMonday.getMonth(), 
                        targetMonday.getDate()
                    ));
                    const endDateUTC = new Date(Date.UTC(
                        targetSunday.getFullYear(), 
                        targetSunday.getMonth(), 
                        targetSunday.getDate(), 
                        23, 59, 59
                    ));
                    
                    console.log(`Tuần ${weekNumber} năm ${year}: Từ ${startDateUTC.toISOString()} đến ${endDateUTC.toISOString()}`);
                    
                    // Truy vấn CSDL với ngày đã tính
                    const caLamViec = await ChamCong.findAll({
                        where: {
                            ngay: {
                                [Op.gte]: startDateUTC,
                                [Op.lte]: endDateUTC
                            }
                        },
                        include: [
                            {
                                model: NhanVien,
                                attributes: ['id', 'ten', 'chucVu'],
                            }
                        ]
                    });
                    return res.json({ 
                        status: true, 
                        list: caLamViec,
                        debug: {
                            week: week,
                            year: parseInt(year),
                            weekNumber: weekNumber,
                            startDate: startDateUTC.toISOString(),
                            endDate: endDateUTC.toISOString(),
                            recordCount: caLamViec.length
                        }
                    });
                } catch (error) {
                    console.error('Lỗi khi lấy ca làm việc:', error);
                    return res.status(500).json({ 
                        status: false, 
                        message: 'Đã xảy ra lỗi khi lấy dữ liệu ca làm việc', 
                        error: error.message 
                    });
                }
            } else {
                return res.status(400).json({ 
                    status: false, 
                    message: 'Thiếu tham số week. Sử dụng định dạng YYYY-Wnn' 
                });
            }
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
    },
    // Phương thức lấy danh sách nhân viên chưa đăng ký ca trong tuần
    layNhanVienChuaCoCa: async (req, res) => {
        if (!req.query.week) {
            return res.status(400).json({ 
                status: false, 
                message: 'Thiếu tham số week. Sử dụng định dạng YYYY-Wnn' 
            });
        }

        try {
            const week = req.query.week;
            
            // Phân tách năm và số tuần từ chuỗi định dạng ISO "YYYY-Wnn"
            const [year, weekPart] = week.split('-W');
            const weekNumber = parseInt(weekPart);
            
            // Đảm bảo dữ liệu hợp lệ
            if (!year || isNaN(weekNumber) || weekNumber < 1 || weekNumber > 53) {
                return res.status(400).json({ 
                    status: false, 
                    message: 'Định dạng tuần không hợp lệ. Sử dụng định dạng YYYY-Wnn' 
                });
            }

            // Tính ngày bắt đầu và kết thúc của tuần
            const firstDayOfYear = new Date(parseInt(year), 0, 1);
            const firstThursday = new Date(parseInt(year), 0, 1 + ((11 - firstDayOfYear.getDay()) % 7));
            const targetMonday = new Date(firstThursday);
            targetMonday.setDate(firstThursday.getDate() - 3 + (weekNumber - 1) * 7);
            const targetSunday = new Date(targetMonday);
            targetSunday.setDate(targetMonday.getDate() + 6);
            
            // Format ngày cho Sequelize
            const startDateUTC = new Date(Date.UTC(
                targetMonday.getFullYear(), 
                targetMonday.getMonth(), 
                targetMonday.getDate()
            ));
            const endDateUTC = new Date(Date.UTC(
                targetSunday.getFullYear(), 
                targetSunday.getMonth(), 
                targetSunday.getDate(), 
                23, 59, 59
            ));
            
            // Xác định tuần hiện tại để áp dụng quy tắc khác nhau
            const today = new Date();
            const currentYear = today.getFullYear();
            const startOfYear = new Date(currentYear, 0, 1);
            const firstThursdayOfYear = new Date(currentYear, 0, 1 + ((11 - startOfYear.getDay()) % 7));
            const dayInFirstWeek = new Date(firstThursdayOfYear);
            dayInFirstWeek.setDate(firstThursdayOfYear.getDate() - 3);
            
            // Tính số tuần
            const millisecondsPerDay = 24 * 60 * 60 * 1000;
            const currentWeekNumber = Math.ceil(
                (today.getTime() - dayInFirstWeek.getTime()) / millisecondsPerDay / 7
            );
            
            // So sánh tuần yêu cầu với tuần hiện tại
            const isFutureWeek = 
                (parseInt(year) > currentYear) || 
                (parseInt(year) === currentYear && weekNumber > currentWeekNumber);
            
            console.log(`Tuần yêu cầu: ${weekNumber}, Tuần hiện tại: ${currentWeekNumber}, Là tuần tương lai: ${isFutureWeek}`);
            
            // 1. Lấy tất cả nhân viên
            const allEmployees = await NhanVien.findAll({
                where: {
                    trangThai: 1 // Chỉ lấy nhân viên đang hoạt động
                },
                attributes: ['id', 'ten', 'chucVu']
            });
            
            // 2. Xác định điều kiện truy vấn dựa trên tuần
            let whereCondition = {
                ngay: {
                    [Op.gte]: startDateUTC,
                    [Op.lte]: endDateUTC
                }
            };
            
            // Nếu là tuần sau, thêm điều kiện về trạng thái
            if (isFutureWeek) {
                // Tuần sau: Lấy danh sách nhân viên đã đăng ký và được duyệt (trạng thái 1)
                const approvedEmployees = await ChamCong.findAll({
                    where: {
                        ...whereCondition,
                        trangThai: 1 // Đã duyệt
                    },
                    attributes: ['idNhanVien'],
                    group: ['idNhanVien'],
                    raw: true
                });
                
                // Danh sách nhân viên đã có ca được duyệt
                const approvedEmployeeIds = approvedEmployees.map(item => item.idNhanVien);
                
                // Lọc ra nhân viên chưa có ca được duyệt trong tuần sau
                const employeesWithoutApprovedShifts = allEmployees.filter(employee => 
                    !approvedEmployeeIds.includes(employee.id)
                );
                
                // 3. Thêm thông tin chi tiết cho mỗi nhân viên
                const enhancedEmployees = await Promise.all(employeesWithoutApprovedShifts.map(async (employee) => {
                    // Kiểm tra xem nhân viên có đăng ký ca nào trong tuần này không (bất kể trạng thái)
                    const pendingShifts = await ChamCong.findAll({
                        where: {
                            idNhanVien: employee.id,
                            ...whereCondition
                        },
                        attributes: ['id', 'ngay', 'caLamViec', 'trangThai'],
                        order: [['ngay', 'ASC']],
                        raw: true
                    });
                    
                    // Lấy lần đăng ký ca gần nhất (bất kể tuần nào)
                    const lastRegistration = await ChamCong.findOne({
                        where: {
                            idNhanVien: employee.id
                        },
                        order: [['ngay', 'DESC']],
                        attributes: ['ngay', 'caLamViec', 'trangThai'],
                        raw: true
                    });
                    
                    // Đếm tổng số ca đã đăng ký
                    const totalShifts = await ChamCong.count({
                        where: {
                            idNhanVien: employee.id
                        }
                    });
                    
                    return {
                        id: employee.id,
                        ten: employee.ten,
                        chucVu: employee.chucVu
                    };
                }));
                
                return res.json({
                    status: true,
                    list: enhancedEmployees,
                    tuanSau: true,
                    debug: {
                        week: week,
                        weekNumber: weekNumber,
                        startDate: startDateUTC.toISOString(),
                        endDate: endDateUTC.toISOString(),
                        totalEmployees: allEmployees.length,
                        employeesWithoutApprovedShifts: enhancedEmployees.length
                    }
                });
            } else {
                // Tuần hiện tại hoặc quá khứ: Chỉ lấy nhân viên chưa đăng ký ca (bất kể trạng thái)
                const registeredEmployees = await ChamCong.findAll({
                    where: whereCondition,
                    attributes: ['idNhanVien'],
                    group: ['idNhanVien'],
                    raw: true
                });
                
                // Danh sách nhân viên đã đăng ký ca
                const registeredEmployeeIds = registeredEmployees.map(item => item.idNhanVien);
                
                // Lọc ra nhân viên chưa đăng ký ca nào
                const unregisteredEmployees = allEmployees.filter(employee => 
                    !registeredEmployeeIds.includes(employee.id)
                );
                
                // 3. Thêm thông tin chi tiết
                const enhancedEmployees = await Promise.all(unregisteredEmployees.map(async (employee) => {
                    // Lấy lần đăng ký ca gần nhất
                    const lastRegistration = await ChamCong.findOne({
                        where: {
                            idNhanVien: employee.id
                        },
                        order: [['ngay', 'DESC']],
                        attributes: ['ngay', 'caLamViec', 'trangThai'],
                        raw: true
                    });
                    
                    // Đếm tổng số ca đã đăng ký
                    const totalShifts = await ChamCong.count({
                        where: {
                            idNhanVien: employee.id
                        }
                    });
                    
                    return {
                        id: employee.id,
                        ten: employee.ten,
                        chucVu: employee.chucVu
                    };
                }));
                
                return res.json({
                    status: true,
                    list: enhancedEmployees,
                    tuanSau: false,
                    debug: {
                        week: week,
                        weekNumber: weekNumber,
                        startDate: startDateUTC.toISOString(),
                        endDate: endDateUTC.toISOString(),
                        totalEmployees: allEmployees.length,
                        unregisteredEmployees: enhancedEmployees.length
                    }
                });
            }
        } catch (error) {
            console.error('Lỗi khi lấy danh sách nhân viên chưa đăng ký ca:', error);
            return res.status(500).json({
                status: false,
                message: 'Đã xảy ra lỗi khi lấy danh sách nhân viên chưa đăng ký ca',
                error: error.message
            });
        }
    }
}