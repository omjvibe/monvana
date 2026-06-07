const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicons() {
    const inputPath = path.join(__dirname, '../public/pnb.png');
    const outputDir = path.join(__dirname, '../public');

    // Ensure input exists
    if (!fs.existsSync(inputPath)) {
        console.error('Logo not found at:', inputPath);
        process.exit(1);
    }

    try {
        // Generate favicon.ico (32x32)
        await sharp(inputPath)
            .resize(32, 32)
            .toFile(path.join(outputDir, 'favicon.ico'));
        console.log('Generated: favicon.ico (32x32)');

        // Generate apple-touch-icon (180x180)
        await sharp(inputPath)
            .resize(180, 180)
            .toFile(path.join(outputDir, 'apple-touch-icon.png'));
        console.log('Generated: apple-touch-icon.png (180x180)');

        // Generate icon-192 for PWA
        await sharp(inputPath)
            .resize(192, 192)
            .toFile(path.join(outputDir, 'icon-192.png'));
        console.log('Generated: icon-192.png (192x192)');

        // Generate icon-512 for PWA
        await sharp(inputPath)
            .resize(512, 512)
            .toFile(path.join(outputDir, 'icon-512.png'));
        console.log('Generated: icon-512.png (512x512)');

        console.log('\nAll favicons generated successfully!');
    } catch (error) {
        console.error('Error generating favicons:', error);
        process.exit(1);
    }
}

generateFavicons();
