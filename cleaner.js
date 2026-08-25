const fs = require('fs');

function cleanFile(path) {
  let content = fs.readFileSync(path, 'utf8');

  // Change state to hardcoded constants
  content = content.replace(/const \[selectedGender, setSelectedGender\] = useState<'Women' \| 'Men'>\('Women'\);/g, `const selectedGender = 'Women';\n  const isWomen = true;`);
  
  // Remove URL params for gender
  content = content.replace(/const genderParam = params\.get\('gender'\);\n\s*if \(genderParam === 'Men' \|\| genderParam === 'Women'\) \{\n\s*setSelectedGender\(genderParam\);\n\s*\}/g, '');

  // Remove the toggle UI container
  content = content.replace(/<div className="gender-toggle-container">[\s\S]*?MEN\n\s*<\/button>\n\s*<\/div>/g, '');
  content = content.replace(/<div className="gender-toggle-wrap">[\s\S]*?MEN\n\s*<\/button>\n\s*<\/div>/g, '');

  // Remove handleGenderToggle
  content = content.replace(/const handleGenderToggle = \(gender: 'Women' \| 'Men'\) => \{\n\s*setSelectedGender\(gender\);\n\s*router\.push\(`.*`\);\n\s*\};\n/g, '');
  
  fs.writeFileSync(path, content, 'utf8');
}

cleanFile('src/app/page.tsx');
cleanFile('src/app/categories/page.tsx');
cleanFile('src/app/catalog/page.tsx');
console.log('Cleaned files.');
