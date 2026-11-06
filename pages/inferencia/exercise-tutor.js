const number = value => Number(value.toPrecision(7)).toString();
const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const frame = (title, tex, comment = '') => ({title, tex, comment});

function exerciseData(exercise, question) {
  const params=exercise.visual.params;
  if(exercise.type==='normal')return String.raw`\mu=${params.mean},\quad\sigma=${params.sd},\quad${question.id==='interval'?`a=${params.lower},\\ b=${params.upper}`:`p=${params.quantileProbability}`}`;
  if(exercise.type==='continuous')return String.raw`f(x)=cx,\quad0\le x\le${params.upper},\quad t=${number(params.threshold)}`;
  if(exercise.type==='events')return String.raw`N=${params.total},\quad n_A=${params.countA},\quad n_B=${params.countB},\quad n_{A\cap B}=${params.both}`;
  if(exercise.type==='bayes')return String.raw`P(D)=${number(params.prevalence)},\quad P(+\mid D)=${number(params.sensitivity)},\quad P(+\mid\overline D)=${number(params.falsePositive)}`;
  if(exercise.type==='binomial')return String.raw`n=${params.n},\quad p=${params.p},\quad k=${params.k}`;
  if(exercise.type==='poisson')return String.raw`r=${params.rate},\quad t=${params.duration},\quad k=${params.k}`;
  return '';
}

