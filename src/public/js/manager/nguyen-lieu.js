document.addEventListener('DOMContentLoaded', async function() {
    let listDanhMucNguyenLieu = await getAPIDanhMucNguyenLieu();
    let listNguyenLieu = await getAPINguyenLieu();
    let listNhaCungCap = await getAPINhaCungCap();
    thaoTacVoiCompoboxFilter(listDanhMucNguyenLieu, listNguyenLieu);
    thaoTacVoiBang(listNguyenLieu);
    if (listDanhMucNguyenLieu.length > 0) {
        const comboboxThemDanhMuc = document.getElementById('ingredientCategory')
        const comboboxSuaDanhMuc = document.getElementById('editIngredientCategory')
        listDanhMucNguyenLieu.forEach(item => {
             // Option cho form thêm mới
             const optionThem = document.createElement('option');
             optionThem.value = item.id;
             optionThem.textContent = item.tenDanhMuc;
             comboboxThemDanhMuc.appendChild(optionThem);
             
             // Option cho form sửa - tạo phần tử mới
             const optionSua = document.createElement('option');
             optionSua.value = item.id;
             optionSua.textContent = item.tenDanhMuc;
             comboboxSuaDanhMuc.appendChild(optionSua);
        });
    }
    if (listNhaCungCap.length > 0) {
        const comboboxThemNhaCungCap = document.getElementById('ingredientSupplier')
        const comboboxSuaNhaCungCap = document.getElementById('editIngredientSupplier')
        listNhaCungCap.forEach(item => {
            
            const optionThem = document.createElement('option');
            optionThem.value = item.id;
            optionThem.textContent = item.ten;
            comboboxThemNhaCungCap.appendChild(optionThem);
            
            // Option cho form sửa - tạo phần tử mới
            const optionSua = document.createElement('option');
            optionSua.value = item.id;
            optionSua.textContent = item.ten;
            comboboxSuaNhaCungCap.appendChild(optionSua);
        })
    }

    // Xử lý form thêm nguyên liệu
    const addForm = document.getElementById('addIngredientForm');
    addForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData();
        const txtTen = document.getElementById('ingredientName');
        const txtDonVi = document.getElementById('ingredientUnit');
        const txtToiThieu = document.getElementById('ingredientMinStock');
        const txtDanhMuc = document.getElementById('ingredientCategory');
        const txtNhaCungCap = document.getElementById('ingredientSupplier');
        const fileHinhAnh = document.getElementById('ingredientImage');
        const htmlHinhAnh = document.getElementById('ingredientPreview');

        const isValidTen = kiemTraTen(txtTen);
        const isValidToiThieu = kiemTraToiThieu(txtToiThieu)
        const isValidHinhAnh = kiemTraHinhAnh(fileHinhAnh)
        if(isValidTen && isValidToiThieu && isValidHinhAnh){
            formData.append('ten', txtTen.value.trim());
            formData.append('donVi', txtDonVi.value);
            formData.append('toiThieu', txtToiThieu.value.trim());
            formData.append('idDanhMuc', txtDanhMuc.value);
            formData.append('idNhaCungCap', txtNhaCungCap.value);
            formData.append('hinhAnh', fileHinhAnh.files[0]);
            try {
                const res = await fetch('/api/nguyen-lieu', {
                    method: 'POST',
                    body: formData
                })
                const  data = await res.json();
                if(data.status){
                    listNguyenLieu.unshift(data.obj);
                    thaoTacVoiBang(listNguyenLieu);
                    showToastSuccess('Thêm nguyên liệu thành công!')
                    bootstrap.Modal.getInstance(document.getElementById('addIngredientModal')).hide();
                    this.reset(); // Reset form sau khi thêm thành công
                    htmlHinhAnh.src = ''; // Reset hình ảnh preview
                }
                else{
                    showToastDanger(data.error);
                    console.error(data.error);
                }
            }
            catch(e){
                showToastDanger();
                console.error(e);
            }
        }
    });
    // Xử lý form sửa nguyên liệu
    const editForm = document.getElementById('editIngredientForm');
    editForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const formData = new FormData();
        const txtTen = document.getElementById('editIngredientName');
        const txtDonVi = document.getElementById('editIngredientUnit');
        const txtToiThieu = document.getElementById('editIngredientMinStock');
        const txtDanhMuc = document.getElementById('editIngredientCategory');
        const txtNhaCungCap = document.getElementById('editIngredientSupplier');
        const fileHinhAnh = document.getElementById('editIngredientImage');
        const id = document.getElementById('editIngredientId').value;
        const htmlHinhAnh = document.getElementById('editIngredientPreview');
        
        const isValidTen = kiemTraTen(txtTen);
        const isValidToiThieu = kiemTraToiThieu(txtToiThieu)
        if(isValidTen && isValidToiThieu){
            formData.append('id', id);
            formData.append('ten', txtTen.value);
            formData.append('donVi', txtDonVi.value);
            formData.append('toiThieu', txtToiThieu.value);
            formData.append('idDanhMuc', txtDanhMuc.value);
            formData.append('idNhaCungCap', txtNhaCungCap.value);
            if(fileHinhAnh.files[0]){
                formData.append('hinhAnh', fileHinhAnh.files[0]);
            }
            try {
                const res = await fetch('/api/nguyen-lieu', {
                    method: 'PUT',
                    body: formData
                })
                const  data = await res.json();
                if(data.status){
                    const index = listNguyenLieu.findIndex(item => item.id == id);
                    listNguyenLieu[index] = data.obj;
                    thaoTacVoiBang(listNguyenLieu);
                    showToastPrimary('Chỉnh sửa nguyên liệu thành công!');
                    bootstrap.Modal.getInstance(document.getElementById('editIngredientModal')).hide();
                    this.reset(); // Reset form sau khi sửa thành công
                    htmlHinhAnh.src = ''; // Reset hình ảnh preview
                }
                else{
                    showToastDanger(data.error);
                    console.error(data.error);
                }
            }
            catch(e){
                showToastDanger()
                console.error(e);
            }
        }
    });
    // Preview ảnh khi chọn file
    const imageInputs = document.querySelectorAll('input[type="file"]');
    imageInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                const preview = this.closest('.modal-body').querySelector('img');
                if (preview) {
                    reader.onload = function(e) {
                        preview.src = e.target.result;
                    };
                    reader.readAsDataURL(this.files[0]);
                }
            }
        });
    });

    // Thêm xử lý tìm kiếm
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchText = removeAccents(this.value.toLowerCase().trim());
            const rows = document.querySelectorAll('tbody tr');

            rows.forEach(row => {
                const nameCell = row.querySelector('td:nth-child(3)');
                if (nameCell) {
                    const ingredientName = removeAccents(nameCell.textContent.toLowerCase());
                    if (ingredientName.includes(searchText)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                }
            });
        });
    }
});

