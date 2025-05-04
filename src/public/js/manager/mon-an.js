document.addEventListener('DOMContentLoaded', async function() {
    // Khai báo biến toàn cục
    let ingredientsList = await getAPINguyenLieu();
    let listDanhMucMonAn = await getAPIDanhMucMonAn();
    let listMonAn = await getAPIMonAn();
    thaoTacVoiBang(listMonAn);
    if(listDanhMucMonAn.length > 0){
        listDanhMucMonAn.forEach(function(item) {
            const option1 = document.createElement('option');
            const option2 = document.createElement('option');
            const option3 = document.createElement('option');
            option3.innerHTML = item.tenDanhMuc;
            option3.value = item.id;
            option1.innerHTML = item.tenDanhMuc;
            option1.value = item.id;
            option2.innerHTML = item.tenDanhMuc;
            option2.value = item.id;
            document.getElementById('categoryFilter').appendChild(option1);
            document.getElementById('addFoodCategory').appendChild(option2);
            document.getElementById('editFoodCategory').appendChild(option3);
        })
    }
    // Xử lý preview ảnh khi chọn file
    const foodImageInput = document.getElementById('addFoodImage');
    if (foodImageInput) {
        foodImageInput.addEventListener('change', function() {
            const file = this.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    document.getElementById('addFoodImagePreview').src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Xử lý nút thêm nguyên liệu
    const btnAddIngredient = document.getElementById('btnAddIngredient');
    if (btnAddIngredient) {
        btnAddIngredient.addEventListener('click', function() {
            addIngredientRow();
        });
    }
    
    // Hàm thêm hàng nguyên liệu mới
    function addIngredientRow() {
        const template = document.getElementById('ingredientRowTemplate');
        const ingredientsListElement = document.getElementById('ingredientsList');
        
        // Tạo bản sao từ template
        const clone = document.importNode(template.content, true);
        const row = clone.querySelector('.ingredient-row');
        
        // Tạo một datalist ID riêng biệt cho hàng này để tránh xung đột
        const datalistId = `ingredient-options-${Date.now()}`;
        const inputField = row.querySelector('.ingredient-name-input');
        const datalist = row.querySelector('datalist');
        
        // Đặt ID mới cho datalist và cập nhật tham chiếu từ input
        datalist.id = datalistId;
        inputField.setAttribute('list', datalistId);
        
        // Thêm options vào datalist
        if (Array.isArray(ingredientsList) && ingredientsList.length > 0) {
            ingredientsList.forEach(item => {
                const option = document.createElement('option');
                option.value = item.ten;
                option.dataset.id = item.id;
                option.dataset.donVi = item.donVi;
                datalist.appendChild(option);
            });
        }
        
        // Xử lý sự kiện khi chọn nguyên liệu
        inputField.addEventListener('input', function() {
            const input = this.value;
            const hiddenInput = this.closest('tr').querySelector('.ingredient-id-input');
            
            // Tìm nguyên liệu trong danh sách
            const selectedIngredient = ingredientsList.find(item => 
                item.ten.toLowerCase() === input.toLowerCase());
                
            if (selectedIngredient) {
                // Nếu tìm thấy, cập nhật ID và đơn vị
                hiddenInput.value = selectedIngredient.id;
                
                // Hiển thị tên chính xác với chữ hoa/thường
                this.value = selectedIngredient.ten;
            } else {
                // Nếu không tìm thấy, xóa giá trị ID và đơn vị
                hiddenInput.value = '';
            
            }
        });
        
        // Xử lý nút xóa nguyên liệu
        const btnRemove = row.querySelector('.btn-remove-ingredient');
        if (btnRemove) {
            btnRemove.addEventListener('click', function() {
                this.closest('tr').remove();
                updateIngredientsAlert();
            });
        }
        
        // Thêm hàng vào bảng
        ingredientsListElement.appendChild(clone);
        
        // Ẩn thông báo không có nguyên liệu
        updateIngredientsAlert();
        
        // Focus vào input mới thêm
        inputField.focus();
            
    }
    
    // Cập nhật hiển thị thông báo khi không có nguyên liệu
    function updateIngredientsAlert() {
        const rows = document.querySelectorAll('#ingredientsList .ingredient-row');
        const alert = document.getElementById('noIngredientsAlert');
        
        if (alert) {
            alert.style.display = rows.length > 0 ? 'none' : 'block';
        }
    }
    
    // Xử lý submit form thêm món ăn
    const addFoodForm = document.getElementById('addFoodForm');
    addFoodForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        // Kiểm tra danh sách nguyên liệu
        const ingredientRows = document.querySelectorAll('#ingredientsList .ingredient-row');
        if (ingredientRows.length === 0) {
            alert('Vui lòng thêm ít nhất một nguyên liệu');
            return;
        }
        const tenMonAn = document.getElementById('addFoodName');
        const giaTien = document.getElementById('addFoodPrice');
        const moTa = document.getElementById('addFoodDescription');
        const danhMuc = document.getElementById('addFoodCategory');
        const hinhAnh = document.getElementById('addFoodImage');
        // Kiểm tra tên món ăn
        const isTenMonAnValid = kiemTraTenMonAn(tenMonAn);
        const isMoTaValid = kiemTraMoTa(moTa);
        const isHinhAnhValid = kiemTraHinhAnh(hinhAnh);


        
        
        
        // Thêm danh sách nguyên liệu
        const ingredients = [];
        ingredientRows.forEach((row) => {
            const ingredientId = row.querySelector('.ingredient-id-input').value;
            const quantity = row.querySelector('.ingredient-quantity').value;
            const unit = row.querySelector('.ingredient-unit-select').value;
            
            // Kiểm tra dữ liệu hợp lệ
            if (ingredientId && quantity > 0) {
                ingredients.push({
                    idNguyenLieu: ingredientId,
                    dinhLuong: quantity,
                    donVi: unit
                });
            }
        });
        
        // Thêm danh sách nguyên liệu vào formData
        if (isTenMonAnValid && isMoTaValid && isHinhAnhValid && ingredients.length > 0) {
            // Tạo FormData
            const formData = new FormData();
            
            formData.append('NguyenLieu', JSON.stringify(ingredients));
            formData.append('ten', tenMonAn.value.trim());
            formData.append('gia', giaTien.value);
            formData.append('moTa', moTa.value.trim());
            formData.append('idDanhMuc', danhMuc.value);
            formData.append('hinhAnh', hinhAnh.files[0]);
            
            // Gửi dữ liệu lên server
            try {
                const response = await fetch('/api/mon-an', {
                    method: 'POST',
                    body: formData
                });
                
                const data = await response.json();
                if (data.status) {
                    showToastSuccess("Thêm món ăn thành công!");
                    listMonAn.unshift(data.obj);
                    // Reset form sau khi thêm thành công
                    addFoodForm.reset();
                    // Xóa tất cả hàng nguyên liệu
                    const ingredientRows = document.querySelectorAll('#ingredientsList .ingredient-row');
                    ingredientRows.forEach((row) => {
                        row.remove();
                    });
                    // Đóng modal
                    bootstrap.Modal.getInstance(document.getElementById('addFoodModal')).hide()
                    // Xóa hình ảnh preview
                    document.getElementById('addFoodImagePreview').src = '';
                    // Cập nhật danh sách món ăn
                    thaoTacVoiBang(listMonAn);              
                } else {
                    showToastDanger(data.error);
                    console.error('Lỗi server:', data.error);
                }
            }
            catch (error) {
                showToastDanger();
                console.error('Lỗi khi thêm món ăn:', error);
            }

        }
            
       
    });
    // Xử lý submit form chỉnh sửa món ăn
    const editFoodForm = document.getElementById('editFoodForm');
    editFoodForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Kiểm tra danh sách nguyên liệu
        const ingredientRows = document.querySelectorAll('#editIngredientsList .edit-ingredient-row');
        if (ingredientRows.length === 0) {
            alert('Vui lòng thêm ít nhất một nguyên liệu');
            return;
        }
        
        // Lấy dữ liệu từ form
        const foodId = document.getElementById('editFoodId').value;
        const tenMonAn = document.getElementById('editFoodName');
        const giaTien = document.getElementById('editFoodPrice');
        const moTa = document.getElementById('editFoodDescription');
        const danhMuc = document.getElementById('editFoodCategory');
        const hinhAnh = document.getElementById('editFoodImage');
        
        // Kiểm tra dữ liệu nhập
        const isTenMonAnValid = kiemTraTenMonAn(tenMonAn);
        const isMoTaValid = kiemTraMoTa(moTa);
        
        // Thu thập dữ liệu nguyên liệu
        const ingredients = [];
        ingredientRows.forEach(row => {
            const ingredientId = row.querySelector('.ingredient-id-input').value;
            const quantity = row.querySelector('.ingredient-quantity').value;
            const unit = row.querySelector('.ingredient-unit-select').value;
            
            if (ingredientId && quantity > 0) {
                ingredients.push({
                    idNguyenLieu: ingredientId,
                    dinhLuong: quantity,
                    donVi: unit
                });
            }
        });
        
        if (isTenMonAnValid && isMoTaValid && ingredients.length > 0) {
            // Tạo FormData
            const formData = new FormData();
            
            formData.append('id', foodId);
            formData.append('NguyenLieu', JSON.stringify(ingredients));
            formData.append('ten', tenMonAn.value.trim());
            formData.append('gia', giaTien.value);
            formData.append('moTa', moTa.value.trim());
            formData.append('idDanhMuc', danhMuc.value);
            
            if (hinhAnh.files[0]) {
                formData.append('hinhAnh', hinhAnh.files[0]);
            }
            
            try {
                // Gửi dữ liệu lên server
                const response = await fetch(`/api/mon-an`, {
                    method: 'PUT',
                    body: formData
                });
                
                const data = await response.json();
                
                
                if (data.status) {
                    // Hiển thị thông báo thành công
                    showToastPrimary("Chỉnh sửa món ăn thành công!");
                    const index = listMonAn.findIndex(item => item.id == foodId);
                    listMonAn[index] = data.obj;
                    // Cập nhật danh sách món ăn
                    thaoTacVoiBang(listMonAn);
                    // Reset form sau khi chỉnh sửa thành công
                    editFoodForm.reset();
                    // Xóa tất cả hàng nguyên liệu
                    const ingredientRows = document.querySelectorAll('#editIngredientsList .edit-ingredient-row');
                    ingredientRows.forEach((row) => {
                        row.remove();
                    })
                    // Đóng modal
                    bootstrap.Modal.getInstance(document.getElementById('editFoodModal')).hide();
                    
                } else {
                    showToastDanger(data.error);
                    console.error('Lỗi server:', data.error);
                }
            } catch (error) {
                showToastDanger();
                console.error('Lỗi:', error);
            }
        } 
    });
    
    document.getElementById('categoryFilter').addEventListener('change', async function() {
        const selectedCategory = this.value;
        const filteredList = listMonAn.filter(item => item.idDanhMuc == selectedCategory || selectedCategory == 'all');
        thaoTacVoiBang(filteredList);
    });
});
async function getAPINguyenLieu(){
    try {
        const response = await fetch('/api/nguyen-lieu');
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
        console.error('Lỗi khi lấy danh sách nguyên liệu:', error);
        return [];
    }
}
async function getAPIDanhMucMonAn(){
    const response = await fetch('/api/danh-muc-mon-an');
    try{
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
// Hàm lấy danh sách món ăn
async function getAPIMonAn(){
    const response = await fetch('/api/mon-an');
    try{
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
        return [];
    }
}
// Hảm thao tác chi tiết món ăn
async function getChiTietMonAnAPI(id) {
    const response = await fetch('/api/chi-tiet-mon-an?id=' + id);
    try {
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
        console.error('Lỗi khi lấy chi tiết món ăn:', error);
        return [];
    }
}
async function thaoTacVoiBang(list){
    const tbody = document.querySelector('.table-danhSach tbody');
    tbody.innerHTML = ''; // Xóa nội dung hiện tại của tbody
    // Duyệt qua danh sách và tạo các hàng mới
    list.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <img src="${item.hinhAnh}" class="food-image" alt="Phở">
            </td>
            <td>${item.ten}</td>
            <td>${item.DanhMucMonAn.tenDanhMuc}</td>
            <td>${parseInt(item.gia).toLocaleString("vi-VN")}đ</td>
            <td>
                <button class="btn btn-sm btn-info btn-xem me-2" 
                    data-bs-toggle="modal" 
                    data-bs-target="#viewFoodModal"
                    data-bs-tooltip="tooltip"
                    title="Xem chi tiết"
                    data-id="${item.id}"
                    >
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-primary btn-sua" 
                    data-bs-toggle="modal" 
                    data-bs-target="#editFoodModal"
                    data-bs-tooltip="tooltip"
                    title="Chỉnh sửa"
                    data-id="${item.id}">
                    <i class="fas fa-edit"></i>
                    </button>
            </td>`;
        tbody.appendChild(row);
    });
    // Khởi tạo tất cả tooltips
    const tooltips = document.querySelectorAll('[data-bs-tooltip="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });
    // Xử lý sự kiện cho nút xem chi tiết
    document.querySelectorAll('.btn-xem').forEach(btn => {
        btn.addEventListener('click', async function() {
            const id = this.dataset.id;
            const monAn = list.find(item => item.id == id);
            // Hiển thị thông tin chi tiết món ăn
            document.getElementById('viewFoodName').innerHTML = monAn.ten;
            document.getElementById('viewFoodImage').src = monAn.hinhAnh;
            document.getElementById('viewFoodCategory').innerHTML = monAn.DanhMucMonAn.tenDanhMuc;
            document.getElementById('viewFoodPrice').innerHTML = parseInt(monAn.gia).toLocaleString("vi-VN") + 'đ';
            document.getElementById('viewFoodDescription').innerHTML = monAn.moTa;
            // Lấy danh sách nguyên liệu
            const listNguyenLieu = await getChiTietMonAnAPI(id);
            document.querySelector('.table-xemNguyenLieu tbody').innerHTML = ''; // Xóa nội dung hiện tại của tbody
            listNguyenLieu.forEach((nguyenLieu, index) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${nguyenLieu.NguyenLieu.ten}</td>
                    <td>${nguyenLieu.dinhLuong}</td>
                    <td>${nguyenLieu.donVi}</td>`;
                document.querySelector('.table-xemNguyenLieu tbody').appendChild(tr);
            })
        })
    })
    // Xử lý sự kiện cho nút chỉnh sửa
    document.querySelectorAll('.btn-sua').forEach(btn => {
        btn.addEventListener('click', async function() {
            const id = this.dataset.id;
            const monAn = list.find(item => item.id == id);
            // Hiển thị thông tin chỉnh sửa món ăn
            document.getElementById('editFoodId').value = monAn.id;
            document.getElementById('editFoodName').value = monAn.ten;
            document.getElementById('editFoodPrice').value = monAn.gia;
            document.getElementById('editFoodCategory').value = monAn.idDanhMuc;
            document.getElementById('editFoodDescription').value = monAn.moTa || '';
            document.getElementById('editFoodImagePreview').src = monAn.hinhAnh || '/images/default-food.png';
            
            // Xóa danh sách nguyên liệu hiện tại
            document.getElementById('editIngredientsList').innerHTML = '';
            
            // Thêm nguyên liệu hiện tại vào danh sách
            const listNguyenLieu = await getChiTietMonAnAPI(id);
            listNguyenLieu.forEach(item => {
                addEditIngredientRow(item, listNguyenLieu);
            });
        })
    })
}
// Hàm thêm hàng nguyên liệu khi chỉnh sửa
async function addEditIngredientRow(existingItem = null, ingredientsList) {
    const template = document.getElementById('editIngredientRowTemplate');
    const ingredientsListElement = document.getElementById('editIngredientsList');
    
    
    if (template && ingredientsListElement) {
        // Tạo bản sao từ template
        const clone = document.importNode(template.content, true);
        const row = clone.querySelector('.edit-ingredient-row');
        
        // Tạo datalist ID riêng biệt
        const datalistId = `edit-ingredient-options-${Date.now()}`;
        const inputField = row.querySelector('.ingredient-name-input');
        const datalist = row.querySelector('datalist');
        const hiddenInput = row.querySelector('.ingredient-id-input');
        const quantityInput = row.querySelector('.ingredient-quantity');
        const unitSelect = row.querySelector('.ingredient-unit-select');
        
        // Đặt ID mới cho datalist
        datalist.id = datalistId;
        inputField.setAttribute('list', datalistId);
        
        // Thêm options vào datalist
        if (Array.isArray(ingredientsList) && ingredientsList.length > 0) {
            ingredientsList.forEach(item => {
                const option = document.createElement('option');
                const displayText = item.ten
                option.value = displayText;
                option.dataset.id = item.id;
                option.dataset.donVi = item.donVi;
                option.dataset.tenNL = item.ten;
                datalist.appendChild(option);
            });
        }
        
        // Nếu có dữ liệu nguyên liệu hiện có, điền vào trường
        if (existingItem && existingItem.NguyenLieu) {
            hiddenInput.value = existingItem.idNguyenLieu;
            
            // Hiển thị tên nguyên liệu
            const displayText = existingItem.NguyenLieu.nhaCungCap ? 
                `${existingItem.NguyenLieu.ten} - ${existingItem.NguyenLieu.nhaCungCap.ten}` : 
                existingItem.NguyenLieu.ten;
            inputField.value = displayText;
            
            // Điền định lượng và đơn vị
            quantityInput.value = existingItem.dinhLuong;
            unitSelect.value = existingItem.donVi;
        }
        
        // Xử lý sự kiện khi chọn nguyên liệu
        inputField.addEventListener('input', function() {
            const input = this.value;
            const hiddenInput = this.closest('tr').querySelector('.ingredient-id-input');
            const unitSelect = this.closest('tr').querySelector('.ingredient-unit-select');
            
            // Tìm nguyên liệu trong danh sách
            const matchingOption = Array.from(datalist.options).find(opt => 
                opt.value === input);
                
            if (matchingOption) {
                // Nếu chọn từ datalist
                hiddenInput.value = matchingOption.dataset.id;
                // Tự động chọn đơn vị dựa trên nguyên liệu đã chọn
                for (let i = 0; i < unitSelect.options.length; i++) {
                    if (unitSelect.options[i].value === matchingOption.dataset.donVi) {
                        unitSelect.selectedIndex = i;
                        break;
                    }
                }
            } else {
                // Xóa giá trị ID và đơn vị
                hiddenInput.value = '';
            }
        });
        
        // Xử lý nút xóa nguyên liệu
        const btnRemove = row.querySelector('.btn-remove-ingredient');
        if (btnRemove) {
            btnRemove.addEventListener('click', function() {
                this.closest('tr').remove();
                updateEditIngredientsAlert();
            });
        }
        
        // Thêm hàng vào bảng
        ingredientsListElement.appendChild(clone);
        
        // Ẩn thông báo không có nguyên liệu
        updateEditIngredientsAlert();
    }
}

