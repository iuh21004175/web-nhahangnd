document.addEventListener('DOMContentLoaded', function () {
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    const resultTbody = document.getElementById('attendanceData');
    const totalWorkingDays = document.getElementById('totalWorkingDays');
    const totalWorkingHours = document.getElementById('totalWorkingHours'); 
    const totalSalary = document.getElementById('totalSalary');

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Thêm năm hiện tại
    const yearOption = document.createElement('option');
    yearOption.value = currentYear;
    yearOption.textContent = currentYear;
    yearOption.selected = true;
    yearSelect.appendChild(yearOption);

    // Thêm 12 tháng
    for (let i = 1; i <= 12; i++) {
        const monthOption = document.createElement('option');
        monthOption.value = i;
        monthOption.textContent = `Tháng ${i}`;
        if (i === currentMonth) {
            monthOption.selected = true;
        }
        monthSelect.appendChild(monthOption);
    }

    // Gọi API khi thay đổi tháng hoặc năm
    yearSelect.addEventListener('change', loadShifts);
    monthSelect.addEventListener('change', loadShifts);

    // Gọi lần đầu
    loadShifts();

    async function loadShifts() {
        const thang = monthSelect.value;
        const nam = yearSelect.value;

        let totalHours = 0; // Biến để lưu tổng số giờ làm

        try {
            const response = await fetch(`/api/luong?thang=${thang}&nam=${nam}`);
            const data = await response.json();

            if (data.status) {
                if (data.data.length === 0) {
                    resultTbody.innerHTML = `<tr><td colspan="6">Không có ca làm việc trong tháng ${thang}/${nam}.</td></tr>`;
                    // Đặt lại tổng ngày và tổng giờ làm
                    totalWorkingDays.textContent = `0 ngày`;
                    totalWorkingHours.textContent = `0 giờ`;
                    totalSalary.textContent = `0₫`;
                } else {
                    resultTbody.innerHTML = data.data.map(item => {
                        const dateObj = new Date(item.ngay);
                        const weekday = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][dateObj.getDay()];
                        const day = String(dateObj.getDate()).padStart(2, '0');
                        const month = String(dateObj.getMonth() + 1).padStart(2, '0');

                        const start = item.checkIn ? new Date(item.checkIn).getUTCHours() + ':' + String(new Date(item.checkIn).getUTCMinutes()).padStart(2, '0') : 'N/A';
                        const end = item.checkOut ? new Date(item.checkOut).getUTCHours() + ':' + String(new Date(item.checkOut).getUTCMinutes()).padStart(2, '0') : 'N/A';

                        // Chuyển thời gian thành phút từ đầu ngày
                        const startMinutes = start !== 'N/A' ? (parseInt(start.split(":")[0]) * 60 + parseInt(start.split(":")[1])) : 0;
                        const endMinutes = end !== 'N/A' ? (parseInt(end.split(":")[0]) * 60 + parseInt(end.split(":")[1])) : 0;

                        // Tính sự chênh lệch giữa end và start (theo phút)
                        const totalMinutes = endMinutes - startMinutes;

                        // Chuyển phút thành giờ
                        const totalHoursForDay = totalMinutes / 60;

                        // Làm tròn đến 2 chữ số thập phân
                        const totalHoursRounded = Math.round(totalHoursForDay * 100) / 100;

                        // Dummy hệ số và ghi chú (có thể thay bằng logic thực)
                        const heSo = item.heSoLuong || 1; // sử dụng hệ số lương từ backend, mặc định là 1 nếu không có
                        const ghiChu = item.ghiChu || ''; // có thể là ngày lễ chẳng hạn

                        // Tính tổng giờ làm có tính hệ số
                        totalHours += totalHoursForDay * heSo;

                        return ` 
                            <tr>
                                <td>${weekday}, ${day}/${month}</td>
                                <td><span class="time-badge">${start}</span></td>
                                <td><span class="time-badge">${end}</span></td>
                                <td><span class="total-hours">${totalHoursRounded} giờ</span></td>
                                <td><span class="coefficient">${heSo}</span></td>
                                <td><span class="holiday-note">${ghiChu}</span></td>
                            </tr>
                        `;
                    }).join('');

                    // Đếm số dòng trong bảng (số ngày làm)
                    const totalDays = resultTbody.getElementsByTagName('tr').length;

                    // Hiển thị tổng số ngày làm
                    totalWorkingDays.textContent = `${totalDays} ngày`;

                    // Hiển thị tổng số giờ làm
                    totalWorkingHours.textContent = `${Math.round(totalHours * 100) / 100} giờ`;

                    // Lương theo giờ
                    const basicSalary = 30000; // Đơn giá theo giờ
                    const salary = basicSalary * totalHours;

                    // Hiển thị tổng lương
                    totalSalary.textContent = `${salary.toLocaleString()}₫`;
                }
            } else {
                resultTbody.innerHTML = `<tr><td colspan="6">Lỗi: ${data.error}</td></tr>`;
            }
        } catch (err) {
            console.error(err);
            resultTbody.innerHTML = `<tr><td colspan="6">Lỗi khi tải dữ liệu.</td></tr>`;
        }
    }
});
