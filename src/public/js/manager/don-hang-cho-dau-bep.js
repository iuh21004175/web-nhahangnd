// Thêm biến để theo dõi trạng thái đầu bếp có đang chế biến món nào không
let isChefCooking = false;

document.addEventListener('DOMContentLoaded', async function() {
    let listMonCho = await getAPIMonCho();
    let monDangCheBien = await getAPIMonDangCheBien();
    
    // Kiểm tra xem đầu bếp có đang chế biến món nào không
    if(monDangCheBien) {
        isChefCooking = true;
        capNhatDangCheBien(monDangCheBien);
    } else {
        isChefCooking = false;
    }
    
    // Hiển thị danh sách món chờ với trạng thái nút phù hợp
    thaoTacMonCho(listMonCho);
    
    document.getElementById('completeDishBtn').addEventListener('click', async function() {
        const id = this.dataset.id;
        if (id) {
            try {
                const response = await fetch('/api/mon-dang-che-bien/hoan-thanh', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id })
                });
                const data = await response.json();
                if(data.status){
                    stopTimer();
                    document.getElementById('noDishInProgress').classList.remove('d-none');
                    document.getElementById('currentDishInfo').classList.add('d-none');
                    
                    // Cập nhật trạng thái đầu bếp không còn chế biến món nào
                    isChefCooking = false;
                    
                    // Cập nhật lại danh sách món chờ với nút đã được kích hoạt
                    let updatedList = await getAPIMonCho();
                    thaoTacMonCho(updatedList);
                    
                    showToastSuccess('Món ăn đã được hoàn thành.');
                }
                else{
                    showToastDanger('Lỗi khi hoàn thành món ăn. Vui lòng thử lại sau.');
                }
            } catch (error) {
                console.error('Error completing dish:', error);
                showToastDanger('Lỗi khi hoàn thành món ăn. Vui lòng thử lại sau.');
            }
        }
    });
});

