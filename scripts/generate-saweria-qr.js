const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

async function generate() {
  const url = 'https://saweria.co/levystudios';
  const outDir = path.join(__dirname, '../public/images');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Generate high-res PNG (600x600)
  const pngPath = path.join(outDir, 'saweria-qr.png');
  await QRCode.toFile(pngPath, url, {
    width: 600,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
  console.log('Generated saweria-qr.png successfully');

  // 2. Generate SVG
  const svgPath = path.join(outDir, 'saweria-qr.svg');
  const svgStr = await QRCode.toString(url, {
    type: 'svg',
    margin: 2,
    errorCorrectionLevel: 'H',
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });
  fs.writeFileSync(svgPath, svgStr, 'utf8');
  console.log('Generated saweria-qr.svg successfully');
}

generate().catch(console.error);
