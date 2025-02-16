const multer = require('multer');

// Создание экземпляра Multer (без сохранения на диск)
const upload = multer({
    storage: multer.memoryStorage(), // Store file in memory
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit (adjust as needed)
    }
});

module.exports = upload;