document.addEventListener('DOMContentLoaded', async function () {
    const listLoaiMon = await getAPIDanhMucMonAn();
    const listMonAn = await getAPIMonAn();
    const idBan = new URLSearchParams(window.location.search).get('idBan');
    const ban = await getAPIBan(idBan);
    const donHang = await getAPIDonHang(idBan);

    thaoTacLoaiMon(listLoaiMon);
    thaoTacThucDon(listMonAn);
    thaoTacBan(ban);
    thaoTacDonHang(donHang);

    // Bấm nút lưu đơn hàng (saveDraft)
    document.getElementById('saveDraft').addEventListener('click', async function (e) {
        e.preventDefault();

        const orderItems = document.querySelectorAll('.order-item');
        if (orderItems.length === 0) {
            alert('Giỏ hàng đang trống!');
            return;
        }

        const idBan = new URLSearchParams(window.location.search).get('idBan');
        if (!idBan) {
            alert('Không tìm thấy ID bàn!');
            return;
        }

        const chiTietDonHang = [];
        let tongTien = 0;

        orderItems.forEach(item => {
            const idMonAn = item.dataset.id;
            const soLuong = parseInt(item.querySelector('.so-luong').value) || 0;
            const giaText = item.querySelector('.price').textContent.trim();
            const gia = parseInt(giaText.replace(/[^\d]/g, '')) || 0;

            if (soLuong > 0 && gia > 0) {
                chiTietDonHang.push({
                    idMonAn,
                    soLuong,
                    gia,
                    ghiChu: '' // Ghi chú nếu cần
                });
                tongTien += gia * soLuong;
            }
        });

        if (chiTietDonHang.length === 0) {
            alert('Không có món hợp lệ để ghi đơn!');
            return;
        }

        try {
            // Thêm idDonHang vào body request
            const response = await fetch(`/api/ghi-don-hang?idBan=${idBan}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    idDonHang: donHang?.id || null, // Nếu donHang có id thì truyền vào, nếu không thì truyền null
                    hinhThuc: 0,
                    trangThai: 7,
                    tongTien,
                    chiTietDonHang
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error('Server returned HTTP error: ' + response.status);
            }

            const data = await response.json();
            console.log('API response data:', data);

            if (data.status) {
                alert('Ghi đơn hàng thành công!');

                // Cập nhật trạng thái bàn
                try {
                    const response = await fetch('/api/cap-nhat-trang-thai-ban', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            idBan: idBan,
                            newStatus: 1
                        })
                    });

                    const statusUpdate = await response.json();
                    if (statusUpdate.status) {
                        console.log('Cập nhật trạng thái bàn thành công');
                    } else {
                        console.error('Lỗi cập nhật trạng thái bàn:', statusUpdate.error);
                    }
                } catch (error) {
                    console.error('Lỗi khi gọi API cập nhật trạng thái bàn:', error);
                }

                window.location.href = '/manager/danh-sach-ban';
            } else {
                alert('Ghi đơn thất bại: ' + (data.error || 'Không rõ nguyên nhân'));
            }

        } catch (error) {
            console.error('Lỗi ghi đơn hàng:', error);
            alert('Đã xảy ra lỗi: ' + error.message);
        }
    });

    // Bấm nút thanh toán (checkout)
    document.getElementById('checkout').addEventListener('click', async function(e) {
        e.preventDefault();
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
    
        const orderItems = document.querySelectorAll('.order-item');
        const chiTietDonHang = [];
        let tongTien = 0;
    
        orderItems.forEach(item => {
            const idMonAn = item.dataset.id;
            const soLuong = parseInt(item.querySelector('.so-luong').value) || 0;
            const giaText = item.querySelector('.price').textContent.trim();
            const gia = parseInt(giaText.replace(/[^\d]/g, '')) || 0;
    
            if (soLuong > 0 && gia > 0) {
                chiTietDonHang.push({
                    idMonAn,
                    soLuong,
                    gia,
                    ghiChu: ''
                });
                tongTien += gia * soLuong;
            }
        });
    
        if (chiTietDonHang.length === 0) {
            alert('Không có món hợp lệ để ghi đơn!');
            return;
        }
    
        if (paymentMethod === '0') { // Thanh toán tiền mặt
            try {
                const orderResponse = await fetch(`/api/ghi-don-hang?idBan=${idBan}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        idDonHang: donHang?.id || null,
                        hinhThuc: 0,
                        thanhToan: paymentMethod,
                        trangThai: 2,
                        tongTien,
                        chiTietDonHang
                    })
                });
    
                const orderData = await orderResponse.json();
                console.log('Dữ liệu trả về từ API ghi đơn hàng:', orderData); 
    
                if (orderData.status) {
                    const tableStatusResponse = await fetch('/api/cap-nhat-trang-thai-ban', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            idBan: idBan,
                            newStatus: 0
                        })
                    });
    
                    const tableStatusData = await tableStatusResponse.json();
                    if (tableStatusData.status) {
                        alert('Thanh toán đơn hàng thành công!');
                        window.location.href = `/manager/danh-sach-ban`;
                    } else {
                        alert('Thanh toán đơn hàng thất bại!');
                    }
                } else {
                    alert('Thanh toán đơn hàng thất bại! Vui lòng thử lại.');
                }
    
            } catch (error) {
                console.error('Lỗi:', error);
                alert('Có lỗi xảy ra, vui lòng thử lại sau.');
            }
    
        } else if (paymentMethod === '1') {
            alert('Thanh toán chuyển khoản đang được xử lý...');
            // Xử lý thanh toán chuyển khoản tại đây
        }
    });  
});


