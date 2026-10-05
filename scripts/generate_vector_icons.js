const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DESIGN 1: Signature Couture Rose Background (Rich, Vibrant Luxury)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const svgDesign1_CoutureRose = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Rich Couture Rose Gradient -->
    <linearGradient id="bgCoutureRose" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E25C80" />
      <stop offset="50%" stop-color="#C23860" />
      <stop offset="100%" stop-color="#9E1E42" />
    </linearGradient>

    <!-- Radiant Champagne Gold Gradient -->
    <linearGradient id="goldHanger" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF5E4" />
      <stop offset="30%" stop-color="#F3DCB5" />
      <stop offset="60%" stop-color="#D4AF37" />
      <stop offset="100%" stop-color="#B88A28" />
    </linearGradient>

    <!-- Soft Ivory for Hands -->
    <linearGradient id="ivoryHands" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="100%" stop-color="#FDE8EE" />
    </linearGradient>

    <filter id="luxuryDropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#550A1E" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Full-bleed background -->
  <rect width="512" height="512" fill="url(#bgCoutureRose)" />

  <!-- Subtle Radial Spotlight in Center -->
  <circle cx="256" cy="256" r="220" fill="#FFFFFF" opacity="0.08" />

  <g filter="url(#luxuryDropShadow)">
    <!-- ━━━ UPPER HAND (Top-Right handing over hook) ━━━ -->
    <g fill="url(#ivoryHands)" stroke="url(#goldHanger)" stroke-width="3">
      <!-- Arm & Palm silhouette -->
      <path d="M 440 140 C 400 150 365 175 330 195 C 310 205 285 205 272 190 C 265 180 268 168 280 158 C 300 145 320 135 345 125 C 375 110 405 105 440 100 Z" />
      <!-- Graceful Fingers holding hook -->
      <path d="M 272 190 C 260 195 248 190 245 180 C 242 170 250 162 262 160 C 275 158 285 168 280 178 Z" />
      <path d="M 285 198 C 275 208 260 208 252 198 C 248 192 252 184 260 182 C 270 180 282 188 285 198 Z" />
    </g>

    <!-- ━━━ THE LUXURY COUTURE HANGER (Centerpiece) ━━━ -->
    <!-- Hook -->
    <path d="M 256 160 C 256 125 285 110 285 85 C 285 68 270 55 252 55 C 235 55 224 66 222 80" 
          fill="none" stroke="url(#goldHanger)" stroke-width="14" stroke-linecap="round" />
    
    <!-- Hook Tip Ball -->
    <circle cx="222" cy="80" r="8" fill="url(#goldHanger)" />

    <!-- Main Hanger Frame -->
    <path d="M 256 155 Q 160 220 90 265 Q 82 272 90 280 Q 98 285 108 282 L 404 282 Q 414 285 422 280 Q 430 272 422 265 Q 352 220 256 155 Z" 
          fill="url(#goldHanger)" />

    <!-- Hanger Inner Cutout -->
    <path d="M 256 182 Q 180 230 125 264 L 387 264 Q 332 230 256 182 Z" 
          fill="url(#bgCoutureRose)" opacity="0.95" />

    <!-- Crossbar -->
    <rect x="100" y="266" width="312" height="10" rx="5" fill="url(#goldHanger)" />

    <!-- Sculpted Center Rose Crest -->
    <g transform="translate(256, 218)">
      <circle cx="0" cy="0" r="28" fill="url(#goldHanger)" />
      <!-- Rose Petals Detail -->
      <path d="M -12 -6 C -10 -16 10 -16 12 -6 C 16 4 0 16 0 16 C 0 16 -16 4 -12 -6 Z" fill="#C23860" />
      <circle cx="0" cy="-2" r="8" fill="url(#goldHanger)" />
    </g>

    <!-- ━━━ LOWER HAND (Bottom-Left receiving the base) ━━━ -->
    <g fill="url(#ivoryHands)" stroke="url(#goldHanger)" stroke-width="3">
      <!-- Arm & Palm reaching up to support the base bar -->
      <path d="M 72 380 C 110 370 145 350 180 330 C 205 318 235 320 255 335 C 265 345 262 358 248 368 C 225 382 200 395 170 405 C 135 418 105 422 72 420 Z" />
      <!-- Elegant supportive fingers -->
      <path d="M 255 335 C 270 332 285 340 286 350 C 287 360 276 366 262 368 C 248 368 242 355 255 335 Z" />
      <path d="M 240 322 C 255 315 270 322 272 332 C 274 340 265 346 252 346 C 240 344 235 332 240 322 Z" />
    </g>
  </g>
