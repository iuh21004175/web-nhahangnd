document.addEventListener('DOMContentLoaded', function(){
    document.getElementById('warehouse-tab').addEventListener('click', function(e) {
        xuLyKho();
    })
    document.getElementById('ingredients-tab').addEventListener('click', function(e) {
        xuLyNguyenLieu();
    })
    document.getElementById('categories-tab').addEventListener('click', function(e) {
        xuLyDanhMuc();
    })
    document.getElementById('suppliers-tab').addEventListener('click', function(e) {
        xuLyNhaCungCap();
    })
    document.getElementById('import-tab').addEventListener('click', function(e) {
        xuLyPhieuNhap();
    })
    document.getElementById('export-tab').addEventListener('click', function(e) {
        xuLyPhieuXuat();
    })
    document.getElementById('warehouse-tab').click(); // Mặc định mở tab kho nguyên liệu
})
async function xuLyKho() {
    // Lấy danh sách kho nguyên liệu và danh mục
    let listKho = await getAPIKhoNguyenLieu();
    let listDanhMucNguyenLieu = await getAPIDanhMucNguyenLieu();
    
    // Hiển thị dữ liệu kho
    if (listKho.length > 0) {
        thaoTacVoiBang(listKho);
    } else {
        const tableBody = document.querySelector('#warehouse .table-danhSach tbody');
        tableBody.innerHTML = ''; 
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="8" class="text-center">Không tìm thấy nguyên liệu trong kho</td>`;
        tableBody.appendChild(row);
    }

    // Thiết lập tìm kiếm - sử dụng ID riêng để tránh xung đột
    const searchInput = document.getElementById('warehouseSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const keyword = this.value.trim().toLowerCase();
            const selectedCategory = document.getElementById('warehouseCategoryFilter').value;
            
            // Lọc danh sách nguyên liệu dựa trên từ khóa tìm kiếm và danh mục đã chọn
            const filteredList = listKho.filter(item => {
                const matchKeyword = removeAccents(item.NguyenLieu.ten.toLowerCase()).includes(removeAccents(keyword));
                const matchCategory = selectedCategory === 'all' || item.NguyenLieu.idDanhMuc === selectedCategory;
                return matchKeyword && matchCategory;
            });
            
            thaoTacVoiBang(filteredList);
        });
    }

    // Thiết lập bộ lọc danh mục - sử dụng ID riêng để tránh xung đột
    const categoryFilter = document.getElementById('warehouseCategoryFilter');
    if (categoryFilter && listDanhMucNguyenLieu.length > 0) {
        // Xóa các options cũ (trừ option "Tất cả danh mục")
        while (categoryFilter.options.length > 1) {
            categoryFilter.remove(1);
        }
        
        // Thêm options danh mục từ API
        listDanhMucNguyenLieu.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.tenDanhMuc;
            categoryFilter.appendChild(option);
        });
        
        // Xử lý sự kiện khi thay đổi danh mục
        categoryFilter.addEventListener('change', function() {
            const selectedCategory = this.value;
            const keyword = document.getElementById('warehouseSearchInput').value.trim().toLowerCase();
            
            // Lọc danh sách nguyên liệu dựa trên từ khóa tìm kiếm và danh mục đã chọn
            const filteredList = listKho.filter(item => {
                const matchKeyword = removeAccents(item.NguyenLieu.ten.toLowerCase()).includes(removeAccents(keyword));
                const matchCategory = selectedCategory === 'all' || item.NguyenLieu.idDanhMuc == selectedCategory;
                return matchKeyword && matchCategory;
            });
            
            thaoTacVoiBang(filteredList);
        });
    }

    // Hàm thao tác với bảng
    function thaoTacVoiBang(list) {
        const tableBody = document.querySelector('#warehouse .table-danhSach tbody');
        tableBody.innerHTML = ''; // Xóa nội dung hiện tại của bảng
    
        list.forEach((item, index) => {
            const row = document.createElement('tr');
            const hanSuDung = new Date(item.hanSuDung);
            const ngayHienTai = new Date();
            const khoangCach = Math.floor((hanSuDung - ngayHienTai) / (1000 * 60 * 60 * 24)); // Tính số ngày còn lại
            
            // Tạo badge cho trạng thái
            let statusBadge = `<span class="badge bg-success">Bình thường</span>`;
            if (khoangCach < 5) {
                statusBadge = `<span class="badge bg-warning text-dark">Sắp hết hạn</span>`;
            }
            if (khoangCach < 0) {
                statusBadge = `<span class="badge bg-danger">Hết hạn</span>`;
            }
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.NguyenLieu.ten}</td>
                <td>${item.NguyenLieu.DanhMucNguyenLieu?.tenDanhMuc || 'Không có'}</td>
                <td>${item.NguyenLieu.donVi}</td>
                <td>${formatCurrency(item.gia)}</td>
                <td>${item.soLuong}</td>
                <td>${formatDate(hanSuDung)}</td>
                <td>${statusBadge}</td>
            `;
            tableBody.appendChild(row);
        });
    }

    // Hàm loại bỏ dấu tiếng Việt để tìm kiếm
    function removeAccents(str) {
        return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }
    
    // Hàm lấy dữ liệu kho nguyên liệu từ API
    async function getAPIKhoNguyenLieu() {
        try {
            const response = await fetch('/api/kho-nguyen-lieu');
            const data = await response.json();
            if (data.status) {
                return data.list;
            } else {
                console.error('Error fetching kho nguyen lieu:', data.error || data.message);
                return [];
            }
        } catch (error) {
            console.error('Error fetching kho nguyen lieu:', error);
            return [];
        }
    }
    
    // Hàm lấy danh sách danh mục nguyên liệu từ API
    async function getAPIDanhMucNguyenLieu() {
        try {
            const response = await fetch('/api/danh-muc-nguyen-lieu');
            const data = await response.json();
            if (data.status) {
                return data.list;
            } else {
                console.error('Error fetching danh muc nguyen lieu:', data.error);
                return [];
            }
        } catch (error) {
            console.error('Error fetching danh muc nguyen lieu:', error);
            return [];
        }
    }

    // Hàm định dạng tiền tệ
    function formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }
}
async function xuLyNguyenLieu() {
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
        const tbody = document.querySelector('#ingredients tbody');
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
}
async function xuLyDanhMuc() {
    let listDanhMucNguyenLieu = await getAPIDanhMucNguyenLieu();
    thaoTacVoiBang(listDanhMucNguyenLieu);
    // Xử lý form thêm danh mục
    const addForm = document.getElementById('addCategoryForm');
    addForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        // Xử lý thêm danh mục
        const tenDanhMuc = this.querySelector('#txt-themDanhMuc').value;
        try {
            const response = await fetch('/api/danh-muc-nguyen-lieu', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tenDanhMuc })
            });
            const data = await response.json();
            if(data.status){
                // Thêm thành công
                listDanhMucNguyenLieu.push(data.obj);
                thaoTacVoiBang(listDanhMucNguyenLieu);
                showToastSuccess('Thêm danh mục thành công!');
                // Đóng modal sau khi thêm
                bootstrap.Modal.getInstance(document.getElementById('addCategoryModal')).hide();
                this.reset();
            }
            else{
                showToastDanger(data.error);
                console.error('Lỗi server:', data.error);
            }
        } catch (error) {
            showToastDanger();
            console.error('Error:', error);
        }
    });

    // Xử lý form sửa danh mục
    const editForm = document.getElementById('editCategoryForm');
    editForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        // Xử lý sửa danh mục
        const tenDanhMuc = this.querySelector('#txt-suaDanhMuc').value;
        const id = this.querySelector('#editCategoryId').value;
        try {
            const response = await fetch('/api/danh-muc-nguyen-lieu', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id, tenDanhMuc })
            });
            const data = await response.json();
            if(data.status){
                // Sửa thành công
                const index = listDanhMucNguyenLieu.findIndex(dm => dm.id == id);
                listDanhMucNguyenLieu[index] = data.obj;
                thaoTacVoiBang(listDanhMucNguyenLieu);
                showToastPrimary('Sửa danh mục thành công!');
                // Đóng modal sau khi sửa
                bootstrap.Modal.getInstance(document.getElementById('editCategoryModal')).hide();
            }
            else{
                showToastDanger(data.error);
                console.error('Lỗi server:', data.error);
            }
        }
        catch(error){
            showToastDanger();
            console.error('Error:', error);
        }
    });
    async function getAPIDanhMucNguyenLieu(){
        try{
            const response = await fetch('/api/danh-muc-nguyen-lieu');
            const data = await response.json();
            if(data.status){
                return data.list;
            }
            else{
                showToastDanger(data.error);
                console.error('Lỗi server:', data.error);
                return [];
            }
        }
        catch(error){
            showToastDanger();
            console.error('Error:', error);
        }
    }
    function thaoTacVoiBang(list){
        const tableDanhSach = document.querySelector('#categories .table-danhSach tbody');
        tableDanhSach.innerHTML = '';
        list.forEach((dm, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>${dm.tenDanhMuc}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-sua" 
                        data-bs-toggle="modal" 
                        data-bs-target="#editCategoryModal" 
                        data-bs-tooltip="tooltip"
                        title="Chỉnh sửa"
                        data-id="${dm.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            tableDanhSach.appendChild(tr);
        });
        // Khởi tạo tất cả tooltips
        const tooltips = document.querySelectorAll('[data-bs-tooltip="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });
        document.querySelectorAll('.btn-sua').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                const dm = list.find(dm => dm.id == id);
    
                editCategoryForm.querySelector('#txt-suaDanhMuc').value = dm.tenDanhMuc;
                editCategoryForm.querySelector('#editCategoryId').value = id;
            });
        })
    }
}
async function xuLyNhaCungCap(){
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
        const tableDanhSach = document.querySelector('#suppliers .table-danhSach tbody');
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
}
async function xuLyPhieuNhap(){
    // Thiết lập giá trị mặc định cho các input date
    setupDefaultDates();
    // Biến toàn cục để lưu trữ danh sách nguyên liệu
    let ingredientsList = [];
    let listPhieuNhap = await getAPIPhieuNhap()
    thaoTacVoiBang(listPhieuNhap);
    // Khởi tạo ứng dụng
    init();

    // Hàm khởi tạo
    function init() {
        // Tải danh sách nguyên liệu
        loadIngredients();
        
        // Xử lý nút thêm hàng mới
        const addIngredientRowButton = document.getElementById('addIngredientRow');
        if (addIngredientRowButton) {
            addIngredientRowButton.addEventListener('click', addIngredientRow);
        }
        
        // Khởi tạo sự kiện cho hàng đầu tiên
        document.querySelectorAll('.ingredient-row').forEach(row => {
            attachRowEventListeners(row);
        });
        
        // Xử lý submit form
        const addReceiptForm = document.getElementById('addReceiptForm');
        if (addReceiptForm) {
            addReceiptForm.addEventListener('submit', submitPhieuNhap);
        }
    }
    function setupDefaultDates() {
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        
        if (startDateInput && endDateInput) {
            const today = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 7);
            
            startDateInput.value = sevenDaysAgo.toISOString().split('T')[0];
            endDateInput.value = today.toISOString().split('T')[0];
        }
        
        // Thiết lập ngày hạn sử dụng mặc định cho form phiếu nhập (nếu có)
        const expireDateInputs = document.querySelectorAll('.expire-date-input');
        if (expireDateInputs.length > 0) {
            const nextMonth = new Date();
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            
            const formattedDate = nextMonth.toISOString().split('T')[0];
            expireDateInputs.forEach(input => {
                input.value = formattedDate;
            });
        }
    }
    // Thêm hàm này vào file phieu-nhap.js
    async function submitPhieuNhap(e) {
        e.preventDefault();
        
        try {
            showLoading(true);
            
            // Lấy thông tin chung của phiếu nhập
            const phieuNhap = {
                thoiGianNhap: new Date().toISOString(),
                tongTien: parseInt(document.getElementById('createTotalAmount')?.textContent.replace(/[^\d]/g, '')) || 0,
                chiTiet: [] // Chi tiết các nguyên liệu
            };
            
            // Lặp qua tất cả các hàng để lấy thông tin chi tiết
            const rows = document.querySelectorAll('.ingredient-row');
            let hasError = false;
            
            rows.forEach((row, index) => {
                const ingredientId = row.querySelector('.ingredient-value')?.value;
                const ingredientName = row.querySelector('.ingredient-search')?.value;
                const quantity = parseFloat(row.querySelector('.quantity-input')?.value) || 0;
                const price = parseFloat(row.querySelector('.price-input')?.value) || 0;
                const expireDate = row.querySelector('.expire-date-input')?.value;
                const note = row.querySelector('.note-input')?.value || '';
                
                // Kiểm tra dữ liệu hợp lệ
                if (!ingredientId || !ingredientName) {
                    alert(`Vui lòng chọn nguyên liệu ở hàng ${index + 1}`);
                    hasError = true;
                    return;
                }
                
                if (!quantity || quantity <= 0) {
                    alert(`Vui lòng nhập số lượng hợp lệ ở hàng ${index + 1}`);
                    hasError = true;
                    return;
                }
                
                if (!price || price <= 0) {
                    alert(`Vui lòng nhập đơn giá hợp lệ ở hàng ${index + 1}`);
                    hasError = true;
                    return;
                }
                
                if (!expireDate) {
                    alert(`Vui lòng nhập hạn sử dụng ở hàng ${index + 1}`);
                    hasError = true;
                    return;
                }
                
                // Thêm chi tiết vào phiếu nhập
                phieuNhap.chiTiet.push({
                    idNguyenLieu: ingredientId,
                    soLuong: quantity,
                    gia: price,
                    hanSuDung: expireDate,
                    ghiChu: note
                });
            });
            
            // Nếu có lỗi, dừng việc gửi API
            if (hasError) {
                showLoading(false);
                return;
            }
            
            // Gọi API để tạo phiếu nhập
            const response = await fetch('/api/phieu-nhap', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(phieuNhap)
            });
            
            const data = await response.json();
            if (data.status){
                // Reset form hoặc đóng modal
                showToastSuccess("Tạo phiếu nhập thành công!")
                const modal = bootstrap.Modal.getInstance(document.getElementById('addReceiptModal'));
                if (modal) {
                    modal.hide();
                }
                resetPhieuNhapForm();
                listPhieuNhap.unshift(data.obj); // Thêm phiếu nhập mới vào đầu danh sách
                thaoTacVoiBang(listPhieuNhap); // Cập nhật bảng danh sách phiếu nhập
            }
            else {
                showToastDanger(data.error)
                console.error('Lỗi khi tạo phiếu nhập:', data.error);
            }
            
            
        } catch (error) {
            showToastDanger()
            console.error('Lỗi khi tạo phiếu nhập:', error);
        } finally {
            showLoading(false);
        }
    }
    // Thêm hàm reset phiếu nhập
    function resetPhieuNhapForm() {
        // Giữ lại dòng đầu tiên và xóa các dòng khác
        const tbody = document.querySelector('#ingredientTable tbody');
        const allRows = tbody.querySelectorAll('.ingredient-row');
        
        // Nếu có nhiều hơn 1 dòng, giữ lại dòng đầu và xóa các dòng còn lại
        if (allRows.length > 1) {
            const firstRow = allRows[0];
            
            // Xóa tất cả các dòng
            tbody.innerHTML = '';
            
            // Thêm lại dòng đầu tiên
            tbody.appendChild(firstRow);
        }
        
        // Reset giá trị trong dòng đầu tiên
        const firstRow = tbody.querySelector('.ingredient-row');
        if (firstRow) {
            // Reset các input
            firstRow.querySelectorAll('input').forEach(input => {
                input.value = '';
                
                // Đảm bảo unit-input hiển thị và là readonly
                if (input.classList.contains('unit-input')) {
                    input.style.display = '';
                    input.readOnly = true;
                }
                
                // Reset initialized attribute cho input tìm kiếm
                if (input.classList.contains('ingredient-search')) {
                    input.removeAttribute('data-initialized');
                }
            });
            
            // Reset thành tiền
            const amountCell = firstRow.querySelector('.amount-cell');
            if (amountCell) amountCell.textContent = '0đ';
            
            // Reset date picker về ngày hiện tại nếu có
            const expireDateInput = firstRow.querySelector('.expire-date-input');
            if (expireDateInput) {
                const today = new Date();
                const nextMonth = new Date(today);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                
                const year = nextMonth.getFullYear();
                const month = String(nextMonth.getMonth() + 1).padStart(2, '0');
                const day = String(nextMonth.getDate()).padStart(2, '0');
                
                expireDateInput.value = `${year}-${month}-${day}`;
            }
            
            // Reset select boxes nếu có
            firstRow.querySelectorAll('select').forEach(select => {
                select.selectedIndex = 0;
            });
            
            // Reset STT
            const sttCell = firstRow.querySelector('td:first-child');
            if (sttCell) sttCell.textContent = '1';
        }
        
        // Reset tổng tiền
        const totalElement = document.getElementById('createTotalAmount');
        if (totalElement) {
            totalElement.textContent = formatCurrency(0);
        }
        
        // Khởi tạo lại dropdown
        initializeCustomDropdowns();
    }
        // Hàm loại bỏ dấu tiếng Việt để tìm kiếm
    function removeDiacritics(str) {
        return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }
    
    // Hàm tải danh sách nguyên liệu từ API
    async function loadIngredients() {
        try {
            showLoading(true);
            const response = await fetch('/api/nguyen-lieu');
            if (!response.ok) throw new Error('Không thể tải danh sách nguyên liệu');
            
            // Lưu danh sách nguyên liệu vào biến toàn cục
            const data = await response.json();
            ingredientsList = data.list;
            
            // Khởi tạo dropdown
            initializeCustomDropdowns();
            
            showLoading(false);
        } catch (error) {
            console.error("Lỗi khi tải danh sách nguyên liệu:", error);
            alert("Không thể tải danh sách nguyên liệu. Vui lòng thử lại sau.");
            showLoading(false);
        }
    }
    
    // Khởi tạo dropdown tùy chỉnh
    function initializeCustomDropdowns() {
        document.querySelectorAll('.ingredient-search').forEach(input => {
            if (!input.dataset.initialized) {
                setupIngredientSearch(input);
                input.dataset.initialized = "true";
            }
        });
    }
    
    // Thiết lập tìm kiếm nguyên liệu
    function setupIngredientSearch(input) {
        const container = input.closest('.custom-dropdown-container');
        const dropdown = container.querySelector('.ingredient-dropdown');
        const resultsContainer = dropdown.querySelector('.dropdown-search-results');
        
        // Xử lý hiển thị dropdown khi focus vào input
        input.addEventListener('focus', function() {
            closeAllDropdowns();
            
            // Tính toán và đặt vị trí cho dropdown
            positionDropdownAbsolute(dropdown, input);
            
            // Hiển thị dropdown
            dropdown.classList.add('active');
            filterIngredients(input.value, resultsContainer);
        });
        
        // Xử lý tìm kiếm khi gõ
        input.addEventListener('input', function() {
            filterIngredients(input.value, resultsContainer);
        });
        
        // Xử lý click bên ngoài để đóng dropdown
        document.addEventListener('click', function(e) {
            if (!container.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
        
        // Xử lý click vào dropdown arrow
        const arrow = container.querySelector('.dropdown-arrow');
        arrow.addEventListener('click', function() {
            input.focus();
        });
    }
    // Hàm mới để tính toán vị trí chính xác cho dropdown
    function positionDropdownAbsolute(dropdown, input) {
        // Lấy vị trí của input trên trang
        const rect = input.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
        
        // Đặt vị trí top và left cho dropdown
        dropdown.style.top = (rect.bottom + scrollTop) + 'px';
        dropdown.style.left = (rect.left + scrollLeft) + 'px';
        dropdown.style.width = Math.max(rect.width, 250) + 'px';
        
        // Kiểm tra nếu dropdown sẽ bị tràn ra khỏi màn hình
        const dropdownHeight = 250; // Chiều cao ước lượng
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        
        // Nếu tràn ra dưới màn hình, hiển thị dropdown lên trên
        if (rect.bottom + dropdownHeight > windowHeight) {
            dropdown.style.top = (rect.top + scrollTop - dropdownHeight) + 'px';
        }
        
        // Nếu tràn ra phải, dịch sang trái
        if (rect.left + dropdown.offsetWidth > windowWidth) {
            dropdown.style.left = (windowWidth - dropdown.offsetWidth - 10 + scrollLeft) + 'px';
        }
        
        // Đặt max-height để tránh quá dài
        dropdown.style.maxHeight = '250px';
        dropdown.style.overflowY = 'auto';
    }

    // Cập nhật khi cuộn trang
    window.addEventListener('scroll', function() {
        const activeDropdown = document.querySelector('.ingredient-dropdown.active');
        if (activeDropdown) {
            const input = activeDropdown.closest('.custom-dropdown-container')?.querySelector('.ingredient-search');
            if (input) {
                positionDropdownAbsolute(activeDropdown, input);
            }
        }
    }, true);

    // Cập nhật khi thay đổi kích thước cửa sổ
    window.addEventListener('resize', function() {
        const activeDropdown = document.querySelector('.ingredient-dropdown.active');
        if (activeDropdown) {
            const input = activeDropdown.closest('.custom-dropdown-container')?.querySelector('.ingredient-search');
            if (input) {
                positionDropdownAbsolute(activeDropdown, input);
            }
        }
    });

    // Cập nhật khi cuộn trong table-responsive
    document.querySelectorAll('.table-responsive').forEach(table => {
        table.addEventListener('scroll', function() {
            const activeDropdown = document.querySelector('.ingredient-dropdown.active');
            if (activeDropdown) {
                const input = activeDropdown.closest('.custom-dropdown-container')?.querySelector('.ingredient-search');
                if (input) {
                    positionDropdownAbsolute(activeDropdown, input);
                }
            }
        });
    });
    // Đóng tất cả dropdown đang mở
    function closeAllDropdowns() {
        document.querySelectorAll('.ingredient-dropdown.active').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
    
    // Lọc danh sách nguyên liệu theo từ khóa tìm kiếm
    function filterIngredients(keyword, resultsContainer) {
        // Xóa nội dung hiện tại
        resultsContainer.innerHTML = '';
        
        // Nếu không có từ khóa, hiển thị tất cả
        const normalizedKeyword = removeDiacritics(keyword.toLowerCase());
        
        // Lọc danh sách nguyên liệu
        const filteredIngredients = normalizedKeyword.length > 0 
            ? ingredientsList.filter(ingredient => {
                const normalizedName = removeDiacritics(ingredient.ten.toLowerCase());
                return normalizedName.includes(normalizedKeyword);
              })
            : ingredientsList;
        
        // Nếu không có kết quả
        if (filteredIngredients.length === 0) {
            resultsContainer.innerHTML = '<div class="dropdown-no-results">Không tìm thấy nguyên liệu</div>';
            return;
        }
        
        // Hiển thị kết quả
        filteredIngredients.forEach(ingredient => {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.dataset.id = ingredient.id;
            item.dataset.name = ingredient.ten;
            item.dataset.unit = ingredient.donVi || '';
            
            // Highlight từ khóa tìm kiếm
            const name = ingredient.ten;
            if (normalizedKeyword.length > 0) {
                const normalizedName = removeDiacritics(name.toLowerCase());
                const start = normalizedName.indexOf(normalizedKeyword);
                if (start !== -1) {
                    const end = start + normalizedKeyword.length;
                    item.innerHTML = name.substring(0, start) + 
                        '<span class="highlight">' + name.substring(start, start + normalizedKeyword.length) + '</span>' + 
                        name.substring(end);
                } else {
                    item.textContent = name;
                }
            } else {
                item.textContent = name;
            }
            
            // Xử lý khi chọn một nguyên liệu
            item.addEventListener('click', function() {
                const input = this.closest('.custom-dropdown-container').querySelector('.ingredient-search');
                const hiddenInput = this.closest('.custom-dropdown-container').querySelector('.ingredient-value');
                const dropdown = this.closest('.ingredient-dropdown');
                
                // Cập nhật giá trị
                input.value = this.dataset.name;
                hiddenInput.value = this.dataset.id;
                dropdown.classList.remove('active');
                
                // Cập nhật đơn vị - đảm bảo đơn vị luôn được hiển thị
                const row = input.closest('.ingredient-row');
                const unitInput = row.querySelector('.unit-input');
                
                if (unitInput && this.dataset.unit) {
                    // Đảm bảo input đơn vị hiển thị và được cập nhật
                    unitInput.style.display = '';
                    unitInput.value = this.dataset.unit;
                }
            });
            
            resultsContainer.appendChild(item);
        });
    }
    
    // Thêm hàng nguyên liệu mới
    function addIngredientRow() {
        const tbody = document.querySelector('#ingredientTable tbody');
        if (!tbody) {
            console.error('Không tìm thấy bảng nguyên liệu');
            return;
        }
        
        const firstRow = tbody.querySelector('.ingredient-row');
        if (!firstRow) {
            console.error('Không tìm thấy dòng nguyên liệu mẫu');
            return;
        }
        
        const newRow = firstRow.cloneNode(true);
        
        // Reset các giá trị trong dòng mới
        newRow.querySelectorAll('input').forEach(input => {
            // Reset giá trị nhưng không ẩn input đơn vị
            input.value = '';
            
            // Chỉ ẩn các input khác nếu cần, KHÔNG ẩn unit-input
            if (input.classList.contains('unit-input')) {
                // Đảm bảo input đơn vị hiển thị và là readonly
                input.style.display = ''; // Xóa style display:none nếu có
                input.readOnly = true;
            }
            
            // Reset initialized attribute cho input tìm kiếm
            if (input.classList.contains('ingredient-search')) {
                input.removeAttribute('data-initialized');
            }
        });
        // Reset thành tiền
        const amountCell = newRow.querySelector('.amount-cell');
        if (amountCell) amountCell.textContent = '0đ';
        // Reset ghi chú
        const noteInput = newRow.querySelector('.note-input');
        if (noteInput) noteInput.value = '';
        // Reset select boxes nếu có
        newRow.querySelectorAll('select').forEach(select => {
            select.selectedIndex = 0;
        });
        
        // Cập nhật STT
        const rowCount = tbody.children.length + 1;
        const sttCell = newRow.querySelector('td:first-child');
        if (sttCell) {
            sttCell.textContent = rowCount;
        }
        
        // Đảm bảo các phần tử có đúng style
        const unitInput = newRow.querySelector('.unit-input');
        if (unitInput) {
            // Đảm bảo input đơn vị hiển thị đúng
            unitInput.style.display = '';
            unitInput.style.width = '30px';
            unitInput.readOnly = true;
        }
        
        // Thêm dòng mới vào bảng
        tbody.appendChild(newRow);
        
        // Khởi tạo lại dropdown
        initializeCustomDropdowns();
        
        // Gắn lại các event listeners
        attachRowEventListeners(newRow);
        
        // Tính lại tổng tiền
        calculateTotal();
    }
    
    // Gắn sự kiện cho các phần tử trong hàng
    function attachRowEventListeners(row) {
        const removeButton = row.querySelector('.remove-row');
        if (removeButton) {
            removeButton.addEventListener('click', function() {
                if (document.querySelectorAll('.ingredient-row').length > 1) {
                    row.remove();
                    updateRowNumbers();
                    calculateTotal();
                }
            });
        }
        
        const quantityInput = row.querySelector('.quantity-input');
        const priceInput = row.querySelector('.price-input');
        
        if (quantityInput) quantityInput.addEventListener('input', () => calculateAmount(row));
        if (priceInput) priceInput.addEventListener('input', () => calculateAmount(row));
        
        // Đảm bảo input đơn vị hiển thị (nếu có unit-select thì xử lý khác)
        const unitInput = row.querySelector('.unit-input');
        if (unitInput) {
            unitInput.style.display = ''; // Đảm bảo hiển thị
        }
    }
    
    // Cập nhật số thứ tự các hàng
    function updateRowNumbers() {
        document.querySelectorAll('.ingredient-row').forEach((row, index) => {
            row.querySelector('td:first-child').textContent = index + 1;
        });
    }
    
    // Tính toán thành tiền cho một hàng
    function calculateAmount(row) {
        const quantity = parseFloat(row.querySelector('.quantity-input').value) || 0;
        const price = parseFloat(row.querySelector('.price-input').value) || 0;
        const amount = quantity * price;
        
        row.querySelector('.amount-cell').textContent = formatCurrency(amount);
        calculateTotal();
    }
    
    // Tính tổng tiền
    function calculateTotal() {
        let total = 0;
        document.querySelectorAll('.ingredient-row').forEach(row => {
            const amountText = row.querySelector('.amount-cell').textContent;
            const amount = parseFloat(amountText.replace(/[^\d]/g, '')) || 0;
            total += amount;
        });
        
        const totalElement = document.getElementById('createTotalAmount');
        if (totalElement) {
            totalElement.textContent = formatCurrency(total);
        }
    }
    
    
    // Hiển thị loading indicator
    function showLoading(show) {
        if (show) {
            if (!document.getElementById('loading-indicator')) {
                const loadingIndicator = document.createElement('div');
                loadingIndicator.id = 'loading-indicator';
                loadingIndicator.style.position = 'fixed';
                loadingIndicator.style.top = '0';
                loadingIndicator.style.left = '0';
                loadingIndicator.style.right = '0';
                loadingIndicator.style.bottom = '0';
                loadingIndicator.style.background = 'rgba(255,255,255,0.7)';
                loadingIndicator.style.zIndex = '9999';
                loadingIndicator.style.display = 'flex';
                loadingIndicator.style.justifyContent = 'center';
                loadingIndicator.style.alignItems = 'center';
                loadingIndicator.innerHTML = `
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                `;
                document.body.appendChild(loadingIndicator);
            }
        } else {
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) loadingIndicator.remove();
        }
    }
    document.querySelector('.btn-timKiem').addEventListener('click', async function(e) {
        e.preventDefault();
        timKiemPhieuNhap();
    })
    document.querySelector('.btn-lamMoi').addEventListener('click', async function(e) {
        e.preventDefault();
        setupDefaultDates();
        document.getElementById('minAmount').value = '';
        document.getElementById('maxAmount').value = '';
        listPhieuNhap = await getAPIPhieuNhap()
        thaoTacVoiBang(listPhieuNhap);
    })
    // Format số tiền
    function formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }
    // Hàm lấy dữ liệu danh sách phiếu nhập từ API
    async function getAPIPhieuNhap() {
        try {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const response = await fetch(`/api/phieu-nhap?startDate=${startDate}&endDate=${endDate}`);
            const data = await response.json();
            if(data.status) {
                return data.list
            }
            else{
                showToastDanger(data.error)
                console.error('Lỗi khi tải danh sách phiếu nhập:', data.error);
                return [];
            }
        } catch (error) {
            showToastDanger()
            console.error('Lỗi khi tải danh sách phiếu nhập:', error);
            return [];
        }
    }
    function formatDate (date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    };
    // Hàm render danh sách phiếu nhập và sử lý sự kiện phiếu nhập
    function thaoTacVoiBang(list){
        const tableBody = document.querySelector('#import .table-danhSach tbody');
        tableBody.innerHTML = ''; // Xóa nội dung hiện tại
        // Format ngày dạng YYYY-MM-DD cho input type="date"
        if(list.length > 0) {
            list.forEach((phieuNhap, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${formatDate(new Date(phieuNhap.thoiGianNhap))}</td>
                    <td>${formatCurrency(phieuNhap.tongTien)}</td>
                    <td>
                        <button class="btn btn-sm btn-info text-white btn-xem" 
                            data-bs-toggle="modal"
                            data-bs-target="#viewReceiptModal"
                            data-bs-tooltip="tooltip"
                            data-id="${phieuNhap.id}"
                            title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            })
        }
        else{
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="4" class="text-center">Không tìm thấy phiếu nhập kho nào</td>
            `;
            tableBody.appendChild(row);
        }
        // Khởi tạo tooltips
        const tooltips = document.querySelectorAll('[data-bs-tooltip="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });
        document.querySelectorAll('.btn-xem').forEach(button => {
            button.addEventListener('click', async function() {
                const id = this.dataset.id;
                const phieuNhap = list.find(item => item.id == id);
                document.getElementById('receiptDate').innerHTML = formatDate(new Date(phieuNhap.thoiGianNhap));
                document.getElementById('receiptDateTime').innerHTML = formatFullDateTime(new Date(phieuNhap.thoiGianNhap));
                document.getElementById('viewTotalAmount').innerHTML = formatCurrency(phieuNhap.tongTien);
                const listNguyenLieu = await getAPINguyenLieuByIdPhieu(id);
                renderNguyenLieuPhieuNhap(listNguyenLieu);
            });
        });
    }
    // Hàm render danh sách nguyên liệu của phiếu nhập
    function renderNguyenLieuPhieuNhap(list) {
        const tableBody = document.querySelector('#receiptDetails');
        tableBody.innerHTML = ''; // Xóa nội dung hiện tại
        list.forEach((nguyenLieu, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${nguyenLieu.NguyenLieu.ten}</td>
                <td>${nguyenLieu.NguyenLieu.donVi}</td>
                <td>${nguyenLieu.soLuong}</td>
                <td>${formatCurrency(nguyenLieu.gia)}</td>
                <td>${formatCurrency(parseInt(nguyenLieu.soLuong) * parseInt(nguyenLieu.gia))}</td>
                <td>${formatDate(new Date(nguyenLieu.hanSuDung))}</td>
                <td>${nguyenLieu.ghiChu || 'N/A'}</td>
            `;
            tableBody.appendChild(row);
        })
    }
    // Hàm lấy API danh sách nguyên liệu của phiếu nhập
    async function getAPINguyenLieuByIdPhieu(id) {
        try {
            const response = await fetch(`/api/chi-tiet-phieu-nhap?id=${id}`);
            const data = await response.json();
            if(data.status) {
                return data.list
            }
            else{
                showToastDanger(data.error)
                console.error('Lỗi khi tải danh sách nguyên liệu:', data.error);
                return [];
            }
        } catch (error) {
            showToastDanger()
            console.error('Lỗi khi tải danh sách nguyên liệu:', error);
            return [];
        }
    }
    // Hàm tìm kiếm phiếu nhập
    async function timKiemPhieuNhap() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const minAmount = document.getElementById('minAmount').value;
        const maxAmount = document.getElementById('maxAmount').value;

        try{
            const res = await fetch(`/api/tim-kiem-phieu-nhap?startDate=${startDate}&endDate=${endDate}&minAmount=${minAmount}&maxAmount=${maxAmount}`);
            const data = await res.json();
            if(data.status) {
                thaoTacVoiBang(data.list);
            }
            else{
                showToastDanger(data.error)
                console.error('Lỗi khi tìm kiếm phiếu nhập:', data.error);
            }
        }
        catch (error) {
            showToastDanger()
            console.error('Lỗi khi tìm kiếm phiếu nhập:', error);
        }
    }
    // Hàm định dạng ngày tháng đầy đủ (ngày/tháng/năm giờ:phút:giây)
    function formatFullDateTime(date) {
        if (!date || isNaN(date)) return 'N/A';
        
        // Lấy thông tin ngày tháng
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        // Lấy thông tin giờ phút giây
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        // Trả về chuỗi định dạng đầy đủ
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }
}
async function xuLyPhieuXuat() {
    // Thiết lập giá trị mặc định cho ngày bắt đầu và ngày kết thúc
    setDefaultDate();
    
    // Biến lưu trữ danh sách nguyên liệu và người nhận
    let inventoryList = [];
    let receiverList = [];
    
    // Lấy danh sách phiếu xuất từ API
    let listPhieuXuat = await getAPIPhieuXuat();
    thaoTacVoiBang(listPhieuXuat);
    
    // Khởi tạo ứng dụng
    init();
    
    // Hàm khởi tạo để thiết lập các sự kiện và đổ dữ liệu
    async function init() {
        // Tải danh sách nguyên liệu từ kho
        inventoryList = await getAPIKhoNguyenLieu();
        
        // Tải danh sách người nhận (nếu cần)
        receiverList = await getAPIReceivers();
        
        // Thiết lập sự kiện cho nút thêm hàng mới
        const addIngredientRowButton = document.getElementById('addExportIngredientRow');
        if (addIngredientRowButton) {
            addIngredientRowButton.addEventListener('click', addExportIngredientRow);
        }
        
        // Khởi tạo sự kiện cho hàng đầu tiên
        document.querySelectorAll('.export-ingredient-row').forEach(row => {
            attachExportRowEventListeners(row);
        });
        
        // Thiết lập sự kiện submit form
        const addExportForm = document.getElementById('addExportForm');
        if (addExportForm) {
            addExportForm.addEventListener('submit', submitPhieuXuat);
        }
        
        // Khởi tạo dropdown tùy chỉnh
        initializeExportDropdowns();
    }
    
    // Hàm lấy dữ liệu từ kho nguyên liệu
    async function getAPIKhoNguyenLieu() {
        try {
            const response = await fetch('/api/kho-nguyen-lieu');
            const data = await response.json();
            if (data.status) {
                return data.list;
            } else {
                showToastDanger(data.error || 'Không thể tải danh sách nguyên liệu');
                return [];
            }
        } catch (error) {
            showToastDanger('Lỗi khi tải danh sách nguyên liệu');
            console.error('Error fetching inventory:', error);
            return [];
        }
    }
    
    // Hàm lấy danh sách người nhận
    async function getAPIReceivers() {
        try {
            const response = await fetch('/api/nhan-vien');
            const data = await response.json();
            if (data.status) {
                return data.list;
            } else {
                return [];
            }
        } catch (error) {
            console.error('Error fetching receivers:', error);
            return [];
        }
    }
    
    // Khởi tạo dropdown tùy chỉnh
    function initializeExportDropdowns() {
        document.querySelectorAll('.export-inventory-search').forEach(input => {
            if (!input.dataset.initialized) {
                setupExportIngredientSearch(input);
                input.dataset.initialized = "true";
            }
        });
        
        // Thiết lập dropdown cho người nhận (nếu cần)
        const receiverInput = document.getElementById('exportReceiverName');
        if (receiverInput && !receiverInput.dataset.initialized) {
            setupReceiverSearch(receiverInput);
            receiverInput.dataset.initialized = "true";
        }
    }
    
    // Thiết lập tìm kiếm nguyên liệu trong phiếu xuất
    function setupExportIngredientSearch(input) {
        const container = input.closest('.custom-dropdown-container');
        const dropdown = container.querySelector('.export-inventory-dropdown');
        
        // Kiểm tra và thêm phần tử dropdown-search-results nếu chưa có
        let resultsContainer = dropdown.querySelector('.dropdown-search-results');
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.className = 'dropdown-search-results';
            dropdown.appendChild(resultsContainer);
        }
        
        // Xử lý hiển thị dropdown khi focus vào input
        input.addEventListener('focus', function() {
            closeAllExportDropdowns();
            
            // Tính toán và đặt vị trí cho dropdown
            positionExportDropdown(dropdown, input);
            
            // Hiển thị dropdown
            dropdown.classList.add('active');
            filterExportIngredients(input.value, resultsContainer);
        });
        
        // Xử lý tìm kiếm khi gõ
        input.addEventListener('input', function() {
            filterExportIngredients(input.value, resultsContainer);
        });
        
        // Xử lý click bên ngoài để đóng dropdown
        document.addEventListener('click', function(e) {
            if (!container.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
        
        // Xử lý click vào dropdown arrow
        const arrow = container.querySelector('.dropdown-arrow');
        if (arrow) {
            arrow.addEventListener('click', function() {
                input.focus();
            });
        }
    }
    
    // Lọc danh sách nguyên liệu theo từ khóa tìm kiếm
    function filterExportIngredients(keyword, resultsContainer) {
        // Kiểm tra nếu resultsContainer không tồn tại, tạo mới
        if (!resultsContainer) {
            console.error('Result container not found');
            return;
        }
        
        // Xóa nội dung hiện tại
        resultsContainer.innerHTML = '';
        
        // Log để debug
        console.log("Filtering with keyword:", keyword);
        console.log("Available inventory:", inventoryList);
        
        // Chuẩn hóa từ khóa tìm kiếm
        const normalizedKeyword = removeDiacritics(keyword.toLowerCase());
        
        // Lọc danh sách nguyên liệu
        const filteredIngredients = normalizedKeyword.length > 0 
            ? inventoryList.filter(item => {
                const normalizedName = removeDiacritics(item.NguyenLieu.ten.toLowerCase());
                return normalizedName.includes(normalizedKeyword);
              })
            : inventoryList;
        
        // Log để debug
        console.log("Filtered results:", filteredIngredients);
        
        // Nếu không có kết quả
        if (filteredIngredients.length === 0) {
            resultsContainer.innerHTML = '<div class="dropdown-no-results">Không tìm thấy nguyên liệu</div>';
            return;
        }
        
        // Hiển thị kết quả
        filteredIngredients.forEach(item => {
            const ingredient = item.NguyenLieu;
            const inventoryItem = document.createElement('div');
            inventoryItem.className = 'dropdown-item';
            inventoryItem.dataset.id = item.id;
            inventoryItem.dataset.name = ingredient.ten;
            inventoryItem.dataset.unit = ingredient.donVi || '';
            inventoryItem.dataset.price = item.gia || 0;
            
            // Highlight từ khóa tìm kiếm
            const name = ingredient.ten;
            if (normalizedKeyword.length > 0) {
                const normalizedName = removeDiacritics(name.toLowerCase());
                const start = normalizedName.indexOf(normalizedKeyword);
                if (start !== -1) {
                    const end = start + normalizedKeyword.length;
                    inventoryItem.innerHTML = name.substring(0, start) + 
                        '<span class="highlight">' + name.substring(start, start + normalizedKeyword.length) + '</span>' + 
                        name.substring(end);
                } else {
                    inventoryItem.textContent = name;
                }
            } else {
                inventoryItem.textContent = name;
            }
            
            // Thêm thông tin tồn kho
            const stockInfo = document.createElement('small');
            stockInfo.className = 'text-muted ms-2';
            stockInfo.textContent = `(Tồn: ${item.soLuong} ${ingredient.donVi})`;
            inventoryItem.appendChild(stockInfo);
            
            // Xử lý khi chọn một nguyên liệu
            inventoryItem.addEventListener('click', function() {
                const input = this.closest('.custom-dropdown-container').querySelector('.export-inventory-search');
                const hiddenInput = this.closest('.custom-dropdown-container').querySelector('.export-inventory-id');
                const dropdown = this.closest('.export-inventory-dropdown');
                
                // Cập nhật giá trị
                input.value = this.dataset.name;
                hiddenInput.value = this.dataset.id;
                dropdown.classList.remove('active');
                
                // Cập nhật đơn vị
                const row = input.closest('.export-ingredient-row');
                const unitInput = row.querySelector('.export-unit-input');
                const priceInput = row.querySelector('.export-price-input');
                
                if (unitInput && this.dataset.unit) {
                    unitInput.value = this.dataset.unit;
                }
                
                if (priceInput && this.dataset.price) {
                    priceInput.value = this.dataset.price;
                }
                
                // Tính lại thành tiền
                calculateExportAmount(row);
            });
            
            resultsContainer.appendChild(inventoryItem);
        });
    }
    
    // Loại bỏ dấu tiếng Việt để tìm kiếm
    function removeDiacritics(str) {
        return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }
    
    // Tính toán vị trí cho dropdown
    function positionExportDropdown(dropdown, input) {
        // Lấy vị trí của input
        const rect = input.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
        
        // Đặt vị trí và kích thước cho dropdown
        dropdown.style.position = 'absolute';
        dropdown.style.top = (rect.bottom + scrollTop) + 'px';
        dropdown.style.left = (rect.left + scrollLeft) + 'px';
        dropdown.style.width = Math.max(rect.width, 250) + 'px';
        dropdown.style.zIndex = '1050';
        
        // Kiểm tra nếu dropdown sẽ bị tràn ra khỏi màn hình
        const dropdownHeight = 250; // Chiều cao ước lượng
        const windowHeight = window.innerHeight;
        
        if (rect.bottom + dropdownHeight > windowHeight) {
            dropdown.style.top = (rect.top + scrollTop - dropdownHeight) + 'px';
        }
    }
    
    // Đóng tất cả dropdown đang mở
    function closeAllExportDropdowns() {
        document.querySelectorAll('.export-inventory-dropdown.active').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
    
    // Thiết lập tìm kiếm người nhận
    function setupReceiverSearch(input) {
        // Xóa dropdown cũ nếu đã tồn tại
        const container = input.closest('.export-receiver-container');
        container.querySelectorAll('.receiver-dropdown').forEach(el => el.remove());
        
        // Tạo dropdown mới với style rõ ràng
        const dropdownMenu = document.createElement('div');
        dropdownMenu.className = 'dropdown-menu receiver-dropdown';
        dropdownMenu.style.width = '100%';
        dropdownMenu.style.maxHeight = '250px';
        dropdownMenu.style.overflow = 'auto';
        dropdownMenu.style.position = 'absolute';
        dropdownMenu.style.zIndex = '9999';
        dropdownMenu.style.display = 'none';
        
        // Phải thêm vào container để có context đúng
        container.appendChild(dropdownMenu);

        // Đảm bảo hidden input tồn tại
        if (!document.getElementById('exportReceiverId')) {
            const hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.id = 'exportReceiverId';
            hiddenInput.name = 'exportReceiverId';
            container.appendChild(hiddenInput);
        }

        // Xử lý hiển thị dropdown khi focus vào input
        input.addEventListener('focus', function() {
            // Đóng tất cả dropdown khác
            document.querySelectorAll('.receiver-dropdown').forEach(menu => {
                if (menu !== dropdownMenu) {
                    menu.style.display = 'none';
                }
            });

            // Đặt vị trí cho dropdown - đây là phần quan trọng cần sửa
            const rect = input.getBoundingClientRect();
            
            // Đặt vị trí theo container thay vì toàn trang
            dropdownMenu.style.top = input.offsetHeight + 'px';
            dropdownMenu.style.left = '0';
            dropdownMenu.style.width = '100%';
            
            // Hiển thị dropdown
            dropdownMenu.style.display = 'block';
            
            // Lọc và hiển thị danh sách người nhận
            filterReceivers(input.value);
        });

        // Xử lý tìm kiếm khi gõ
        input.addEventListener('input', function() {
            if (dropdownMenu.style.display !== 'block') {
                dropdownMenu.style.display = 'block';
            }
            filterReceivers(this.value);
        });

        // Đóng dropdown khi click ra ngoài
        document.addEventListener('click', function(e) {
            if (!container.contains(e.target)) {
                dropdownMenu.style.display = 'none';
            }
        });

        // Xử lý khi nhấn vào dropdown arrow
        const arrow = container.querySelector('.dropdown-arrow');
        if (arrow) {
            arrow.addEventListener('click', function() {
                input.focus();
            });
        }

        // Hàm lọc và hiển thị danh sách người nhận
        function filterReceivers(keyword) {
            dropdownMenu.innerHTML = '';
            console.log("Danh sách người nhận:", receiverList);

            // Chuẩn hóa từ khóa tìm kiếm
            const normalizedKeyword = removeDiacritics(keyword.toLowerCase());

            // Lọc danh sách người nhận - sử dụng trường ten
            const filteredReceivers = normalizedKeyword.length > 0
                ? receiverList.filter(receiver => {
                    const normalizedName = removeDiacritics(receiver.ten.toLowerCase());
                    return normalizedName.includes(normalizedKeyword);
                  })
                : receiverList;

            // Nếu không có kết quả
            if (filteredReceivers.length === 0) {
                const noResults = document.createElement('div');
                noResults.className = 'dropdown-item text-muted';
                noResults.textContent = 'Không tìm thấy người nhận';
                dropdownMenu.appendChild(noResults);
            } else {
                // Hiển thị kết quả
                filteredReceivers.forEach(receiver => {
                    const item = document.createElement('div');
                    item.className = 'dropdown-item';
                    item.dataset.id = receiver.id;
                    item.dataset.name = receiver.ten;

                    // Highlight từ khóa tìm kiếm
                    const name = receiver.ten;
                    if (normalizedKeyword.length > 0) {
                        const normalizedName = removeDiacritics(name.toLowerCase());
                        const start = normalizedName.indexOf(normalizedKeyword);
                        if (start !== -1) {
                            const end = start + normalizedKeyword.length;
                            item.innerHTML = name.substring(0, start) +
                                '<span class="highlight">' + name.substring(start, start + normalizedKeyword.length) + '</span>' +
                                name.substring(end);
                        } else {
                            item.textContent = name;
                        }
                    } else {
                        item.textContent = name;
                    }

                    // Thêm thông tin phòng ban/vị trí (nếu có)
                    if (receiver.phongBan || receiver.viTri) {
                        const info = document.createElement('small');
                        info.className = 'text-muted d-block';
                        info.textContent = `${receiver.phongBan || ''} ${receiver.viTri ? `- ${receiver.viTri}` : ''}`.trim();
                        item.appendChild(info);
                    }

                    // Xử lý khi chọn một người nhận
                    item.addEventListener('click', function() {
                        input.value = this.dataset.name;
                        document.getElementById('exportReceiverId').value = this.dataset.id;
                        dropdownMenu.style.display = 'none';
                    });

                    dropdownMenu.appendChild(item);
                });
            }

            // Thêm tùy chọn để thêm người nhận mới
            if (keyword.trim()) {
                const addCustomOption = document.createElement('div');
                addCustomOption.className = 'dropdown-item text-primary';
                addCustomOption.innerHTML = '<i class="fas fa-plus-circle me-2"></i>Sử dụng "' + keyword + '" làm người nhận';
                addCustomOption.addEventListener('click', function() {
                    input.value = keyword;
                    document.getElementById('exportReceiverId').value = '';
                    dropdownMenu.style.display = 'none';
                });
                dropdownMenu.appendChild(addCustomOption);
            }
        }
    }
    
    // Gắn sự kiện cho các phần tử trong hàng
    function attachExportRowEventListeners(row) {
        const removeButton = row.querySelector('.export-remove-row');
        if (removeButton) {
            removeButton.addEventListener('click', function() {
                if (document.querySelectorAll('.export-ingredient-row').length > 1) {
                    row.remove();
                    updateExportRowNumbers();
                    calculateExportTotal();
                }
            });
        }
        
        const quantityInput = row.querySelector('.export-quantity-input');
        if (quantityInput) {
            quantityInput.addEventListener('input', () => calculateExportAmount(row));
        }
    }
    
    // Tính toán thành tiền cho một hàng
    function calculateExportAmount(row) {
        const quantity = parseFloat(row.querySelector('.export-quantity-input').value) || 0;
        const price = parseFloat(row.querySelector('.export-price-input').value) || 0;
        const amount = quantity * price;
        
        row.querySelector('.export-amount-cell').textContent = formatCurrency(amount);
        calculateExportTotal();
    }
    
    // Tính tổng tiền
    function calculateExportTotal() {
        let total = 0;
        document.querySelectorAll('.export-ingredient-row').forEach(row => {
            const amountText = row.querySelector('.export-amount-cell').textContent;
            const amount = parseFloat(amountText.replace(/[^\d]/g, '')) || 0;
            total += amount;
        });
        
        const totalElement = document.getElementById('exportTotalAmount');
        if (totalElement) {
            totalElement.textContent = formatCurrency(total);
        }
    }
    
    // Thêm hàng nguyên liệu mới
    function addExportIngredientRow() {
        const tbody = document.querySelector('#exportIngredientTable tbody');
        if (!tbody) {
            console.error('Không tìm thấy bảng nguyên liệu xuất');
            return;
        }
        
        const firstRow = tbody.querySelector('.export-ingredient-row');
        if (!firstRow) {
            console.error('Không tìm thấy dòng nguyên liệu xuất mẫu');
            return;
        }
        
        const newRow = firstRow.cloneNode(true);
        
        // Reset các giá trị trong dòng mới
        newRow.querySelectorAll('input').forEach(input => {
            input.value = '';
            
            // Reset initialized attribute cho input tìm kiếm
            if (input.classList.contains('export-inventory-search')) {
                input.removeAttribute('data-initialized');
            }
        });
        
        // Reset thành tiền
        const amountCell = newRow.querySelector('.export-amount-cell');
        if (amountCell) amountCell.textContent = '0đ';
        
        // Reset ghi chú
        const noteInput = newRow.querySelector('.export-note-input');
        if (noteInput) noteInput.value = '';
        
        // Cập nhật STT
        const rowCount = tbody.children.length + 1;
        const sttCell = newRow.querySelector('td:first-child');
        if (sttCell) {
            sttCell.textContent = rowCount;
        }
        
        // Thêm dòng mới vào bảng
        tbody.appendChild(newRow);
        
        // Khởi tạo lại dropdown
        initializeExportDropdowns();
        
        // Gắn lại các event listeners
        attachExportRowEventListeners(newRow);
        
        // Tính lại tổng tiền
        calculateExportTotal();
    }
    
    // Cập nhật số thứ tự các hàng
    function updateExportRowNumbers() {
        document.querySelectorAll('.export-ingredient-row').forEach((row, index) => {
            row.querySelector('td:first-child').textContent = index + 1;
        });
    }
    
    // Xử lý submit form tạo phiếu xuất
    async function submitPhieuXuat(e) {
        e.preventDefault();
        
        try {
            showLoading(true);
            
            // Lấy thông tin chung của phiếu xuất
            const phieuXuat = {
                nguoiNhan: document.getElementById('exportReceiverName').value,
                lyDo: document.getElementById('exportReasonInput').value,
                thoiGianXuat: new Date().toISOString(),
                tongTien: parseInt(document.getElementById('exportTotalAmount').textContent.replace(/[^\d]/g, '')) || 0,
                chiTiet: [] // Chi tiết các nguyên liệu
            };
            
            // Lặp qua tất cả các hàng để lấy thông tin chi tiết
            const rows = document.querySelectorAll('.export-ingredient-row');
            let hasError = false;
            
            rows.forEach((row, index) => {
                const ingredientId = row.querySelector('.export-inventory-id').value;
                const ingredientName = row.querySelector('.export-inventory-search').value;
                const quantity = parseFloat(row.querySelector('.export-quantity-input').value) || 0;
                const price = parseFloat(row.querySelector('.export-price-input').value) || 0;
                const note = row.querySelector('.export-note-input').value || '';
                
                // Kiểm tra dữ liệu hợp lệ
                if (!ingredientId || !ingredientName) {
                    showToastDanger(`Vui lòng chọn nguyên liệu ở hàng ${index + 1}`);
                    hasError = true;
                    return;
                }
                
                if (!quantity || quantity <= 0) {
                    showToastDanger(`Vui lòng nhập số lượng hợp lệ ở hàng ${index + 1}`);
                    hasError = true;
                    return;
                }
                
                // Kiểm tra số lượng tồn kho
                const inventoryItem = inventoryList.find(item => item.id == ingredientId);
                if (inventoryItem && quantity > inventoryItem.soLuong) {
                    showToastDanger(`Số lượng xuất (${quantity}) vượt quá số lượng tồn kho (${inventoryItem.soLuong}) ở hàng ${index + 1}`);
                    hasError = true;
                    return;
                }
                
                // Thêm chi tiết vào phiếu xuất
                phieuXuat.chiTiet.push({
                    idNguyenLieuKho: ingredientId,
                    soLuong: quantity,
                    gia: price,
                    ghiChu: note
                });
            });
            
            // Nếu có lỗi, dừng việc gửi API
            if (hasError) {
                showLoading(false);
                return;
            }
            
            // Kiểm tra thông tin người nhận và lý do
            if (!phieuXuat.nguoiNhan) {
                showToastDanger('Vui lòng nhập tên người nhận');
                showLoading(false);
                return;
            }
            
            // Gọi API để tạo phiếu xuất
            const response = await fetch('/api/phieu-xuat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(phieuXuat)
            });
            
            const data = await response.json();
            if (data.status) {
                showToastSuccess("Tạo phiếu xuất thành công!");
                const modal = bootstrap.Modal.getInstance(document.getElementById('addExportModal'));
                if (modal) {
                    modal.hide();
                }
                
                // Reset form
                resetPhieuXuatForm();
                
                // Thêm phiếu xuất mới vào danh sách và cập nhật bảng
                listPhieuXuat.unshift(data.obj);
                thaoTacVoiBang(listPhieuXuat);
            } else {
                showToastDanger(data.error || 'Lỗi khi tạo phiếu xuất');
                console.error('Lỗi khi tạo phiếu xuất:', data.error);
            }
        } catch (error) {
            showToastDanger('Đã xảy ra lỗi khi tạo phiếu xuất');
            console.error('Lỗi khi tạo phiếu xuất:', error);
        } finally {
            showLoading(false);
        }
    }
    
    // Reset form phiếu xuất
    function resetPhieuXuatForm() {
        // Giữ lại dòng đầu tiên và xóa các dòng khác
        const tbody = document.querySelector('#exportIngredientTable tbody');
        const allRows = tbody.querySelectorAll('.export-ingredient-row');
        
        if (allRows.length > 1) {
            const firstRow = allRows[0];
            tbody.innerHTML = '';
            tbody.appendChild(firstRow);
        }
        
        // Reset giá trị trong dòng đầu tiên
        const firstRow = tbody.querySelector('.export-ingredient-row');
        if (firstRow) {
            firstRow.querySelectorAll('input').forEach(input => {
                input.value = '';
                if (input.classList.contains('export-inventory-search')) {
                    input.removeAttribute('data-initialized');
                }
            });
            
            // Reset thành tiền
            const amountCell = firstRow.querySelector('.export-amount-cell');
            if (amountCell) amountCell.textContent = '0đ';
        }
        
        // Reset thông tin người nhận và lý do
        document.getElementById('exportReceiverName').value = '';
        document.getElementById('exportReasonInput').value = '';
        
        // Reset tổng tiền
        const totalElement = document.getElementById('exportTotalAmount');
        if (totalElement) {
            totalElement.textContent = formatCurrency(0);
        }
        
        // Khởi tạo lại dropdown
        initializeExportDropdowns();
    }
    
    // Hiển thị loading indicator
    function showLoading(show) {
        if (show) {
            if (!document.getElementById('loading-indicator')) {
                const loadingIndicator = document.createElement('div');
                loadingIndicator.id = 'loading-indicator';
                loadingIndicator.style.position = 'fixed';
                loadingIndicator.style.top = '0';
                loadingIndicator.style.left = '0';
                loadingIndicator.style.right = '0';
                loadingIndicator.style.bottom = '0';
                loadingIndicator.style.background = 'rgba(255,255,255,0.7)';
                loadingIndicator.style.zIndex = '9999';
                loadingIndicator.style.display = 'flex';
                loadingIndicator.style.justifyContent = 'center';
                loadingIndicator.style.alignItems = 'center';
                loadingIndicator.innerHTML = `
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Đang tải...</span>
                    </div>
                `;
                document.body.appendChild(loadingIndicator);
            }
        } else {
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) loadingIndicator.remove();
        }
    }
    
    // Xử lý sự kiện khi nhấn nút tìm kiếm
    document.querySelector('.btn-timKiemXuat').addEventListener('click', async function(e) {
        e.preventDefault();
        try {
            const startDate = document.getElementById('exportStartDate').value;
            const endDate = document.getElementById('exportEndDate').value;
            const minAmount = document.getElementById('exportMinAmount').value;
            const maxAmount = document.getElementById('exportMaxAmount').value;
            const response = await fetch(`/api/tim-kiem-phieu-xuat?startDate=${startDate}&endDate=${endDate}&minAmount=${minAmount}&maxAmount=${maxAmount}`);
            const data = await response.json();
            if(data.status) {
                thaoTacVoiBang(data.list);
            }
            else {
                showToastDanger(data.error);
                console.error('Lỗi khi gọi API:', data.error);
                thaoTacVoiBang([]);
            }
        }
        catch (error) {
            showToastDanger();
            console.error('Lỗi khi gọi API:', error);
            thaoTacVoiBang([]);
        }
    });
    
    // Đặt lại tìm kiếm
    document.querySelector('.btn-datLaiXuat').addEventListener('click', function(e) {
        e.preventDefault();
        // Đặt lại giá trị của các input
        setDefaultDate();
        document.getElementById('exportMinAmount').value = '';
        document.getElementById('exportMaxAmount').value = '';
        // Lấy lại danh sách phiếu xuất
        getAPIPhieuXuat().then(data => {
            listPhieuXuat = data;
            thaoTacVoiBang(listPhieuXuat);
        });
    });

    // Xử lý bảng danh sách phiếu xuất
    function thaoTacVoiBang(list) {
        const tableBody = document.querySelector('#export .table-danhSach tbody');
        tableBody.innerHTML = ''; // Xóa nội dung hiện tại
        
        if (list.length > 0) {
            list.forEach((phieuXuat, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${phieuXuat.nguoiNhan}</td>
                    <td>${formatDate(new Date(phieuXuat.thoiGianXuat))}</td>
                    <td>${formatCurrency(phieuXuat.tongTien)}</td>
                    <td>
                        <button class="btn btn-sm btn-info text-white btn-xem-xuat" 
                            data-bs-toggle="modal"
                            data-bs-target="#viewExportModal"
                            data-bs-tooltip="tooltip"
                            data-id="${phieuXuat.id}"
                            title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
            
            // Khởi tạo tooltips
            const tooltips = document.querySelectorAll('[data-bs-tooltip="tooltip"]');
            tooltips.forEach(tooltip => {
                new bootstrap.Tooltip(tooltip);
            });
            
            // Xử lý sự kiện khi nhấn nút xem chi tiết
            document.querySelectorAll('.btn-xem-xuat').forEach(button => {
                button.addEventListener('click', async function() {
                    const id = this.dataset.id;
                    await loadExportDetails(id);
                });
            });
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center">Không tìm thấy phiếu xuất nào</td>
                </tr>
            `;
        }
    }
    
    // Hàm tải chi tiết phiếu xuất
    async function loadExportDetails(id) {
        try {
            showLoading(true);
            
            // Tìm phiếu xuất trong danh sách
            const phieuXuat = listPhieuXuat.find(item => item.id == id);
            if (!phieuXuat) {
                throw new Error('Không tìm thấy phiếu xuất');
            }
            
            // Cập nhật thông tin phiếu xuất
            document.getElementById('viewExportDate').textContent = formatFullDateTime(new Date(phieuXuat.thoiGianXuat));
            document.getElementById('viewExportReason').textContent = phieuXuat.lyDo || 'Không có';
            document.getElementById('viewReceiverName').textContent = phieuXuat.nguoiNhan;
            document.getElementById('viewTotalAmount').textContent = formatCurrency(phieuXuat.tongTien);
            
            // Tải chi tiết phiếu xuất
            const response = await fetch(`/api/chi-tiet-phieu-xuat?id=${id}`);
            const data = await response.json();
            
            if (data.status) {
                renderExportDetails(data.list);
            } else {
                throw new Error(data.error || 'Không thể tải chi tiết phiếu xuất');
            }
        } catch (error) {
            showToastDanger(error.message || 'Đã xảy ra lỗi khi tải chi tiết phiếu xuất');
            console.error('Error loading export details:', error);
        } finally {
            showLoading(false);
        }
    }
    
    // Hiển thị chi tiết phiếu xuất
    function renderExportDetails(details) {
        const tableBody = document.getElementById('viewExportDetails');
        tableBody.innerHTML = '';
        
        if (!details || details.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">Không có chi tiết phiếu xuất</td>
                </tr>
            `;
            return;
        }
        
        details.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="text-center">${index + 1}</td>
                <td>${item.NguyenLieu.ten}</td>
                <td>${item.NguyenLieu.donVi}</td>
                <td>${item.soLuong}</td>
                <td>${formatCurrency(item.gia)}</td>
                <td>${formatCurrency(item.soLuong * item.gia)}</td>
                <td>${item.ghiChu || 'N/A'}</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    // Thiết lập giá trị mặc định cho ngày bắt đầu và ngày kết thúc
    function setDefaultDate() {
        const startDateInput = document.getElementById('exportStartDate');
        const endDateInput = document.getElementById('exportEndDate');
        
        if (startDateInput && endDateInput) {
            const today = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 7);
            
            startDateInput.value = sevenDaysAgo.toISOString().split('T')[0];
            endDateInput.value = today.toISOString().split('T')[0];
        }
    }
    
    // Hàm lấy danh sách phiếu xuất từ API
    async function getAPIPhieuXuat() {
        const startDate = document.getElementById('exportStartDate').value;
        const endDate = document.getElementById('exportEndDate').value;
        
        try {
            const response = await fetch(`/api/phieu-xuat?startDate=${startDate}&endDate=${endDate}`);
            const data = await response.json();
            
            if (data.status) {
                return data.list;
            } else {
                showToastDanger(data.error);
                console.error('Lỗi khi gọi API:', data.error);
                return [];
            }
        } catch (error) {
            showToastDanger();
            console.error('Lỗi khi gọi API:', error);
            return [];
        }
    }
    
    // Format số tiền
    function formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }
    
    // Format ngày
    function formatDate(date) {
        if (!date || isNaN(date)) return 'N/A';
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    }
    
    // Format ngày giờ đầy đủ
    function formatFullDateTime(date) {
        if (!date || isNaN(date)) return 'N/A';
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }
}
 // Thêm hàm định dạng ngày kiểu DD/MM/YYYY
 function formatDate(date) {
    if (!date || isNaN(date)) return 'N/A';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
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
// Hàm helper để reset tất cả các bộ lọc
function resetAllFilters() {
    // Reset bộ lọc theo tab hiện tại
    const activeTab = document.querySelector('.tab-pane.active');
    if (activeTab.id === 'warehouse') {
        document.getElementById('warehouseSearchInput').value = '';
        document.getElementById('warehouseCategoryFilter').value = 'all';
    } else if (activeTab.id === 'ingredients') {
        document.getElementById('searchInput').value = '';
        document.getElementById('categoryFilter').value = 'all';
    }
}