function thaoTacLoaiMon(list) {
    const danhSachLoaiMon = document.querySelector('#category-filters');
    danhSachLoaiMon.innerHTML = "";

    // Thêm nút "Tất cả"
    const tatCaBtn = document.createElement('button');
    tatCaBtn.className = "btn btn-outline-primary active";
    tatCaBtn.textContent = "Tất cả";
    tatCaBtn.dataset.id = "";
    danhSachLoaiMon.appendChild(tatCaBtn);

    // Thêm các nút còn lại
    list.forEach(loaiMon => {
        const btn = document.createElement('button');
        btn.className = "btn btn-outline-primary";
        btn.textContent = loaiMon.tenDanhMuc;
        btn.dataset.id = loaiMon.id;
        danhSachLoaiMon.appendChild(btn);
    });

    // Xử lý sự kiện click để lọc
    danhSachLoaiMon.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', async function () {
            // Active trạng thái nút
            danhSachLoaiMon.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');

            const loaiId = this.dataset.id;
            const monAn = await getAPIMonAn(loaiId);
            thaoTacThucDon(monAn);
        });
    });
}

function thaoTacThucDon(list) {
    const danhSachMonAn = document.querySelector('#danhSachMonAn');
    danhSachMonAn.innerHTML = "";
    if (list.length === 0) {
        danhSachMonAn.innerHTML = `<p class="text-center text-danger">Không có món trong loại này.</p>`;
        return;
    }
    list.forEach(monAn => {
        const card = `
        <div class="col">
            <div class="menu-item card h-100" data-id="${monAn.id}" data-name="${monAn.ten}" data-price="${monAn.gia}" data-img="${monAn.hinhAnh}">
                <img src="${monAn.hinhAnh}" class="card-img-top" style="height: 160px; object-fit: cover;" alt="${monAn.ten}">
                <div class="card-body d-flex flex-column justify-content-between h-100">
                    <div>
                        <h6 class="card-title">${monAn.ten}</h6>
                        <p class="card-text text-primary">${monAn.gia.toLocaleString('vi-VN')}₫</p>
                    </div>
                </div>                    
            </div>
        </div> 
        `;
        danhSachMonAn.innerHTML += card;
    });

    // Xử lý sự kiện Thêm vào giỏ
    document.querySelectorAll('.menu-item').forEach(function(item) {
        item.addEventListener('click', function() {
            const id = this.dataset.id;
            const name = this.dataset.name;
            const price = parseInt(this.dataset.price);
            const img = this.dataset.img;

            // Thêm món vào giỏ hàng
            themVaoGioHang(id, name, price, img);
        });
    });
}

function thaoTacBan(banList) {
    const banContainer = document.querySelector('.table-selection'); // Selector chứa danh sách bàn
    banContainer.innerHTML = ""; // Xóa nội dung cũ trước khi thêm bàn mới

    if (banList.length === 0) {
        banContainer.innerHTML = "<p>Không có bàn nào để hiển thị.</p>";
        return;
    }

    banList.forEach(ban => {
        // Tạo một phần tử mới cho mỗi bàn
        const banElement = document.createElement('div'); 
        banElement.className = 'table-item'; // Thêm class để style nếu cần

        // Cập nhật nội dung của phần tử
        banElement.innerHTML = `
            <h5 class="mb-3 text-primary text-center">Lập Hóa Đơn</h5>

            <div class="d-flex justify-content-between mb-2">
                <span class="fw-bold">Bàn:</span>
                <span id="selectedTable">${ban.ten}</span> 
            </div>
            <div class="d-flex justify-content-between mb-3">
                <span class="fw-bold">Khu vực:</span>
                <span id="selectedArea">${ban.KhuVuc.tenKhuVuc}</span>
            </div>
        `;

        // Thêm phần tử vào container
        banContainer.appendChild(banElement);
    });
}



