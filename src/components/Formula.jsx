import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function Formula({tex, meaning}) {
  const html = katex.renderToString(tex, {displayMode: true, throwOnError: true, trust: false, strict: 'ignore'});
  return <div className="course-formula"><div dangerouslySetInnerHTML={{__html: html}} />{meaning && <p>{meaning}</p>}</div>;
}