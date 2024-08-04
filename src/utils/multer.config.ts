import { Request } from 'express';
import multer from 'multer';
import path from 'path';

// Configure Multer
const storage = multer.diskStorage({
  filename: function (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error, filename: string) => void,
  ) {
    const fileExt = path.extname(file.originalname);
    const fileName = `${new Date().getTime()}${fileExt}`;
    console.error(`I'm at this point, ${fileName}`);
    cb(null, fileName);
  },
});

export const allowedMimeTypes = [
  'video/mp4',
  'video/avi',
  'video/mkv',
  'video/mov',
  'video/wmv',
  'video/flv',
  'video/3gp',
  'video/webm',
  'video/ogg',
  'video/ogv',
  'video/ogx',
  'image/png',
  'image/jpg',
  'image/jpeg',
  'image/heic',
];

// const fileFilter = function (
//   _req: Request,
//   file: Express.Multer.File,
//   cb: FileFilterCallback,
// ) {
//   if (allowedMimeTypes.includes(file.mimetype)) {
//     cb(null, true);
//   } else {
//     // throw new AppException(
//     //   `File type ${file.mimetype} is not allowed, only ${allowedMimeTypes.join(
//     //     ', ',
//     //   )} are allowed`,
//     //   httpStatus.BAD_REQUEST,
//     // );
//     throw cb(
//       new Error(
//         `File type ${
//           file.mimetype
//         } is not allowed, only ${allowedMimeTypes.join(', ')} are allowed`,
//       ),
//     );
//   }
// };

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024, fieldNameSize: 200 },
  //   fileFilter: fileFilter,
});

export default upload;
