const fs = require('fs');

const files = [
  'src/app/page.tsx',
  'src/app/categories/page.tsx',
  'src/app/catalog/page.tsx',
  'src/app/product/[id]/page.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // Remove selectedGender state
  content = content.replace(/const \[selectedGender, setSelectedGender\] = useState<'Women' \| 'Men'>\('Women'\);\n?/g, '');
  
  // Remove isWomen const
  content = content.replace(/const isWomen = .*?\n?/g, '');

  // Remove gender query params fetching
  content = content.replace(/const genderParam = searchParams\.get\('gender'\);\n?/g, '');
  content = content.replace(/if \(genderParam === 'Men' \|\| genderParam === 'Women'\) \{\n\s+setSelectedGender\(genderParam\);\n\s+\}\n?/g, '');
  
  // Remove gender toggles in Nav (it's a div with gender-toggle-container)
  // This might be tricky with regex, so we'll do it manually if it fails, but let's try
  content = content.replace(/<div className="gender-toggle-container">[\s\S]*?<\/div>\s*<\/div>\s*<\/nav>/g, '</nav>'); // That might eat too much.
  
  // Actually, replacing complex JSX is dangerous with Regex. 
  // I will just read the files using view_file and use multi_replace_file_content.
}
