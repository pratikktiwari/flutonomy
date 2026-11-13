/**
 * Draws a bansuri as an SVG string. Pure function → usable both at build
 * time (Astro components) and in the browser (live fingering updates).
 * Colours come from CSS tokens, so it follows the theme.
 */
import type { Hole } from './fingering';

const HOLE_X = [118, 152, 186, 236, 270, 304];

export function bansuriSvg(holes: readonly Hole[], { uid = 'b' }: { uid?: string } = {}): string {
  const holeEls = holes
    .map((h, i) => {
      const x = HOLE_X[i];
      const clip = `${uid}-h${i}`;
      const fill =
        h === 1
          ? `<circle cx="${x}" cy="40" r="10" class="bansuri__finger"/>`
          : h === 0.5
            ? `<clipPath id="${clip}"><rect x="${x - 11}" y="29" width="11" height="22"/></clipPath><circle cx="${x}" cy="40" r="10" class="bansuri__finger" clip-path="url(#${clip})"/>`
            : '';
      const state = h === 1 ? 'closed' : h === 0.5 ? 'half' : 'open';
      return `<g class="bansuri__hole bansuri__hole--${state}"><circle cx="${x}" cy="40" r="10" class="bansuri__ring"/>${fill}<text x="${x}" y="72" text-anchor="middle" class="bansuri__num">${i + 1}</text></g>`;
    })
    .join('');

  return `<svg class="bansuri" viewBox="0 0 400 82" role="img" aria-label="Bansuri fingering: ${holes
    .map((h) => (h === 1 ? 'closed' : h === 0.5 ? 'half' : 'open'))
    .join(', ')}">
  <defs>
    <linearGradient id="${uid}-bamboo" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--bansuri-light, #e7cf98)"/>
      <stop offset="0.55" stop-color="var(--bansuri-mid, #c9a663)"/>
      <stop offset="1" stop-color="var(--bansuri-dark, #8f6b2f)"/>
    </linearGradient>
  </defs>
  <rect x="6" y="24" width="388" height="32" rx="16" fill="url(#${uid}-bamboo)"/>
  <rect x="28" y="24" width="5" height="32" class="bansuri__node"/>
  <rect x="356" y="24" width="5" height="32" class="bansuri__node"/>
  <rect x="210" y="24" width="4" height="32" class="bansuri__node"/>
  <ellipse cx="58" cy="40" rx="9" ry="7.5" class="bansuri__mouth"/>
  <text x="58" y="72" text-anchor="middle" class="bansuri__num">blow</text>
  ${holeEls}
</svg>`;
}
