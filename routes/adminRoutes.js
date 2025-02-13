const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile(__dirname + '/../views/adminPanel.html'); // Если HTML
    // res.render('adminPanel'); // Если EJS
});

module.exports = router;