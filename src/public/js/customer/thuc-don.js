document.addEventListener('DOMContentLoaded', async function () {
    let listMonAn = await getAPIMonAn();  // Lấy tất cả món ăn 
    let listLoaiMon = await getAPIDanhMucMonAn();  // Lấy danh sách loại món ăn
    thaoTacThucDon(listMonAn);  // Hiển thị món ăn 
    thaoTacLoaiMon(listLoaiMon);  // Hiển thị các loại món ăn
    updateCartBadge();  // Cập nhật số lượng giỏ hàng
    // Xử lý tìm kiếm món ăn
    document.querySelector('#formTimKiem').addEventListener('submit', async function (e) {
    e.preventDefault();  // Ngăn reload
    const tuKhoa = document.querySelector('#tuKhoa').value.trim().toLowerCase();

    if (!tuKhoa) return;

    // Gọi API tất cả món ăn
    const listMonAn = await getAPIMonAn();

    // Lọc theo từ khóa tên món
    const ketQua = listMonAn.filter(mon => mon.ten.toLowerCase().includes(tuKhoa));

    // Hiển thị lại danh sách
    thaoTacThucDon(ketQua);
});

});

function thaoTacThucDon(list) {
    const danhSachMonAn = document.querySelector('#danhSachMonAn');
    danhSachMonAn.innerHTML = '';
    if (list.length === 0) {
        danhSachMonAn.innerHTML = `<div class="col-12 text-center text-muted py-5">Không tìm thấy món ăn nào phù hợp.</div>`;
        return;
    }
    list.forEach(function(monAn) {
        const card = `
        <div class="col-md-6 col-lg-4">
            <div class="menu-item-card shadow-sm">
                <div class="menu-item-image table-card"  data-id-mon="${monAn.id}">
                    <img class="image" src="${monAn.hinhAnh}" alt="Món ăn" class="img-fluid">
                    <img class="qr-image" data-id="${monAn.id}" src="" alt="QR Code" style="max-width: 100px;" />
                </div>
                
                <div class="menu-item-info p-4">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="menu-item-title mb-0">${monAn.ten}</h5>

                        <span class="menu-item-price text-primary fw-bold">${monAn.gia.toLocaleString('vi-VN')}₫</span>
                    </div>
                    <p class="menu-item-desc text-muted mb-3">${monAn.moTa}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="input-group input-group-sm w-50">
                            <button class="btn btn-outline-secondary btn-giam" type="button">-</button>
                            <input type="number" class="form-control text-center so-luong" value="1" min="1">
                            <button class="btn btn-outline-secondary btn-tang" type="button">+</button>
                        </div>
                        <button class="btn-them btn btn-primary" value="${monAn.id}">
                            <i class="fas fa-cart-plus me-2"></i>Thêm vào giỏ
                        </button>
                    </div>
                   
                </div>
            </div>
        </div>`;

        // Gán vào DOM
        danhSachMonAn.innerHTML += card;
        
        
    });


    document.querySelectorAll('.btn-them').forEach(function(btnThem) {
        btnThem.addEventListener('click', function () {
            const parent = this.closest('.menu-item-info');
            const soLuong = parseInt(parent.querySelector('.so-luong').value);
            const tenMon = parent.querySelector('.menu-item-title').textContent;
            const giaMon = parent.querySelector('.menu-item-price').textContent.replace(/[^\d]/g, '');
            const hinhAnh = parent.closest('.menu-item-card').querySelector('img').src;
        
            const item = {
                id: this.value,
                name: tenMon,              
                price: parseInt(giaMon),   
                quantity: soLuong,
                image: hinhAnh
            };
        
            // Lấy giỏ hàng từ localStorage
            let cart = JSON.parse(localStorage.getItem('gioHang')) || [];
        
            // Kiểm tra xem món ăn đã có trong giỏ chưa
            const index = cart.findIndex(i => i.id === item.id);
            if (index >= 0) {
                // Nếu món ăn đã có, cập nhật số lượng
                cart[index].quantity += item.quantity;
            } else {
                // Nếu món ăn chưa có, thêm vào giỏ
                cart.push(item);
            }
        
            // Lưu lại giỏ hàng vào localStorage
            localStorage.setItem('gioHang', JSON.stringify(cart));
            updateCartBadge(); 
            console.log('Đã thêm vào giỏ hàng:', cart);
        });
    });
    
    
    // Sự kiện tăng số lượng
    document.querySelectorAll('.btn-tang').forEach(function(btnTang) {
        btnTang.addEventListener('click', function () {
            const input = this.closest('.menu-item-info').querySelector('.so-luong');
            let value = parseInt(input.value);
            if(value <20) input.value = value + 1;
        });
    });

    // Sự kiện giảm số lượng
    document.querySelectorAll('.btn-giam').forEach(function(btnGiam) {
        btnGiam.addEventListener('click', function () {
            const input = this.closest('.menu-item-info').querySelector('.so-luong');
            let value = parseInt(input.value);
            if (value > 1) input.value = value - 1;
        });
    });

    const monCard = document.querySelectorAll('.table-card');
        monCard.forEach(card => {
            card.addEventListener('click', function() {
            const idMon = this.dataset.idMon;
            window.location.href = `/chi-tiet-mon-an?idMon=${idMon}`;
        });
    });
    async function hienThiTatCaQRCode() {
        const qrImages = document.querySelectorAll('.qr-image');
    
        qrImages.forEach(async (img) => {
            const idMonAn = img.getAttribute('data-id');
            try {
                const res = await fetch(`/generate-qrcode/${idMonAn}`);
                const data = await res.json();
    
                if (data.qrCode) {
                    img.src = data.qrCode;
                } else {
                    console.error(`Không tạo được QR cho món ID ${idMonAn}:`, data.error);
                }
            } catch (error) {
                console.error(`Lỗi khi tạo QR cho món ID ${idMonAn}:`, error);
            }
        });
    }
    
    hienThiTatCaQRCode();
}