</svg>
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DESIGN 2: Warm Ivory Silk Background with Solid Couture Rose & Gold Emblem
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const svgDesign2_WarmSilk = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <!-- Crisp Warm Cream Background -->
    <linearGradient id="bgWarmSilk" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFDF9" />
      <stop offset="100%" stop-color="#FBF3EC" />
    </linearGradient>

    <!-- Rich Bold Couture Rose -->
    <linearGradient id="roseEmblem" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DE4A73" />
      <stop offset="100%" stop-color="#A82348" />
    </linearGradient>

    <!-- Metallic Champagne Gold -->
    <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#EED8B3" />
      <stop offset="50%" stop-color="#C5A880" />
      <stop offset="100%" stop-color="#9C7B4F" />
    </linearGradient>

    <filter id="cleanShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="#4A1525" flood-opacity="0.16" />
    </filter>
  </defs>

  <!-- Full-bleed background with NO fake borders -->
  <rect width="512" height="512" fill="url(#bgWarmSilk)" />

  <g filter="url(#cleanShadow)">
    <!-- ━━━ UPPER HAND (Top-Right handing over hook) ━━━ -->
    <g fill="url(#roseEmblem)">
      <!-- Arm & Palm silhouette in Bold Couture Rose -->
      <path d="M 440 140 C 400 150 365 175 330 195 C 310 205 285 205 272 190 C 265 180 268 168 280 158 C 300 145 320 135 345 125 C 375 110 405 105 440 100 Z" />
      <path d="M 272 190 C 260 195 248 190 245 180 C 242 170 250 162 262 160 C 275 158 285 168 280 178 Z" />
    </g>

    <!-- ━━━ THE LUXURY COUTURE HANGER (Centerpiece in Gold) ━━━ -->
    <!-- Hook -->
    <path d="M 256 160 C 256 125 285 110 285 85 C 285 68 270 55 252 55 C 235 55 224 66 222 80" 
          fill="none" stroke="url(#goldAccent)" stroke-width="16" stroke-linecap="round" />
    <circle cx="222" cy="80" r="9" fill="url(#goldAccent)" />

    <!-- Main Hanger Frame -->
    <path d="M 256 155 Q 160 220 90 265 Q 82 272 90 280 Q 98 285 108 282 L 404 282 Q 414 285 422 280 Q 430 272 422 265 Q 352 220 256 155 Z" 
          fill="url(#goldAccent)" />

    <!-- Hanger Inner Cutout -->
    <path d="M 256 184 Q 180 230 125 264 L 387 264 Q 332 230 256 184 Z" 
          fill="url(#bgWarmSilk)" />

    <!-- Crossbar -->
    <rect x="100" y="266" width="312" height="12" rx="6" fill="url(#goldAccent)" />

    <!-- Sculpted Center Rose Crest -->
    <g transform="translate(256, 218)">
      <circle cx="0" cy="0" r="30" fill="url(#roseEmblem)" />
      <!-- Rose Petals in Gold -->
      <path d="M -12 -6 C -10 -16 10 -16 12 -6 C 16 4 0 16 0 16 C 0 16 -16 4 -12 -6 Z" fill="url(#goldAccent)" />
      <circle cx="0" cy="-2" r="8" fill="url(#bgWarmSilk)" />
    </g>

    <!-- ━━━ LOWER HAND (Bottom-Left receiving the base) ━━━ -->
    <g fill="url(#roseEmblem)">
      <path d="M 72 380 C 110 370 145 350 180 330 C 205 318 235 320 255 335 C 265 345 262 358 248 368 C 225 382 200 395 170 405 C 135 418 105 422 72 420 Z" />
      <path d="M 255 335 C 270 332 285 340 286 350 C 287 360 276 366 262 368 C 248 368 242 355 255 335 Z" />
    </g>
  </g>
</svg>
`;

async function renderDesigns() {
  const artifactsDir = 'C:\\Users\\Bhavya\\.gemini\\antigravity-ide\\brain\\9be0c269-89df-4d5b-9762-52fcfc885e43';
  
  const file1 = path.join(artifactsDir, 'vector_icon_couture_rose.png');
  const file2 = path.join(artifactsDir, 'vector_icon_warm_silk.png');

  await sharp(Buffer.from(svgDesign1_CoutureRose))
    .resize(512, 512)
    .png()
    .toFile(file1);

  await sharp(Buffer.from(svgDesign2_WarmSilk))
    .resize(512, 512)
    .png()
    .toFile(file2);

  console.log('Rendered vector designs:');
  console.log('1.', file1);
  console.log('2.', file2);
}

renderDesigns().catch(console.error);
