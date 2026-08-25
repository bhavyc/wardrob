const fs = require('fs');

function cleanPageTsx() {
  const path = 'src/app/page.tsx';
  let content = fs.readFileSync(path, 'utf8');

  // Remove state
  content = content.replace(/const \[selectedGender, setSelectedGender\] = useState<'Women' \| 'Men'>\('Women'\);\n/g, '');

  // Remove URL parameter fetching
  content = content.replace(/const genderParam = params\.get\('gender'\);\n/g, '');
  content = content.replace(/if \(genderParam === 'Men' \|\| genderParam === 'Women'\) \{\n\s*setSelectedGender\(genderParam\);\n\s*\}\n/g, '');

  // Remove metadata parsing logic for gender
  content = content.replace(/gender: data\.gender \|\| 'Women',/g, '');
  content = content.replace(/let gender: 'Women' \| 'Men' = 'Women';/g, '');
  content = content.replace(/if \(text\.includes\('men'\) \|\| text\.includes\('shirt'\) \|\| text\.includes\('unisex'\)\) \{\n\s*gender = 'Men';\n\s*\}/g, '');
  content = content.replace(/if \(text\.includes\('saree'\) \|\| text\.includes\('women'\) \|\| text\.includes\('lehenga'\) \|\| text\.includes\('anarkali'\) \|\| text\.includes\('kurti'\)\) \{\n\s*gender = 'Women';\n\s*\}/g, '');
  content = content.replace(/gender,/g, '');

  // Remove filtering by gender
  content = content.replace(/\/\/ 1\. Direct Gender check\n\s*if \(meta\.gender !== selectedGender\) return false;/g, '');

  // Hardcode isWomen for safe removal of ternaries later, or just replace ternaries
  content = content.replace(/const isWomen = selectedGender === 'Women';/g, '');
  
  // Replace hero
  content = content.replace(/const heroImage = isWomen[\s\S]*?;\s*\/\/ Men premium heritage portrait/g, `const heroImage = '/luxury-banner.png';`);
  content = content.replace(/const heroCursive = isWomen \? 'Shahi Bunkar' : 'Varanasi Heritage';/g, `const heroCursive = 'WARDROB';`);
  content = content.replace(/const heroTagline = isWomen \? "Women's Couture & Weaves" : "Men's Luxury Handloom classics";/g, `const heroTagline = "Peer-to-Peer Luxury Rentals";`);

  // Replace category cards
  const categoryCardsRegex = /const categoryCards = isWomen[\s\S]*?];/g;
  const newCards = `const categoryCards = [
    { name: 'Sarees', filter: 'Saree', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=400' },
    { name: 'Kurtas & Kurtis', filter: 'Kurta', image: 'https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?auto=format&fit=crop&q=80&w=400' },
    { name: 'Shawls & Stoles', filter: 'Shawl', image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=400' }
  ];`;
  content = content.replace(categoryCardsRegex, newCards);

  // Desktop Nav gender toggle
  content = content.replace(/<div className="gender-toggle-wrap">[\s\S]*?MEN\n\s*<\/button>\n\s*<\/div>/g, '');

  // Nav links desktop
  content = content.replace(/<Link\n\s*href=\{`\/catalog\?gender=\$\{selectedGender\}`\}\n\s*className="cat-nav-link"\n\s*>\n\s*ALL WEAVES\n\s*<\/Link>/g, `<Link href="/catalog" className="cat-nav-link">ALL WEAVES</Link>`);
  
  content = content.replace(/\{isWomen \? \([\s\S]*?\) : \([\s\S]*?\)\}/g, `<Link href="/categories" className="cat-nav-link active">WARDROB Categories</Link>`);

  // Mobile nav gender toggle
  content = content.replace(/<div className="gender-toggle-container">[\s\S]*?MEN\n\s*<\/button>\n\s*<\/div>/g, '');
  
  // Mobile nav links
  content = content.replace(/\{isWomen \? \([\s\S]*?\) : \([\s\S]*?\)\}/g, `<Link href="/categories" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>Categories</Link>`);

  content = content.replace(/<Link\n\s*href=\{`\/catalog\?gender=\$\{selectedGender\}`\}\n\s*className="mobile-nav-link"\n\s*onClick=\{.*\}\n\s*>\n\s*ALL WEAVES\n\s*<\/Link>/g, `<Link href="/catalog" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>ALL WEAVES</Link>`);

  // Footer links
  content = content.replace(/<Link href="\/catalog\?gender=Women" className="st-footer-link">Women's Weaves<\/Link>\n\s*<Link href="\/catalog\?gender=Men" className="st-footer-link">Men's Heritage<\/Link>/g, `<Link href="/catalog" className="st-footer-link">WARDROB Collection</Link>`);

  fs.writeFileSync(path, content, 'utf8');
}

cleanPageTsx();
console.log('Cleaned page.tsx safely');
