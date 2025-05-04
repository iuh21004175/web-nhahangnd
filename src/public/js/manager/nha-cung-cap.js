document.addEventListener('DOMContentLoaded', async function() {
    // Khởi tạo danh sách nhà cung cấp
    let listNhaCungCap = await getAPINhaCungCap();
    
    // Hiển thị danh sách
    thaoTacVoiBang(listNhaCungCap);
    
    // Thiết lập xem trước ảnh khi thêm mới
    const fileThemAnh = document.getElementById('file-themHinhAnh');
    if (fileThemAnh) {
        fileThemAnh.onchange = function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('preview-themHinhAnh').src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
    }
    
    // Thiết lập xem trước ảnh khi chỉnh sửa
    const fileEditAnh = document.getElementById('edit-hinhAnh');
    if (fileEditAnh) {
        fileEditAnh.onchange = function(event) {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('preview-editHinhAnh').src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
    }
    
    // Thiết lập ngày hiện tại cho ngày hợp tác

    // Form thêm nhà cung cấp
    const addSupplierForm = document.getElementById('addSupplierForm');
    addSupplierForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Lấy dữ liệu từ form
        const txtTen = document.getElementById('txt-themTen');
        const txtSoDienThoai = document.getElementById('txt-themSoDienThoai');
        const txtEmail = document.getElementById('txt-themEmail');
        const txtDiaChi = document.getElementById('txt-themDiaChi');
        const fileHinhAnh = document.getElementById('file-themHinhAnh');
        
        // Kiểm tra dữ liệu
        const isValidTen = kiemTraTen(txtTen);
        const isValidSoDienThoai = kiemTraSoDienThoai(txtSoDienThoai);
        const isValidEmail = kiemTraEmail(txtEmail);
        const isValidDiaChi = kiemTraDiaChi(txtDiaChi);
        
        if (isValidTen && isValidSoDienThoai && isValidEmail && isValidDiaChi) {
            const formData = new FormData();
            formData.append('ten', txtTen.value.trim());
            formData.append('soDienThoai', txtSoDienThoai.value.trim());
            formData.append('email', txtEmail.value.trim());
            formData.append('diaChi', txtDiaChi.value.trim());
            
            if (fileHinhAnh.files.length > 0) {
                formData.append('hinhAnh', fileHinhAnh.files[0]);
            }
            
            try {
                const response = await fetch('/api/nha-cung-cap', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                
                if (data.status) {
                    // Đóng modal
                    bootstrap.Modal.getInstance(document.getElementById('addSupplierModal')).hide();
                    
                    // Hiển thị thông báo thành công
                    showToastSuccess('Thêm nhà cung cấp thành công!');
                    
                    // Cập nhật lại danh sách
                    listNhaCungCap.push(data.obj)
                    thaoTacVoiBang(listNhaCungCap);
                    
                    // Reset form
                    this.reset();
                } else {
                    showToastDanger(data.error);
                    console.error('Lỗi:', data.error);
                }
            } catch (error) {
                showToastDanger();
                console.error('Error:', error);
            }
        }
    });
    
    
    // Form chỉnh sửa nhà cung cấp
    const editSupplierForm = document.getElementById('editSupplierForm');
    if (editSupplierForm) {
        editSupplierForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Lấy dữ liệu từ form
            const supplierId = document.getElementById('edit-supplierId').value;
            const txtTen = document.getElementById('edit-ten');
            const txtSoDienThoai = document.getElementById('edit-soDienThoai');
            const txtEmail = document.getElementById('edit-email');
            const txtDiaChi = document.getElementById('edit-diaChi');
            const fileHinhAnh = document.getElementById('edit-hinhAnh');
            
            // Kiểm tra dữ liệu
            const isValidTen = kiemTraTen(txtTen);
            const isValidSoDienThoai = kiemTraSoDienThoai(txtSoDienThoai);
            const isValidEmail = kiemTraEmail(txtEmail);
            const isValidDiaChi = kiemTraDiaChi(txtDiaChi);
            
            if (isValidTen && isValidSoDienThoai && isValidEmail && isValidDiaChi) {
                const formData = new FormData();
                formData.append('id', supplierId);
                formData.append('ten', txtTen.value.trim());
                formData.append('soDienThoai', txtSoDienThoai.value.trim());
                formData.append('email', txtEmail.value.trim());
                formData.append('diaChi', txtDiaChi.value.trim());
                
                if (fileHinhAnh.files.length > 0) {
                    formData.append('hinhAnh', fileHinhAnh.files[0]);
                }
                
                try {
                    const response = await fetch('/api/nha-cung-cap', {
                        method: 'PUT',
                        body: formData
                    });
                    
                    const data = await response.json();
                    
                    if (data.status) {
                        // Đóng modal
                        bootstrap.Modal.getInstance(document.getElementById('editSupplierModal')).hide();
                        
                        // Hiển thị thông báo thành công
                        showToastPrimary("Chỉnh sửa nhà cung cấp thành công!")
                        
                        // Cập nhật lại danh sách
                        const index = listNhaCungCap.findIndex(item => item.id == supplierId);
                        listNhaCungCap[index] = data.obj;
                        thaoTacVoiBang(listNhaCungCap);
                    } else {
                        showToastDanger(data.error);
                        console.error('Lỗi:', data.error);
                    }
                } catch (error) {
                    showToastDanger();
                    console.error('Lỗi:', error);
                }
            }
        });
    }

});

