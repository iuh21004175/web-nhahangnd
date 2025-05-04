document.addEventListener('DOMContentLoaded', function() {
    console.log("Trang đã được tải xong");
    
    // Khởi tạo dữ liệu
    updateCurrentDate();
    initializeCharts();
    setupEventListeners();

    // Giả lập dữ liệu cho các thành phần khác
    loadSampleData();
});

/**
 * Cập nhật thông tin ngày hiện tại
 */
function updateCurrentDate() {
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        const today = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateElement.textContent = today.toLocaleDateString('vi-VN', options);
    }
}

/**
 * Khởi tạo biểu đồ thống kê
 */
function initializeCharts() {
    console.log("Bắt đầu khởi tạo biểu đồ");
    
    const performanceChartElement = document.getElementById('performance-chart');
    
    if (!performanceChartElement) {
        console.error("Không tìm thấy element có id 'performance-chart'");
        return;
    }
    
    console.log("Đã tìm thấy element performance-chart, tiến hành tạo biểu đồ");
    
    // Dữ liệu mẫu cho biểu đồ
    const options = {
        series: [
            {
                name: 'Giờ làm việc',
                type: 'column',
                data: [28, 30, 32, 24, 33, 26, 21]
            },
            {
                name: 'Hiệu suất (%)',
                type: 'line',
                data: [85, 88, 92, 78, 94, 86, 80]
            }
        ],
        chart: {
            height: 350,
            type: 'line',
            toolbar: {
                show: true
            },
            animations: {
                enabled: true
            }
        },
        stroke: {
            width: [0, 3]
        },
        dataLabels: {
            enabled: false
        },
        labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
        xaxis: {
            categories: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
        },
        yaxis: [
            {
                title: {
                    text: 'Giờ làm việc'
                }
            },
            {
                opposite: true,
                title: {
                    text: 'Hiệu suất (%)'
                },
                min: 0,
                max: 100
            }
        ],
        colors: ['#2E93fA', '#66DA26'],
        tooltip: {
            y: {
                formatter: function(value, { seriesIndex }) {
                    if (seriesIndex === 0) return value + ' giờ';
                    return value + '%';
                }
            }
        }
    };

    try {
        if (typeof ApexCharts === 'undefined') {
            console.error("ApexCharts không được định nghĩa. Vui lòng kiểm tra thư viện.");
            return;
        }
        
        const chart = new ApexCharts(performanceChartElement, options);
        chart.render();
        
        // Lưu trữ chart để có thể cập nhật sau này
        window.performanceChart = chart;
        
        console.log("Khởi tạo biểu đồ thành công");
    } catch (error) {
        console.error("Lỗi khi tạo biểu đồ:", error);
    }
}

/**
 * Cập nhật dữ liệu biểu đồ dựa trên khoảng thời gian
 */
function updateChartData(period) {
    console.log("Cập nhật dữ liệu biểu đồ cho period:", period);
    
    if (!window.performanceChart) {
        console.error("Biểu đồ chưa được khởi tạo");
        return;
    }
    
    let categories, workHoursData, performanceData, title;
    
    switch(period) {
        case 'week':
            categories = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
            workHoursData = [28, 30, 32, 24, 33, 26, 21];
            performanceData = [85, 88, 92, 78, 94, 86, 80];
            title = 'Ngày trong tuần';
            break;
        case 'month':
            categories = ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4'];
            workHoursData = [120, 135, 115, 125];
            performanceData = [88, 92, 85, 90];
            title = 'Tuần trong tháng';
            break;
        case 'quarter':
            categories = ['Tháng 1', 'Tháng 2', 'Tháng 3'];
            workHoursData = [380, 420, 390];
            performanceData = [86, 89, 84];
            title = 'Tháng trong quý';
            break;
        default:
            categories = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
            workHoursData = [28, 30, 32, 24, 33, 26, 21];
            performanceData = [85, 88, 92, 78, 94, 86, 80];
            title = 'Ngày trong tuần';
    }
    
    // Cập nhật dữ liệu biểu đồ
    window.performanceChart.updateOptions({
        xaxis: {
            categories: categories
        }
    });
    
    window.performanceChart.updateSeries([
        {
            name: 'Giờ làm việc',
            data: workHoursData
        },
        {
            name: 'Hiệu suất (%)',
            data: performanceData
        }
    ]);
    
    console.log("Đã cập nhật biểu đồ thành công");
}

/**
 * Thiết lập các sự kiện
 */
function setupEventListeners() {
    console.log("Thiết lập sự kiện cho các nút");
    
    // Sự kiện cho các nút lọc biểu đồ
    const chartFilterButtons = document.querySelectorAll('.chart-period-selector .btn');
    chartFilterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const period = this.getAttribute('data-period');
            console.log("Nút lọc được nhấp:", period);
            
            // Xóa class active từ tất cả các nút
            chartFilterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Thêm class active cho nút được nhấp
            this.classList.add('active');
            
            // Cập nhật dữ liệu biểu đồ
            updateChartData(period);
        });
    });
    
    // Các sự kiện khác có thể được thêm vào đây
    setupTaskCheckboxes();
}

/**
 * Thiết lập các checkbox nhiệm vụ
 */
function setupTaskCheckboxes() {
    const checkboxes = document.querySelectorAll('.task-list .form-check-input');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const label = this.nextElementSibling;
            if (this.checked) {
                label.classList.add('completed');
            } else {
                label.classList.remove('completed');
            }
            
            // Cập nhật số nhiệm vụ đã hoàn thành
            updateTaskCounter();
        });
    });
}

/**
 * Cập nhật bộ đếm nhiệm vụ
 */
function updateTaskCounter() {
    const totalTasks = document.querySelectorAll('.task-list .form-check-input').length;
    const completedTasks = document.querySelectorAll('.task-list .form-check-input:checked').length;
    
    const todayTasks = document.getElementById('today-tasks');
    if (todayTasks) {
        todayTasks.textContent = `${completedTasks} / ${totalTasks}`;
    }
    
    // Cập nhật thanh tiến độ nếu có
    const taskProgressBar = document.querySelector('.task-progress .progress-bar');
    if (taskProgressBar) {
        const percentage = (completedTasks / totalTasks) * 100;
        taskProgressBar.style.width = `${percentage}%`;
    }
}

/**
 * Tải dữ liệu mẫu cho các phần khác
 */
function loadSampleData() {
    // Đã có dữ liệu mẫu trong HTML, chỉ cần cập nhật một số thông tin động
    updateTaskCounter();
}