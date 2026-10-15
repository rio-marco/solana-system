'use strict';

const fs = require('fs');
const path = require('path');

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

async function saveImage(file, { subdir = 'profiles', prefix = 'img' } = {}) {
    const ext = path.extname(file?.name || '').toLowerCase() || '.jpg';

    if (!ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
        return { error: 'Only image files are allowed (jpg, jpeg, png, webp, gif).' };
    };

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subdir);
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    };

    const uniqueName = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
    await fs.promises.writeFile(path.join(uploadDir, uniqueName), buffer);

    return { path: `uploads/${subdir}/${uniqueName}` };
};

function deleteImage(relativePath) {
    const value = (relativePath || '').trim();

    if (!value || /^(https?:\/\/|data:)/i.test(value)) return;

    const fullPath = path.join(process.cwd(), 'public', value.replace(/^\/+/, ''));

    try {
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        };
    } catch (e) {
        // best effort cleanup
    };
};

module.exports = { saveImage, deleteImage, ALLOWED_IMAGE_EXTENSIONS };