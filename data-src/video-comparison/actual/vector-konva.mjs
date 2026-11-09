import Konva from 'konva';

function svgTransform(value='') {
  const transform=new Konva.Transform();
  for(const match of value.matchAll(/(translate|scale|matrix|rotate)\(([^)]+)\)/g)) {
    const values=match[2].trim().split(/[\s,]+/).map(Number);
    if(match[1]==='translate')transform.translate(values[0],values[1] || 0);
    if(match[1]==='scale')transform.scale(values[0],values[1] ?? values[0]);
    if(match[1]==='matrix')transform.multiply(new Konva.Transform(values));
    if(match[1]==='rotate')transform.rotate(values[0]*Math.PI/180);
  }
  return transform.decompose();
}

export function formulaGraphic(vector,{x,y,width,height,color}) {
  const [left,top,originalWidth,originalHeight]=vector.viewBox;
  const scale=Math.min(width/originalWidth,height/originalHeight);
  const outer=new Konva.Group({x:x+(width-originalWidth*scale)/2-left*scale,y:y+(height-originalHeight*scale)/2-top*scale,scaleX:scale,scaleY:scale,listening:false});
  const append=(parent,description,fill)=>{
    const attributes=description.attributes;
    const tone=attributes.fill && attributes.fill!=='currentColor'?attributes.fill:fill;
    const group=new Konva.Group({...svgTransform(attributes.transform),listening:false});
    parent.add(group);
    if(description.kind==='path')group.add(new Konva.Path({data:attributes.d,fill:tone,listening:false}));
    if(description.kind==='rect')group.add(new Konva.Rect({x:Number(attributes.x || 0),y:Number(attributes.y || 0),width:Number(attributes.width),height:Number(attributes.height),fill:tone,listening:false}));
    for(const child of description.children)append(group,child,tone);
  };
  for(const child of vector.children)append(outer,child,color);
  return outer;
}