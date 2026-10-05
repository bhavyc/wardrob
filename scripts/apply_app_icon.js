const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sourceIcon = 'C:\\Users\\Bhavya\\.gemini\\antigravity-ide\\brain\\9be0c269-89df-4d5b-9762-52fcfc885e43\\wardrob_simple_emblem_crisp.png';

const androidResDir = path.resolve('E:\\projects\\wardrob_mobile\\android\\app\\src\\main\\res');
const iosAppIconDir = path.resolve('E:\\projects\\wardrob_mobile\\ios\\Runner\\Assets.xcassets\\AppIcon.appiconset');
const mobileAssetsDir = path.resolve('E:\\projects\\wardrob_mobile\\assets\\icons');
const webPublicDir = path.resolve('E:\\projects\\wardrob\\public');

const targets = [
  // Android launcher icons
  { dir: path.join(androidResDir, 'mipmap-mdpi'), name: 'ic_launcher.png', size: 48 },
  { dir: path.join(androidResDir, 'mipmap-hdpi'), name: 'ic_launcher.png', size: 72 },
  { dir: path.join(androidResDir, 'mipmap-xhdpi'), name: 'ic_launcher.png', size: 96 },
  { dir: path.join(androidResDir, 'mipmap-xxhdpi'), name: 'ic_launcher.png', size: 144 },
  { dir: path.join(androidResDir, 'mipmap-xxxhdpi'), name: 'ic_launcher.png', size: 192 },
  
  // iOS launcher icons
  { dir: iosAppIconDir, name: 'Icon-App-1024x1024@1x.png', size: 1024 },
  { dir: iosAppIconDir, name: 'Icon-App-20x20@1x.png', size: 20 },
  { dir: iosAppIconDir, name: 'Icon-App-20x20@2x.png', size: 40 },
  { dir: iosAppIconDir, name: 'Icon-App-20x20@3x.png', size: 60 },
  { dir: iosAppIconDir, name: 'Icon-App-29x29@1x.png', size: 29 },
  { dir: iosAppIconDir, name: 'Icon-App-29x29@2x.png', size: 58 },
  { dir: iosAppIconDir, name: 'Icon-App-29x29@3x.png', size: 87 },
  { dir: iosAppIconDir, name: 'Icon-App-40x40@1x.png', size: 40 },
  { dir: iosAppIconDir, name: 'Icon-App-40x40@2x.png', size: 80 },
  { dir: iosAppIconDir, name: 'Icon-App-40x40@3x.png', size: 120 },
  { dir: iosAppIconDir, name: 'Icon-App-60x60@2x.png', size: 120 },
  { dir: iosAppIconDir, name: 'Icon-App-60x60@3x.png', size: 180 },
  { dir: iosAppIconDir, name: 'Icon-App-76x76@1x.png', size: 76 },
  { dir: iosAppIconDir, name: 'Icon-App-76x76@2x.png', size: 152 },
  { dir: iosAppIconDir, name: 'Icon-App-83.5x83.5@2x.png', size: 167 },

  // Shared assets & web
  { dir: mobileAssetsDir, name: 'app_icon.png', size: 512 },
  { dir: webPublicDir, name: 'app_icon.png', size: 512 },
  { dir: webPublicDir, name: 'favicon.png', size: 192 },
];

async function applyIcons() {
  console.log('Generating 3D Hanger Handover launcher icons from:', sourceIcon);
  if (!fs.existsSync(sourceIcon)) {
    console.error('Source icon file not found!');
    process.exit(1);
  }

  for (const t of targets) {
    if (!fs.existsSync(t.dir)) {
      fs.mkdirSync(t.dir, { recursive: true });
    }
    const dest = path.join(t.dir, t.name);
    await sharp(sourceIcon)
      .resize(t.size, t.size)
      .png()
      .toFile(dest);
    console.log(`Saved: ${dest} (${t.size}x${t.size})`);
  }

  console.log('All 3D Hanger Handover launcher icons applied successfully across Android and iOS!');
}

applyIcons().catch(err => {
  console.error('Error applying icons:', err);
  process.exit(1);
});
