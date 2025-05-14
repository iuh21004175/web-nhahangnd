const DonHang = require('../models/DonHang');
const ChiTietDonHang = require('../models/ChiTietDonHang');
const khachHang = require('../models/KhachHang');
const MonAn = require('../models/MonAn');
const Transaction = require('../models/Transaction');
const axios = require('axios');
const KhachHang = require('../models/KhachHang');
async function xulyWebhook(data, io) {
    const {
        gateway, transactionDate, accountNumber, subAccount,
        transferType, transferAmount, accumulated, code,
        content, referenceCode, description
    } = data;
    const amount_in = transferType === 'in' ? transferAmount : 0;
    const amount_out = transferType === 'out' ? transferAmount : 0;

    await Transaction.create({
        gateway,
        transaction_date: transactionDate,
        account_number: accountNumber,
        sub_account: subAccount,
        amount_in,
        amount_out,
        accumulated,
        code,
        transaction_content: content,
        reference_number: referenceCode,
        body: description
    });

    const match = content.match(/DH(\d+)/);
    const orderId = match ? parseInt(match[1]) : null;

    if (!orderId) return; // không cần publish vì không có mã đơn hàng

    try {
        const order = await DonHang.findOne({
            where: {
                id: orderId,
                tongTien: amount_in,
                trangThai: 7
            }
        });

        if (!order) {
            console.log("Không tìm thấy đơn hàng hoặc đơn hàng đã được thanh toán.");
            return;
        } else {
            // Gủi yều yêu cầu tạo món 
            const chiTietDonHang = await ChiTietDonHang.findAll({
                where: {
                    idDonHang: orderId
                }
            });
            chiTietDonHang.forEach(async (item) => {
                guiYeuCauTaoMon(orderId, io)
            })
            order.thanhToan = 1;
            order.trangThai = 2;
            await order.save();
            io.emit(`don-hang-${orderId}-da-thanh-toan`, 'ok');
        }
    } catch (err) {
        console.error("Lỗi xử lý webhook:", err);
    }

}
async function guiYeuCauTaoMon(id, io) {
    const chiTiet = await ChiTietDonHang.findOne({
        where: {
            id
        },
        include: [
            {
                model: MonAn,
                attributes: ['id', 'ten', 'hinhAnh']
            },
            {
                model: DonHang,
                attributes: ['hinhThuc']
            }
        ]
    });
    io.emit('don-hang-yeu-cau-tao-mon', {
        chiTiet: chiTiet.toJSON()
    });
}
async function guiYeuCauCapNhatMon(id, io) {
    const chiTiet = await ChiTietDonHang.findOne({
        where: {
            id
        },
        include: [
            {
                model: MonAn,
                attributes: ['id', 'ten', 'hinhAnh']
            },
            {
                model: DonHang,
                attributes: ['hinhThuc']
            }
        ]
    });
    
    io.emit('don-hang-yeu-cau-cap-nhat-mon', {
        chiTiet: chiTiet.toJSON()
    });
}
async function checkGiaoHang(idDonHang) {
    // Kiểm tra các món đã hoàn thành chưa
    const chiTietDonHang = await ChiTietDonHang.findAll({
        where: {
            idDonHang
        }
    });
    const allCompleted = chiTietDonHang.every(item => item.trangThai == 2);
    if (allCompleted) {
        // Nếu tất cả các món đã hoàn thành, cập nhật trạng thái đơn hàng
        const donHang = await DonHang.findOne({
            where: {
                id: idDonHang
            },
            include: [
                {
                    model: KhachHang,
                    attributes: ['id', 'ten']
                }
            ]
        });
        giaoHang(chiTietDonHang, donHang);
        donHang.trangThai = 5;
        await donHang.save();
        // Gửi thông báo cho giao hàng
    }

}
async function giaoHang(gioHang, donHang){
    const diaChi = JSON.parse(donHang.diaChi);
    const khoiLuongTB = 200; // Trọng lượng trung bình của một món ăn (đơn vị gram)
    const tongPhan = gioHang.reduce((total, item) => {
        return total + item.soLuong;
    }, 0)
    try {
        if(donHang.thanhToan == 0){
            console.log("Đơn hàng thanh toán bằng tiền mặt");
            const response = await axios.post(
                'https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create', 
                {
                    payment_type_id: 2,
                    note: "Xin hãy nhẹ tay",
                    required_note: "KHONGCHOXEMHANG",
                    return_phone: "0902599450",
                    return_address: "12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, Hồ Chí Minh, Vietnam",
                    return_district_id: null,
                    return_ward_code: "",
                    client_order_code: "",
                    from_name: "Nhà hàng ND",
                    from_phone: "0902599450",
                    from_address: "12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, Hồ Chí Minh, Vietnam",
                    from_ward_name: "Phường 4",
                    from_district_name: "Quận Gò Vấp",
                    from_province_name: "Hồ Chí Minh",
                    to_name: donHang.KhachHang.ten,
                    to_phone: donHang.soDienThoaiNhan,
                    to_address: diaChi.address,
                    to_ward_name: diaChi.level_4,
                    to_district_name: diaChi.level_3,
                    to_province_name: diaChi.level_2,
                    cod_amount: parseInt(donHang.tongTien),
                    content: "Đồ ăn giao tận nơi",
                    length: 35,
                    width: 20,
                    height: 25 * tongPhan,
                    weight: (khoiLuongTB * tongPhan) > 20000 ? 19000 : khoiLuongTB * tongPhan,
                    cod_failed_amount: 2000,                  
                    pick_station_id: null,
                    deliver_station_id: null,
                    insurance_value: parseInt(donHang.tongTien),
                    service_type_id: 2,
                    coupon: null,
                    pickup_time: Math.floor(Date.now() / 1000) + 5 * 60,
                    pick_shift: [2],
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Token': process.env.TOKEN_GIAO_HANG_NHANH,
                        'ShopId': process.env.ID_SHOP,
                    }
                }
            );
            const data = response.data;
            console.log("Giao hàng thành công:", data);
        }
        else{
            const response = await axios.post(
                'https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/create', 
                {
                    payment_type_id: 1,
                    note: "Xin hãy nhẹ tay",
                    required_note: "KHONGCHOXEMHANG",
                    return_phone: "0902599450",
                    return_address: "12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, Hồ Chí Minh, Vietnam",
                    return_district_id: null,
                    return_ward_code: "",
                    client_order_code: "",
                    from_name: "Nhà hàng ND",
                    from_phone: "0902599450",
                    from_address: "12 Nguyễn Văn Bảo, Phường 4, Gò Vấp, Hồ Chí Minh, Vietnam",
                    from_ward_name: "Phường 4",
                    from_district_name: "Quận Gò Vấp",
                    from_province_name: "Hồ Chí Minh",
                    to_name: donHang.KhachHang.ten,
                    to_phone: donHang.soDienThoaiNhan,
                    to_address: diaChi.address,
                    to_ward_name: diaChi.level_4,
                    to_district_name: diaChi.level_3,
                    to_province_name: diaChi.level_2,
                    cod_amount: 0,
                    content: "Đồ ăn giao tận nơi",
                    length: 35,
                    width: 20,
                    height: 25 * tongPhan,
                    weight: (khoiLuongTB * tongPhan) > 20000 ? 19000 : khoiLuongTB * tongPhan,
                    cod_failed_amount: 2000,                  
                    pick_station_id: null,
                    deliver_station_id: null,
                    insurance_value: parseInt(donHang.tongTien),
                    service_type_id: 2,
                    coupon: null,
                    pickup_time: Math.floor(Date.now() / 1000) + 5 * 60,
                    pick_shift: [2],
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Token': process.env.TOKEN_GIAO_HANG_NHANH,
                        'ShopId': process.env.ID_SHOP,
                    }
                }
            );
            const data = response.data;
            console.log("Giao hàng thành công:", data);
        }

    } catch (error) {
        console.log("Lỗi giao hàng:", error);
    }
}
module.exports = (io, subscriber) => {
    subscriber.on("message", async (channel, message) => {
        if (channel === "sepay-gui-webhook") {
            const data = JSON.parse(message);
            // console.log("Nhận webhook từ SEPAY:", data);
            await xulyWebhook(data, io);
        }
        else if (channel === "don-hang-tao-mon") {
            const data = JSON.parse(message);
            const { id }  = data;
            await guiYeuCauTaoMon(id, io);
        }
        else if (channel === "don-hang-cap-nhat-mon") {
            const data = JSON.parse(message);
            const { id }  = data;
            await guiYeuCauCapNhatMon(id, io);
        }
        else if (channel === "don-hang-xoa-mon") {
            const data = JSON.parse(message);
            const { id }  = data;
            io.emit('don-hang-yeu-cau-xoa-mon', { // Xóa món ở đơn hàng ở đầu bếp
                id
            });
        }
        else if (channel === "dau-bep-nhan-mon") {
            const data = JSON.parse(message);
            const { id, idDonHang, hinhThuc }  = data;
            if(hinhThuc == 0){
                io.emit(`don-hang-${idDonHang}-dau-bep-nhan-mon`, {// Ghi đơn hàng phục vụ
                    id
                });
            }
            io.emit('don-hang-yeu-cau-xoa-mon', {// Tận dụng sự kiện xóa món các đầu bếp khác
                id
            });
        }
        else if (channel === "dau-bep-hoan-thanh-mon") {
            const data = JSON.parse(message);
            const { id, idDonHang, hinhThuc }  = data;
            if(hinhThuc == 0){
                io.emit(`don-hang-${idDonHang}-dau-bep-hoan-thanh-mon`, {
                    id
                });
            }
            else{
                checkGiaoHang(idDonHang)
            }
        }
        else if (channel === "cap-nhat-trang-thai-ban") {
            const data = JSON.parse(message);
            const { id, trangThai }  = data;
            io.emit('cap-nhat-trang-thai-ban', {
                id,
                trangThai
            });
        }
        else if (channel === "phuc-vu-tao-don-hang") {
            const data = JSON.parse(message);
            const { donHang }  = data;
            io.emit('tao-don-hang', {
                donHang
            });
        }
    })
}