function thaoTacLoaiMon(list) {
    const danhSachLoaiMon = document.querySelector('#danhSachLoaiMonList'); 
    danhSachLoaiMon.innerHTML = '';
    list.forEach(function(loaiMon, index) {
        const card = `
            <li class="nav-item">
                <button class="nav-link" data-id="${loaiMon.id}">
                    ${loaiMon.tenDanhMuc}
                </button>
            </li>
        `;
        danhSachLoaiMon.innerHTML += card;
    });
    // Thêm sự kiện click cho các button lọc theo loại
    document.querySelectorAll('.nav-link').forEach(function(button) {
        button.addEventListener('click', async function() {
            document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const loaiId = this.getAttribute('data-id');
            let listMonAn = await getAPIMonAn(loaiId);  
            thaoTacThucDon(listMonAn); 
        });
    });

    // // Thêm sự kiện click cho các button lọc theo loại
    // document.querySelectorAll('.nav-link').forEach(function(button) {
    //     button.addEventListener('click', async function() {
    //         const loaiId = this.getAttribute('data-id');
    //         let listMonAn = await getAPIMonAn(loaiId);  
    //         thaoTacThucDon(listMonAn); 
    //     });
    // });
}

async function getAPIMonAn(idDanhMuc = null) {
    let url = '/api/mon-an';

    // Nếu có idDanhMuc, thêm vào URL với tham số id
    if (idDanhMuc) {
        url += `/${idDanhMuc}`;
    }

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.status) {
            return data.list;
        } else {
            console.error('Lỗi server:', data.error);
            return [];
        }
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

async function getAPIDanhMucMonAn() {
    const reponse = await fetch('/api/danh-muc-mon-an');    
    try {
        const data = await reponse.json();
        if (data.status) {
            return data.list;  // Trả về danh sách loại món ăn
        } else {
            console.error('Lỗi server:', data.error);
            return [];
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function getCartItemCount() {
    const cart = JSON.parse(localStorage.getItem('gioHang')) || [];
    return cart.length; // lấy số món khác nhau
}

function updateCartBadge() {
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = getCartItemCount();
    }
}