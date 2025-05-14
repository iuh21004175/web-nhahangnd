document.addEventListener('DOMContentLoaded', async function() {
    let listKhuVuc = await getAPIKhuVuc();
    let listBan = await getAPIBan();
    renderKhuVuc(listKhuVuc)
    thaoTacVoiBan(listBan)
    const socket = io();
    socket.on('connect', function() {
        console.log('Kết nối thành công với server:', socket.id);
        socket.on('cap-nhat-trang-thai-ban', function(data) {
            console.log('Nhận dữ liệu cập nhật trạng thái bàn:', data);
            const { id, trangThai } = data;
            const tableCard = document.querySelector(`.table-card[data-id-ban="${id}"]`);
            if (tableCard) {
                const statusElement = tableCard.querySelector('.table-status');
                const badgeElement = tableCard.querySelector('.badge');
                if (statusElement) {
                    statusElement.className = `table-status ${trangThai == 0 ? 'empty' : trangThai == 1 ? 'occupied' : 'maintenance'}`;
                }
                if (badgeElement) {
                    badgeElement.className = `badge ${trangThai == 0 ? 'bg-success' : trangThai == 1 ? 'bg-danger' : 'bg-warning'}`;
                    badgeElement.textContent = trangThai == 0 ? 'Trống' : trangThai == 1 ? 'Đang sử dụng' : 'Bảo trì';
                }
            }
        });
    });
    const khuVucList = document.querySelector('.list-group');
    
    // Phải attach event listener sau khi render khu vực
    khuVucList.addEventListener('click', function(e) {
        e.preventDefault();
        const target = e.target.closest('.list-group-item');
        if (!target) return;

        // Xóa active từ tất cả
        document.querySelectorAll('.list-group-item').forEach(item => item.classList.remove('active'));
        target.classList.add('active');

        const areaId = target.dataset.areaId;
        const filteredTables = listBan.filter(table => table.idKhuVuc == areaId || areaId == 'all');
        thaoTacVoiBan(filteredTables);
    });
});


async function getAPIKhuVuc() {
    try {
        const res = await fetch('/api/khu-vuc')
        const data = await res.json()
        if (data.status) {
            return data.list
        } else {
            showToastDanger(data.error)
            console.error(data.error)
            return []
        }
    } catch (error) {
        showToastDanger()
        console.error(error)
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
// Hàm lấy bàn 
function thaoTacVoiBan(list){
    const banList = document.querySelector('.listBan');
    banList.innerHTML = '';

    list.forEach(item => {
        const card = `
                <div class="table-card" data-id-ban="${item.id}">
                    <div class="table-status ${item.trangThai == 0 ? 'empty' :  item.trangThai == 1 ? 'occupied' : 'maintenance'}"></div>
                    <div class="table-info">
                        <h5 class="table-name">${item.ten}</h5>
                        <p class="mb-1"><i class="fas fa-users me-2"></i><span class="table-capacity">${item.sucChua} người</span></p>
                        <p class="mb-1"><i class="fas fa-map-marker-alt me-2"></i><span class="table-area">${item.KhuVuc.tenKhuVuc}</span></p>
                        <span class="badge ${item.trangThai == 0 ? 'bg-success' : item.trangThai == 1 ? 'bg-danger' : 'bg-warning'}">${item.trangThai == 0 ? 'Trống' : item.trangThai == 1 ? 'Đang sử dụng' : 'Bảo trì'}</span>
                    </div>
                </div>
        `;
        banList.insertAdjacentHTML('beforeend', card);
    })

    // 
    const tableCards = document.querySelectorAll('.table-card');
    tableCards.forEach(card => {
        card.addEventListener('click', function() {
            const idBan = this.dataset.idBan;
            window.location.href = `/manager/ghi-don-hang?idBan=${idBan}`;
        });
    });
}


// Hàm lấy khu vực
function renderKhuVuc(list) {
    const khuVucList = document.querySelector('.list-group'); 
    khuVucList.innerHTML = '';

    // Tạo khu vực "Tất cả" trước
    let tongSoBan = 0;
    list.forEach(item => {
        tongSoBan += item.soBan;
    });

    const allArea = `
        <a href="#" class="list-group-item list-group-item-action active" data-area-id="all">
            <i class="fas fa-border-all me-2"></i>Tất cả
            <span class="badge bg-secondary rounded-pill ms-2 soBanTatCa">${tongSoBan}</span>
        </a>
    `;
    khuVucList.insertAdjacentHTML('beforeend', allArea);

    // Thêm từng khu vực
    list.forEach(item => {
        const khuVucItem = `
            <a href="#" class="list-group-item list-group-item-action" data-area-id="${item.id}">
                <i class="fas fa-map-marker-alt me-2"></i>${item.tenKhuVuc}
                <span class="badge bg-secondary rounded-pill ms-2">${item.soBan}</span>
            </a>
        `;
        khuVucList.insertAdjacentHTML('beforeend', khuVucItem);
    });
}
