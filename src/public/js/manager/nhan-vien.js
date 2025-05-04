document.addEventListener('DOMContentLoaded', async function() {
    // Khởi tạo danh sách nhân viên
    let listNhanVien = await getAPINhanVien();
    // Khởi tạo tooltips
    const fileThemAnh = document.getElementById('file-themHinhAnh');
    fileThemAnh.onchange = function(event){
        loadHinhAnhThemNhanVien(event);
    }
    // Thiết lập ngày bắt đầu mặc định là ngày hiện tại
    const txtNgayBatDau = document.getElementById('txt-themNgayBatDau');
    // Lấy ngày hiện tại
    const today = new Date();
        
    // Định dạng thành chuỗi YYYY-MM-DD cho input type="date"
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Tháng từ 0-11, cần +1 và format 2 số
    const day = String(today.getDate()).padStart(2, '0');
    
    // Gán giá trị cho input
    txtNgayBatDau.value = `${year}-${month}-${day}`;
    // Thao tác với bảng
    thaoTacVoiBang(listNhanVien);
    document.getElementById('positionFilter').onchange = function(){
        const selectedValue = this.value;
        const filteredList = listNhanVien.filter(nv => nv.chucVu == selectedValue || selectedValue == '');
        thaoTacVoiBang(filteredList);
    }
    // Xử lý form thêm nhân viên
    const addStaffForm = document.getElementById('addStaffForm');
    addStaffForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const txtNgaySinh = document.getElementById('txt-themNgaySinh');
        const txtTen = document.getElementById('txt-themTen');
        const txtSoDienThoai = document.getElementById('txt-themSoDienThoai');
        const txtDiaChi = document.getElementById('txt-themDiaChi');
        const comboboxChucVu = document.getElementById('combobox-themChucVu');
        const selectedGender = document.querySelector('input[name="gender"]:checked');
        // Xử lý thêm nhân viên ở đây
        // Kiểm tra từng điều kiện và lưu kết quả
        const isValidNgaySinh = kiemTraNgaySinh(txtNgaySinh);
        const isValidHoTen = kiemTraHoTen(txtTen);
        const isValidSoDienThoai = kiemTraSoDienThoai(txtSoDienThoai);
        const isValidDiaChi = kiemTraDiaChi(txtDiaChi);
        const isValidAnhDaiDien = kiemTraAnhDaiDien(fileThemAnh);

        // Kiểm tra tất cả đều hợp lệ
        if (isValidNgaySinh && isValidHoTen && isValidSoDienThoai && isValidDiaChi && isValidAnhDaiDien) {
            const formData = new FormData();
            formData.append('ten', txtTen.value.trim());
            formData.append('gioiTinh', selectedGender.value);
            formData.append('ngaySinh', txtNgaySinh.value);
            formData.append('soDienThoai', txtSoDienThoai.value.trim());
            formData.append('diaChi', txtDiaChi.value.trim());
            formData.append('hinhAnh', fileThemAnh.files[0]);
            formData.append('chucVu', comboboxChucVu.value);
            formData.append('ngayBatDau', txtNgayBatDau.value.trim());
                
               
            try{
                const response = await fetch('/api/nhan-vien', {
                    method: 'POST',
                    body: formData
                }); 
                const data = await response.json();
                if (data.status){
                    // Đóng modal sau khi thêm thành công
                    listNhanVien.push(data.obj);
                    thaoTacVoiBang(listNhanVien);
                    bootstrap.Modal.getInstance(document.getElementById('addStaffModal')).hide();
                    this.reset();
                    showToastSuccess("Thêm nhân viên thành công!");
                }
                else{
                    showToastDanger(data.error);
                    console.error('Error:', data.error);
                }
            } 
            catch (error) {
                showToastDanger()
                console.error('Error:', error);
            }
        }
        
    });
    // Xử lý form chỉnh sửa nhân viên
    const editStaffForm = document.getElementById('editStaffForm');
    editStaffForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        // Xử lý cập nhật nhân viên ở đây
        const txtId = document.getElementById('editStaffId');
        const txtTen = document.getElementById('editStaffName');
        const txtNgaySinh = document.getElementById('editStaffBirthDate');
        const txtSoDienThoai = document.getElementById('editStaffPhone');
        const txtDiaChi = document.getElementById('editStaffAddress');
        const comboboxChucVu = document.getElementById('editStaffPosition');
        const selectedGender = document.querySelector('input[name="editGender"]:checked');
        const fileAnhDaiDien = document.getElementById('editHinhAnh');
        const txtTrangThai = document.getElementById('editStaffStatus');
        const txtMatKhau = document.getElementById('editStaffPassword')

        const isValidNgaySinh = kiemTraNgaySinh(txtNgaySinh);
        const isValidHoTen = kiemTraHoTen(txtTen);
        const isValidSoDienThoai = kiemTraSoDienThoai(txtSoDienThoai);
        const isValidDiaChi = kiemTraDiaChi(txtDiaChi);
        if(isValidDiaChi && isValidSoDienThoai && isValidHoTen && isValidNgaySinh){
            const formData = new FormData();
            formData.append('id', txtId.value);
            formData.append('ten', txtTen.value.trim());
            formData.append('gioiTinh', selectedGender.value);
            formData.append('ngaySinh', txtNgaySinh.value);
            formData.append('soDienThoai', txtSoDienThoai.value.trim());
            formData.append('diaChi', txtDiaChi.value.trim());
            formData.append('chucVu', comboboxChucVu.value);
            formData.append('trangThai', txtTrangThai.value);
            if(fileAnhDaiDien.files.length > 0){
                formData.append('hinhAnh', fileAnhDaiDien.files[0]);
            }
            
            formData.append('matKhau', txtMatKhau.value.trim());
            try{
                const response = await fetch('/api/nhan-vien', {
                    method: 'PUT',
                    body: formData
                });   
                const data = await response.json();
                if (data.status){
                    // Đóng modal sau khi cập nhật
                    const index = listNhanVien.findIndex(nv => nv.id == data.obj.id);
                    listNhanVien[index] = data.obj;
                    thaoTacVoiBang(listNhanVien);
                    bootstrap.Modal.getInstance(document.getElementById('editStaffModal')).hide();
                    this.reset();
                    showToastPrimary('Chỉnh sửa nhân viên thành công!');
                }
                else{
                    showToastDanger(data.error);
                    console.error('Error:', data.error);
                }
            } 
            catch (error) {
                showToastDanger()
                console.error('Error:', error);
            }
        }
        
    });

   
});
async function getAPINhanVien(){
    const response = await fetch('/api/nhan-vien');
    try{
        const data = await response.json();
        if(data.status){
            return data.list;
        }
        else{
            showToastDanger(data.error);
            console.error('Error:', data.error);
            return [];
        }
    }
    catch(error){
        showToastDanger();
        console.error('Error:', error);
    }
}
function thaoTacVoiBang(list){
    // Hiển thị danh sách nhân viên khi mở trang
    const tableDanhSach = document.querySelector('.table-danhSach tbody');
    tableDanhSach.innerHTML = '';
    list.forEach((nv, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <img src="${nv.hinhAnh}" class="staff-avatar" alt="Avatar">
            </td>
            <td>${nv.ten}</td>
            <td>${nv.soDienThoai}</td>
            <td>${parseInt(nv.chucVu) === 1 ? 'Đầu bếp' : 'Phục vụ'}</td>
            <td>
                <span class="badge ${parseInt(nv.trangThai) === 1 ? 'bg-success' : 'bg-danger'}">
                    ${parseInt(nv.trangThai) === 1 ? 'Đang làm việc' : 'Nghỉ việc'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-info btn-xem me-1" 
                    data-bs-toggle="modal" 
                    data-bs-target="#viewStaffModal"
                    data-bs-tooltip="tooltip"
                    title="Xem chi tiết"
                    data-id="${nv.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-primary btn-sua" 
                    data-bs-toggle="modal" 
                    data-bs-target="#editStaffModal"
                    data-bs-tooltip="tooltip"
                    title="Chỉnh sửa"
                    data-id="${nv.id}">
                    <i class="fas fa-edit"></i>
                </button>
            </td>    
        `
        tableDanhSach.appendChild(row);
    })
    // Khởi tạo tooltip cho các nút "Xem" và "Chỉnh sửa"
    const tooltips = document.querySelectorAll('[data-bs-tooltip="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });
    // Hiển thị thông tin chi tiết nhân viên khi nhấn nút "Xem"
    document.querySelectorAll('.btn-xem').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.dataset.id;
            const staff = list.find(nv => parseInt(nv.id) === parseInt(id));
            document.getElementById('viewStaffImage').src = staff.hinhAnh;
            document.getElementById('viewStaffName').textContent = staff.ten;
            document.getElementById('viewStaffGender').textContent = staff.gioiTinh === 1 ? 'Nam' : 'Nữ';
            document.getElementById('viewStaffBirthDate').textContent = new Date(staff.ngaySinh).toLocaleDateString('vi-VN');
            document.getElementById('viewStaffPhone').textContent = staff.soDienThoai;
            document.getElementById('viewStaffAddress').textContent = staff.diaChi;
            document.getElementById('viewStaffPosition').textContent = parseInt(staff.chucVu) === 1 ? 'Đầu bếp' : 'Phục vụ';
            document.getElementById('viewStaffStartDate').textContent = new Date(staff.ngayBatDau).toLocaleDateString('vi-VN');
            document.getElementById('viewStaffStatus').textContent = parseInt(staff.trangThai) === 1 ? 'Đang làm việc' : 'Nghỉ việc';
            document.getElementById('viewStaffUsername').textContent = staff.TaiKhoan.tenDangNhap;
        })

    });
    // Hiển thị thông tin chỉnh sửa nhân viên khi nhấn nút "Chỉnh sửa"
    document.querySelectorAll('.btn-sua').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.dataset.id;
            const staff = list.find(nv => parseInt(nv.id) === parseInt(id));
            document.getElementById('editStaffId').value = staff.id;
            document.getElementById('editStaffName').value = staff.ten;
            document.getElementById('editStaffBirthDate').value = staff.ngaySinh
            document.getElementById('editStaffPhone').value = staff.soDienThoai;
            document.getElementById('editStaffAddress').value = staff.diaChi;
            document.getElementById('editStaffPosition').value = staff.chucVu;
            document.getElementById('editStaffStatus').value = staff.trangThai;
            document.querySelectorAll('input[name="editGender"]').forEach(radio => {
                radio.checked = parseInt(radio.value) === parseInt(staff.gioiTinh);
            });
            document.getElementById('currentStaffImage').src = staff.hinhAnh; 
        })
    });
}
function kiemTraNgaySinh(txtngaySinh){
    let isValid = true;
    const birthDate = new Date(txtngaySinh.value);
    const today = new Date();
    txtngaySinh.nextElementSibling.innerHTML = '&nbsp;';
    // Tính tuổi
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    // Nếu chưa tới tháng sinh nhật trong năm nay, trừ 1 tuổi
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    if (age < 18) {
        txtngaySinh.nextElementSibling.innerHTML = 'Nhân viên phải đủ 18 tuổi trở lên';
        isValid = false;
    } else if (age > 65) {
        txtngaySinh.nextElementSibling.innerHTML = 'Tuổi nhân viên không được vượt quá 65';
        isValid = false;
    }
    return isValid;
}
function kiemTraHoTen(txtHoTen){
    let isValid = true;
    txtHoTen.nextElementSibling.innerHTML = '&nbsp;';
    if (txtHoTen.value.trim() === '') {
        txtHoTen.nextElementSibling.innerHTML = 'Họ tên không được để trống';
        isValid = false;
    }
    return isValid;
}
function kiemTraSoDienThoai(txtSoDienThoai){
    let isValid = true;
    txtSoDienThoai.nextElementSibling.innerHTML = '&nbsp;';
    const phonePattern = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phonePattern.test(txtSoDienThoai.value)) {
        txtSoDienThoai.nextElementSibling.innerHTML = 'Số điện thoại không hợp lệ';
        isValid = false;
    }
    return isValid;
}
function kiemTraDiaChi(txtDiaChi){
    let isValid = true;
    txtDiaChi.nextElementSibling.innerHTML = '&nbsp;';
    if (txtDiaChi.value.trim() === '') {
        txtDiaChi.nextElementSibling.innerHTML = 'Địa chỉ không được để trống';
        isValid = false;
    }
    return isValid;
}
function kiemTraAnhDaiDien(fileAnhDaiDien){
    let isValid = true;
    fileAnhDaiDien.nextElementSibling.innerHTML = '&nbsp;';
    if (fileAnhDaiDien.files.length === 0) {
        fileAnhDaiDien.nextElementSibling.innerHTML = 'Chưa chọn ảnh đại diện';
        isValid = false;
    }
    return isValid;
}
function loadHinhAnhThemNhanVien(event){
    const file = event.target.files[0];
    const preview = document.querySelector('#avatarPreview img');
    const errorMessage = document.querySelector('.message-error');
    // Xóa thông báo lỗi cũ
    errorMessage.innerHTML = '&nbsp;';
    if(file){
        if (file.size > 5 * 1024 * 1024) {
            errorMessage.textContent = 'Dung lượng ảnh không được vượt quá 5MB';
            return;
        }

        // Hiển thị ảnh preview
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
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