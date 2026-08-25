const fs = require('fs');

const path = 'src/app/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove selectedGender state
content = content.replace(/const \[selectedGender, setSelectedGender\] = useState<'Women' \| 'Men'>\('Women'\);\n/g, '');

// 2. Remove genderParam from useEffect
content = content.replace(/const genderParam = params\.get\('gender'\);\n/g, '');
content = content.replace(/if \(genderParam === 'Men' \|\| genderParam === 'Women'\) \{\n\s*setSelectedGender\(genderParam\);\n\s*\}\n/g, '');

// 3. Remove gender inference from parseProductMetadata
content = content.replace(/let gender: 'Women' \| 'Men' = 'Women';\n\s*if \(text\.includes\('men'\) \|\| text\.includes\('shirt'\) \|\| text\.includes\('unisex'\)\) \{\n\s*gender = 'Men';\n\s*\}\n\s*if \(text\.includes\('saree'\) \|\| text\.includes\('women'\) \|\| text\.includes\('lehenga'\) \|\| text\.includes\('anarkali'\) \|\| text\.includes\('kurti'\)\) \{\n\s*gender = 'Women';\n\s*\}\n/g, '');
content = content.replace(/gender: data\.gender \|\| 'Women',/g, '');
content = content.replace(/gender,/g, '');

// 4. Remove gender filter in filteredlistings
content = content.replace(/\/\/ 1\. Direct Gender check\n\s*if \(meta\.gender !== selectedGender\) return false;\n/g, '');

// 5. Update Hero and Category variables
content = content.replace(/const isWomen = selectedGender === 'Women';\n/g, '');
content = content.replace(/const heroImage = isWomen\n\s*\? '\/luxury-banner\.png'\n\s*: 'https:\/\/images\.unsplash\.com\/photo-1617137968427-85924c800a22\?auto=format&fit=crop&q=80&w=1200'; \/\/ Men premium heritage portrait\n/g, 'const heroImage = \'/luxury-banner.png\';\n');
content = content.replace(/const heroCursive = isWomen \? 'Shahi Bunkar' : 'Varanasi Heritage';\n/g, 'const heroCursive = \'WARDROB\';\n');
content = content.replace(/const heroTagline = isWomen \? "Women's Couture & Weaves" : "Men's Luxury Handloom classics";\n/g, 'const heroTagline = "Peer-to-Peer Luxury Rentals";\n');

// 6. Fix category cards
const catReplace = `const categoryCards = isWomen
    ? [
      { name: 'Sarees', filter: 'Saree', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400' },
      { name: 'Kurtas & Kurtis', filter: 'Kurta', image: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?auto=format&fit=crop&q=80&w=400' },
      { name: 'Shawls & Stoles', filter: 'Shawl', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=400' },
    ]
    : [
      { name: 'Khadi Shirts', filter: 'Shirt', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=400' },
      { name: 'Kurtas & Pyjamas', filter: 'Kurta', image: 'https://images.unsplash.com/photo-1621245033772-e0aea50913f4?auto=format&fit=crop&q=80&w=400' },
      { name: 'Pashmina Shawls', filter: 'Shawl', image: 'https://images.unsplash.com/photo-1615214059438-e6921200bf49?auto=format&fit=crop&q=80&w=400' },
    ];`;
const newCat = `const categoryCards = [
      { name: 'Sarees', filter: 'Saree', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400' },
      { name: 'Kurtas & Kurtis', filter: 'Kurta', image: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?auto=format&fit=crop&q=80&w=400' },
      { name: 'Shawls & Stoles', filter: 'Shawl', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=400' },
      { name: 'Lehengas', filter: 'Lehenga', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=400' }
    ];`;
content = content.replace(catReplace, newCat);

// 7. Remove Gender Toggle UI
const genderToggleHTML = `<div className="gender-toggle-container">
                <button
                  className={\`gender-toggle-btn\${isWomen ? ' active' : ''}\`}
                  onClick={() => setSelectedGender('Women')}
                >
                  WOMEN
                </button>
                <button
                  className={\`gender-toggle-btn\${!isWomen ? ' active' : ''}\`}
                  onClick={() => setSelectedGender('Men')}
                >
                  MEN
                </button>
              </div>`;
content = content.replace(genderToggleHTML, '');

// Write back
fs.writeFileSync(path, content, 'utf8');
console.log('Done cleaning page.tsx');
