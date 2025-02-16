const multer = require('multer');
const path = require('path');

// Настройка хранилища для Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/'); // Папка для сохранения загруженных файлов
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Создание экземпляра Multer
const upload = multer({ storage: storage });

module.exports = upload;