function themVaoGioHang(id, name, price, img) {
    const orderItems = document.querySelector('.order-items');
    
    // Kiểm tra xem món ăn đã có trong giỏ hay chưa
    const existingItem = orderItems.querySelector(`.order-item[data-id="${id}"]`);
    if (existingItem) {
        // Nếu có, tăng số lượng
        const quantityInput = existingItem.querySelector('.so-luong');
        quantityInput.value = parseInt(quantityInput.value) + 1;
        updateTotal(); // Cập nhật lại tổng giá trị
        return;
    }

    const orderItem = document.createElement('div');
    orderItem.className = 'order-item d-flex justify-content-between mb-2';
    orderItem.dataset.id = id;

    // Tạo nội dung món ăn trong giỏ hàng
    orderItem.innerHTML = `
        <div class="d-flex align-items-center justify-content-between mb-3">
            <div class="d-flex align-items-center">
                <img src="${img}" alt="${name}" style="height: 50px; width: 50px; object-fit: cover; margin-right: 15px;">
            </div>
            <div class="d-flex flex-column">
                <span class="fw-bold">${name}</span>
                <span class="price text-primary">${price.toLocaleString('vi-VN')}₫</span>
            </div>
        </div>

        <div class="d-flex align-items-center mb-2">
            <div class="input-group input-group-sm" style="max-width: 130px;">
                <button class="btn btn-outline-secondary btn-giam" type="button">-</button>
                <input type="number" class="form-control text-center so-luong" value="1" min="1" style="width: 50px;">
                <button class="btn btn-outline-secondary btn-tang" type="button">+</button>
            </div>
            <button class="btn btn-sm btn-danger ms-2 btn-xoa" data-id="${id}">Xóa</button>
        </div>
    `;

    orderItems.appendChild(orderItem);

    // Cập nhật tổng giá trị
    updateTotal();

    // Thêm sự kiện cho nút xóa
    orderItem.querySelector('.btn-xoa').addEventListener('click', function() {
        orderItem.remove();
        updateTotal();
    });

    // Thêm sự kiện cho nút tăng/giảm số lượng
    orderItem.querySelector('.btn-tang').addEventListener('click', function () {
        const input = orderItem.querySelector('.so-luong');
        let currentValue = parseInt(input.value) || 0;
    
        if (currentValue < 20) {
            input.value = currentValue + 1;
            updateTotal(); // Cập nhật lại tổng giá trị
        }
    });
    

    orderItem.querySelector('.btn-giam').addEventListener('click', function () {
        const input = orderItem.querySelector('.so-luong');
        if (input.value > 1) input.value = parseInt(input.value) - 1;
        updateTotal(); // Cập nhật lại tổng giá trị
    });
}

function updateTotal() {
    const orderItems = document.querySelectorAll('.order-item');
    let total = 0;

    orderItems.forEach(item => {
        // Remove non-numeric characters from price text (₫ and commas)
        const price = parseInt(item.querySelector('.price').textContent.replace('₫', '').replace('.', '').trim());
        const quantity = parseInt(item.querySelector('.so-luong').value);
        total += price * quantity;
    });

    document.querySelector('#total').textContent = `${total.toLocaleString('vi-VN')}₫`;
}


async function getAPIDanhMucMonAn() {
    try {
        const response = await fetch('/api/danh-muc-mon-an');
        const data = await response.json();
        return data.status ? data.list : [];
    } catch (error) {
        console.error('Lỗi khi lấy danh mục:', error);
        return [];
    }
}

