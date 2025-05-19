document.addEventListener('DOMContentLoaded', async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    const socket = io();

    let donHang = null; // 👈 Khai báo biến toàn cục trong scope của DOMContentLoaded

    // Lấy giá trị tổng tiền từ DB và thông tin đơn hàng
    if (orderId) {
        donHang = await getAPILayGiaDonHang(orderId); // 👈 Gán vào biến toàn cục
        if (donHang) {
            const tongTien = donHang.tongTien;
            //const phiVanChuyen = donHang.phiVanChuyen
            const orderDescription = `DH${orderId}`;
            const qrImg = document.getElementById('qrImage');
            if (qrImg) {
                const newQRUrl = `https://qr.sepay.vn/img?bank=TPBank&acc=10001198354&template=compact&amount=${tongTien}&des=${orderDescription}`;
                qrImg.src = newQRUrl;
            }

            const soTienDiv = document.getElementById('soTien');
            if (soTienDiv) {
                soTienDiv.textContent = tongTien.toLocaleString('vi-VN') + 'đ';
            }
        }
    }

    // Lắng nghe sự kiện thanh toán qua Socket.io
    socket.on(`don-hang-${orderId}-da-thanh-toan`, async (data) => {
        console.log('Đã nhận thanh toán:', data);
        document.getElementById('checkout_box').style.display = 'none';
        document.getElementById('success_pay_box').style.display = 'block';
        document.getElementById('btnBlack').href = '/manager/danh-sach-ban';
        document.getElementById('btnBlack').innerHTML = 'Về trang ghi đơn hàng';

        // Gửi yêu cầu cập nhật trạng thái bàn
        try {
            const response = await fetch('/api/cap-nhat-trang-thai-ban', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    idBan: donHang?.idBan, // 👈 Sử dụng biến đã gán từ trước
                    newStatus: 0
                })
            });

            const resData = await response.json();
            console.log('Cập nhật trạng thái bàn:', resData);
            if (!resData.status) {
                console.error('Không thể cập nhật trạng thái bàn:', resData.message);
            }
        } catch (err) {
            console.error('Lỗi khi cập nhật trạng thái bàn:', err);
        }
    });

    // Đếm ngược thời gian
    let secondsLeft = 300;
    setInterval(function updateCountdown() {
        const countdownEl = document.getElementById('countdown');
        if (countdownEl) {
            const minutes = Math.floor(secondsLeft / 60);
            const seconds = secondsLeft % 60;
            countdownEl.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        }

        secondsLeft--;

        if (secondsLeft < 0) {
            window.location.href = '/';
        }
    }, 1000);
});


async function getAPILayGiaDonHang(id) {
    try {
        const url = `/api/lay-gia-don-hang?id=${id}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status) {
            return data.obj;
        } else {
            console.error('Lỗi từ API:', data.error || data.message);
        }
    } catch (error) {
        showToastDanger('Lỗi khi lấy đơn hàng!');
        console.error('Lỗi khi lấy đơn hàng:', error);
    }
}
