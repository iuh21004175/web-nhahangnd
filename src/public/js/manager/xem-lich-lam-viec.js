document.addEventListener('DOMContentLoaded', function () {
    const select = document.getElementById("weekSelector");
    const tableBody = document.getElementById("scheduleTableBody");

    // Trả về thứ 2 đầu tiên của tuần chứa ngày truyền vào
    function getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = (day === 0 ? -6 : 1) - day;
        d.setDate(d.getDate() + diff);
        return d;
    }

    // Format dd/mm/yyyy
    function formatDate(date) {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    }

    // Tuần bắt đầu từ thứ 2 đầu tiên trong năm
    function getCustomWeekNumber(date) {
        const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const day = tempDate.getUTCDay() || 7; // 1 (Mon) to 7 (Sun)
        tempDate.setUTCDate(tempDate.getUTCDate() + 4 - day);
        const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((tempDate - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }

    // Lấy thứ 2 đầu tiên của năm
    function getFirstMondayOfYear(year) {
        const jan1 = new Date(year, 0, 1);
        const day = jan1.getDay();
        const diff = (day === 0 ? 1 : 8 - day);
        jan1.setDate(jan1.getDate() + diff);
        return jan1;
    }

    // Tạo các tùy chọn cho dropdown
    let current = getFirstMondayOfYear(new Date().getFullYear());
    const end = new Date(current.getFullYear(), 11, 31);

    let weekCount = 1;
    const weekMap = new Map(); // để lưu lại tuần với ngày bắt đầu

    while (current <= end) {
        const start = new Date(current);
        const endWeek = new Date(start);
        endWeek.setDate(start.getDate() + 6);

        const option = document.createElement("option");
        option.value = weekCount;
        option.textContent = `Tuần ${weekCount}: ${formatDate(start)} - ${formatDate(endWeek)}`;
        select.appendChild(option);

        weekMap.set(weekCount, new Date(start)); // lưu lại để sử dụng sau

        current.setDate(current.getDate() + 7);
        weekCount++;
    }

    // Tính tuần hiện tại theo custom logic
    const currentWeekNumber = getCustomWeekNumber(new Date());
    select.value = currentWeekNumber;
    function getCaLabel(trangThai) {
        switch (trangThai) {
            case 1: return { label: "Ca làm", class: "shift-working" };
            case 2: return { label: "Chờ duyệt", class: "shift-pending" };
            case 3: return { label: "Đã chấm công", class: "shift-approved" };
            default: return { label: "Trống", class: "shift-empty" };
        }
    }
    
    async function updateScheduleForSelectedWeek() {
        const selectedWeekNumber = parseInt(select.value);
        const startOfWeek = weekMap.get(selectedWeekNumber); // lấy từ map

        tableBody.innerHTML = '';

        const lichLamViec = await getAPIXemLich();

        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(startOfWeek);
            currentDay.setDate(startOfWeek.getDate() + i);
        
            const row = document.createElement("tr");
        
            const dateCell = document.createElement("td");
            dateCell.classList.add("date-cell", "text-center");
            dateCell.innerHTML = `<strong>${["Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy", "Chủ nhật"][i]}</strong><br><small>${formatDate(currentDay)}</small>`;
            row.appendChild(dateCell);
        
            // Ca sáng (0)
            const ca1 = lichLamViec.find(lich => {
                const lichDate = new Date(lich.ngay);
                return lich.caLamViec === 0 &&
                    lichDate.getDate() === currentDay.getDate() &&
                    lichDate.getMonth() === currentDay.getMonth() &&
                    lichDate.getFullYear() === currentDay.getFullYear();
            });
        
            const ca1Info = getCaLabel(ca1?.trangThai);
            const shiftMorningCell = document.createElement("td");
            shiftMorningCell.classList.add("text-center");
            const shiftMorning = document.createElement("div");
            shiftMorning.classList.add("shift-box", ca1Info.class);
            shiftMorning.textContent = ca1Info.label;
            shiftMorningCell.appendChild(shiftMorning);
            row.appendChild(shiftMorningCell);
        
            // Ca chiều (1)
            const ca2 = lichLamViec.find(lich => {
                const lichDate = new Date(lich.ngay);
                return lich.caLamViec === 1 &&
                    lichDate.getDate() === currentDay.getDate() &&
                    lichDate.getMonth() === currentDay.getMonth() &&
                    lichDate.getFullYear() === currentDay.getFullYear();
            });
        
            const ca2Info = getCaLabel(ca2?.trangThai);
            const shiftAfternoonCell = document.createElement("td");
            shiftAfternoonCell.classList.add("text-center");
            const shiftAfternoon = document.createElement("div");
            shiftAfternoon.classList.add("shift-box", ca2Info.class);
            shiftAfternoon.textContent = ca2Info.label;
            shiftAfternoonCell.appendChild(shiftAfternoon);
            row.appendChild(shiftAfternoonCell);
        
            tableBody.appendChild(row);
        }
        
    }

    select.addEventListener('change', updateScheduleForSelectedWeek);

    // Cập nhật ngay khi vào trang
    updateScheduleForSelectedWeek();
});

async function getAPIXemLich() {
    const selectedWeekNumber = parseInt(document.getElementById("weekSelector").value);
    const response = await fetch(`/api/xem-lich?tuan=${selectedWeekNumber}`);
    try {
        const data = await response.json();
        if (data.status) {
            return data.list;
        } else {
            console.error('Lỗi server:', data.error);
            return [];
        }
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

