document.addEventListener('DOMContentLoaded', async function () {
    
    let thongTinKhachHang = await getAPIThongTinKhachHang();
    thaoTacThongTinKhachHang(thongTinKhachHang);

    const cartItemsContainer = document.getElementById('cartSummary');
    const emptyCartMessage = document.getElementById('emptyCartMessage');
    let cart = JSON.parse(localStorage.getItem('gioHang')) || [];

    // Xóa nội dung cũ
    cartItemsContainer.innerHTML = '';

    if (cart.length > 0) {
        let tongTien = 0;
        const phiDichVu = 30000;

        // 1. Hiển thị từng món ăn
        cart.forEach(item => {
            const tongGia = item.price * item.quantity;
            tongTien += tongGia;

            const itemHTML = `
                <div class="cart-item d-flex align-items-center mb-3">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image me-3 rounded" width="60" height="60">
                    <div class="cart-item-details flex-grow-1">
                        <h6 class="cart-item-title mb-1">${item.name}</h6>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-muted">${item.quantity} x ${item.price.toLocaleString('vi-VN')}₫</span>
                            <span class="cart-item-price text-primary">${tongGia.toLocaleString('vi-VN')}₫</span>
                        </div>
                    </div>
                </div>
            `;

            cartItemsContainer.insertAdjacentHTML('beforeend', itemHTML);
        });

        // 2. Hiển thị phần tổng kết đơn hàng
        const htmlTongKet = `
            <div class="cart-summary border-top pt-3 mt-2">
                <div class="d-flex justify-content-between mb-2">
                    <span>Tạm tính:</span>
                    <span id="subTotal">${tongTien.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div class="d-flex justify-content-between mb-2">
                    <span>Phí dịch vụ:</span>
                    <span id="serviceCharge">${phiDichVu.toLocaleString('vi-VN')} ₫</span>
                </div>
                <hr>
                <div class="d-flex justify-content-between mb-0 fw-bold fs-5">
                    <span>Tổng cộng:</span>
                    <span class="text-primary" id="totalAmount">${(tongTien+phiDichVu).toLocaleString('vi-VN')} ₫</span>
                </div>
            </div>
        `;

        cartItemsContainer.insertAdjacentHTML('beforeend', htmlTongKet);
        emptyCartMessage.style.display = 'none';
    } else {
        emptyCartMessage.style.display = 'block';
    }
    const phoneRegex = /^(0[3-9][0-9]{8})$/;


    document.getElementById('addOrder').addEventListener('click', async function (e) {
        e.preventDefault();

        const fullName = document.getElementById('fullNameTT').value.trim();
        const phone = document.getElementById('phoneTT').value.trim();
        const address = document.getElementById('address').value;
        const note = document.getElementById('note').value;
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        const gioHang = JSON.parse(localStorage.getItem('gioHang')) || [];
        const trangThai = 1; // Đặt thành công
        const tongTien = document.getElementById('totalAmount').innerText.replace(/\./g, '').replace('₫', '').trim();
        const hinhThuc = 1; // Đặt hàng online

        // Kiểm tra các trường bắt buộc
        if (!fullName || !phone || !address) {
            alert('Vui lòng nhập đầy đủ thông tin: Họ tên, Số điện thoại và Địa chỉ!');
            return;
        }
        
        // Kiểm tra số điện thoại có hợp lệ không
        if (phone === '') {
            // Nếu số điện thoại trống
            document.getElementById('phoneTT').classList.add('is-invalid');  // Thêm class 'is-invalid'
            document.querySelector('#phoneTT + .invalid-feedback').innerText = 'Vui lòng nhập số điện thoại!';
            return;
        } else if (!phoneRegex.test(phone)) {
            // Nếu số điện thoại không hợp lệ
            document.getElementById('phoneTT').classList.add('is-invalid');  // Thêm class 'is-invalid'
            document.querySelector('#phoneTT + .invalid-feedback').innerText = 'Số điện thoại không hợp lệ! Vui lòng nhập lại.';
            return;
        } else {
            document.getElementById('phoneTT').classList.remove('is-invalid');  // Xóa class 'is-invalid' nếu hợp lệ
        }

        // Kiểm tra rỗng giỏ hàng
        if(gioHang.length === 0){
            alert('Giỏ hàng trống! Vui lòng chọn món ăn trước khi đặt hàng.');
            return;
        }
        if (paymentMethod === '0') {
            try {
                const response = await fetch('/api/them-don-hang', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include', // gửi cookie chứa JWT
                    body: JSON.stringify({
                        hinhThuc: hinhThuc,
                        diaChi: address,
                        trangThai,
                        tongTien,
                        thanhToan: paymentMethod,
                        gioHang,
                        ghiChu: note
                    })
                });
        
                const data = await response.json();
                if (data.status) {
                    alert('Đặt hàng thành công!');
                    localStorage.removeItem('gioHang'); // Xóa giỏ hàng sau khi đặt hàng thành công
                    window.location.href = '/';
                } else {
                    alert('Đặt hàng thất bại! Vui lòng thử lại sau.');
                }
        
            } catch (error) {
                console.error('Lỗi:', error);
            }
        } else if (paymentMethod === '1') {
            console.log(hinhThuc)
            const trangThai = 7; // Chờ thanh toán
            try {
                const response = await fetch('/api/them-don-hang', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        hinhThuc: hinhThuc,
                        diaChi: address,
                        trangThai: trangThai,
                        tongTien: tongTien - 30000,
                        thanhToan: paymentMethod,
                        gioHang,
                        ghiChu: note
                    })
                });
        
                const data = await response.json();
                if (data.status) {
                    // Redirect sang trang hiển thị QR với id đơn hàng
                    //localStorage.removeItem('gioHang');
                    window.location.href = `/thanh-toan-online?id=${data.idDonHang}`;
                } else {
                    alert('Tạo đơn hàng thất bại! Vui lòng thử lại.');
                }
        
            } catch (error) {
                console.error('Lỗi khi tạo đơn hàng:', error);
                alert('Đã có lỗi xảy ra!');
            }
        }   
    
    
    });
});