// Hàm thaoTacMonCho được cập nhật để xử lý trạng thái vô hiệu hóa nút
function thaoTacMonCho(list){
    let tableBody = document.querySelector('#pendingDishesTable');
    tableBody.innerHTML = ''; // Xóa nội dung hiện tại của tbody
    
    if(list.length > 0){
        list.forEach((item, index) => {
            let row = document.createElement('tr');
            
            // Thêm thuộc tính disabled cho nút nếu đầu bếp đang chế biến món
            const buttonDisabled = isChefCooking ? 'disabled' : '';
            const buttonTooltip = isChefCooking ? 'data-bs-toggle="tooltip" data-bs-placement="top" title="Bạn đang chế biến món khác"' : '';
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <img src="${item.MonAn.hinhAnh}" alt="${item.MonAn.ten}" class="dish-thumbnail me-2" width="40" height="40">
                        <div>
                            <div class="fw-bold">${item.MonAn.ten}</div>
                            <small class="text-muted">${item.MonAn.GhiChu ? item.MonAn.GhiChu : 'Không có'}</small>
                        </div>
                    </div>
                </td>
                <td>#${item.idDonHang}</td>
                <td>${item.soLuong}</td>
                <td>${formatDateTime(item.thoiGianCapNhat)}</td>
                <td>
                    <button class="btn btn-primary btn-sm take-dish-btn" ${buttonDisabled} ${buttonTooltip} data-id="${item.id}">
                        <i class="fas fa-utensils me-1"></i> Nhận món
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Khởi tạo tooltips nếu có
        if (isChefCooking) {
            // Khởi tạo tooltips - Bootstrap 5
            const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.map(function (tooltipTriggerEl) {
                return new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }

        // Thêm sự kiện click cho các nút
        document.querySelectorAll('.take-dish-btn').forEach(button => {
            button.addEventListener('click', async function() {
                // Nếu nút bị vô hiệu hóa, không thực hiện hành động
                if (this.disabled) return;
                
                const id = this.dataset.id;
                const monDangCheBien = list.find(item => item.id == id);
                
                if (monDangCheBien) {
                    try {
                        const response = await fetch('/api/mon-dang-cho/nhan-mon', {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ id })
                        });
                        const data = await response.json();
                        
                        if(data.status){
                            // Cập nhật trạng thái đầu bếp đang chế biến món
                            isChefCooking = true;
                            
                            showToastSuccess('Nhận món thành công.');
                            
                            // Cập nhật lại danh sách món đang chờ với nút đã bị vô hiệu hóa
                            let updatedList = await getAPIMonCho();
                            thaoTacMonCho(updatedList);
                            
                            // Cập nhật thông tin món đang chế biến
                            capNhatDangCheBien(data.obj);
                        }
                        else{
                            showToastDanger('Lỗi khi nhận món. Vui lòng thử lại sau.');
                        }
                    }
                    catch (error) {
                        console.error('Error receiving dish:', error);
                        showToastDanger('Lỗi khi nhận món. Vui lòng thử lại sau.');
                    }
                } else {
                    showToastDanger('Món không tồn tại trong danh sách chờ.');
                }
            });
        });
    }
    else{
        let row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="6" class="text-center">Không có món nào trong danh sách chờ.</td>
        `;
        tableBody.appendChild(row);
    }
}

async function getAPIMonCho() { // Hàm này sẽ gọi API để lấy danh sách món đang chờ
    try {
        const response = await fetch('/api/mon-dang-cho');
        const data = await response.json();
        if(data.status){
            return data.list
        }
        else{
            showToastDanger('Lỗi khi tải danh sách món chờ. Vui lòng thử lại sau.');
            return []
        }
    } catch (error) {
        console.error('Error fetching mon cho:', error);
        showToastDanger('Lỗi khi tải danh sách món chờ. Vui lòng thử lại sau.');
        return []
    }
}
async function getAPIMonDangCheBien() { // Hàm này sẽ gọi API để lấy danh sách món đang chế biến
    try {
        const response = await fetch('/api/mon-dang-che-bien');
        const data = await response.json();
        if(data.status){
            return data.obj
        }
        else{

            showToastDanger('Lỗi khi tải danh sách món chế biến. Vui lòng thử lại sau.');
            return null
        }
    }
    catch (error) {
        console.error('Error fetching mon dang che bien:', error);
        showToastDanger('Lỗi khi tải danh sách món chế biến. Vui lòng thử lại sau.');
        return null
    }
}
// Biến lưu trữ thông tin về đồng hồ
let timerInterval;
let startTime;
let isRunning = false;

/**
 * Cập nhật thông tin món ăn đang chế biến và bắt đầu đồng hồ bấm giờ
 * @param {Object} item - Thông tin món ăn đang chế biến
 */
function capNhatDangCheBien(item) {
    // Cập nhật thông tin món ăn lên giao diện
    document.getElementById('currentDishName').textContent = item.MonAn.ten;
    document.getElementById('currentOrderId').textContent = item.idDonHang;
    document.getElementById('currentDishQuantity').textContent = item.soLuong;
    document.getElementById('currentDishStartTime').textContent = formatDateTime(item.thoiGianCapNhat);
    document.getElementById('currentDishNote').textContent = item.MonAn.GhiChu ? item.MonAn.GhiChu : 'Không có';
    document.getElementById('currentDishImage').src = item.MonAn.hinhAnh;
    document.getElementById('currentDishImage').alt = item.MonAn.ten;
    document.getElementById('completeDishBtn').dataset.id = item.id;
    
    // Chuyển từ phần "Không có món đang chế biến" sang phần hiển thị món
    document.getElementById('noDishInProgress').classList.add('d-none');
    document.getElementById('currentDishInfo').classList.remove('d-none');

    // Lấy thời gian bắt đầu chế biến
    const thoiGianBatDau = new Date(item.thoiGianCapNhat);
    
    // Khởi tạo đồng hồ bấm giờ
    initializeAndStartTimer(thoiGianBatDau);
}

/**
 * Khởi tạo và bắt đầu đồng hồ bấm giờ
 * @param {Date} thoiGianBatDau - Thời điểm bắt đầu chế biến
 */
function initializeAndStartTimer(thoiGianBatDau) {
    // Dừng timer cũ nếu đang chạy
    stopTimer();
    
    // Thiết lập thời gian bắt đầu
    startTime = thoiGianBatDau;
    
    // Cập nhật timer ngay lập tức
    updateTimerDisplay();
    
    // Bắt đầu chạy timer
    isRunning = true;
    timerInterval = setInterval(updateTimerDisplay, 1000);
}

/**
 * Cập nhật hiển thị đồng hồ bấm giờ
 */
function updateTimerDisplay() {
    if (!startTime) return;
    
    // Tính thời gian đã trôi qua
    const now = new Date();
    const elapsedTime = now - startTime;
    
    // Chuyển thành phút và giây
    const minutes = Math.floor(elapsedTime / (60 * 1000));
    const seconds = Math.floor((elapsedTime % (60 * 1000)) / 1000);
    
    // Định dạng thời gian với số 0 đứng trước nếu cần
    const displayMinutes = String(minutes).padStart(2, '0');
    const displaySeconds = String(seconds).padStart(2, '0');
    
    // Cập nhật hiển thị
    const timerElement = document.getElementById('dishTimer');
    timerElement.textContent = `${displayMinutes}:${displaySeconds}`;
    
    // Đổi màu nếu thời gian chờ quá 15 phút
    if (minutes >= 15) {
        timerElement.classList.add('text-danger', 'fw-bold');
    } else {
        timerElement.classList.remove('text-danger', 'fw-bold');
    }
}

/**
 * Dừng đồng hồ bấm giờ
 */
function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    isRunning = false;
}
/**
 * Chuyển đổi chuỗi thời gian ISO sang định dạng dd/mm/yyyy hh:mm
 * @param {string|Date} dateTimeStr - Chuỗi thời gian ISO hoặc đối tượng Date
 * @returns {string} Chuỗi thời gian đã định dạng
 */
function formatDateTime(dateTimeStr) {
    // Kiểm tra nếu đầu vào là null hoặc undefined
    if (!dateTimeStr) return 'N/A';
    
    try {
        // Chuyển đổi thành đối tượng Date
        const date = new Date(dateTimeStr);
        
        // Kiểm tra nếu date không hợp lệ
        if (isNaN(date.getTime())) return 'Ngày không hợp lệ';
        
        // Lấy các thành phần của ngày tháng
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Tháng bắt đầu từ 0
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        // Trả về chuỗi đã định dạng
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
        console.error('Lỗi khi định dạng thời gian:', error);
        return 'Lỗi định dạng';
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

