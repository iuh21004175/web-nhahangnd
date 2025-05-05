document.addEventListener('DOMContentLoaded', function () {
    const select = document.getElementById("weekSelector");
    const tableBody = document.getElementById("scheduleTableBody");

    // Format dd/mm/yyyy
    function formatDate(date) {
        const d = date.getDate().toString().padStart(2, '0');
        const m = (date.getMonth() + 1).toString().padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    }

    // Trả về thứ 2 đầu tiên của tuần ISO 1 (tuần chứa ngày 4/1)
    function getFirstISOWeekMonday(year) {
        const jan4 = new Date(Date.UTC(year, 0, 4)); // Jan 4 luôn thuộc tuần 1 ISO
        const day = jan4.getUTCDay() || 7; // Chủ nhật = 7
        const monday = new Date(jan4);
        monday.setUTCDate(jan4.getUTCDate() - day + 1); // về thứ 2
        return monday;
    }

    // Tính tuần ISO hiện tại
    function getISOWeekNumber(date) {
        const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNr = target.getUTCDay() || 7;
        target.setUTCDate(target.getUTCDate() + 4 - dayNr);
        const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((target - yearStart) / 86400000) + 1) / 7);
        return weekNo;
    }

    // Danh sách tuần theo chuẩn ISO
    const year = new Date().getFullYear();
    let current = getFirstISOWeekMonday(year);
    const end = new Date(Date.UTC(year, 11, 31));
    let weekCount = 1;
    const weekMap = new Map();

    while (current <= end) {
        const start = new Date(current);
        const endWeek = new Date(current);
        endWeek.setUTCDate(current.getUTCDate() + 6);

        const option = document.createElement("option");
        option.value = weekCount;
        option.textContent = `Tuần ${weekCount}: ${formatDate(start)} - ${formatDate(endWeek)}`;
        select.appendChild(option);

        weekMap.set(weekCount, new Date(start));
        current.setUTCDate(current.getUTCDate() + 7);
        weekCount++;
    }

    const currentWeekNumber = getISOWeekNumber(new Date());
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
        const startOfWeek = weekMap.get(selectedWeekNumber);

        tableBody.innerHTML = '';
        const lichLamViec = await getAPIXemLich();

        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(startOfWeek);
            currentDay.setUTCDate(startOfWeek.getUTCDate() + i);

            const row = document.createElement("tr");

            const dateCell = document.createElement("td");
            dateCell.classList.add("date-cell", "text-center");
            dateCell.innerHTML = `<strong>${["Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy", "Chủ nhật"][i]}</strong><br><small>${formatDate(currentDay)}</small>`;
            row.appendChild(dateCell);

            // Ca sáng (0)
            const ca1 = lichLamViec.find(lich => {
                const lichDate = new Date(lich.ngay);
                return lich.caLamViec === 0 &&
                    lichDate.getDate() === currentDay.getUTCDate() &&
                    lichDate.getMonth() === currentDay.getUTCMonth() &&
                    lichDate.getFullYear() === currentDay.getUTCFullYear();
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
                    lichDate.getDate() === currentDay.getUTCDate() &&
                    lichDate.getMonth() === currentDay.getUTCMonth() &&
                    lichDate.getFullYear() === currentDay.getUTCFullYear();
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
