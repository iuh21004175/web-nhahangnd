const DonHang = require('../models/DonHang');
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
            order.thanhToan = 1;
            order.trangThai = 2;
            await order.save();
            io.emit(`don-hang-${orderId}-da-thanh-toan`, 'ok');
        }
    } catch (err) {
        console.error("Lỗi xử lý webhook:", err);
    }

}

module.exports = (io, subscriber) => {
    subscriber.on("message", async (channel, message) => {
        if (channel === "sepay-gui-webhook") {
            const data = JSON.parse(message);
            // console.log("Nhận webhook từ SEPAY:", data);
            await xulyWebhook(data, io);
        }
    })
}