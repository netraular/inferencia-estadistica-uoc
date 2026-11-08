const colors = {paper:'#fcfefd',ink:'#253330',muted:'#64736e',grid:'#dce7e1',base:'#117568',focus:'#ad3459',wash:'#d5ebe2',gold:'#956512'};
const number = value => new Intl.NumberFormat('es',{maximumSignificantDigits:4}).format(value);
const clamp = (value,lower,upper) => Math.max(lower,Math.min(upper,value));
const span = (values,zero = false) => {
  let lower = Math.min(...values,...(zero ? [0] : []));
  let upper = Math.max(...values,...(zero ? [0] : []));
  if (lower === upper) {lower -= Math.abs(lower)*0.1 || 1;upper += Math.abs(upper)*0.1 || 1;}
  return [lower,upper];
};

export function selectContextDiagram(visual, cueIndex = -1) {
  const phase = Number.isInteger(cueIndex) && cueIndex >= 0 ? visual?.phases?.[cueIndex] : undefined;
  return {diagram:phase?.context || visual?.context,phase};
}

export function drawContextDiagram(context, diagram, width, height, {phase,compact=false} = {}) {
  if (!context || !diagram) return null;
  if (![width,height].every(value=>Number.isFinite(value) && value>0)) throw new RangeError('Dimensiones de diagrama no validas');
  const labels = [];
  let marks = 0;
  const plot = {x:58,y:compact ? 34 : 100,width:Math.max(1,width-82),height:Math.max(1,height-(compact ? 136 : 202))};
  const result = {kind:diagram.kind,width,height,plot,labels,marks:0,cue:phase?.cue ?? -1};
  const label = (value,x,y,boxWidth,boxHeight,{align='left',color=colors.ink,size=13,bold=false} = {}) => {
    const text = String(value ?? '');
    if (!text || boxWidth<=0 || boxHeight<10) return;
    let rows;
    let lineHeight;
    const wrap = () => {
      context.font = `${bold ? 'bold ' : ''}${size}px Atkinson, "Trebuchet MS", sans-serif`;
      rows = [''];
      for (const word of text.split(/\s+/)) {
        const last = rows.length-1;
        if (context.measureText(`${rows[last]} ${word}`.trim()).width<=boxWidth) rows[last]=`${rows[last]} ${word}`.trim();
        else {
          if (rows[last]) rows.push('');
          for (const character of word) {
            if (context.measureText(rows.at(-1)+character).width>boxWidth && rows.at(-1)) rows.push('');
            rows[rows.length-1]+=character;
          }
        }
      }
      lineHeight = size+3;
    };
    wrap();
    while (rows.length*lineHeight>boxHeight && size>10) {size--;wrap();}
    const maximum = Math.max(1,Math.floor(boxHeight/lineHeight));
    if (rows.length>maximum) {
      rows=rows.slice(0,maximum);
      while (context.measureText(`${rows.at(-1)}...`).width>boxWidth && rows.at(-1)) rows[rows.length-1]=rows.at(-1).slice(0,-1);
      rows[rows.length-1]+='...';
    }
    context.fillStyle=color;
    context.textBaseline='top';
    context.textAlign=align;
    const anchor = align==='center' ? x+boxWidth/2 : align==='right' ? x+boxWidth : x;
    rows.forEach((row,index)=>context.fillText(row,anchor,y+index*lineHeight));
    labels.push({text,x,y,width:boxWidth,height:rows.length*lineHeight,rows,font:context.font});
  };
  const path = (points,{color=colors.base,fill,lineWidth=2,dash=[],closed=false} = {}) => {
    if (!points.length) return;
    context.beginPath();
    points.forEach(([positionX,positionY],index)=>index ? context.lineTo(positionX,positionY) : context.moveTo(positionX,positionY));
    if (closed) context.closePath();
    if (fill) {context.fillStyle=fill;context.fill();}
    context.strokeStyle=color;context.lineWidth=lineWidth;context.setLineDash(dash);context.stroke();context.setLineDash([]);
    marks++;
  };
  const dot = (positionX,positionY,{color=colors.focus,filled=true,radius=4} = {}) => {
    context.beginPath();context.arc(positionX,positionY,radius,0,Math.PI*2);
    context.fillStyle=filled ? color : colors.paper;context.fill();
    context.strokeStyle=color;context.lineWidth=2;context.stroke();marks++;
  };
  const legend = value => label(value,16,height-42,width-32,38,{size:12,color:colors.muted});
  const axes = (domain,range,xTitle,yTitle,{ticks} = {}) => {
    const mapX = value=>plot.x+(value-domain[0])/(domain[1]-domain[0])*plot.width;
    const mapY = value=>plot.y+plot.height-(value-range[0])/(range[1]-range[0])*plot.height;
    const bottom = plot.y+plot.height;
    const xTicks = ticks || [domain[0],(domain[0]+domain[1])/2,domain[1]];
    for (const value of [range[0],(range[0]+range[1])/2,range[1]]) {
      const top=mapY(value);
      path([[plot.x,top],[plot.x+plot.width,top]],{color:colors.grid,lineWidth:1});
      label(number(value),3,top-7,plot.x-10,18,{align:'right',size:11,color:colors.muted});
    }
    path([[plot.x,plot.y],[plot.x,bottom],[plot.x+plot.width,bottom]],{color:colors.ink,lineWidth:1.5});
    if (range[0]<0 && range[1]>0) path([[plot.x,mapY(0)],[plot.x+plot.width,mapY(0)]],{color:colors.muted,lineWidth:1});
    const tickWidth=Math.min(64,plot.width/Math.max(1,xTicks.length));
    for (const value of xTicks) {
      const left=clamp(mapX(value)-tickWidth/2,plot.x-12,width-tickWidth-8);
      path([[mapX(value),bottom],[mapX(value),bottom+4]],{color:colors.ink,lineWidth:1});
      label(number(value),left,bottom+9,tickWidth,28,{align:'center',size:11,color:colors.muted});
    }
    label(yTitle,plot.x,compact ? 8 : 74,plot.width,23,{size:12,color:colors.muted});
    label(xTitle,plot.x,height-63,plot.width,19,{align:'center',size:12,color:colors.muted});
    return {mapX,mapY,bottom,domain,range};
  };
  const clipped = draw => {
    context.save();context.beginPath();context.rect(plot.x-1,plot.y-1,plot.width+2,plot.height+2);context.clip();draw();context.restore();
  };
  const selected = diagram.highlight || diagram.selected || phase?.focus?.targets?.indices || [];
  context.save();
  try {
    context.clearRect(0,0,width,height);
    context.fillStyle=colors.paper;context.fillRect(0,0,width,height);
    if(!compact)label(diagram.label || diagram.caption,16,12,width-32,57,{bold:true,size:15});
    if (diagram.kind === 'bars') {
      const values=diagram.values;
      const [minimum,maximum]=span(values,true);
      const range=[minimum<0 ? minimum*1.14 : 0,maximum>0 ? maximum*1.18 : 0];
      const chart=axes([0,values.length],range,diagram.xLabel || '',diagram.yLabel || (diagram.measure==='mass' ? 'Masa' : 'Valor'),{ticks:[]});
      const unit=plot.width/values.length;
      const stride=Math.max(1,Math.ceil(36/unit));
      const ticks=new Set([values.length-1,...values.flatMap((_,index)=>index%stride===0 && index+stride<=values.length-1 ? [index] : [])]);
      values.forEach((value,index)=>{
        const left=chart.mapX(index+0.18);
        const top=chart.mapY(Math.max(0,value));
        context.fillStyle=selected.includes(index) ? colors.focus : colors.base;
        context.fillRect(left,top,Math.max(1,unit*0.64),Math.max(1,Math.abs(chart.mapY(value)-chart.mapY(0))));marks++;
        if (unit>=36) label(number(value),chart.mapX(index),Math.max(plot.y+4,(value<0 ? chart.mapY(value) : top)-22),unit,20,{align:'center',size:11});
        if (ticks.has(index)) {
          const tickWidth=Math.max(1,unit*stride-4);
          const tickLeft=clamp(chart.mapX(index+0.5)-tickWidth/2,plot.x-12,width-tickWidth-8);
          label(diagram.labels[index],tickLeft,chart.bottom+9,tickWidth,38,{align:'center',size:11});
        }
      });
      const focus=selected.length ? `Seleccion: ${selected.map(index=>diagram.labels[index]).join(', ')}.` : 'Alturas en la escala del eje vertical.';
      legend(`${focus}${diagram.total===undefined ? '' : ` Total: ${number(diagram.total)}.`}${diagram.tail===undefined ? '' : ` Cola fuera del marco: ${number(diagram.tail)}.`}`);
    } else if (diagram.kind === 'matrix') {
      const rowWidth=Math.min(112,(width-32)*0.34);
      const cellWidth=(width-32-rowWidth)/diagram.columns.length;
      const top=compact ? 53 : 119;
      const cellHeight=(height-54-top)/diagram.rows.length;
      diagram.columns.forEach((column,index)=>label(column,16+rowWidth+index*cellWidth,compact ? 8 : 74,cellWidth-3,42,{align:'center',size:12,bold:true}));
      diagram.rows.forEach((row,rowIndex)=>{
        const positionY=top+rowIndex*cellHeight;
        label(row,16,positionY+4,rowWidth-8,cellHeight-6,{size:12});
        diagram.values[rowIndex].forEach((value,columnIndex)=>{
          const positionX=16+rowWidth+columnIndex*cellWidth;
          const active=(diagram.highlight || phase?.focus?.targets?.cells || []).some(([row,column])=>row===rowIndex && column===columnIndex);
          context.fillStyle=active ? colors.focus : colors.wash;context.fillRect(positionX,positionY,cellWidth-3,cellHeight-3);marks++;
          label(number(value),positionX+3,positionY+Math.max(3,(cellHeight-19)/2),cellWidth-9,Math.min(40,cellHeight-6),{align:'center',size:13,bold:active,color:active ? '#ffffff' : colors.ink});
        });
      });
      legend('Cada entrada conserva su fila y columna; carmesi = seleccion.');
    } else if (diagram.kind === 'trials') {
      const columns=Math.max(1,Math.min(diagram.outcomes.length,Math.floor((width-32)/86)));
      const rows=Math.ceil(diagram.outcomes.length/columns);
      const cellWidth=(width-32)/columns;
      const cellHeight=(height-(compact ? 76 : 142))/rows;
      diagram.outcomes.forEach((outcome,index)=>{
        const left=16+(index%columns)*cellWidth;
        const top=(compact ? 11 : 77)+Math.floor(index/columns)*cellHeight;
        const active=selected.includes(index);
        context.fillStyle=active ? colors.wash : '#eef3f0';context.fillRect(left,top,cellWidth-6,cellHeight-5);marks++;
        label(`${index+1}`,left+5,top+3,cellWidth-16,16,{size:10,color:colors.muted});
        label(outcome,left+5,top+22,cellWidth-16,cellHeight-29,{size:13,bold:active,color:active ? colors.focus : colors.ink});
        (diagram.groups || []).forEach((group,groupIndex)=>{
          if (group.indices.includes(index)) path([[left+3,top+cellHeight-8-groupIndex*3],[left+cellWidth-9,top+cellHeight-8-groupIndex*3]],{color:groupIndex%2 ? colors.gold : colors.base});
        });
      });
      legend((diagram.groups || []).map(group=>`${group.label}: ${group.indices.map(index=>index+1).join(', ')}`).join('; ') || 'Orden de lectura: izquierda a derecha, fila a fila. Carmesi = seleccion.');
    } else if (diagram.kind === 'tree') {
      const leaves = node=>node.children?.length ? node.children.reduce((sum,child)=>sum+leaves(child),0) : 1;
      const depth = node=>1+Math.max(0,...(node.children || []).map(depth));
      const levels=Math.max(...diagram.nodes.map(depth));
      const leafCount=diagram.nodes.reduce((sum,node)=>sum+leaves(node),0);
      const column=(width-32)/levels;
      const unit=(height-(compact ? 66 : 132))/leafCount;
      const walk = (node,level,offset,parent) => {
        const count=leaves(node);
        const left=16+level*column;
        const middle=(compact ? 12 : 78)+(offset+count/2)*unit;
        if (parent) path([[parent[0],parent[1]],[left-3,middle]],{color:colors.grid});
        dot(left,middle,{color:colors.base,radius:2});
        const text=node.weight===undefined ? node.label : `${node.label}; p = ${number(node.weight)}`;
        const boxHeight=Math.min(count*unit-4,100);
        label(text,left+3,middle-boxHeight/2,column-10,boxHeight,{size:12,bold:level===0});
        let next=offset;
        for (const child of node.children || []) {walk(child,level+1,next,[left+column-7,middle]);next+=leaves(child);}
      };
      let next=0;
      diagram.nodes.forEach(node=>{walk(node,0,next);next+=leaves(node);});
      legend('Ramas del modelo; solo se ponderan las probabilidades indicadas.');
    } else if (diagram.kind === 'number-line') {
      const mapX=value=>28+(value-diagram.min)/(diagram.max-diagram.min)*(width-56);
      const bottom=height-114;
      path([[28,bottom],[width-28,bottom]],{color:colors.ink});
      const intervals=diagram.intervals || [];
      const lane=Math.min(46,(bottom-(compact ? 26 : 92))/Math.max(1,intervals.length));
      intervals.forEach((item,index)=>{
        const top=(compact ? 22 : 88)+(index+0.5)*lane;
        const left=mapX(item.from);
        const right=mapX(item.to);
        path([[left,top],[right,top]],{color:index%2 ? colors.gold : colors.base,lineWidth:4});
        dot(left,top,{filled:item.closed?.[0] ?? true,color:colors.base});
        dot(right,top,{filled:item.closed?.[1] ?? true,color:colors.base});
        label(item.label,28,top+9,width-56,Math.min(30,lane-10),{align:'center',size:12});
      });
      const ticks=[...new Set([diagram.min,...(diagram.points || []),diagram.max])].sort((left,right)=>left-right);
      const occupied=[];
      ticks.forEach(value=>{
        const position=mapX(value);
        context.font='11px Atkinson, "Trebuchet MS", sans-serif';
        const boxWidth=Math.min(64,Math.max(24,context.measureText(number(value)).width+8));
        const left=clamp(position-boxWidth/2,8,width-boxWidth-8);
        let lane=0;
        while (occupied.some(box=>box.lane===lane && left<box.right+3 && left+boxWidth>box.left-3)) lane++;
        occupied.push({left,right:left+boxWidth,lane});
        dot(position,bottom,{color:(diagram.points || []).includes(value) ? colors.focus : colors.muted,radius:3});
        label(number(value),left,bottom+10+lane*19,boxWidth,18,{align:'center',size:11});
      });
      legend('Extremo hueco: excluido. Extremo lleno: incluido.');
    } else if (['scatter','region','joint-normal'].includes(diagram.kind)) {
      let points=diagram.points || [];
      let domain;
      let range;
      if (diagram.kind==='joint-normal') {
        domain=[diagram.meanX-3.6*diagram.sdX,diagram.meanX+3.6*diagram.sdX];
        range=[diagram.meanY-3.6*diagram.sdY,diagram.meanY+3.6*diagram.sdY];
      } else {
        const all=[...points,...(diagram.markers || []),...(diagram.cut || []),...(diagram.polygons || []).flat()];
        domain=span(all.map(point=>point[0]),diagram.kind==='region');
        range=span(all.map(point=>point[1]),diagram.kind==='region');
        const paddingX=(domain[1]-domain[0])*0.08;
        const paddingY=(range[1]-range[0])*0.08;
        domain=[domain[0]-paddingX,domain[1]+paddingX];range=[range[0]-paddingY,range[1]+paddingY];
      }
      const chart=axes(diagram.domain || domain,diagram.range || range,diagram.xLabel || 'X',diagram.yLabel || 'Y');
      const map=point=>[chart.mapX(point[0]),chart.mapY(point[1])];
      clipped(()=>{
        if (diagram.kind==='joint-normal') {
          for (const radius of [3,2,1]) {
            const contour=Array.from({length:97},(_,index)=>{
              const angle=index*Math.PI/48;
              return map([diagram.meanX+diagram.sdX*radius*Math.cos(angle),diagram.meanY+diagram.sdY*radius*(diagram.rho*Math.cos(angle)+Math.sqrt(1-diagram.rho**2)*Math.sin(angle))]);
            });
            path(contour,{closed:true,fill:radius===3 ? '#eef3f0' : radius===2 ? colors.wash : '#afd2c3'});
          }
          if (diagram.highlightAxis) {
            if (['x','both'].includes(diagram.highlightAxis)) path([[chart.mapX(domain[0]),chart.mapY(diagram.meanY)],[chart.mapX(domain[1]),chart.mapY(diagram.meanY)]],{color:colors.gold,dash:[5,4]});
            if (['y','both'].includes(diagram.highlightAxis)) path([[chart.mapX(diagram.meanX),chart.mapY(range[0])],[chart.mapX(diagram.meanX),chart.mapY(range[1])]],{color:colors.gold,dash:[5,4]});
          }
          if (Number.isFinite(diagram.cutX)) path([[chart.mapX(diagram.cutX),plot.y],[chart.mapX(diagram.cutX),chart.bottom]],{color:colors.focus,lineWidth:3});
        } else if (diagram.kind==='region') {
          path(points.map(map),{closed:true,fill:colors.wash});
          for (const polygon of diagram.polygons || []) path(polygon.map(map),{closed:true,fill:'#afd2c3',color:colors.focus});
          if (diagram.sweep) for (let index=1;index<10;index++) {
            const position=diagram.sweep[0]+(diagram.sweep[1]-diagram.sweep[0])*index/10;
            const intersections=[];
            points.forEach((point,pointIndex)=>{
              const next=points[(pointIndex+1)%points.length];
              if (point[0]!==next[0] && position>=Math.min(point[0],next[0]) && position<=Math.max(point[0],next[0])) intersections.push(point[1]+(next[1]-point[1])*(position-point[0])/(next[0]-point[0]));
            });
            if (intersections.length>1) path([map([position,Math.min(...intersections)]),map([position,Math.max(...intersections)])],{color:colors.base,lineWidth:1});
          }
          if (diagram.cut) path(diagram.cut.map(map),{color:colors.focus,lineWidth:3});
          for (const point of diagram.markers || []) dot(...map(point));
        } else {
          if (diagram.line) path([map([domain[0],diagram.line.slope*domain[0]+diagram.line.intercept]),map([domain[1],diagram.line.slope*domain[1]+diagram.line.intercept])],{color:colors.muted});
          points.forEach((point,index)=>dot(...map(point),{color:selected.includes(index) ? colors.focus : colors.base,radius:5}));
        }
      });
      legend(diagram.kind==='joint-normal' ? `Contornos de igual densidad; rho = ${number(diagram.rho)}.${diagram.cutX===undefined ? '' : ` Corte X = ${number(diagram.cutX)}.`}` : diagram.kind==='region' ? `Region admisible${diagram.density===undefined ? '' : `; densidad = ${number(diagram.density)}`}. Carmesi = corte o seleccion.` : 'Cada punto conserva su pareja (X, Y); ejes en unidades originales.');
    } else if (diagram.kind==='curve' || diagram.kind==='normal') {
      let points=diagram.points;
      let domain=diagram.domain;
      if (diagram.kind==='normal') {
        domain=domain || [diagram.mean-4*diagram.sd,diagram.mean+4*diagram.sd];
        points=Array.from({length:161},(_,index)=>{
          const position=domain[0]+(domain[1]-domain[0])*index/160;
          return [position,Math.exp(-0.5*((position-diagram.mean)/diagram.sd)**2)/(diagram.sd*Math.sqrt(2*Math.PI))];
        });
      }
      domain=domain || span(points.map(point=>point[0]));
      const range=diagram.range || [Math.min(0,...points.map(point=>point[1])),Math.max(...points.map(point=>point[1]),0.000001)*1.12];
      const chart=axes(domain,range,diagram.xLabel || 'x',diagram.yLabel || (diagram.kind==='normal' ? 'Densidad' : diagram.measure || 'y'),{ticks:diagram.ticks});
      const map=point=>[chart.mapX(point[0]),chart.mapY(point[1])];
      const at = position => {
        const upper=points.findIndex(point=>point[0]>position);
        if (upper<0) return points.at(-1)[1];
        if (!upper) return points[0][1];
        const left=points[upper-1];const right=points[upper];
        return left[1]+(right[1]-left[1])*(position-left[0])/(right[0]-left[0]);
      };
      const shade=diagram.shade || (diagram.kind==='normal' && (diagram.lower!==undefined || diagram.upper!==undefined) ? [diagram.lower ?? domain[0],diagram.upper ?? domain[1]] : null);
      clipped(()=>{
        if (shade) {
          const lower=Math.max(domain[0],shade[0]);const upper=Math.min(domain[1],shade[1]);
          if (lower<=upper) path([[lower,0],[lower,at(lower)],...points.filter(point=>point[0]>lower && point[0]<upper),[upper,at(upper)],[upper,0]].map(map),{closed:true,fill:colors.wash,color:colors.base,lineWidth:1});
        }
        path(points.map(map),{lineWidth:3});
        for (const marker of [...(diagram.markers || []),...(Number.isFinite(diagram.marker) ? [diagram.marker] : [])]) {
          path([map([marker,0]),map([marker,at(marker)])],{color:colors.focus,dash:[5,3]});dot(...map([marker,at(marker)]));
        }
        if (diagram.kind!=='normal' && Number.isFinite(diagram.level)) path([[plot.x,chart.mapY(diagram.level)],[plot.x+plot.width,chart.mapY(diagram.level)]],{color:colors.gold,dash:[5,3]});
      });
      const measure=diagram.kind==='normal' ? 'density' : diagram.measure;
      const names={density:'Altura de densidad; la probabilidad es area',cdf:'Probabilidad acumulada',survival:'Probabilidad de seguir esperando',function:'Salida de la funcion',likelihood:'Verosimilitud; no probabilidad del parametro','moment-integrand':'Integrando del momento; no densidad','normalizer-integrand':'Integrando de la constante; no densidad'};
      const annotation=diagram.kind==='normal' && Number.isFinite(diagram.level) ? ` Area solicitada: ${number(diagram.level)}; umbral por determinar.` : Number.isFinite(diagram.marker) ? ` Umbral: ${number(diagram.marker)}.` : '';
      legend(`${names[measure] || 'Curva en las unidades de los ejes'}.${shade ? ` Franja: ${number(shade[0])} a ${number(shade[1])}.` : ''}${annotation}`);
    } else throw new RangeError(`Diagrama no compatible: ${diagram.kind}`);
    result.marks=marks;
    return result;
  } finally {context.restore();}
}