// Cập nhật hiển thị thông báo khi không có nguyên liệu trong form chỉnh sửa
function updateEditIngredientsAlert() {
    const rows = document.querySelectorAll('#editIngredientsList .edit-ingredient-row');
    const alert = document.getElementById('editNoIngredientsAlert');
    
    if (alert) {
        alert.style.display = rows.length > 0 ? 'none' : 'block';
    }
}

// Xử lý nút thêm nguyên liệu trong form chỉnh sửa
const btnAddEditIngredient = document.getElementById('btnAddEditIngredient');
if (btnAddEditIngredient) {
    btnAddEditIngredient.addEventListener('click', function() {
        addEditIngredientRow();
    });
}
// Hàm kiểm tra kiểm tra tên món ăn
function kiemTraTenMonAn(tenMonAn) {
    let isValid = true;
    const errorMessage = tenMonAn.nextElementSibling;
    errorMessage.innerHTML = '&nbsp;';
    // Kiểm tra xem có để trống không
    if(tenMonAn.value.trim() === '') {
        errorMessage.innerHTML = 'Tên món ăn không được để trống';
        isValid = false;
    }
    // Kiểm tra độ dài
    else if(tenMonAn.value.length < 3 || tenMonAn.value.length > 50) {
        errorMessage.innerHTML = 'Tên món ăn phải từ 3 đến 50 ký tự';
        isValid = false;
    }
    // Kiểm tra xem có chứa số không
    else if(/\d/.test(tenMonAn.value)) {
        errorMessage.innerHTML = 'Tên món ăn không được chứa số';
        isValid = false;
    }
    else {
        errorMessage.innerHTML = '&nbsp;';
    }
    return isValid;
}
// Hàm kiểm tra mô tả món ăn
function kiemTraMoTa(moTa) {
    let isValid = true;
    const errorMessage = moTa.nextElementSibling;
    errorMessage.innerHTML = '&nbsp;';
    // Kiểm tra không được để trống
    if(moTa.value.trim() === '') {
        errorMessage.innerHTML = 'Mô tả không được để trống';
        isValid = false;
    }
    else {
        errorMessage.innerHTML = '&nbsp;';
    }
    return isValid;
}
// Hàm kiểm tra hình ảnh món ăn
function kiemTraHinhAnh(hinhAnh) {
    let isValid = true;
    const errorMessage = hinhAnh.nextElementSibling;
    errorMessage.innerHTML = '&nbsp;';
    // Kiểm tra không được để trống
    if(hinhAnh.files.length === 0) {
        errorMessage.innerHTML = 'Vui lòng chọn hình ảnh';
        isValid = false;
    }
    else {
        errorMessage.innerHTML = '&nbsp;';
    }
    return isValid;
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