function operations(exercise, question) {
  const params = exercise.visual.params;
  const core = globalThis.jStat;
  if (exercise.type === 'events') {
    const {total,countA,countB,both}=params;
    const union=countA+countB-both;
    const parts=[frame('Reunir los dos grupos',String.raw`${countA}+${countB}=${countA+countB}`,'Los casos que pertenecen a ambos grupos se cuentan dos veces.'),frame('Corregir el solapamiento',String.raw`${countA+countB}-${both}=${union}`,'Restamos una vez la interseccion.'),frame('Comparar con el total',String.raw`P(A\cup B)=\frac{${union}}{${total}}`)];
    if(question.id==='neither')parts.push(frame('Seleccionar lo que queda fuera',String.raw`P(\overline{A\cup B})=1-\frac{${union}}{${total}}`));
    return parts;
  }
  if (exercise.type === 'bayes') {
    const {prevalence,sensitivity,falsePositive}=params;
    const trueRoute=prevalence*sensitivity;
    const falseRoute=(1-prevalence)*falsePositive;
    const positive=trueRoute+falseRoute;
    const parts=[frame('Recorrer la ruta del verdadero positivo',String.raw`${number(prevalence)}\cdot${number(sensitivity)}=${number(trueRoute)}`,'La probabilidad del grupo pondera la de obtener un positivo dentro de el.'),frame('Recorrer la ruta del falso positivo',String.raw`(1-${number(prevalence)})\cdot${number(falsePositive)}=${number(falseRoute)}`,'Un positivo tambien puede venir del otro grupo.'),frame('Reunir todos los positivos',String.raw`P(+ )=${number(trueRoute)}+${number(falseRoute)}`,'Las dos rutas son excluyentes: sumamos sus probabilidades.')];
    if(question.id==='posterior')parts.push(frame('Cambiar el grupo de referencia',String.raw`P(D\mid +)=\frac{${number(trueRoute)}}{${number(positive)}}`,'Entre todos los positivos, conservamos la ruta de los verdaderos positivos.'));
    return parts;
  }
  if (exercise.type === 'normal') {
    const {mean,sd,lower,upper,quantileProbability} = params;
    if (question.id === 'interval') {
      const left = (lower-mean)/sd;
      const right = (upper-mean)/sd;
      return [
        frame('Marcar el intervalo',String.raw`${lower}\le X\le ${upper}`,'El area buscada esta entre los dos limites.'),
        frame('Centrar el limite izquierdo',String.raw`${lower}-${mean}=${number(lower-mean)}`,'Restamos la media para medir la distancia al centro.'),
        frame('Medir esa distancia en desviaciones',String.raw`z_a=\frac{${number(lower-mean)}}{${sd}}=${number(left)}`,'Dividimos por la desviacion, no por la varianza.'),
        frame('Centrar el limite derecho',String.raw`${upper}-${mean}=${number(upper-mean)}`),
        frame('Tipificar el segundo limite',String.raw`z_b=\frac{${number(upper-mean)}}{${sd}}=${number(right)}`),
        frame('Acumular hasta el limite derecho',String.raw`\Phi(${number(right)})=${number(core.normal.cdf(right,0,1))}`,'Esta area incluye tambien lo que queda antes del limite izquierdo.'),
        frame('Identificar el area que sobra',String.raw`\Phi(${number(left)})=${number(core.normal.cdf(left,0,1))}`),
        frame('Quitar el area que sobra',String.raw`P=${number(core.normal.cdf(right,0,1))}-${number(core.normal.cdf(left,0,1))}`)
      ];
    }
    const quantile = core.normal.inv(quantileProbability,0,1);
    return [
      frame('Fijar el area acumulada',String.raw`\Phi(z)=${number(quantileProbability)}`,'Buscamos un limite que deje esta proporcion a su izquierda.'),
      frame('Invertir la acumulada',String.raw`z=\Phi^{-1}(${number(quantileProbability)})`),
      frame('Consultar el cuantil estandar',String.raw`z=${number(quantile)}`),
      frame('Recuperar la escala',String.raw`\sigma z=${sd}\cdot${number(quantile)}=${number(sd*quantile)}`,'La desviacion devuelve las unidades originales.'),
      frame('Recuperar el centro',String.raw`x=${mean}+${number(sd*quantile)}`)
    ];
  }
  if (exercise.type === 'continuous') {
    const {upper,threshold,constant} = params;
    if (question.id === 'normalizer') return [
      frame('Usar todo el soporte',String.raw`\int_0^{${upper}}cx\,dx=1`,'La densidad debe reunir un area total de uno.'),
      frame('Encontrar una primitiva',String.raw`\int x\,dx=\frac{x^2}{2}`,'Derivar x al cuadrado entre dos devuelve x.'),
      frame('Evaluar los extremos',String.raw`c\left(\frac{${upper}^2}{2}-\frac{0^2}{2}\right)=1`),
      frame('Calcular el area sin la constante',String.raw`${number(upper**2/2)}c=1`),
      frame('Dejar sola la constante',String.raw`c=\frac{1}{${number(upper**2/2)}}`)
    ];
    if (question.id === 'below') return [
      frame('Recortar el intervalo',String.raw`0\le X\le ${number(threshold)}`,'No integramos el soporte completo, solo el evento pedido.'),
      frame('Usar la densidad normalizada',String.raw`P=\int_0^{${number(threshold)}}${number(constant)}x\,dx`),
      frame('Evaluar la primitiva',String.raw`P=${number(constant)}\left(\frac{${number(threshold)}^2}{2}-0\right)`),
      frame('Calcular el area del intervalo',String.raw`P=${number(constant)}\cdot${number(threshold**2/2)}`)
    ];
    return [frame('Distinguir un punto de un intervalo',String.raw`[${number(threshold)},${number(threshold)}]`,'El intervalo tiene anchura cero, aunque la curva tenga altura.'),frame('Medir su anchura',String.raw`${number(threshold)}-${number(threshold)}=0`)];
  }
  if (exercise.type === 'discrete') {
    const {weights,probabilities} = params;
    const total = weights.reduce((sum,value)=>sum+value,0);
    if (question.id === 'normalizer') return [frame('Reunir los pesos',String.raw`(${weights.join('+')})c=1`),frame('Sumar',String.raw`${total}c=1`),frame('Dividir ambos lados',String.raw`c=\frac1{${total}}`)];
    const squared = question.id === 'variance';
    const values = probabilities.map((probability,index)=>(squared ? index**2 : index)*probability);
    const result = values.reduce((sum,value)=>sum+value,0);
    const parts = values.map((value,index)=>frame(`Ponderar el valor ${index}`,String.raw`${index}${squared ? '^2' : ''}\cdot\frac{${weights[index]}}{${total}}=${number(value)}`));
    parts.push(frame(squared ? 'Reunir el segundo momento' : 'Reunir la media',String.raw`${squared ? 'E[X^2]' : 'E[X]'}=${values.map(number).join('+')}`));
    if (squared) {
      const mean = probabilities.reduce((sum,value,index)=>sum+index*value,0);
      parts.push(frame('Restar el cuadrado de la media',String.raw`\operatorname{Var}(X)=${number(result)}-(${number(mean)})^2`));
    }
    return parts;
  }
  return question.steps.slice(1,-1).flatMap(step => {
    if (!step.tex) return [frame(step.title,'',step.explanation.split(/[.!?]\s/)[0])];
    const parts = [];
    let depth = 0;
    let start = 0;
    for (let index=0;index<step.tex.length;index++) {
      const character = step.tex[index];
      if (character === '{' && step.tex[index-1] !== '\\') depth++;
      if (character === '}' && step.tex[index-1] !== '\\') depth--;
      if (character === '=' && depth === 0) {parts.push(step.tex.slice(start,index));start=index+1;}
    }
    parts.push(step.tex.slice(start));
    if (parts.length === 1) return [frame(step.title,step.tex,step.explanation.split(/[.!?]\s/)[0])];
    return parts.map((part,index)=>frame(step.title,index ? `${parts[0]}=${part}` : part,index ? '' : step.explanation.split(/[.!?]\s/)[0]));
  });
}

