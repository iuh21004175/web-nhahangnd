const DonHang = require('../models/DonHang');
const Transaction = require('../models/Transaction');

exports.handleWebhook = async (req, res) => {
  const data = req.body;

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ success: false, message: 'No data' });
  }

  try {
    const {
      gateway, transactionDate, accountNumber, subAccount,
      transferType, transferAmount, accumulated, code,
      content: transactionContent, referenceCode, description
    } = data;

    const amount_in = transferType === 'in' ? transferAmount : 0;
    const amount_out = transferType === 'out' ? transferAmount : 0;

    // Tạo transaction
    await Transaction.create({
      gateway,
      transaction_date: transactionDate,
      account_number: accountNumber,
      sub_account: subAccount,
      amount_in,
      amount_out,
      accumulated,
      code,
      transaction_content: transactionContent,
      reference_number: referenceCode,
      body: description
    });

    try {
        // Tách mã đơn hàng từ nội dung
        const match = transactionContent.match(/DH(\d+)/);
        const orderId = match ? parseInt(match[1]) : null;
        console.log("Mã đơn hàng:", orderId);  // Kiểm tra xem orderId có tách đúng không
      
        if (!orderId) {
          return res.status(400).json({ success: false, message: 'Order ID not found in content' });
        }
      
        // Kiểm tra giá trị amount_in
        console.log('Số tiền trong giao dịch:', amount_in);
      
        // Tìm đơn hàng chưa thanh toán (trangThai = 7) và đúng số tiền
        const order = await DonHang.findOne({
          where: {
            id: orderId,
            tongTien: amount_in,
            trangThai: 7  // trạng thái chờ thanh toán
          }
        });
      
        if (!order) {
          return res.status(404).json({ success: false, message: 'Order not found or already paid' });
        }
      
        console.log("Đơn hàng tìm thấy:", order);
      
        // Cập nhật trạng thái thanh toán và trạng thái đơn hàng
        try {
          order.thanhToan = 1; // Cập nhật trạng thái thanh toán
          order.trangThai = 2; // Đã thanh toán
          await order.save();
          console.log("Đơn hàng đã được cập nhật thành công");
        } catch (err) {
          console.error("Lỗi khi lưu đơn hàng:", err);
        }
      
        return res.json({ success: true });
      
      } catch (err) {
        console.error("Lỗi tổng thể:", err);
        return res.status(500).json({ success: false, message: 'Server error', error: err.message });
      }
    }catch (err) {
    console.error("Lỗi khi tạo giao dịch:", err);   
    }      
};
