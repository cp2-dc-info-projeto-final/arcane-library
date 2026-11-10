
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Caminho onde as imagens serão armazenadas
const uploadDir = path.join(__dirname, '..', 'src', 'uploads');

// Cria a pasta automaticamente caso ela não exista
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const nome = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname).toLowerCase()}`;

        cb(null, nome);
    }
});

const fileFilter = (req, file, cb) => {
    const formatosPermitidos = [
        'image/jpeg',
        'image/png',
        'image/webp'
    ];

    if (formatosPermitidos.includes(file.mimetype)) {
        return cb(null, true);
    }

    cb(new Error('Formato de imagem não permitido.'));
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = upload;
