import { Locator } from '@playwright/test';

/** Colour names the FSD uses for badges, buttons and borders. */
export type ColourFamily = 'grey' | 'red' | 'orange' | 'amber' | 'yellow' | 'green' | 'teal' | 'blue' | 'purple' | 'pink';

/**
 * Names the colour family of a CSS rgb()/rgba() value by hue, so a spec can check "amber badge" without pinning the
 * exact shade. Low-saturation colours (incl. Tailwind's blue-tinted "slate") count as grey.
 */
export function colourFamily(css: string): ColourFamily {
  const [r, g, b] = (css.match(/\d+(\.\d+)?/g) ?? ['0', '0', '0']).slice(0, 3).map((v) => Number(v) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  if (saturation < 0.3) return 'grey';
  let hue: number;
  if (max === r) hue = 60 * (((g - b) / delta) % 6);
  else if (max === g) hue = 60 * ((b - r) / delta + 2);
  else hue = 60 * ((r - g) / delta + 4);
  if (hue < 0) hue += 360;
  if (hue < 15 || hue >= 345) return 'red';
  if (hue < 33) return 'orange';
  if (hue < 50) return 'amber';
  if (hue < 65) return 'yellow';
  // Emerald shades (hue ≈ 160–164) read as green; teal starts around 170.
  if (hue < 168) return 'green';
  if (hue < 195) return 'teal';
  if (hue < 250) return 'blue';
  if (hue < 300) return 'purple';
  return 'pink';
}

/** Computed CSS colour of an element (`color`, `background-color`, `border-top-color`, ...). */
export async function cssColour(locator: Locator, property = 'color'): Promise<string> {
  return locator.evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop), property);
}

/** Colour family of an element's computed colour property. */
export async function colourOf(locator: Locator, property = 'color'): Promise<ColourFamily> {
  return colourFamily(await cssColour(locator, property));
}
