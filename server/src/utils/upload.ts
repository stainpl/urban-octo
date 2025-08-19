import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${uuidv4()}${ext}`);
  }
});

// accept images only
function fileFilter(_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;
  if (allowed.test(ext) && allowed.test(mime)) cb(null, true);
  else cb(new Error('Only image files allowed (jpeg, png, webp)'));
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// create responsive versions (returns object with urls)
export async function makeResponsiveImages(filePath: string) {
  const sizes = [1200, 800, 400]; 
  const ext = path.extname(filePath);
  const basename = path.basename(filePath, ext);
  const dir = path.dirname(filePath);

  const outputs: { width: number; path: string; url: string }[] = [];

  for (const w of sizes) {
    const outName = `${basename}-${w}${ext}`;
    const outPath = path.join(dir, outName);
    await sharp(filePath).resize({ width: w }).toFile(outPath);
    outputs.push({ width: w, path: outPath, url: `/uploads/${path.basename(outPath)}` });
  }

  outputs.unshift({ width: 0, path: filePath, url: `/uploads/${path.basename(filePath)}` });

  return outputs;
}