export function createTutorFrames(exercise, question) {
  return [frame('Identificar lo que buscamos','',question.prompt),...operations(exercise,question),{...frame('Comprobar el resultado',String.raw`\boxed{${number(question.answer)}}`,question.interpretation),result:true}];
}

export function drawTutorFigure(context, exercise, question, position, width, height) {
  const params = exercise.visual.params;
  const left = 45;
  const right = width-25;
  const top = 25;
  const bottom = height-40;
  context.clearRect(0,0,width,height);
  context.fillStyle = '#f8faf9';
  context.fillRect(0,0,width,height);
  context.lineWidth = 2;
  context.font = '14px Atkinson, sans-serif';
  context.strokeStyle = '#334155';
  context.fillStyle = '#334155';
  context.beginPath();context.moveTo(left,top);context.lineTo(left,bottom);context.lineTo(right,bottom);context.stroke();
  if (exercise.type === 'normal' || exercise.type === 'continuous') {
    const normal = exercise.type === 'normal';
    const minimum = normal ? params.mean-4*params.sd : 0;
    const maximum = normal ? params.mean+4*params.sd : params.upper;
    const value = input=>normal ? globalThis.jStat.normal.pdf(input,params.mean,params.sd) : params.constant*input;
    const peak = normal ? value(params.mean) : value(maximum);
    const horizontal = input=>left+(input-minimum)/(maximum-minimum)*(right-left);
    const vertical = input=>bottom-value(input)/peak*(bottom-top-15);
    let from = normal && question.id === 'interval' ? params.lower : minimum;
    const to = normal ? question.id === 'interval' ? params.upper : globalThis.jStat.normal.inv(params.quantileProbability,params.mean,params.sd) : question.id === 'normalizer' ? maximum : params.threshold;
    let shadedTo=to;
    const currentTitle=createTutorFrames(exercise,question)[position].title;
    if(normal&&question.id==='interval'&&currentTitle==='Acumular hasta el limite derecho')from=minimum;
    if(normal&&question.id==='interval'&&currentTitle==='Identificar el area que sobra'){from=minimum;shadedTo=params.lower;}
    if (position>0 && question.id !== 'point') {
      context.beginPath();context.moveTo(horizontal(from),bottom);
      for(let index=0;index<=80;index++){const input=from+(shadedTo-from)*index/80;context.lineTo(horizontal(input),vertical(input));}
      context.lineTo(horizontal(shadedTo),bottom);context.closePath();context.fillStyle=currentTitle==='Identificar el area que sobra'?'#f4cbd4':'#bbdfd0';context.fill();
    }
    context.strokeStyle='#147d68';context.beginPath();
    for(let index=0;index<=120;index++){const input=minimum+(maximum-minimum)*index/120;if(index)context.lineTo(horizontal(input),vertical(input));else context.moveTo(horizontal(input),vertical(input));}
    context.stroke();context.fillStyle='#334155';context.fillText(number(minimum),left,bottom+23);context.fillText(number(maximum),right-35,bottom+23);
    if(position>0){context.strokeStyle='#bd4864';context.beginPath();context.moveTo(horizontal(to),bottom);context.lineTo(horizontal(to),vertical(to));context.stroke();}
  } else if (['joint','joint-basic','covariance','independence','conditional','bayes'].includes(exercise.type)) {
    const matrix=exercise.type==='bayes' ? [[params.prevalence*params.sensitivity,params.prevalence*(1-params.sensitivity)],[(1-params.prevalence)*params.falsePositive,(1-params.prevalence)*(1-params.falsePositive)]] : exercise.type==='conditional' ? [[params.recoveredTreated,params.treated-params.recoveredTreated],[params.recoveredUntreated,params.total-params.treated-params.recoveredUntreated]] : params.probabilities;
    const rows=exercise.type==='bayes'?['D','No D']:exercise.type==='conditional'?['Tratado','No tratado']:['X = 0','X = 1'];
    const columns=exercise.type==='bayes'?['+','-']:exercise.type==='conditional'?['Recupera','No recupera']:['Y = 0','Y = 1'];
    const cellWidth=(right-left)/2;
    const cellHeight=(bottom-top)/2;
    matrix.forEach((row,rowIndex)=>row.forEach((value,columnIndex)=>{
      const selected=position>0&&(exercise.type==='bayes' ? columnIndex===0&&(position!==1||rowIndex===0) : exercise.type==='conditional' ? rowIndex===0 : question.id==='cell'?rowIndex===1&&columnIndex===1:columnIndex===1);
      const startX=left+columnIndex*cellWidth;
      const startY=top+rowIndex*cellHeight;
      context.fillStyle=selected?'#bbdfd0':'#edf1ef';context.fillRect(startX+2,startY+2,cellWidth-4,cellHeight-4);
      context.fillStyle=selected?'#075b4d':'#63716c';
      const text=exercise.type==='bayes'&&position===0?'':number(value);
      context.fillText(text,startX+cellWidth/2-context.measureText(text).width/2,startY+cellHeight/2+5);
    }));
    context.fillStyle='#334155';
    columns.forEach((text,index)=>context.fillText(text,left+cellWidth*(index+0.5)-context.measureText(text).width/2,bottom+23));
    rows.forEach((text,index)=>{context.save();context.translate(left-10,top+cellHeight*(index+0.5));context.rotate(-Math.PI/2);context.fillText(text,-context.measureText(text).width/2,0);context.restore();});
  } else if (exercise.type==='events'||exercise.type==='proportions') {
    const total=params.total;
    const values=exercise.type==='events'?[params.countA-params.both,params.both,params.countB-params.both,total-params.countA-params.countB+params.both]:[params.part,total-params.part];
    const labels=exercise.type==='events'?['Solo A','Ambos','Solo B','Ninguno']:['Germina','No germina'];
    const barWidth=(right-left)/values.length;
    values.forEach((value,index)=>{
      const selected=position>0&&(question.id==='neither'?index===3:index<3);
      const size=(bottom-top)*value/total;
      context.fillStyle=selected?'#bd4864':'#147d68';context.fillRect(left+index*barWidth+5,bottom-size,barWidth-10,size);
      context.fillStyle='#334155';context.fillText(String(value),left+index*barWidth+barWidth/2-8,bottom-size-5);
      context.fillText(labels[index],left+index*barWidth+barWidth/2-context.measureText(labels[index]).width/2,bottom+23);
    });
  } else if (exercise.type==='binomial'||exercise.type==='poisson') {
    const limit=exercise.type==='binomial'?params.n:Math.ceil(params.lambda+4*Math.sqrt(params.lambda));
    const values=Array.from({length:limit+1},(_,index)=>exercise.type==='binomial'?globalThis.jStat.binomial.pdf(index,params.n,params.p):globalThis.jStat.poisson.pdf(index,params.lambda));
    const peak=Math.max(...values);
    const barWidth=(right-left)/values.length;
    values.forEach((value,index)=>{
      const selected=position>0&&(question.id==='exact'?index===params.k:question.id==='strict-tail'?index>params.k:index<=params.k);
      context.fillStyle=selected?'#bd4864':'#147d68';context.fillRect(left+index*barWidth+1,bottom-(bottom-top)*value/peak,Math.max(1,barWidth-2),(bottom-top)*value/peak);
      if(index===0||index===params.k||index===limit){context.fillStyle='#334155';context.fillText(String(index),left+index*barWidth,bottom+23);}
    });
  } else if (exercise.type === 'continuous-joint' || exercise.type === 'plane-regions') {
    const limit = params.a || params.capacity;
    context.beginPath();context.moveTo(left,bottom);context.lineTo(right,bottom);context.lineTo(left,top);context.closePath();context.fillStyle='#d7e9e2';context.fill();context.strokeStyle='#147d68';context.stroke();
    if(position>0){
      const fraction = question.id==='sum-event' ? params.b/limit : (params.x || params.first)/limit;
      context.strokeStyle='#bd4864';context.lineWidth=3;context.beginPath();
      if(question.id==='sum-event'){context.moveTo(left,bottom-(bottom-top)*fraction);context.lineTo(left+(right-left)*fraction,bottom);}
      else {context.moveTo(left+(right-left)*fraction,bottom);context.lineTo(left+(right-left)*fraction,top+(bottom-top)*fraction);}
      context.stroke();
    }
    context.fillStyle='#334155';context.fillText('0',left-17,bottom+20);context.fillText(number(limit),right-20,bottom+20);context.fillText('X',right-5,bottom+35);context.fillText('Y',left-25,top+8);
  } else {
    const values = params.weights || params.probabilities || params.values || null;
    if(Array.isArray(values) && values.every(value=>typeof value==='number') && values.length<=20){
      const peak = Math.max(...values,1);
      values.forEach((value,index)=>{const barWidth=(right-left)/values.length;const size=(bottom-top)*value/peak;context.fillStyle=index===Math.min(position-1,values.length-1)?'#bd4864':'#147d68';context.fillRect(left+index*barWidth+8,bottom-size,barWidth-16,size);context.fillStyle='#334155';context.fillText(String(index),left+index*barWidth+barWidth/2,bottom+23);});
    } else {
      const stages = ['Datos','Modelo','Calculo','Resultado'];
      stages.forEach((label,index)=>{const cell=(right-left)/4;const center=left+cell*(index+0.5);context.fillStyle=index===Math.min(position,3)?'#147d68':'#d7e9e2';context.beginPath();context.arc(center,(top+bottom)/2,Math.min(cell/4,24),0,Math.PI*2);context.fill();context.fillStyle='#334155';context.fillText(label,center-context.measureText(label).width/2,(top+bottom)/2+45);});
    }
  }
}

