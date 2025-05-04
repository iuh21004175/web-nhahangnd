document.addEventListener('DOMContentLoaded', async function() {
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
});
function thaoTacVoiBang(list){
    const tableBody = document.querySelector('.table-danhSach tbody');
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
            <td>${item.hanSuDung}</td>
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