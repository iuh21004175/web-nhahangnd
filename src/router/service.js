const express = require('express');
const router = express.Router();

router.get('/sepay/webhook', (req, res) => {
    res.send('Xin chào bạn, đây là webhook của SEPAY!');
});
router.post('/sepay/webhook', async (req, res) => {
    const data = req.body;
    if (!data || typeof data !== 'object') {
        return res.status(400).json({ success: false, message: 'No data' });
    }

    try {
        const {
        gateway, transactionDate, accountNumber, subAccount,
        transferType, transferAmount, accumulated, code,
        content, referenceCode, description
        } = data;
        // Publish lên Redis để xử lý tiếp
        await req.redis.publish('sepay-gui-webhook', JSON.stringify(data));

        const match = content?.match(/DH(\d+)/);
        const orderId = match ? parseInt(match[1]) : null;

        if (!orderId) {
        return res.status(400).json({ success: false, message: 'Order ID not found in content' });
        }
        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('Lỗi tổng thể:', err);
        return res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
})
module.exports = router;