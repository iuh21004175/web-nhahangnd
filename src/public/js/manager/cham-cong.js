document.addEventListener('DOMContentLoaded', async function() {
    // Lấy ngày hiện tại
    const today = new Date(); // Tạo đối tượng Date từ ngày hiện tại
    const currentDate = today.toISOString().split('T')[0]; // Format cho API
    console.log('Ngày hiện tại:', currentDate);
    
    // Định dạng ngày hiển thị
    const formattedDate = formatDateDisplay(today); // Truyền đối tượng Date vào hàm
    
    // Hiển thị ngày hiện tại vào phần tử HTML
    const currentDateElement = document.getElementById('currentDate');
    if (currentDateElement) {
        currentDateElement.textContent = formattedDate;
    }
    
    // Tiếp tục code khác
    let listChamCong = await getAPICaChamCong(currentDate);
    thaoTacVoiBang(listChamCong);
});

async function getAPICaChamCong(currentDate) {
    try {
        const response = await fetch(`/api/ca-cham-cong?day=${currentDate}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if(data.status){
            console.log('Dữ liệu chấm công:', data);
            return data.list;
        }
        else{
            console.error('Lỗi khi tải dữ liệu chấm công:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu chấm công:', error);
        return [];
    }
}
function thaoTacVoiBang(list){
    const tableBody = document.querySelector('.table-danhSach tbody'); // Thay đổi selector nếu cần
    tableBody.innerHTML = ''; // Xóa nội dung hiện tại của bảng
    if (list.length > 0) {
        list.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>#${item.NhanVien.id}</td>
                <td>${item.NhanVien.ten}</td>
                <td>${item.caLamViec == 0 ? 'Ca sáng (06:00 - 14:00)' : 'Ca chiều (14:00 - 22:00)' }</td>
                <td>${formatTime(item.checkIn)}</td>
                <td>${formatTime(item.checkOut)}</td>
                <td>${item.trangThai == 1 ? '<span class="badge bg-warning">Chưa check-in</span>' 
                    : item.trangThai == 2 ? '<span class="badge bg-primary">Đang làm việc</span>'
                    : '<span class="badge bg-success">Đã chấm công</span>'}</td>
                <td>${item.trangThai == 1 ? 
                    `<button class="btn btn-sm btn-success check-in-btn" 
                                                data-employee-id="${item.id}"
                                                onclick="checkIn(${item.id})" 
                                                >
                                            <i class="fas fa-sign-in-alt me-1"></i>Check-in
                                        </button>
                                        <button class="btn btn-sm btn-danger check-out-btn" 
                                                data-employee-id="${item.id}"
                                                onclick="checkOut(${item.id})"
                                                disabled>
                                            <i class="fas fa-sign-out-alt me-1"></i>Check-out
                                        </button>` 
                    : item.trangThai == 2 ? 
                    `<button class="btn btn-sm btn-success check-in-btn" 
                                                data-employee-id="${item.id}"
                                                onclick="checkIn(${item.id})" 
                                                disabled>
                                            <i class="fas fa-sign-in-alt me-1"></i>Check-in
                                        </button>
                                        <button class="btn btn-sm btn-danger check-out-btn" 
                                                data-employee-id="${item.id}"
                                                onclick="checkOut(${item.id})"
                                                >
                                            <i class="fas fa-sign-out-alt me-1"></i>Check-out
                                        </button>`
                    : 
                    `<button class="btn btn-sm btn-success check-in-btn" 
                                                data-employee-id="${item.id}"
                                                onclick="checkIn(${item.id})" 
                                                disabled>
                                            <i class="fas fa-sign-in-alt me-1"></i>Check-in
                                        </button>
                                        <button class="btn btn-sm btn-danger check-out-btn" 
                                                data-employee-id="${item.id}"
                                                onclick="checkOut(${item.id})"
                                                disabled>
                                            <i class="fas fa-sign-out-alt me-1"></i>Check-out
                                        </button>`}
                </td>
            `;
            tableBody.appendChild(row);        
        });
    }
    else{
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="8" class="text-center">Không có dữ liệu</td>`
        tableBody.appendChild(row);
    }
    
}
// Hàm xử lý check-in
async function checkIn(chamCongId) {
    try {
        // Gọi API check-in
        const response = await fetch('/api/ca-cham-cong/check-in', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: chamCongId })
        });
        
        const result = await response.json();
        
        if (result.status) {
            // Hiển thị thông báo thành công
            showToastSuccess("Check-in thành công!");
            
            // Tải lại dữ liệu
            const currentDate = new Date().toISOString().split('T')[0];
            let listChamCong = await getAPICaChamCong(currentDate);
            thaoTacVoiBang(listChamCong);
        } else {
            showToastDanger(result.message);
        }
    } catch (error) {
        console.error("Lỗi khi thực hiện check-in:", error);
        showToastDanger("Đã xảy ra lỗi khi thực hiện check-in");
    }
}

// Hàm xử lý check-out
async function checkOut(chamCongId) {
    try {
        // Gọi API check-out
        const response = await fetch('/api/ca-cham-cong/check-out', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: chamCongId })
        });
        
        const result = await response.json();
        
        if (result.status) {
            // Hiển thị thông báo thành công
            showToastSuccess("Check-out thành công!");
            
            // Tải lại dữ liệu
            const currentDate = new Date().toISOString().split('T')[0];
            let listChamCong = await getAPICaChamCong(currentDate);
            thaoTacVoiBang(listChamCong);
        } else {
            showToastDanger(result.message);
        }
    } catch (error) {
        console.error("Lỗi khi thực hiện check-out:", error);
        showToastDanger("Đã xảy ra lỗi khi thực hiện check-out");
    }
}
// Hàm định dạng thời gian từ datetime sang giờ:phút
function formatTime(dateTimeStr) {
    if (!dateTimeStr) return '--:--';
    
    const date = new Date(dateTimeStr);
    if (isNaN(date)) return '--:--';
    
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${hours}:${minutes}`;
}
function formatDateDisplay(date) {
    // Nếu date là chuỗi, chuyển thành đối tượng Date
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    // Kiểm tra nếu date không phải Date hợp lệ
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
        return 'N/A';
    }
    
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const dayOfWeek = days[date.getDay()];
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${dayOfWeek}, ${day}/${month}/${year}`;
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