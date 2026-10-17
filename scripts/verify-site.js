const fs = require('fs');
const path = require('path');

const publicDir = path.resolve('public');
const files = fs.readdirSync(publicDir).filter(f => f.endsWith('.html'));

console.log('Verifying HTML files in', publicDir);

let issues = 0;

files.forEach(f => {
  const content = fs.readFileSync(path.join(publicDir, f), 'utf8');

  // Check 1: Google temporary image URLs
  if (content.includes('lh3.googleusercontent.com')) {
    console.warn(`[WARN] ${f} contains lingering googleusercontent URL`);
    issues++;
  }

  // Check 2: Chilled RO
  if (content.match(/chilled\s+ro/i) && f !== 'amenities.html') {
    // Only check if unexpected
    console.warn(`[INFO] ${f} contains "chilled ro":`, content.match(/.{0,30}chilled\s+ro.{0,30}/gi));
  }

  // Check 3: Turnstile
  const turnstiles = content.match(/.{0,30}turnstile.{0,30}/gi);
  if (turnstiles && f !== 'amenities.html') {
    console.warn(`[INFO] ${f} contains "turnstile":`, turnstiles);
  }

  // Check 4: thelordsgymsachin in login.html
  if (f === 'login.html' && content.includes('thelordsgymsachin@gmail.com')) {
    console.warn(`[WARN] login.html contains thelordsgymsachin@gmail.com!`);
    issues++;
  }

  // Check 5: img src references exist on disk
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
  let match;
  while ((match = imgRegex.exec(content)) !== null) {
    let src = match[1];
    if (src.startsWith('/')) src = src.substring(1);
    if (!src.startsWith('http') && !src.startsWith('data:')) {
      const diskPath = path.join(publicDir, src);
      if (!fs.existsSync(diskPath)) {
        console.warn(`[WARN] ${f} references missing image file: ${src}`);
        issues++;
      }
    }
  }
});

console.log(`Scan completed with ${issues} issue(s).`);
