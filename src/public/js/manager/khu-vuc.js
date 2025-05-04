document.addEventListener('DOMContentLoaded', async function() {
    const addAreaForm = document.getElementById('addAreaForm');
    const addAreaModal = document.getElementById('addAreaModal');
    const editAreaModal = document.getElementById('editAreaModal');
    const editAreaForm = document.getElementById('editAreaForm');
    
    let listKhuVuc = await getAPIKhuVuc();
    thaoTacVoiBang(listKhuVuc);


    // Xử lý form thêm khu vực
    document.getElementById('addAreaForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        // TODO: Xử lý thêm khu vực
        const tenKhuVuc = document.querySelector('.txt-themKhuVuc').value;
        try{
            const res = await fetch('/api/khu-vuc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tenKhuVuc
                })
            })
            const data = await res.json();
            if(data.status){
                showToastSuccess("Thêm khu vực thành công!");
                listKhuVuc.unshift(data.obj);
                bootstrap.Modal.getInstance(addAreaModal).hide();
                addAreaForm.reset();
                thaoTacVoiBang(listKhuVuc);
            }
            else{
                showToastDanger(data.error);
                console.log(data.error);
            }
        }
        catch(err){
            showToastDanger();
            console.log(err);
        }
    });

    // Xử lý form chỉnh sửa khu vực
    document.getElementById('editAreaForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const tenKhuVuc = document.querySelector('.txt-suaKhuVuc').value;
        const areaId = document.querySelector('.txt-suaKhuVuc').dataset.id;
        try{
            const res = await fetch('/api/khu-vuc', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tenKhuVuc,
                    id: areaId
                })
            })
            const data = await res.json();
            if(data.status){
                showToastPrimary("Chỉnh sửa khu vực thành công!");
                const index = listKhuVuc.findIndex(item => item.id == areaId);
                if(index !== -1){
                    listKhuVuc[index].tenKhuVuc = tenKhuVuc;
                }
                bootstrap.Modal.getInstance(editAreaModal).hide();
                editAreaForm.reset();
                thaoTacVoiBang(listKhuVuc);
            }
            else{
                showToastDanger(data.error);
                console.log(data.error);
            }
        }
        catch(error){
            showToastDanger();
            console.log(error);
        }
    });
});
async function getAPIKhuVuc() {
    try{
        const res = await fetch('/api/khu-vuc')
        const data = await res.json();
        if(data.status){
            return data.list;
        }
        else{
            showToastDanger(data.error);
            console.log(data.error);
            return []
        }
    }
    catch(err){
        showToastDanger();
        console.log(err);
        return []
    }
}
function thaoTacVoiBang(list){
    const tableBody = document.querySelector('.table-danhSach tbody');
    tableBody.innerHTML = ''; // Xóa nội dung cũ
    list.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.tenKhuVuc}</td>
            <td>
                <button class="btn btn-sm btn-primary btn-sua" 
                    data-bs-toggle="modal"
                    data-bs-target="#editAreaModal"
                    data-bs-tooltip="tooltip"
                    data-id="${item.id}"
                    title="Chỉnh sửa">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    const tooltips = document.querySelectorAll('[data-bs-tooltip="tooltip"]');
    tooltips.forEach(tooltip => {
        new bootstrap.Tooltip(tooltip);
    });
    document.querySelectorAll('.btn-sua').forEach(button => {
        button.addEventListener('click', function() {
            const areaId = this.dataset.id;
            const areaName = this.closest('tr').querySelector('td:nth-child(2)').textContent;
            document.querySelector('.txt-suaKhuVuc').value = areaName;
            document.querySelector('.txt-suaKhuVuc').dataset.id = areaId;
        });
    });
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