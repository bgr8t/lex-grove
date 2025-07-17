import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '../public/images/universities/source');
const outputDir = path.join(__dirname, '../public/images/universities');

async function optimizeLogo(filename) {
  const inputPath = path.join(sourceDir, filename);
  const outputPath = path.join(outputDir, filename.replace(/\.[^.]+$/, '.svg'));

  try {
    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Read and optimize SVG
    const input = await fs.readFile(inputPath);
    
    // If it's an SVG, just copy it
    if (filename.toLowerCase().endsWith('.svg')) {
      await fs.writeFile(outputPath, input);
      console.log(`Copied SVG: ${filename}`);
      return;
    }

    // For other formats, convert to SVG
    await sharp(input)
      .resize(300, 150, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFile(outputPath);

    console.log(`Optimized: ${filename}`);
  } catch (error) {
    console.error(`Error processing ${filename}:`, error);
  }
}

async function main() {
  try {
    // Ensure source directory exists
    await fs.mkdir(sourceDir, { recursive: true });

    const files = await fs.readdir(sourceDir);
    await Promise.all(files.map(optimizeLogo));
    
    console.log('All logos optimized successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

main(); 