// Hàm lấy danh sách danh mục nguyên liệu từ API
async function getAPIDanhMucNguyenLieu() {
    try{
        const res = await fetch('/api/danh-muc-nguyen-lieu');
        const data = await res.json();
        if(data.status){
            return data.list;
        }
        else{
            showToastDanger(data.error);
            console.error(data.error);
            return []
        }
    }
    catch(e){
        showToastDanger()
        console.error(e);
        return [];
    }
}
// Hàm lấy danh sách nguyên liệu từ API
async function getAPINguyenLieu() {
    try {
        const res = await fetch('/api/nguyen-lieu');
        const data = await res.json();
        if (data.status) {
            return data.list;
        } else {
            showToastDanger(data.error);
            console.error(data.error);
            return [];
        }
    }
    catch(e) {
        showToastDanger()
        console.error(e);
        return [];
    }
}
// Hàm lấy danh sách nhà cung cấp từ API
async function getAPINhaCungCap() {
    try {
        const res = await fetch('/api/nha-cung-cap');
        const data = await res.json();
        if (data.status) {
            return data.list;
        } 
        else {
            showToastDanger(data.error);
            console.error(data.error);
            return [];
        }
    }
    catch(e) {
        showToastDanger()
        console.error(e);
        return [];
    }
}
// Hàm thao tác với danh sách nguyên liệu
function thaoTacVoiBang(list){
    const tbody = document.querySelector('tbody');
    tbody.innerHTML = ''; // Xóa nội dung cũ
    if(list.length > 0){
        list.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><img src="${item.hinhAnh}" alt="${item.ten}" style="width: 50px; height: 50px;"></td>
                <td>${item.ten}</td>
                <td>${item.DanhMucNguyenLieu.tenDanhMuc}</td>
                <td>${item.donVi}</td>
                <td>${item.tonKho}</td>
                <td>
                    <span class="badge ${parseInt(item.tonKho) > parseInt(item.toiThieu) ? 'bg-success' : item.tonKho == 0 ? 'bg-danger' : 'bg-warning'}">
                        ${parseInt(item.tonKho) > parseInt(item.toiThieu) ? 'Còn hàng' : item.tonKho == 0 ? 'Hết hàng' : 'Săp hết'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-info btn-xem me-1" 
                        data-bs-toggle="modal" 
                        data-bs-target="#viewIngredientModal"
                        data-bs-tooltip="tooltip"
                        title="Xem chi tiết"
                        data-id="${item.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary btn-sua" 
                        data-bs-toggle="modal" 
                        data-bs-target="#editIngredientModal"
                        data-bs-tooltip="tooltip"
                        title="Chỉnh sửa"
                        data-id="${item.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
        // Khởi tạo tooltips
        const tooltips = document.querySelectorAll('[data-bs-tooltip="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });
        // Thêm sự kiện cho nút xem chi tiết
        document.querySelectorAll('.btn-xem').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.dataset.id;
                const nguyenLieu = list.find(item => item.id == id);
                document.getElementById('viewIngredientName').innerHTML = nguyenLieu.ten;
                document.getElementById('viewIngredientCategory').innerHTML = nguyenLieu.DanhMucNguyenLieu.tenDanhMuc;
                document.getElementById('viewIngredientStatus').innerHTML = nguyenLieu.trangThai === 1 ? 'Còn hàng' : nguyenLieu.trangThai === 0 ? 'Hết hàng' : 'Sắp hết';
                document.getElementById('viewIngredientUnit').innerHTML = nguyenLieu.donVi;
                document.getElementById('viewIngredientStock').innerHTML = nguyenLieu.tonKho;
                document.getElementById('viewIngredientSupplier').innerHTML = nguyenLieu.NhaCungCap.ten;
                document.getElementById('viewIngredientMinStock').innerHTML = nguyenLieu.toiThieu;
                document.getElementById('viewIngredientStatus').innerHTML =  nguyenLieu.trangThai === 1 ? 'Còn hàng' : nguyenLieu.trangThai === 0 ? 'Hết hàng' : 'Săp hết'
                document.getElementById('viewIngredientImage').src = nguyenLieu.hinhAnh;
            });
        })
        // Thêm sự kiện cho nút sửa nguyên liệu
        document.querySelectorAll('.btn-sua').forEach(button => {
            button.addEventListener('click', function() {
                const id = this.dataset.id;
                const nguyenLieu = list.find(item => item.id == id);
                document.getElementById('editIngredientId').value = nguyenLieu.id;
                document.getElementById('editIngredientName').value = nguyenLieu.ten;
                document.getElementById('editIngredientCategory').value = nguyenLieu.idDanhMuc;
                document.getElementById('editIngredientUnit').value = nguyenLieu.donVi;
                document.getElementById('editIngredientMinStock').value = nguyenLieu.toiThieu;
                document.getElementById('editIngredientSupplier').value = nguyenLieu.idNhaCungCap;
                document.getElementById('editIngredientPreview').src = nguyenLieu.hinhAnh;
            });
        })
    }
}
function removeAccents(str) {
    return str.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}
