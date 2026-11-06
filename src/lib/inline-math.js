// Lesson notes may contain inline TeX between dollar signs, for example
// "la marginal es $2(1-x)$". MDX cannot receive raw TeX (braces are JSX
// expressions), so the generator replaces every segment with a component.
const INLINE = /\$([^$\n]+)\$/g;

export function inlineMathToMdx(html, component = 'InlineFormula') {
  return String(html).replace(INLINE, (_, tex) => `<${component} tex={${JSON.stringify(tex.trim())}} />`);
}

export function inlineMathToHtml(html, render) {
  return String(html).replace(INLINE, (_, tex) => render(tex.trim()));
}

export function inlineMathSegments(html) {
  return Array.from(String(html).matchAll(INLINE), match => match[1].trim());
}
