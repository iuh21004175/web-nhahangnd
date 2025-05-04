document.addEventListener('DOMContentLoaded', async function() {
    let listKhuVuc = await getAPIKhuVuc()
    let listBan = await getAPIBan()
    renderKhuVuc(listKhuVuc)
    renderOptionKhuVuc(listKhuVuc)
    thaoTacVoiBang(listBan)

    // Xử lý chọn khu vực
    const areaItems = document.querySelectorAll('.list-group-item');
    areaItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            // Xóa active class từ tất cả items
            areaItems.forEach(i => i.classList.remove('active'));
            // Thêm active class cho item được chọn
            this.classList.add('active');
            
            // TODO: Lọc bàn theo khu vực
            const areaId = this.dataset.id;
            const filteredTables = listBan.filter(table => table.idKhuVuc == areaId || areaId == 'all');
            thaoTacVoiBang(filteredTables); // Cập nhật danh sách bàn
        });
    });

    // Xử lý lọc bàn
    const statusFilter = document.getElementById('statusFilter');
    const capacityFilter = document.getElementById('capacityFilter');

    statusFilter.addEventListener('change', function() {
        thaoTacVoiBang(listBan); // Cập nhật danh sách bàn
    })
    capacityFilter.addEventListener('change', function() {
        thaoTacVoiBang(listBan); // Cập nhật danh sách bàn
    })

    statusFilter.addEventListener('change', filterTables);
    capacityFilter.addEventListener('change', filterTables);

    const addTableForm = document.getElementById('addTableForm');
    const editTableForm = document.getElementById('editTableForm');
    const editTableModal = document.getElementById('editTableModal');

    // Lắng nghe sự kiện click trên nút chỉnh sửa
    document.querySelectorAll('.edit-table-btn').forEach(button => {
        button.addEventListener('click', function() {
            const tableCard = this.closest('.table-card');
            
            // Lấy thông tin từ table card
            const tableName = tableCard.querySelector('.table-name').textContent;
            const capacity = tableCard.querySelector('.table-capacity').textContent.replace(' người', '');
            const area = tableCard.querySelector('.table-area').textContent;
            
            // Điền thông tin vào form chỉnh sửa
            document.getElementById('editTableName').value = tableName;
            document.getElementById('editCapacity').value = capacity;
            
            // Set giá trị cho select khu vực
            const areaSelect = document.getElementById('editAreaId');
            Array.from(areaSelect.options).forEach(option => {
                if (option.text === area) {
                    areaSelect.value = option.value;
                }
            });
        });
    });

    // Xử lý submit form thêm
    addTableForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        // Xử lý thêm bàn
        try {
            const tenBan = document.getElementById('addTableName');
            if (tenBan.value.trim() === '') {
                document.getElementById('addTableError').classList.remove('d-none');
                document.getElementById('addTableErrorMessage').textContent = 'Tên bàn không được để trống';  
            }
            else{
                const res = await fetch('/api/ban', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        ten: tenBan.value.trim(),
                        sucChua: document.getElementById('addCapacity').value,
                        idKhuVuc: document.getElementById('addAreaId').value
                    })
                });
                const data = await res.json()
                if(data.status){
                    showToastSuccess("Thêm bàn thành công")
                    bootstrap.Modal.getInstance(document.getElementById('addTableModal')).hide(); // Ẩn modal
                    this.reset(); // Reset form
                    document.getElementById('addTableError').classList.add('d-none');
                    document.getElementById('addTableErrorMessage').textContent = '';
                    listBan.unshift(data.obj) // Thêm bàn mới vào đầu danh sách
                    thaoTacVoiBang(listBan) // Cập nhật lại danh sách bàn
                    const listBtnKhuVuc = document.querySelectorAll('.list-khuVuc button')
                    const btn = Array.from(listBtnKhuVuc).find(item => item.dataset.id == data.obj.idKhuVuc)
                    if(btn){
                        btn.querySelector('span').textContent = parseInt(btn.querySelector('span').textContent) + 1 // Cập nhật số bàn trong khu vực
                        document.querySelector('.soBanTatCa').textContent = parseInt(document.querySelector('.soBanTatCa').textContent) + 1 // Cập nhật tổng số bàn
                    }
                    Array.from(document.querySelectorAll('.list-group-item')).forEach(item => {
                        item.classList.remove('active')
                    });
                    document.querySelector('.list-group-item').classList.add('active') // Đặt lại khu vực đầu tiên là active

                }
                else{
                    showToastDanger(data.error)
                    console.log(data.error)
                }
            }
            
        }
        catch (error) {
            showToastDanger()
            console.log(error);
        }

       
    });
    // Xử lý submit form sửa
    editTableForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        // Xử lý sửa bàn
        const tenBan = document.getElementById('editTableName');
        if (tenBan.value.trim() === '') {
            document.getElementById('editTableError').classList.remove('d-none');
            document.getElementById('editTableErrorMessage').textContent = 'Tên bàn không được để trống';  
        }
        else{
            try{
                const res = await fetch('/api/ban', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: document.getElementById('editTableId').value,
                        ten: tenBan.value.trim(),
                        sucChua: document.getElementById('editCapacity').value,
                        idKhuVuc: document.getElementById('editAreaId').value,
                        trangThai: document.getElementById('editStatus').value
                    })
                });
                const data = await res.json()
                if(data.status){
                    showToastPrimary("Chỉnh sửa bàn thành công")
                    bootstrap.Modal.getInstance(editTableModal).hide(); // Ẩn modal
                    this.reset(); // Reset form
                    document.getElementById('editTableError').classList.add('d-none');
                    document.getElementById('editTableErrorMessage').textContent = '';
                    listBan = listBan.map(item => item.id == data.obj.id ? data.obj : item) // Cập nhật danh sách bàn
                    thaoTacVoiBang(listBan) // Cập nhật lại danh sách bàn
                }
                else{
                    showToastDanger(data.error)
                    console.log(data.error)
                }
            }
            catch (error) {
                showToastDanger()
                console.log(error);
            } 
        }
    });
});
// Hàm lấy danh sách khu vực từ API
async function getAPIKhuVuc() {
    try{
        const res = await fetch('/api/khu-vuc')
        const data = await res.json()
        if(data.status){
            return data.list
        }
        else{
            showToastDanger(data.error)
            console.log(data.error)
            return []
        }
    }
    catch (error) {
        showToastDanger()
        console.log(error);
        return []
    }
}
// Hàm lấy danh sách bàn từ API
async function getAPIBan() {
    try{
        const res = await fetch('/api/ban')
        const data = await res.json()
        if(data.status){
            return data.list
        }
        else{
            showToastDanger(data.error)
            console.log(data.error)
            return []
        }
    }
    catch (error) {
        showToastDanger()
        console.log(error);
        return []
    }
}
// Thao tác danh sách bàn
function thaoTacVoiBang(list){
    const tableList = document.querySelector('.table-danhSach')
    const statusFilter = document.getElementById('statusFilter');
    const capacityFilter = document.getElementById('capacityFilter');
    let soBanTrong = 0
    let soBanDangSuDung = 0
    let soBanBaoTri = 0
    tableList.innerHTML = '' // Xóa nội dung cũ
    list = list.filter(item => item.trangThai == statusFilter.value || statusFilter.value == 'all') // Lọc theo trạng thái
    list = list.filter(item => item.sucChua == capacityFilter.value || capacityFilter.value == 'all') // Lọc theo sức chứa
    if(list.length > 0){
        list.forEach((item, index) => {
            const card = document.createElement('div')
            card.className = 'table-card'
            card.innerHTML = `
                <div class="table-status ${item.trangThai == 0 ? 'empty' :  item.trangThai == 1 ? 'occupied' : 'maintenance'}"></div>
                <div class="table-info">
                    <h5 class="table-name">${item.ten}</h5>
                    <p class="mb-1"><i class="fas fa-users me-2"></i><span class="table-capacity">${item.sucChua} người</span></p>
                    <p class="mb-1"><i class="fas fa-map-marker-alt me-2"></i><span class="table-area">${item.KhuVuc.tenKhuVuc}</span></p>
                    <span class="badge ${item.trangThai == 0 ? 'bg-success' : item.trangThai == 1 ? 'bg-danger' : 'bg-warning'}">${item.trangThai == 0 ? 'Trống' : item.trangThai == 1 ? 'Đang sử dụng' : 'Bảo trì'}</span>
                </div>
                <div class="table-actions">
                    <button class="btn btn-sm btn-primary edit-table-btn" 
                        data-bs-toggle="modal" 
                        data-bs-target="#editTableModal"
                        data-id="${item.id}"
                        data-bs-tooltip="tooltip" 
                        title="Chỉnh sửa"
                        ${item.trangThai == 1 ? 'disabled' : ''}>
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            `
            tableList.appendChild(card)
            if(item.trangThai == 0){
                soBanTrong++
            }
            else if(item.trangThai == 1){
                soBanDangSuDung++
            }
            else{
                soBanBaoTri++
            }
        })
    }
    else{
        // Nếu không có bàn nào thì hiển thị thông báo "Không tìm thấy bàn nào"
        const noResult = document.createElement('div')
        noResult.className = 'no-result'
        noResult.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <p>Không tìm thấy bàn nào</p>
        `
        tableList.appendChild(noResult)
    }
    document.getElementById('emptyCount').textContent = soBanTrong
    document.getElementById('occupiedCount').textContent = soBanDangSuDung
    document.getElementById('maintenanceCount').textContent = soBanBaoTri
    // Khởi tạo tooltips
    const tooltips = document.querySelectorAll('[data-bs-tooltip="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });
    
    document.querySelectorAll('.edit-table-btn').forEach(button => {
        button.addEventListener('click', function() {
            const id = this.dataset.id
            const ban = list.find(item => item.id == id)
            if(ban){
                document.getElementById('editTableId').value = id
                document.getElementById('editTableName').value = ban.ten
                document.getElementById('editCapacity').value = ban.sucChua
                const areaSelect = document.getElementById('editAreaId')
                areaSelect.value = ban.idKhuVuc
                document.getElementById('editStatus').value = ban.trangThai
            }
        });
    })
}
// Thao tác danh sách khu vực
function renderKhuVuc(list){
    const khuVucList = document.querySelector('.list-khuVuc')
    let tongSoBan = 0
    list.forEach(item => {
        const khuVucItem = `
            <button class="list-group-item list-group-item-action" data-id="${item.id}">
                <i class="fas fa-map-marker-alt me-2"></i>${item.tenKhuVuc}
                <span class="badge bg-secondary rounded-pill ms-2">${item.soBan}</span>
            </button>
        `
        khuVucList.insertAdjacentHTML('beforeend', khuVucItem)
        tongSoBan += item.soBan
    })
    document.querySelector('.soBanTatCa').textContent = tongSoBan
}
function renderOptionKhuVuc(list){
    const addComboboxKhuVuc = document.getElementById('addAreaId')
    const editComboboxKhuVuc = document.getElementById('editAreaId')
    list.forEach(item => {
        const option = document.createElement('option')
        option.value = item.id
        option.textContent = item.tenKhuVuc
        addComboboxKhuVuc.appendChild(option.cloneNode(true))
        editComboboxKhuVuc.appendChild(option.cloneNode(true))
    })
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
function showToastPrimary(content = null) { //showSuccessToastSua()
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