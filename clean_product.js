const fs = require('fs');

const path = 'src/app/product/[id]/page.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove gender extraction
content = content.replace(/let gender: 'Women' \| 'Men' = 'Women';\n\s*if \(text\.includes\('men'\) \|\| text\.includes\('shirt'\) \|\| text\.includes\('unisex'\)\) \{\n\s*gender = 'Men';\n\s*\}\n\s*if \(text\.includes\('saree'\) \|\| text\.includes\('women'\) \|\| text\.includes\('lehenga'\) \|\| text\.includes\('anarkali'\) \|\| text\.includes\('kurti'\)\) \{\n\s*gender = 'Women';\n\s*\}\n/g, '');
content = content.replace(/gender: data\.gender \|\| 'Women',/g, '');
content = content.replace(/gender,/g, '');

// 2. Remove isWomen toggle logic
content = content.replace(/const isWomen = meta \? meta\.gender === 'Women' : true;\n/g, '');
content = content.replace(/const selectedGender = meta \? meta\.gender : 'Women';\n/g, '');
content = content.replace(/<span className="bc-separator">\/<\/span>\n\s*<Link href=\{`\/catalog\?gender=\$\{selectedGender\}`\} className="bc-link">\{selectedGender\}<\/Link>/g, '');
content = content.replace(/href=\{`\/catalog\?gender=\$\{selectedGender\}&category=\$\{meta\.category\}`\}/g, 'href={`/catalog?category=${meta.category}`}');

const sizeSelectorWomen = `              {isWomen ? (
                <>
                  <button className={\`size-btn\${selectedSize === 'XS' ? ' active' : ''}\`} onClick={() => setSelectedSize('XS')}>XS</button>
                  <button className={\`size-btn\${selectedSize === 'S' ? ' active' : ''}\`} onClick={() => setSelectedSize('S')}>S</button>
                  <button className={\`size-btn\${selectedSize === 'M' ? ' active' : ''}\`} onClick={() => setSelectedSize('M')}>M</button>
                  <button className={\`size-btn\${selectedSize === 'L' ? ' active' : ''}\`} onClick={() => setSelectedSize('L')}>L</button>
                </>
              ) : (
                <>
                  <button className={\`size-btn\${selectedSize === '38' ? ' active' : ''}\`} onClick={() => setSelectedSize('38')}>38</button>
                  <button className={\`size-btn\${selectedSize === '40' ? ' active' : ''}\`} onClick={() => setSelectedSize('40')}>40</button>
                  <button className={\`size-btn\${selectedSize === '42' ? ' active' : ''}\`} onClick={() => setSelectedSize('42')}>42</button>
                  <button className={\`size-btn\${selectedSize === '44' ? ' active' : ''}\`} onClick={() => setSelectedSize('44')}>44</button>
                </>
              )}`;

const sizeSelectorUnified = `              <>
                <button className={\`size-btn\${selectedSize === 'XS' ? ' active' : ''}\`} onClick={() => setSelectedSize('XS')}>XS</button>
                <button className={\`size-btn\${selectedSize === 'S' ? ' active' : ''}\`} onClick={() => setSelectedSize('S')}>S</button>
                <button className={\`size-btn\${selectedSize === 'M' ? ' active' : ''}\`} onClick={() => setSelectedSize('M')}>M</button>
                <button className={\`size-btn\${selectedSize === 'L' ? ' active' : ''}\`} onClick={() => setSelectedSize('L')}>L</button>
                <button className={\`size-btn\${selectedSize === 'XL' ? ' active' : ''}\`} onClick={() => setSelectedSize('XL')}>XL</button>
              </>`;

content = content.replace(sizeSelectorWomen, sizeSelectorUnified);

content = content.replace(/<Link href="\/catalog\?gender=Women" className="st-footer-link">Women's Weaves<\/Link>\n\s*<Link href="\/catalog\?gender=Men" className="st-footer-link">Men's Heritage<\/Link>/g, '<Link href="/catalog" className="st-footer-link">WARDROB Collection</Link>');

fs.writeFileSync(path, content, 'utf8');
console.log('Done product page.');
