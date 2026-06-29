import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let destFolder = 'uploads'; 

        if (file.fieldname === 'audioFile') {
            destFolder = 'uploads/audio';
        } else if (file.fieldname === 'coverImage') {
            destFolder = 'uploads/covers';
        }

        // Garante a existência física do diretório em tempo de execução
        if (!fs.existsSync(destFolder)) {
            fs.mkdirSync(destFolder, { recursive: true });
        }
        cb(null, destFolder);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'audioFile') {
        if (file.mimetype.startsWith('audio/')) cb(null, true);
        else cb(new Error('Formato de arquivo inválido. Apenas áudio é permitido!'), false);
    } else if (file.fieldname === 'coverImage') {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Formato de arquivo inválido. Apenas imagens são permitidas!'), false);
    } else {
        cb(null, true);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 200 * 1024 * 1024 } // Teto de 200MB por requisição multipart
});

export default upload;