function thaoTacThongTinKhachHang(khachHang) {
    const thongTinKhachHang = document.querySelector('.thong-tin-nguoi-nhan');
    thongTinKhachHang.innerHTML = '';
    const card = `<div class="col-12">
                            <label class="form-label">Họ và tên *</label>
                            <input type="text" class="form-control" id="fullNameTT" value="${khachHang?.ten || ''}" required>
                            <div class="invalid-feedback">
                                Vui lòng nhập họ tên
                            </div>
                        </div>

                        <div class="col-md-12">
                            <label class="form-label">Số điện thoại *</label>
                            <input type="tel" class="form-control" id="phoneTT" value="${khachHang?.soDienThoai || ''}" required>
                            <div class="invalid-feedback">
                                Vui lòng nhập số điện thoại
                            </div>
                        </div>

                        <div class="col-12">
                            <label class="form-label">Địa chỉ *</label>
                            <input type="text" class="form-control" id="address"  value="${khachHang?.diaChi || ''}" required>
                           
                            <div class="invalid-feedback">
                                Vui lòng nhập địa chỉ
                            </div>
                        </div>

                        <div class="col-12">
                            <label class="form-label">Ghi chú</label>
                            <textarea class="form-control" id="note" rows="3"></textarea>
                        </div>
                        
                        <div class="col-12">
                            <label class="form-label">Phương thức thanh toán *</label>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="paymentMethod" id="cod" value="0" checked>
                                <label class="form-check-label" for="cod">
                                    Thanh toán khi nhận hàng (COD)
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="paymentMethod" id="banking" value="1">
                                <label class="form-check-label" for="banking">
                                    Chuyển khoản ngân hàng
                                </label>
                            </div>
                        </div>

                        <div class="col-12 mt-4">
                            <button class="btn btn-primary w-100" type="submit" id="addOrder">
                                Đặt hàng
                            </button>
                        </div>`;
    thongTinKhachHang.innerHTML = card;
}

async function getAPIThongTinKhachHang() {
    try {
        const response = await fetch('/api/lay-thong-tin-khach-hang', {
            method: 'GET',
            credentials: 'include' // gửi cookie chứa JWT
        });

        const data = await response.json();
        if (data.status) {
            return data.khachHang;
        } else {
            console.error('Lỗi server:', data.error);
            return {};
        }
    } catch (error) {
        console.error('Lỗi kết nối:', error);
        return {};
    }
}


