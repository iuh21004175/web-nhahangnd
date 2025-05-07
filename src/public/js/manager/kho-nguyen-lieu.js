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
    let listKho = await getAPIKhoNguyenLieu();
    if (listKho.length > 0) {
        thaoTacVoiBang(listKho);
    }
    else {
        const tableBody = document.querySelector('.table-danhSach tbody');
        tableBody.innerHTML = ''; // Xóa nội dung hiện tại của bảng
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="7" class="text-center">Không tìm thấy nguyên liệu trong kho</td>`;
        tableBody.appendChild(row);
    }

    // Xử lý tìm kiếm
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchText = removeAccents(this.value.toLowerCase().trim());
            const rows = document.querySelectorAll('tbody tr:not(.table-light)');
            
            rows.forEach(row => {
                // Bỏ qua các dòng hết hàng
                if (row.querySelector('.badge.bg-danger')) {
                    row.style.display = 'none';
                    return;
                }

                //const code = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
                const name = removeAccents(row.querySelector('td:nth-child(2)').textContent.toLowerCase());
                if (name.includes(searchText)) {
                    row.style.display = '';
                    showCategoryHeader(row);
                } else {
                    row.style.display = 'none';
                }
            });

            updateCategoryHeaders();
        });
    }

    // Xử lý filter danh mục
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            const selectedCategory = this.value;
            const rows = document.querySelectorAll('tbody tr');

            rows.forEach(row => {
                // Bỏ qua các dòng hết hàng
                if (!row.classList.contains('table-light') && row.querySelector('.badge.bg-danger')) {
                    row.style.display = 'none';
                    return;
                }

                if (row.classList.contains('table-light')) {
                    // Xử lý header danh mục
                    const categoryName = row.querySelector('td').textContent.trim();
                    row.style.display = selectedCategory === 'all' || categoryName.includes(selectedCategory) ? '' : 'none';
                } else {
                    // Xử lý dòng dữ liệu
                    const category = row.querySelector('td:nth-child(3)').textContent;
                    row.style.display = selectedCategory === 'all' || category.includes(selectedCategory) ? '' : 'none';
                }
            });

            updateCategoryHeaders();
        });
    }

    // Hàm hiển thị header danh mục
    function showCategoryHeader(row) {
        const prevHeader = row.previousElementSibling;
        if (prevHeader && prevHeader.classList.contains('table-light')) {
            prevHeader.style.display = '';
        }
    }

    // Hàm cập nhật hiển thị của các header danh mục
    function updateCategoryHeaders() {
        document.querySelectorAll('.category-header').forEach(header => {
            let nextRow = header.nextElementSibling;
            let hasVisibleItems = false;
            while (nextRow && !nextRow.classList.contains('table-light')) {
                if (nextRow.style.display !== 'none') {
                    hasVisibleItems = true;
                    break;
                }
                nextRow = nextRow.nextElementSibling;
            }
            header.style.display = hasVisibleItems ? '' : 'none';
        });
    }
    function thaoTacVoiBang(list){
        const tableBody = document.querySelector('#warehouse .table-danhSach tbody');
        tableBody.innerHTML = ''; // Xóa nội dung hiện tại của bảng
    
        list.forEach((item, index) => {
            const row = document.createElement('tr');
            const col = document.createElement('td');
            const hanSuDung = new Date(item.hanSuDung);
            const ngayHienTai = new Date();
            const khoangCach = Math.floor((hanSuDung - ngayHienTai) / (1000 * 60 * 60 * 24)); // Tính số ngày còn lại
            col.innerHTML = `<span class="badge bg-success">Bình thường</span>`;
            if (khoangCach < 5) {
                col.innerHTML = `<span class="badge bg-warning text-dark">Sắp hết hạn</span>`;
            }
            if (khoangCach < 0) {
                col.innerHTML = `<span class="badge bg-danger">Hết hạn</span>`;
            }
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.NguyenLieu.ten}</td>
                <td>${item.NguyenLieu.DanhMucNguyenLieu.tenDanhMuc}</td>
                <td>${item.NguyenLieu.donVi}</td>
                <td>${item.gia}</td>
                <td>${item.soLuong}</td>
                <td>${formatDate(hanSuDung)}</td>
            `;
            row.appendChild(col); // Thêm cột vào hàng
            tableBody.appendChild(row); // Thêm hàng vào bảng
        });
    }
    function removeAccents(str) {
        return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }
    async function getAPIKhoNguyenLieu() {
        try {
            const response = await fetch('/api/kho-nguyen-lieu');
            const data = await response.json();
            if(data.status){
                return data.list
            }
            else {
                console.error('Error fetching kho nguyen lieu:', data.message);
                return [];
            }
        } catch (error) {
            console.error('Error fetching kho nguyen lieu:', error);
            return [];
        }
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
                // Đảm bảo unit-input hiển thị và là readonly
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
async function xuLyPhieuXuat(){
    // Thiết lập giá trị mặc định cho ngày bắt đầu và ngày kết thúc
    setDefaultDate();
    // Biến lưu trữ danh sách nguyên liệu
    let inventoryList = [];
    let receiverList = [];
    let listPhieuXuat = await getAPIPhieuXuat();
    thaoTacVoiBang(listPhieuXuat)
    // Khởi tạo ứng dụng
    init();

    // Hàm khởi tạo
    function init() {
        // Tải danh sách nguyên liệu
        loadInventoryData();
        
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
        const addExportForm = document.getElementById('addExportForm');
        if (addExportForm) {
            addExportForm.addEventListener('submit', submitPhieuXuat);
        }
        
        // Khởi tạo dropdown tìm kiếm
        initializeCustomDropdowns();

        // Tải danh sách nhân viên (người nhận)
        loadReceiverData();
        
        // Thiết lập tìm kiếm người nhận
        setupReceiverSearch();
    }
    // Hàm tải danh sách nhân viên từ API
    async function loadReceiverData() {
        try {
            const response = await fetch('/api/nhan-vien');
            if (!response.ok) throw new Error('Không thể tải danh sách nhân viên');
            
            // Lưu danh sách nhân viên vào biến toàn cục
            const data = await response.json();
            receiverList = data.list || [];
            
            console.log('Đã tải thành công danh sách nhân viên:', receiverList.length);
        } catch (error) {
            console.error("Lỗi khi tải danh sách nhân viên:", error);
        }
    }

    // Hàm thiết lập tìm kiếm người nhận
    function setupReceiverSearch() {
        const input = document.getElementById('receiverName');
        if (!input) return;
        
        const container = input.closest('.receiver-container');
        if (!container) return;
        
        // Tạo dropdown container nếu chưa có
        let dropdown = container.querySelector('.receiver-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'dropdown-menu receiver-dropdown';
            container.appendChild(dropdown);
        }
        
        // Tạo kết quả tìm kiếm container nếu chưa có
        let resultsContainer = dropdown.querySelector('.receiver-results');
        if (!resultsContainer) {
            resultsContainer = document.createElement('div');
            resultsContainer.className = 'dropdown-search-results receiver-results';
            dropdown.appendChild(resultsContainer);
        }
        
        // Xử lý hiển thị dropdown khi focus vào input
        input.addEventListener('focus', function() {
            // Đóng tất cả dropdown khác
            document.querySelectorAll('.inventory-dropdown.active, .receiver-dropdown.active')
                .forEach(d => d.classList.remove('active'));
            
            // Hiển thị dropdown
            dropdown.classList.add('active');
            filterReceivers(input.value, resultsContainer);
        });
        
        // Xử lý tìm kiếm khi gõ
        input.addEventListener('input', function() {
            filterReceivers(input.value, resultsContainer);
        });
        
        // Xử lý click bên ngoài để đóng dropdown
        document.addEventListener('click', function(e) {
            if (!container.contains(e.target)) {
                dropdown.classList.remove('active');
            }
        });
        
        // Xử lý click vào dropdown arrow nếu có
        const arrow = container.querySelector('.dropdown-arrow');
        if (arrow) {
            arrow.addEventListener('click', function() {
                input.focus();
            });
        }
    }

    // Lọc danh sách người nhận theo từ khóa tìm kiếm
    function filterReceivers(keyword, resultsContainer) {
        // Xóa nội dung hiện tại
        resultsContainer.innerHTML = '';
        
        // Nếu không có từ khóa và không có danh sách
        if (keyword.length === 0 && (!receiverList || receiverList.length === 0)) {
            resultsContainer.innerHTML = '<div class="dropdown-no-results">Nhập để tìm kiếm nhân viên...</div>';
            return;
        }
        
        // Nếu danh sách trống
        if (!receiverList || receiverList.length === 0) {
            resultsContainer.innerHTML = '<div class="dropdown-no-results">Không có dữ liệu nhân viên</div>';
            return;
        }
        
        // Chuẩn hóa từ khóa tìm kiếm
        const normalizedKeyword = removeDiacritics(keyword.toLowerCase());
        
        // Lọc danh sách người nhận
        let filteredReceivers;
        if (normalizedKeyword.length > 0) {
            // Lọc theo từ khóa
            filteredReceivers = receiverList.filter(nv => {
                // Giả sử mỗi nhân viên có tên trong thuộc tính "ten" hoặc "hoTen"
                const tenNhanVien = nv.ten || nv.hoTen || '';
                const normalizedName = removeDiacritics(tenNhanVien.toLowerCase());
                return normalizedName.includes(normalizedKeyword);
            });
        } else {
            // Hiển thị tất cả nhân viên nếu không có từ khóa
            filteredReceivers = [...receiverList];
        }
        
        // Nếu không có kết quả
        if (filteredReceivers.length === 0) {
            resultsContainer.innerHTML = '<div class="dropdown-no-results">Không tìm thấy nhân viên phù hợp</div>';
            return;
        }
        
        // Hiển thị kết quả
        filteredReceivers.forEach(nv => {
            const element = document.createElement('div');
            element.className = 'dropdown-item';
            element.dataset.id = nv.id || nv.maNV || '';
            element.dataset.name = nv.ten || nv.hoTen || '';
            
            // Format mã nhân viên
            let id = nv.id || nv.maNV || '';
            id = `NV${id.toString().padStart(8, '0')}`; // Thêm NV và các số 0 vào trước để đảm bảo đủ 10 ký tự
            
            // Highlight từ khóa tìm kiếm nếu có
            const name = nv.ten || nv.hoTen || '';
            if (normalizedKeyword.length > 0) {
                const normalizedName = removeDiacritics(name.toLowerCase());
                const start = normalizedName.indexOf(normalizedKeyword);
                if (start !== -1) {
                    const end = start + normalizedKeyword.length;
                    element.innerHTML = name.substring(0, start) + 
                    '<span class="highlight">' + name.substring(start, start + normalizedKeyword.length) + '</span>' + 
                    name.substring(end) + ` (${id})`;
                } else {
                    element.textContent = `${name} (${id})`;
                }
            } else {
                element.textContent = `${name} (${id})`;
            }
            
            // Xử lý khi chọn một nhân viên
            element.addEventListener('click', function() {
                const input = document.getElementById('receiverName');
                const hiddenInput = document.getElementById('receiverId'); // Nếu bạn muốn lưu ID người nhận
                const dropdown = this.closest('.receiver-dropdown');
                
                // Cập nhật giá trị
                input.value = this.dataset.name;
                if (hiddenInput) hiddenInput.value = this.dataset.id;
                dropdown.classList.remove('active');
            });
            
            resultsContainer.appendChild(element);
        });
    }
    // Hàm loại bỏ dấu tiếng Việt để tìm kiếm
    function removeDiacritics(str) {
        return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd').replace(/Đ/g, 'D');
    }
    
    // Hàm tải danh sách nguyên liệu từ API
    async function loadInventoryData() {
        try {
            const response = await fetch('/api/kho-nguyen-lieu');
            if (!response.ok) throw new Error('Không thể tải danh sách nguyên liệu');
            
            // Lưu danh sách nguyên liệu vào biến toàn cục
            const data = await response.json();
            inventoryList = data.list;
            
            console.log('Đã tải thành công danh sách nguyên liệu:', inventoryList.length);
            
            // Khởi tạo dropdown
            initializeCustomDropdowns();
            
        } catch (error) {
            showToastDanger()
            console.error("Lỗi khi tải danh sách nguyên liệu:", error);
        }
    }
    
    // Khởi tạo dropdown tùy chỉnh
    function initializeCustomDropdowns() {
        document.querySelectorAll('.inventory-search').forEach(input => {
            if (!input.dataset.initialized) {
                setupInventorySearch(input);
                input.dataset.initialized = "true";
            }
        });
    }
    
    // Thiết lập tìm kiếm nguyên liệu
    function setupInventorySearch(input) {
        const container = input.closest('.custom-dropdown-container');
        const dropdown = container.querySelector('.inventory-dropdown');
        const resultsContainer = dropdown.querySelector('.dropdown-search-results');
        
        // Xử lý hiển thị dropdown khi focus vào input
        input.addEventListener('focus', function() {
            closeAllDropdowns();
            
            // Tính toán và đặt vị trí cho dropdown
            positionDropdownAbsolute(dropdown, input);
            
            // Hiển thị dropdown
            dropdown.classList.add('active');
            filterInventory(input.value, resultsContainer);
        });
        
        // Xử lý tìm kiếm khi gõ
        input.addEventListener('input', function() {
            filterInventory(input.value, resultsContainer);
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
    // Hàm tính toán vị trí chính xác cho dropdown
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
        const activeDropdown = document.querySelector('.inventory-dropdown.active');
        if (activeDropdown) {
            const input = activeDropdown.closest('.custom-dropdown-container')?.querySelector('.inventory-search');
            if (input) {
                positionDropdownAbsolute(activeDropdown, input);
            }
        }
    }, true);

    // Cập nhật khi thay đổi kích thước cửa sổ
    window.addEventListener('resize', function() {
        const activeDropdown = document.querySelector('.inventory-dropdown.active');
        if (activeDropdown) {
            const input = activeDropdown.closest('.custom-dropdown-container')?.querySelector('.inventory-search');
            if (input) {
                positionDropdownAbsolute(activeDropdown, input);
            }
        }
    });

    // Cập nhật khi cuộn trong table-responsive
    document.querySelectorAll('.table-responsive').forEach(table => {
        table.addEventListener('scroll', function() {
            const activeDropdown = document.querySelector('.inventory-dropdown.active');
            if (activeDropdown) {
                const input = activeDropdown.closest('.custom-dropdown-container')?.querySelector('.inventory-search');
                if (input) {
                    positionDropdownAbsolute(activeDropdown, input);
                }
            }
        });
    });
    // Xử lý sự kiện khi nhấn nút tìm kiếm
    document.querySelector('.btn-timKiem').addEventListener('click', async function(e) {
        e.preventDefault();
        try {
            const startDate = document.getElementById('startDate').value;
            const endDate = document.getElementById('endDate').value;
            const minAmount = document.getElementById('minAmount').value;
            const maxAmount = document.getElementById('maxAmount').value;
            const response = await fetch(`/api/tim-kiem-phieu-xuat?startDate=${startDate}&endDate=${endDate}&minAmount=${minAmount}&maxAmount=${maxAmount}`);
            const data = await response.json();
            if(data.status){
               
                thaoTacVoiBang(data.list);
            }
            else{
                showToastDanger(data.error)
                console.error('Lỗi khi gọi API:', data.error);
                thaoTacVoiBang([]);
            }
        }
        catch (error) {
            showToastDanger()
            console.error('Lỗi khi gọi API:', error);
            thaoTacVoiBang([]);
        }
    })
    // Đặt lại tìm kiếm
    document.querySelector('.btn-datLai').addEventListener('click', function(e) {
        e.preventDefault();
        console.log(123)
        // Đặt lại giá trị của các input
        setDefaultDate();
        document.getElementById('minAmount').value = '';
        document.getElementById('maxAmount').value = '';
        thaoTacVoiBang(listPhieuXuat)
    })
    // Đóng tất cả dropdown đang mở
    function closeAllDropdowns() {
        document.querySelectorAll('.inventory-dropdown.active').forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
    
    // Lọc danh sách nguyên liệu trong kho theo từ khóa tìm kiếm
    function filterInventory(keyword, resultsContainer) {
        // Xóa nội dung hiện tại
        resultsContainer.innerHTML = '';
        
        // Nếu không có từ khóa, hiển thị tất cả
        const normalizedKeyword = removeDiacritics(keyword.toLowerCase());
        
        // Lọc danh sách nguyên liệu
        const filteredInventory = normalizedKeyword.length > 0 
            ? inventoryList.filter(item => {
                const normalizedName = removeDiacritics(item.NguyenLieu.ten.toLowerCase());
                return normalizedName.includes(normalizedKeyword);
              })
            : inventoryList;
        
        // Nếu không có kết quả
        if (filteredInventory.length === 0) {
            resultsContainer.innerHTML = '<div class="dropdown-no-results">Không tìm thấy nguyên liệu</div>';
            return;
        }
        
        // Hiển thị kết quả
        filteredInventory.forEach(item => {
            const element = document.createElement('div');
            element.className = 'dropdown-item';
            element.dataset.id = item.idNguyenLieu;
            element.dataset.idPhieuNhap = item.idPhieu || '';
            element.dataset.name = item.NguyenLieu.ten;
            element.dataset.unit = item.NguyenLieu.donVi || '';
            element.dataset.price = item.gia || '0';
            element.dataset.maxQuantity = item.soLuong || '0';
            
            // Highlight từ khóa tìm kiếm
            const name = item.NguyenLieu.ten;
            if (normalizedKeyword.length > 0) {
                const normalizedName = removeDiacritics(name.toLowerCase());
                const start = normalizedName.indexOf(normalizedKeyword);
                if (start !== -1) {
                    const end = start + normalizedKeyword.length;
                    element.innerHTML = name.substring(0, start) + 
                        '<span class="highlight">' + name.substring(start, start + normalizedKeyword.length) + '</span>' + 
                        name.substring(end);
                } else {
                    element.textContent = name;
                }
            } else {
                element.textContent = name;
            }
            
            // Xử lý khi chọn một nguyên liệu
            element.addEventListener('click', function() {
                const input = this.closest('.custom-dropdown-container').querySelector('.inventory-search');
                const hiddenInput = this.closest('.custom-dropdown-container').querySelector('.inventory-id');
                const hiddenInputIdPhieuNhap = this.closest('.custom-dropdown-container').querySelector('.id-phieuNhap');
                const dropdown = this.closest('.inventory-dropdown');
                
                // Cập nhật giá trị
                input.value = this.dataset.name;
                hiddenInput.value = this.dataset.id;
                hiddenInputIdPhieuNhap.value = this.dataset.idPhieuNhap;
                dropdown.classList.remove('active');
                
                // Cập nhật đơn vị và đơn giá
                const row = input.closest('.ingredient-row');
                const unitInput = row.querySelector('.unit-input');
                const priceInput = row.querySelector('.price-input');
                const quantityInput = row.querySelector('.quantity-input');
                
                if (unitInput && this.dataset.unit) {
                    // Đảm bảo input đơn vị hiển thị và được cập nhật
                    unitInput.style.display = '';
                    unitInput.value = this.dataset.unit;
                }
                
                if (priceInput && this.dataset.price) {
                    priceInput.value = formatCurrency(this.dataset.price);
                }
                
                if (quantityInput && this.dataset.maxQuantity) {
                    quantityInput.setAttribute('max', this.dataset.maxQuantity);
                    quantityInput.setAttribute('min', 0);
                    quantityInput.value = 1;
                }
                // Tính lại thành tiền
                calculateAmount(row);
            });
            
            resultsContainer.appendChild(element);
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
                // Đảm bảo unit-input hiển thị và là readonly
                input.style.display = ''; // Xóa style display:none nếu có
                input.readOnly = true;
            }
            
            // Reset initialized attribute cho input tìm kiếm
            if (input.classList.contains('inventory-search')) {
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
        
        // Đảm bảo input đơn vị hiển thị
        const unitInput = row.querySelector('.unit-input');
        if (unitInput) {
            unitInput.style.display = '';
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
        const quantity = parseInt(row.querySelector('.quantity-input').value) || 0;
        const price = parseInt(parseFormattedCurrency(row.querySelector('.price-input').value)) || 0;
        const amount = quantity * price;
        
        row.querySelector('.amount-cell').textContent = formatCurrency(amount);
        calculateTotal();
    }
    
    // Tính tổng tiền
    function calculateTotal() {
        let total = 0;
        document.querySelectorAll('.ingredient-row').forEach(row => {
            const amountText = row.querySelector('.amount-cell').textContent;
            const amount = parseFormattedCurrency(amountText);
            total += amount;
        });
        
        const totalElement = document.getElementById('exportTotalAmount');
        if (totalElement) {
            totalElement.textContent = formatCurrency(total);
        }
    }
    

    // Hàm chuyển chuỗi tiền tệ thành số nguyên
    function parseFormattedCurrency(formattedValue) {
        // Loại bỏ tất cả các ký tự không phải số từ chuỗi
        const numericString = formattedValue.replace(/[^\d]/g, '');
        
        // Chuyển đổi chuỗi số thành số nguyên
        return parseInt(numericString) || 0;
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
    
    // Thêm hàm xử lý submit phiếu xuất
    async function submitPhieuXuat(e) {
        e.preventDefault();
        
        try {
            // Trong hàm submitPhieuXuat - cập nhật phần lấy thông tin người nhận
            const phieuXuat = {
                thoiGianXuat: new Date().toISOString(),
                tongTien: parseInt(document.getElementById('exportTotalAmount')?.textContent.replace(/[^\d]/g, '')) || 0,
                idNguoiNhan: document.getElementById('receiverId')?.value || null, // Thêm id người nhận nếu cần
                lyDoXuat: document.getElementById('exportReason')?.value || '',
                chiTiet: [] // Chi tiết các nguyên liệu
            };
            // Kiểm tra xem có nguyên liệu nào không              
            // Lặp qua tất cả các hàng để lấy thông tin chi tiết
            const rows = document.querySelectorAll('.ingredient-row');
            let hasError = false;
            
            rows.forEach((row, index) => {
                const inventoryId = row.querySelector('.inventory-id')?.value;
                const idPhieuNhap = row.querySelector('.id-phieuNhap')?.value;
                const inventoryName = row.querySelector('.inventory-search')?.value;
                const quantity = parseFloat(row.querySelector('.quantity-input')?.value) || 0;
                const note = row.querySelector('.note-input')?.value || '';
                
                // Kiểm tra dữ liệu hợp lệ
                if (!inventoryId || !inventoryName) {
                    alert(`Vui lòng chọn nguyên liệu ở hàng ${index + 1}`);
                    hasError = true;
                    return;
                }
                
                if (!quantity || quantity <= 0) {
                    alert(`Vui lòng nhập số lượng hợp lệ ở hàng ${index + 1}`);
                    hasError = true;
                    return;
                }
                
                
                // Thêm chi tiết vào phiếu xuất
                phieuXuat.chiTiet.push({
                    idNguyenLieu: inventoryId,
                    idPhieuNhap: idPhieuNhap,
                    soLuong: quantity,
                    ghiChu: note
                });
            });
            console.log('Chi tiết phiếu xuất:', phieuXuat);
            // Kiểm tra lý do xuất
            if (!phieuXuat.lyDoXuat) {
                alert('Vui lòng nhập lý do xuất kho');
                hasError = true;
            }
            
            // Nếu có lỗi, dừng việc gửi API
            if (hasError) {
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
            if (data.status){
                // Reset form hoặc đóng modal
                showToastSuccess("Tạo phiếu xuất thành công!")
                const modal = bootstrap.Modal.getInstance(document.getElementById('addExportModal'));
                if (modal) {
                    modal.hide();
                }
                listPhieuXuat.unshift(data.obj)
                thaoTacVoiBang(listPhieuXuat)
                resetPhieuXuatForm();
            }
            else {
                showToastDanger(data.error)
                console.error('Lỗi khi tạo phiếu xuất:', data.error);
            }
            
        } catch (error) {
            showToastDanger()
            console.error('Lỗi khi tạo phiếu xuất:', error);
            alert('Lỗi khi tạo phiếu xuất: ' + error.message);
        }
    }

    // Hàm reset form phiếu xuất
    function resetPhieuXuatForm() {
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
                if (input.classList.contains('inventory-search')) {
                    input.removeAttribute('data-initialized');
                }
            });
            
            // Reset thành tiền
            const amountCell = firstRow.querySelector('.amount-cell');
            if (amountCell) amountCell.textContent = '0đ';
            
            // Reset ghi chú
            const noteInput = firstRow.querySelector('.note-input');
            if (noteInput) noteInput.value = '';
            
            // Reset select boxes nếu có
            firstRow.querySelectorAll('select').forEach(select => {
                select.selectedIndex = 0;
            });
            
            // Reset STT
            const sttCell = firstRow.querySelector('td:first-child');
            if (sttCell) sttCell.textContent = '1';
        }
        
        // Reset các trường thông tin khác
        document.getElementById('receiverName').value = '';
        document.getElementById('exportReason').value = '';
        
        // Reset tổng tiền
        const totalElement = document.getElementById('exportTotalAmount');
        if (totalElement) {
            totalElement.textContent = formatCurrency(0);
        }
        
        // Khởi tạo lại dropdown
        initializeCustomDropdowns();
    }
    async function getAPIPhieuXuat() {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        try{
            const response = await fetch(`/api/phieu-xuat?startDate=${startDate}&endDate=${endDate}`);
            const data = await response.json();
            if(data.status){
                return data.list;
            }
            else{
                console.error('Lỗi khi gọi API:', data.error);
                return []
            }
        }
        catch (error) {
            console.error('Lỗi khi gọi API:', error);
            return []
        }
    }
    function thaoTacVoiBang(list){
        const tableBody = document.querySelector('#export .table-danhSach tbody');
        tableBody.innerHTML = ''; // Xóa nội dung hiện tại của tbody
        if(list.length > 0){
            list.forEach((item, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${item.idNhanVien ? item.NhanVien.ten : 'Không có'}</td>
                    <td>${formatDate(new Date(item.thoiGianXuat))}</td>
                    <td>${formatCurrency(item.tongTien)}</td>
                    <td>
                        <button class="btn btn-sm btn-info btn-xem text-white" 
                            data-bs-toggle="modal"
                            data-bs-target="#viewExportModal"
                            data-bs-tooltip="tooltip"
                            data-id = "${item.id}"
                            title="Xem chi tiết">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
        else{
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="6" class="text-center">Không tìm thấy phiếu xuất kho</td>
            `;
            tableBody.appendChild(row);
        }
        // Khởi tạo tooltips
        const tooltips = document.querySelectorAll('[data-bs-tooltip="tooltip"]');
        tooltips.forEach(tooltip => {
            new bootstrap.Tooltip(tooltip);
        });
        // Gắn sự kiện cho nút xem chi tiết
        document.querySelectorAll('.btn-xem').forEach(button => {
            button.addEventListener('click', async function() {
                const id = this.dataset.id;
                const phieuXuat = list.find(item => item.id == id);
                document.getElementById('viewExportReason').innerHTML = phieuXuat.lyDo
                document.getElementById('viewExportDate').innerHTML = formatDate(new Date(phieuXuat.thoiGianXuat))
                document.getElementById('viewReceiverName').innerHTML = phieuXuat.idNhanVien ? phieuXuat.NhanVien.ten : 'Không có'
                document.getElementById('viewTotalAmount').innerHTML = formatCurrency(phieuXuat.tongTien)
                const listNguyenLieu = await getAPINguyenLieuByIdPhieu(id);
                renderNguyenLieuPhieuXuat(listNguyenLieu);
            });
        });
    }
    function renderNguyenLieuPhieuXuat(list){
        const tableBody = document.getElementById('viewExportDetails')
        tableBody.innerHTML = ''; // Xóa nội dung hiện tại của tbody
        list.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.ChiTietPhieuNhap.NguyenLieu.ten}</td>
                <td>${item.ChiTietPhieuNhap.NguyenLieu.donVi}</td>
                <td>${item.soLuong}</td>
                <td>${formatCurrency(item.ChiTietPhieuNhap.gia)}</td>
                <td>${formatCurrency(item.ChiTietPhieuNhap.gia * item.soLuong)}</td>
                <td>${item.ghiChu || 'N/A'}</td>
            `;
            tableBody.appendChild(row);
        })
    }
    async function getAPINguyenLieuByIdPhieu(id){
        try{
            const response = await fetch(`/api/chi-tiet-phieu-xuat?id=${id}`);
            const data = await response.json();
            if(data.status){
                return data.list;
            }
            else{
                console.error('Lỗi khi gọi API:', data.error);
                return []
            }
        }
        catch (error) {
            console.error('Lỗi khi gọi API:', error);
            return []
        }
    }
    function formatDate (date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${day}/${month}/${year}`;
    };
    
    function setDefaultDate(){
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
    
        if (startDateInput && endDateInput) {
            const today = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(today.getDate() - 7);
    
            startDateInput.value = sevenDaysAgo.toISOString().split('T')[0];
            endDateInput.value = today.toISOString().split('T')[0];
        }
    }
    // Format số tiền
    function formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
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