export function mountExerciseTutor(root, exercise, {formatMath,onHelp,onPractice}) {
  const document = root.ownerDocument;
  const window = document.defaultView || globalThis;
  let questionIndex = 0;
  let position = 0;
  let timer = null;
  let disposed = false;
  const listeners = [];
  const listen = (target,event,handler)=>{target.addEventListener(event,handler);listeners.push(()=>target.removeEventListener(event,handler));};
  root.innerHTML = `<div class="tutor-heading"><label>Apartado<select data-tutor-question>${exercise.questions.map((question,index)=>`<option value="${index}">${index+1}. ${escape(question.prompt)}</option>`).join('')}</select></label><button type="button" class="text-button" data-tutor-practice><i data-lucide="pencil" aria-hidden="true"></i>Intentar otra variante</button></div><div class="tutor-surface"><div class="tutor-figure"><canvas width="720" height="300" role="img"></canvas></div><div class="tutor-writing" aria-live="polite"><h3 data-tutor-title></h3><p data-tutor-comment></p><div data-tutor-lines></div></div></div><div class="tutor-controls"><button type="button" class="icon-button" data-tutor-previous title="Paso anterior" aria-label="Paso anterior"><i data-lucide="arrow-left" aria-hidden="true"></i></button><button type="button" class="icon-button" data-tutor-play title="Reproducir" aria-label="Reproducir"><i data-lucide="play" aria-hidden="true"></i></button><button type="button" class="icon-button" data-tutor-next title="Paso siguiente" aria-label="Paso siguiente"><i data-lucide="arrow-right" aria-hidden="true"></i></button><span data-tutor-position role="status"></span><label>Ritmo<select data-tutor-speed><option value="4000">Pausado</option><option value="2500" selected>Normal</option><option value="1500">Rapido</option></select></label></div><details data-tutor-notes class="tutor-notes"><summary>Apuntes del ejercicio</summary><div data-tutor-note-content></div></details>`;
  const element = selector=>root.querySelector(selector);
  const data=document.createElement('div');
  data.className='tutor-data';
  element('.tutor-surface').before(data);
  element('[data-tutor-play]').innerHTML='<span data-tutor-play-symbol><i data-lucide="play" aria-hidden="true"></i></span><span data-tutor-pause-symbol hidden><i data-lucide="pause" aria-hidden="true"></i></span>';
  const canvas = element('canvas');
  const context = canvas.getContext('2d');
  const stop = ()=>{if(timer!==null)window.clearInterval(timer);timer=null;element('[data-tutor-play]').setAttribute('aria-label','Reproducir');element('[data-tutor-play]').title='Reproducir';element('[data-tutor-play]').setAttribute('aria-pressed','false');element('[data-tutor-play-symbol]').hidden=false;element('[data-tutor-pause-symbol]').hidden=true;};
  const draw = ()=>{
    if(disposed)return;
    const question=exercise.questions[questionIndex];
    if(context){
      const width=Math.max(260,Math.round(canvas.getBoundingClientRect().width||720));
      const height=Math.round(width*5/12);
      const ratio=window.devicePixelRatio||1;
      canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
      context.setTransform(ratio,0,0,ratio,0,0);
      drawTutorFigure(context,exercise,question,position,width,height);
    }
  };
  const render = ()=>{
    const question = exercise.questions[questionIndex];
    const frames = createTutorFrames(exercise,question);
    const current = frames[position];
    const dataTex=exerciseData(exercise,question);
    data.innerHTML=dataTex?formatMath(dataTex):exercise.given.map(value=>`<p>${escape(value)}</p>`).join('');
    element('[data-tutor-title]').textContent=current.title;
    element('[data-tutor-comment]').textContent=current.comment;
    element('[data-tutor-lines]').innerHTML=frames.slice(0,position+1).filter(item=>item.tex).map(item=>`<div class="tutor-equation${item===current?' is-current':''}${item.result?' is-result':''}">${formatMath(item.tex)}${item.result?`<span>${escape(question.unit)}</span>`:''}</div>`).join('');
    element('[data-tutor-position]').textContent=`Paso ${position+1} de ${frames.length}`;
    element('[data-tutor-previous]').disabled=position===0;
    element('[data-tutor-next]').disabled=position===frames.length-1;
    canvas.setAttribute('aria-label',`${exercise.title}. ${current.title}. ${current.comment}`);
    element('[data-tutor-note-content]').innerHTML=`<p>${escape(exercise.prompt)}</p><h4>Datos y supuestos</h4><ul>${[...exercise.given,...exercise.assumptions].map(value=>`<li>${escape(value)}</li>`).join('')}</ul><h4>${escape(question.prompt)}</h4><ol>${question.steps.map(step=>`<li><strong>${escape(step.title)}</strong><p>${escape(step.explanation)}</p>${step.tex?formatMath(step.tex):''}</li>`).join('')}</ol>`;
    if(position>0)onHelp(question.id);
    if(current.result)stop();
    draw();
  };
  const advance = offset=>{position=Math.max(0,Math.min(createTutorFrames(exercise,exercise.questions[questionIndex]).length-1,position+offset));render();};
  listen(element('[data-tutor-next]'),'click',()=>{stop();advance(1);});
  listen(element('[data-tutor-previous]'),'click',()=>{stop();advance(-1);});
  listen(element('[data-tutor-play]'),'click',()=>{
    if(timer!==null){stop();return;}
    if(position===createTutorFrames(exercise,exercise.questions[questionIndex]).length-1)position=0;
    render();
    element('[data-tutor-play]').setAttribute('aria-label','Pausar');element('[data-tutor-play]').title='Pausar';element('[data-tutor-play]').setAttribute('aria-pressed','true');
    element('[data-tutor-play-symbol]').hidden=true;element('[data-tutor-pause-symbol]').hidden=false;
    timer=window.setInterval(()=>advance(1),Number(element('[data-tutor-speed]').value));
  });
  listen(element('[data-tutor-speed]'),'change',stop);
  listen(element('[data-tutor-question]'),'change',()=>{stop();questionIndex=Number(element('[data-tutor-question]').value);position=0;element('[data-tutor-notes]').open=false;render();});
  listen(element('[data-tutor-notes]'),'toggle',()=>{if(element('[data-tutor-notes]').open)onHelp(exercise.questions[questionIndex].id);});
  listen(element('[data-tutor-practice]'),'click',onPractice);
  listen(window,'resize',draw);
  listen(document,'visibilitychange',()=>{if(document.hidden)stop();});
  render();
  document.fonts?.ready.then(()=>{if(!disposed)draw();});
  return ()=>{if(disposed)return;stop();disposed=true;listeners.forEach(remove=>remove());root.innerHTML='';};
}