import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {notationFor} from '../../pages/inferencia/teaching.js';

export function Notation({topic}) {
  return <section className="lesson-notation" aria-label="Lectura y significado de la notación">
    <dl>{notationFor(topic).map(item => <div key={item.term}>
      <dt><strong>{item.symbol} · {item.term}</strong></dt>
      <dd><p><strong>Se lee:</strong> {item.reading}.</p><p>{item.definition}</p><p><strong>Ejemplo:</strong> {item.example}</p></dd>
    </div>)}</dl>
  </section>;
}

export default function Formula({tex, meaning, reading}) {
  const html = katex.renderToString(tex, {displayMode: true, throwOnError: true, trust: false, strict: 'ignore'});
  return <div className="course-formula">{reading && <p><strong>Se lee:</strong> {reading}</p>}<div dangerouslySetInnerHTML={{__html: html}} />{meaning && <p>{meaning}</p>}</div>;
}