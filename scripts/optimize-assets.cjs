const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const Fontmin = require('fontmin');

const PUBLIC_DIR = path.resolve(__dirname, '../public');

// ============================================================
// Part 1: PNG → WebP conversion
// ============================================================
async function convertPngToWebp() {
  console.log('🖼️  Converting PNG to WebP...');
  
  const pngFiles = [
    // Damage sidebar PNGs
    { src: 'damage/damage-hero-left.png', dest: 'damage/damage-hero-left.webp' },
    { src: 'damage/damage-hero-right.png', dest: 'damage/damage-hero-right.webp' },
    // Support sidebar PNGs
    { src: 'support/support-hero-left.png', dest: 'support/support-hero-left.webp' },
    { src: 'support/support-hero-right.png', dest: 'support/support-hero-right.webp' },
    // Tank sidebar PNGs
    { src: 'tank/tank-hero-left.png', dest: 'tank/tank-hero-left.webp' },
    { src: 'tank/tank-hero-right.png', dest: 'tank/tank-hero-right.webp' },
    // Avatar placeholder
    { src: 'default-avatar.png', dest: 'default-avatar.webp' },
  ];

  for (const file of pngFiles) {
    const srcPath = path.join(PUBLIC_DIR, file.src);
    const destPath = path.join(PUBLIC_DIR, file.dest);
    
    if (!fs.existsSync(srcPath)) {
      console.warn(`  ⚠️  Source not found: ${file.src}`);
      continue;
    }

    try {
      const inputStat = fs.statSync(srcPath);
      const inputSizeMB = (inputStat.size / (1024 * 1024)).toFixed(2);

      await sharp(srcPath)
        .webp({ quality: 85 })
        .toFile(destPath);

      const outputStat = fs.statSync(destPath);
      const outputSizeMB = (outputStat.size / (1024 * 1024)).toFixed(2);
      const ratio = ((1 - outputStat.size / inputStat.size) * 100).toFixed(0);

      console.log(`  ✅ ${file.src}: ${inputSizeMB}MB → ${outputSizeMB}MB (${ratio}% smaller)`);
    } catch (err) {
      console.error(`  ❌ Failed to convert ${file.src}: ${err.message}`);
    }
  }
}

// ============================================================
// Part 2: Font subsetting (fontmin)
// ============================================================
async function subsetFonts() {
  console.log('\n🔤  Subsetting fonts...');

  // Scan all source files for used characters
  const srcDir = path.resolve(__dirname, '../src');
  let allText = '';

  function collectText(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        collectText(fullPath);
      } else if (entry.isFile() && /\.(vue|js|ts|css)$/i.test(entry.name)) {
        allText += fs.readFileSync(fullPath, 'utf-8');
      }
    }
  }

  collectText(srcDir);
  
  // Also scan index.html for used text
  const indexPath = path.resolve(__dirname, '../index.html');
  if (fs.existsSync(indexPath)) {
    allText += fs.readFileSync(indexPath, 'utf-8');
  }

  // Extract unique characters
  const uniqueChars = [...new Set(allText)].filter(c => c.charCodeAt(0) >= 32).join('');
  
  // Additional commonly used Chinese punctuation & characters
  const extraChars = '，。、；：？！“”‘’（）【】《》—…·～　ｆｈｔｍｘｓｐｖ';
  const combinedText = uniqueChars + extraChars;

  const fontFiles = [
    { src: 'font-maple-mono.ttf', dest: 'font-maple-mono.ttf' },
    { src: 'font-smiley-sans.ttf', dest: 'font-smiley-sans.ttf' },
  ];

  for (const font of fontFiles) {
    const srcFont = path.join(PUBLIC_DIR, font.src);
    
    if (!fs.existsSync(srcFont)) {
      console.warn(`  ⚠️  Font not found: ${font.src}`);
      continue;
    }

    const inputStat = fs.statSync(srcFont);
    const inputSizeMB = (inputStat.size / (1024 * 1024)).toFixed(2);

    // backup the original
    const backupPath = path.join(PUBLIC_DIR, font.src.replace('.ttf', '-original.ttf'));
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(srcFont, backupPath);
      console.log(`  📦 Backup: ${font.src} → ${font.src.replace('.ttf', '-original.ttf')}`);
    }

    try {
      const fontmin = new Fontmin()
        .src(srcFont)
        .use(Fontmin.glyph({
          text: combinedText,
          hinting: false
        }))
        .dest(path.dirname(srcFont));

      await new Promise((resolve, reject) => {
        fontmin.run((err, files) => {
          if (err) reject(err);
          else resolve(files);
        });
      });

      const outputStat = fs.statSync(srcFont);
      const outputSizeMB = (outputStat.size / (1024 * 1024)).toFixed(2);
      const ratio = ((1 - outputStat.size / inputStat.size) * 100).toFixed(0);

      console.log(`  ✅ ${font.src}: ${inputSizeMB}MB → ${outputSizeMB}MB (${ratio}% smaller)`);
    } catch (err) {
      console.error(`  ❌ Failed to subset ${font.src}: ${err.message}`);
      // restore from backup
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, srcFont);
        console.log(`  ↩️  Restored original: ${font.src}`);
      }
    }
  }
}

// ============================================================
// Main
// ============================================================
async function main() {
  console.log('🚀 Starting asset optimization...\n');
  
  await convertPngToWebp();
  await subsetFonts();
  
  console.log('\n✅ All done!');
}

main().catch(console.error);