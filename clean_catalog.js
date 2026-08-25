const fs = require('fs');

const path = 'src/app/catalog/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove selectedGender state
content = content.replace(/const \[selectedGender, setSelectedGender\] = useState<'Women' \| 'Men'>\('Women'\);\n/g, '');

// 2. Remove URL param syncing
content = content.replace(/const genderParam = params\.get\('gender'\);\n\s*if \(genderParam === 'Men' \|\| genderParam === 'Women'\) \{\n\s*setSelectedGender\(genderParam\);\n\s*\}\n/g, '');

// 3. Remove gender extraction
content = content.replace(/let gender: 'Women' \| 'Men' = 'Women';\n\s*if \(text\.includes\('men'\) \|\| text\.includes\('shirt'\) \|\| text\.includes\('unisex'\)\) \{\n\s*gender = 'Men';\n\s*\}\n\s*if \(text\.includes\('saree'\) \|\| text\.includes\('women'\) \|\| text\.includes\('lehenga'\) \|\| text\.includes\('anarkali'\) \|\| text\.includes\('kurti'\)\) \{\n\s*gender = 'Women';\n\s*\}\n/g, '');
content = content.replace(/gender: data\.gender \|\| 'Women',/g, '');
content = content.replace(/gender,/g, '');

// 4. Remove handleGenderToggle
content = content.replace(/const handleGenderToggle = \(gender: 'Women' \| 'Men'\) => \{\n\s*setSelectedGender\(gender\);\n\s*router\.push\(`\/catalog\?gender=\$\{gender\}`\);\n\s*\};\n/g, '');

// 5. Remove gender filtering
content = content.replace(/\/\/ 1\. Direct Gender check\n\s*if \(meta\.gender !== selectedGender\) return false;\n/g, '');

// 6. Remove isWomen toggle UI and clean up nav
content = content.replace(/const isWomen = selectedGender === 'Women';\n/g, '');

const navRegex = /<div className="gender-toggle-wrap">[\s\S]*?<\/div>/;
content = content.replace(navRegex, '');

const oldLinks = /\{isWomen \? \([\s\S]*?\) : \([\s\S]*?\)\}/;
content = content.replace(oldLinks, `<Link href="/categories" className="cat-nav-link active">WARDROB Categories</Link>`);

const catHeader = /<h1 className="cat-header-title">\{selectedGender\}'s Collection<\/h1>/;
content = content.replace(catHeader, '<h1 className="cat-header-title">Collection</h1>');

const emptyDesc = /There are currently no active products in the backend matching the \{selectedGender\} filter./;
content = content.replace(emptyDesc, 'There are currently no active products in the backend matching your filters.');

// Footer links
content = content.replace(/<Link href="\/catalog\?gender=Women" className="st-footer-link">Women's Weaves<\/Link>\n\s*<Link href="\/catalog\?gender=Men" className="st-footer-link">Men's Heritage<\/Link>/g, '<Link href="/catalog" className="st-footer-link">WARDROB Collection</Link>');
content = content.replace(/href=\{`\/catalog\?gender=\$\{selectedGender\}`\}/g, 'href="/catalog"');
content = content.replace(/href=\{`\/catalog\?gender=\$\{selectedGender\}&category=Saree`\}/g, 'href="/catalog?category=Saree"');

fs.writeFileSync(path, content, 'utf8');
console.log('Done catalog.tsx');
