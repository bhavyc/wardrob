const fs = require('fs');

// Utility to safely remove matching lines
function cleanFile(path) {
  let content = fs.readFileSync(path, 'utf8');

  // Strip anything with setSelectedGender
  content = content.replace(/.*setSelectedGender.*\n/g, '');
  
  // Strip anything with meta.gender === selectedGender
  content = content.replace(/.*meta\.gender.*selectedGender.*\n/g, '');

  // Strip anything with selectedGender in catalog links, just replacing it
  content = content.replace(/\?gender=\$\{selectedGender\}/g, '');
  content = content.replace(/&gender=\$\{selectedGender\}/g, '');
  
  // Strip isWomen toggles from mobile navs (anything like isWomen ? (...) : (...))
  // This is tricky, so let's just find lines with isWomen and selectedGender and nuke or replace them
  content = content.replace(/.*\{isWomen \? \([\s\S]*?\) : \([\s\S]*?\)\}/g, '');
  
  fs.writeFileSync(path, content, 'utf8');
}

cleanFile('src/app/catalog/page.tsx');
cleanFile('src/app/page.tsx');
cleanFile('src/app/product/[id]/page.tsx');
console.log('Cleaned remaining errors.');