async function getAPIMonAn(idDanhMuc = null) {
    let url = '/api/mon-an';
    if (idDanhMuc) url += `/${idDanhMuc}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.status ? data.list : [];
    } catch (error) {
        console.error('Lỗi khi lấy món ăn:', error);
        return [];
    }
}

async function getAPIBan(idBan = null) {
    try {
        let url = '/api/ban'; // Đường dẫn API cơ bản

        // Nếu có idBan, truyền thêm vào query string
        if (idBan) {
            url += `?idBan=${idBan}`;
        }

        const res = await fetch(url);
        const data = await res.json();

        // Kiểm tra trạng thái của API
        if (data.status) {
            console.log("Dữ liệu trả về từ API:", data); 
            return data.list || [data.obj]; 
        } else {
            showToastDanger(data.error);
            console.log("Lỗi từ API:", data.error); // Log lỗi nếu có
            return [];
        }
    } catch (error) {
        showToastDanger();
        console.log("Lỗi trong khi gọi API:", error); // Log lỗi nếu có lỗi trong quá trình gọi API
        return [];
    }
}

async function getAPIDonHang(idBan) {
    try {
        if (!idBan) {
            const listMonAn = await getAPIMonAn();
            thaoTacThucDon(listMonAn);
            return;
        }

        const url = `/api/don-hang-theo-ban?idBan=${idBan}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.status) {
            if (data.obj && data.obj.ChiTietDonHangs?.length > 0) {
                return data.obj;
            } else {
                const listMonAn = await getAPIMonAn();
                thaoTacThucDon(listMonAn);
                return;
            }
        } else {
            // Nếu là không có đơn hàng chờ thanh toán thì hiển thị món ăn
            if (data.message === 'Không có đơn hàng chờ thanh toán cho bàn này') {
                const listMonAn = await getAPIMonAn();
                thaoTacThucDon(listMonAn);
                return;
            }

            // Còn lại là lỗi khác thì thông báo
            showToastDanger(data.error || data.message);
            console.error('Lỗi từ API:', data.error || data.message);
        }
    } catch (error) {
        showToastDanger('Lỗi khi lấy đơn hàng!');
        console.error('Lỗi khi lấy đơn hàng:', error);
    }
}


function thaoTacDonHang(donHang) {
    const donHangContainer = document.querySelector('.order-items');
    donHangContainer.innerHTML = ''; // Clear trước

    if (!donHang || !donHang.ChiTietDonHangs || donHang.ChiTietDonHangs.length === 0) {
        console.log('Không có đơn hàng đã lưu.');
        donHangContainer.innerHTML = '';
        return;
    }

    donHang.ChiTietDonHangs.forEach(ct => {
        const mon = ct.MonAn;

        const orderItem = document.createElement('div');
        orderItem.className = 'order-item d-flex justify-content-between mb-2';
        orderItem.dataset.id = mon.id;

        orderItem.innerHTML = `
            <div class="d-flex align-items-center justify-content-between mb-3">
                <div class="d-flex align-items-center">
                    <img src="${mon.hinhAnh || '/default.jpg'}" alt="${mon.ten}" style="height: 50px; width: 50px; object-fit: cover; margin-right: 15px;">
                </div>
                <div class="d-flex flex-column">
                    <span class="fw-bold">${mon.ten}</span>
                    <span class="price text-primary">${mon.gia.toLocaleString('vi-VN')}₫</span>
                </div>
            </div>

            <div class="d-flex align-items-center mb-2">
                <div class="input-group input-group-sm" style="max-width: 130px;">
                    <button class="btn btn-outline-secondary btn-giam" type="button">-</button>
                    <input type="number" class="form-control text-center so-luong" value="${ct.soLuong}" min="1" style="width: 50px;">
                    <button class="btn btn-outline-secondary btn-tang" type="button">+</button>
                </div>
                <button class="btn btn-sm btn-danger ms-2 btn-xoa" data-id="${mon.id}">Xóa</button>
            </div>
        `;

        donHangContainer.appendChild(orderItem);

        // Gán sự kiện
        const btnTang = orderItem.querySelector('.btn-tang');
        const btnGiam = orderItem.querySelector('.btn-giam');
        const btnXoa = orderItem.querySelector('.btn-xoa');
        const inputSoLuong = orderItem.querySelector('.so-luong');

        btnTang.addEventListener('click', () => {
            inputSoLuong.value = parseInt(inputSoLuong.value) + 1;
            updateTotal();
        });

        btnGiam.addEventListener('click', () => {
            if (parseInt(inputSoLuong.value) > 1) {
                inputSoLuong.value = parseInt(inputSoLuong.value) - 1;
                updateTotal();
            }
        });

        btnXoa.addEventListener('click', () => {
            orderItem.remove();
            updateTotal();
        });
    });

    updateTotal();
}
