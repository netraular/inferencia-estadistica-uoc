// Lesson notes may contain inline TeX between dollar signs, for example
// "la marginal es $2(1-x)$". MDX cannot receive raw TeX (braces are JSX
// expressions), so the generator replaces every segment with a component.
const INLINE = /\$([^$\n]+)\$/g;

const escapeBraces = text => text.replace(/[{}]/g, character => character === '{' ? '&#123;' : '&#125;');

// Braces outside formulas are escaped so MDX shows them as text.
export function inlineMathToMdx(html, component = 'InlineFormula') {
  const source = String(html);
  let output = '';
  let last = 0;
  for (const match of source.matchAll(INLINE)) {
    output += escapeBraces(source.slice(last, match.index)) + `<${component} tex={${JSON.stringify(match[1].trim())}} />`;
    last = match.index + match[0].length;
  }
  return output + escapeBraces(source.slice(last));
}

export function inlineMathToHtml(html, render) {
  return String(html).replace(INLINE, (_, tex) => render(tex.trim()));
}

export function inlineMathSegments(html) {
  return Array.from(String(html).matchAll(INLINE), match => match[1].trim());
}
