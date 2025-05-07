module.exports = {
    index: (req, res) => {
        res.render('customer/trang-chu');
    },
    indexGioiThieu: (req, res) => {
        res.render('customer/gioi-thieu');
    },
    indexThanhToan: (req, res) => {
        res.render('customer/thanh-toan');
    },
    indexThanhToanOnline: (req, res) => {
        res.render('customer/thanh-toan-online');
    },
    indexDonHang: (req, res) => {
        res.render('customer/don-hang');
    }, 
    indexThongTinCaNhan: (req, res)=>{
        res.render('customer/thong-tin-ca-nhan')
    },
    indexChiTietSanPham: (req, res)=>{
        res.render('customer/chi-tiet-mon-an')
    }
    
}