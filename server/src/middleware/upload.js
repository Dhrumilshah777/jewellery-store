import multer from 'multer';

const storage = multer.memoryStorage();
const limits = { fileSize: 5 * 1024 * 1024 }; // 5MB
const fileFilter = (req, file, cb) => {
  const allowed = /^image\/(jpeg|jpg|png|gif|webp)$/i;
  if (allowed.test(file.mimetype)) cb(null, true);
  else cb(new Error('Only images (JPEG, PNG, GIF, WebP) are allowed.'), false);
};

export const uploadSingle = multer({ storage, limits, fileFilter }).single('image');
