document.addEventListener('DOMContentLoaded', async function () {
    const cartToggleBtn = document.querySelector('.cart-toggle');
    const cartSidebar = document.getElementById('cartSidebar')
    let userId = null;
    const khachHang = await getAPIThongTinKhachHang();
    const loginModal = document.getElementById('loginModal');
    // Load ban đầu
    renderCart();
    updateCartBadge();
    if (khachHang) {
        userId = khachHang.id;
    }
    if (cartToggleBtn) {
        cartToggleBtn.addEventListener('click', function () {
            renderCart();
        });
    }

    function getCartItemCount() {
        const cart = JSON.parse(localStorage.getItem('gioHang')) || [];
        return cart.length; // số món khác nhau
    }

    function updateCartBadge() {
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = getCartItemCount();
        }
    }

    function renderCart() {
        const cartItemContainer = document.querySelector('.cart-items-container');
        let cart = JSON.parse(localStorage.getItem('gioHang')) || [];

        updateCartBadge(); // cập nhật badge khi render

        if (cart.length > 0) {
            cartItemContainer.innerHTML = '';
            const listItem = document.createElement('div');
            let tamTinh = 0;

            cart.forEach(item => {
                const html = `
                    <div class="cart-item d-flex mb-3 pb-3 border-bottom">
                        <div class="cart-item-img me-3">
                            <img src="${item.image}" alt="${item.name}" width="80" height="80" class="rounded">
                        </div>
                        <div class="cart-item-details flex-grow-1">
                            <h6 class="mb-1">${item.name}</h6>
                            <p class="mb-1 text-muted">${item.price.toLocaleString('vi-VN')}₫ x <span class="quantity">${item.quantity}</span></p>
                            <div class="d-flex align-items-center">
                                <button class="btn btn-sm btn-outline-secondary decrement-item btn-giam" data-id="${item.id}">-</button>
                                <span class="px-2 soluong">${item.quantity}</span>
                                <button class="btn btn-sm btn-outline-secondary increment-item btn-tang" data-id="${item.id}">+</button>
                                <button class="btn btn-sm btn-link text-danger ms-auto remove-item" data-id="${item.id}">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </div>
                    </div>`;
                listItem.insertAdjacentHTML('beforeend', html);
                tamTinh += item.price * item.quantity;
            });

            const htmlCartSummary = `
                <div class="cart-summary mt-4">
                    
                    <div class="d-flex justify-content-between mb-2 fw-bold">
                        <span>Tổng cộng:</span>
                        <span id="tongCong">${parseInt(tamTinh).toLocaleString('vi-VN')} ₫</span>
                    </div>
                </div>`;

            const htmlAction = `
                <div class="cart-actions mt-4">
                    <a href="/thanh-toan" class="btn btn-primary w-100 mb-2 btn-thanhToan">Thanh toán</a>
                </div>`;

            cartItemContainer.appendChild(listItem);
            cartItemContainer.insertAdjacentHTML('beforeend', htmlCartSummary);
            cartItemContainer.insertAdjacentHTML('beforeend', htmlAction);

            // Gắn lại sự kiện sau khi render
            document.querySelectorAll('.btn-tang').forEach(btn => {
                btn.addEventListener('click', function () {
                    const id = this.dataset.id;
                    const item = cart.find(i => i.id == id);
                    if(item.quantity < 20) {
                        item.quantity++;
                        localStorage.setItem('gioHang', JSON.stringify(cart));
                        renderCart();
                    }
                });
            });

            document.querySelectorAll('.btn-giam').forEach(btn => {
                btn.addEventListener('click', function () {
                    const id = this.dataset.id;
                    const item = cart.find(i => i.id == id);
                    if (item.quantity > 1) {
                        item.quantity--;
                        localStorage.setItem('gioHang', JSON.stringify(cart));
                        renderCart();
                    }
                });
            });

            document.querySelectorAll('.remove-item').forEach(btn => {
                btn.addEventListener('click', function () {
                    const id = this.dataset.id;
                    cart = cart.filter(i => i.id != id);
                    localStorage.setItem('gioHang', JSON.stringify(cart));
                    renderCart();
                });
            });
            const btnThanhToan = document.querySelector('.btn-thanhToan');
            if (btnThanhToan) {
                btnThanhToan.addEventListener('click', function (event) {
                    event.preventDefault(); // Ngăn chặn hành vi mặc định của nút
                    if (!userId) {
                        alert('Vui lòng đăng nhập để thanh toán!');
                        bootstrap.Offcanvas.getInstance(cartSidebar).hide(); // Ẩn giỏ hàng
                        bootstrap.Modal.getOrCreateInstance(loginModal).show(); // Hiện modal đăng nhập
        
                    } else {
                        window.location.href = this.href; // Chuyển hướng đến trang thanh toán
                    }
                });
            }
        } else {
            cartItemContainer.innerHTML = `
                <div class="empty-cart text-center py-5">
                    <i class="fas fa-shopping-cart fa-3x mb-3 text-muted"></i>
                    <p>Giỏ hàng của bạn đang trống</p>
                    <a href="/thuc-don" class="btn btn-primary mt-3">Tiếp tục mua sắm</a>
                </div>`;
        }
    }
});
async function getAPIThongTinKhachHang() {
    try {
        const response = await fetch('/api/lay-thong-tin-khach-hang');
        const data = await response.json();
        if (data.status) {
            return data.khachHang;
        } else {
            console.error('Lỗi khi lấy ID khách hàng:', data.error);
            return null;
        }
    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
        return null;
    }
}