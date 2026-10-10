const jimp = require('jimp');

async function createIcons() {
  const fs = require('fs');
  const path = require('path');
  const publicDir = path.join(__dirname, 'public');
  const iconsDir = path.join(publicDir, 'icons');
  
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
  if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir);

  const sourceImagePath = path.join(__dirname, 'app', 'icon.jpg');

  try {
    // try different Jimp exports
    const JimpModule = jimp.Jimp || jimp.default || jimp;
    const image = await JimpModule.read(sourceImagePath);

    image.clone().resize({ w: 192, h: 192 }).write(path.join(iconsDir, 'icon-192x192.png'));
    image.clone().resize({ w: 512, h: 512 }).write(path.join(iconsDir, 'icon-512x512.png'));
    image.clone().resize({ w: 180, h: 180 }).write(path.join(iconsDir, 'apple-touch-icon.png'));

    console.log('Icons generated successfully.');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

createIcons();
