const DonHang = require('../models/DonHang');
const ChiTietDonHang = require('../models/ChiTietDonHang');
const MonAn = require('../models/MonAn');
const Transaction = require('../models/Transaction');
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
                guiYeuCauTaoMon(item.id, io)
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
    console.log("id", id);
    console.log("Gửi yêu cầu tạo món:", chiTiet);
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