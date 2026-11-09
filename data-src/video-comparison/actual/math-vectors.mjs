import {mathjax} from 'mathjax-full/js/mathjax.js';
import {TeX} from 'mathjax-full/js/input/tex.js';
import {SVG} from 'mathjax-full/js/output/svg.js';
import {liteAdaptor} from 'mathjax-full/js/adaptors/liteAdaptor.js';
import {RegisterHTMLHandler} from 'mathjax-full/js/handlers/html.js';
import {AllPackages} from 'mathjax-full/js/input/tex/AllPackages.js';

const adaptor=liteAdaptor();
RegisterHTMLHandler(adaptor);
const document=mathjax.document('',{InputJax:new TeX({packages:AllPackages}),OutputJax:new SVG({fontCache:'none'})});
export function formulaVector(tex) {
  const result=document.convert(tex,{display:true});
  const svg=adaptor.tags(result,'svg')[0];
  if(!svg || adaptor.tags(result,'merror').length || adaptor.outerHTML(result).includes('data-mjx-error'))throw new Error(`Invalid formula: ${tex}`);
  const describe=node=>({kind:adaptor.kind(node),attributes:Object.fromEntries(adaptor.allAttributes(node).map(attribute=>[attribute.name,attribute.value])),children:adaptor.childNodes(node).filter(child=>adaptor.kind(child)!=='#text').map(describe)});
  return {tex,viewBox:adaptor.getAttribute(svg,'viewBox').split(/\s+/).map(Number),children:adaptor.childNodes(svg).filter(node=>adaptor.kind(node)==='g').map(describe)};
}