// Hàm lấy danh sách nhà cung cấp từ API
async function getAPINhaCungCap() {
    try {
        const response = await fetch('/api/nha-cung-cap');
        const data = await response.json();
        
        if (data.status) {
            return data.list;
        } else {
            showToastDanger(data.error);
            console.error('Lỗi server:', data.error);
            return [];
        }
    } catch (error) {
        showToastDanger();
        console.error('Error', error);
        return [];
    }
}

// Hàm xử lý bảng danh sách
function thaoTacVoiBang(list) {
    const tableDanhSach = document.querySelector('.table-danhSach tbody');
    tableDanhSach.innerHTML = '';
    
    list.forEach((ncc, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="align-middle">${index + 1}</td>
            <td>
                <img src="${ncc.hinhAnh}" 
                     class="supplier-table-img" alt="Logo">
            </td>
            <td class="align-middle">${ncc.ten}</td>
            <td class="align-middle">${ncc.soDienThoai}</td>
            <td class="align-middle">${ncc.email}</td>
            <td class="align-middle">
                <button class="btn btn-sm btn-info btn-xem me-1" 
                    data-bs-toggle="modal" 
                    data-bs-target="#viewSupplierModal"
                    data-bs-tooltip="tooltip"
                    title="Xem chi tiết"
                    data-id="${ncc.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-primary btn-sua" 
                    data-bs-toggle="modal" 
                    data-bs-target="#editSupplierModal"
                    data-bs-tooltip="tooltip"
                    title="Chỉnh sửa"
                    data-id="${ncc.id}">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        tableDanhSach.appendChild(row);
    });
    
    // Khởi tạo tất cả tooltips
    const tooltips = document.querySelectorAll('[data-bs-tooltip="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });
    // Xử lý khi mở modal xem chi tiết
    document.querySelectorAll('.btn-xem').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.dataset.id;
            const ncc = list.find(item => item.id == id);
                    
            // Hiển thị thông tin chi tiết
            document.getElementById('viewSupplierImage').src = ncc.hinhAnh;
            document.getElementById('viewSupplierName').textContent = ncc.ten;
            document.getElementById('viewSupplierPhone').textContent = ncc.soDienThoai;
            document.getElementById('viewSupplierEmail').textContent = ncc.email;
            document.getElementById('viewSupplierAddress').textContent = ncc.diaChi;
        })
    });
     // Xử lý khi mở modal chỉnh sửa
    document.querySelectorAll('.btn-sua').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.dataset.id;
            const ncc = list.find(item => item.id == id);
            
            // Điền dữ liệu vào form
            document.getElementById('edit-supplierId').value = ncc.id;
            document.getElementById('edit-ten').value = ncc.ten;
            document.getElementById('edit-soDienThoai').value = ncc.soDienThoai;
            document.getElementById('edit-email').value = ncc.email;
            document.getElementById('edit-diaChi').value = ncc.diaChi;
            document.getElementById('preview-editHinhAnh').src = ncc.hinhAnh;
        })
    })
}
// Các hàm validation
function kiemTraTen(input) {
    const value = input.value.trim();
    const errorElement = input.nextElementSibling;
    
    if (!value) {
        errorElement.textContent = 'Vui lòng nhập tên nhà cung cấp';
        return false;
    } else if (value.length < 2) {
        errorElement.textContent = 'Tên nhà cung cấp phải có ít nhất 2 ký tự';
        return false;
    } else {
        errorElement.innerHTML = '&nbsp;';
        return true;
    }
}

