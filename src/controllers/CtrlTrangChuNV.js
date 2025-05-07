module.exports = {
    index: (req, res) => {
        res.render('manager/trang-chu')
    },
    indexThanhToanOnline: (req, res) => {
        res.render('manager/thanh-toan-online');
    }
}