// Hàm thao tác với combobox filter
function thaoTacVoiCompoboxFilter(listDanhMuc, listNguyenLieu){
    const categoryFilter = document.getElementById('categoryFilter');
    if(listDanhMuc.length > 0){
        listDanhMuc.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.tenDanhMuc;
            categoryFilter.appendChild(option);
        });
    }
    // Xử lý filter danh mục
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            const category = this.value;
            const list = listNguyenLieu.filter(item => item.idDanhMuc == category || category == 'all');
            thaoTacVoiBang(list); 
        });
    }

}
// Các hàm validation
function kiemTraTen(input) {
    const value = input.value.trim();
    const errorElement = input.nextElementSibling;
    
    if (!value) {
        errorElement.textContent = 'Vui lòng nhập tên nguyên liệu';
        return false;
    } else if (value.length < 2) {
        errorElement.textContent = 'Tên nguyên liệu phải có ít nhất 2 ký tự';
        return false;
    } else {
        errorElement.innerHTML = '&nbsp;';
        return true;
    }
}
function kiemTraToiThieu(input) {
    const value = parseInt(input.value.trim());
    const errorElement = input.nextElementSibling;
    
    if (!value) {
        errorElement.textContent = 'Vui lòng nhập số lượng tối thiểu';
        return false;
    } else if (isNaN(value) || value <= 0) {
        errorElement.textContent = 'Số lượng tối thiểu phải là một số dương';
        return false;
    } else {
        errorElement.innerHTML = '&nbsp;';
        return true;
    }
}
function kiemTraHinhAnh(input) {
    const file = input.files[0];
    const errorElement = input.nextElementSibling;
    
    if (!file) {
        errorElement.textContent = 'Vui lòng chọn hình ảnh';
        return false;
    } else {
        errorElement.innerHTML = '&nbsp;';
        return true;
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