function kiemTraSoDienThoai(input) {
    const value = input.value.trim();
    const errorElement = input.nextElementSibling;
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    
    if (!value) {
        errorElement.textContent = 'Vui lòng nhập số điện thoại';
        return false;
    } else if (!phoneRegex.test(value)) {
        errorElement.textContent = 'Số điện thoại không hợp lệ (VD: 0912345678)';
        return false;
    } else {
        errorElement.innerHTML = '&nbsp;';
        return true;
    }
}

function kiemTraEmail(input) {
    const value = input.value.trim();
    const errorElement = input.nextElementSibling;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (value !== '') {
        if (!emailRegex.test(value)) {
            errorElement.textContent = 'Email không hợp lệ';
            return false;
        } else {
            errorElement.innerHTML = '&nbsp;';
            return true;
        }
    }
    else{
        errorElement.innerHTML = '&nbsp;';
        return true;
    }
}

function kiemTraDiaChi(input) {
    const value = input.value.trim();
    const errorElement = input.nextElementSibling;
    
    if (!value) {
        errorElement.textContent = 'Vui lòng nhập địa chỉ';
        return false;
    } else {
        errorElement.innerHTML = '&nbsp;';
        return true;
    }
}

// Hàm định dạng ngày tháng
function formatDate(dateString) {
    if (!dateString) return 'Chưa có thông tin';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(date);
}

// Hàm định dạng ngày tháng cho input
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
function showToastDanger(content = null) {//showErrorToast()
    if (content) {
        document.querySelector('#dangerToast .toastMessage').textContent = content;
    }
    else{
        document.querySelector('#dangerToast .toastMessage').textContent = 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
    }
    const toastElement = document.getElementById('dangerToast');
    const toast = new bootstrap.Toast(toastElement, {
        delay: 3000 // Tự động ẩn sau 3 giây
    });
    
    // Hiển thị toast
    toast.show();
}
function showToastSuccess(content = null) {//showSuccessToastThem()
    if (content) {
        document.querySelector('#successToast .toastMessage').textContent = content;
    }
    else{
        document.querySelector('#successToast .toastMessage').textContent = 'Thêm thành công.';
    }
    const toastElement = document.getElementById('successToast');
    const toast = new bootstrap.Toast(toastElement, {
        delay: 3000 // Tự động ẩn sau 3 giây
    });
    
    // Hiển thị toast
    toast.show();
}
function showToastPrimary(content = null) { //showSuccessToastSua
    if (content) {
        document.querySelector('#primaryToast .toastMessage').textContent = content;
    }
    else{
        document.querySelector('#primaryToast .toastMessage').textContent = 'Chỉnh sửa thành công.';
    }
    const toastElement = document.getElementById('primaryToast');
    const toast = new bootstrap.Toast(toastElement, {
        delay: 3000 // Tự động ẩn sau 3 giây
    });
    
    // Hiển thị toast
    toast.show();
}