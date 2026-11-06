import React, {useEffect, useId, useRef, useState} from 'react';
import {BookA, Search, X} from 'lucide-react';
import {COURSE} from '../../pages/inferencia/course.js';

const searchable = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');

export function SymbolsDialog({id, onClose}) {
  const dialog = useRef(null);
  const [query, setQuery] = useState('');
  const results = COURSE.glossary.filter(entry => searchable(`${entry.symbol} ${entry.term} ${entry.reading} ${entry.definition} ${entry.example}`).includes(searchable(query.trim())));
  useEffect(() => {
    const element = dialog.current;
    const previousFocus = element.ownerDocument.activeElement;
    element.showModal();
    element.querySelector('input').focus();
    return () => {
      element.close();
      if (previousFocus?.isConnected) previousFocus.focus({preventScroll:true});
    };
  }, []);
  const closeOutside = event => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX >= bounds.right || event.clientY < bounds.top || event.clientY >= bounds.bottom) onClose();
  };
  return <dialog ref={dialog} id={id} className="symbols-dialog" aria-labelledby={`${id}-title`} aria-modal="true" onClick={closeOutside} onCancel={event => {event.preventDefault(); onClose();}} onClose={onClose}>
    <div className="symbols-content">
      <header className="symbols-heading">
        <h2 id={`${id}-title`}>S&iacute;mbolos</h2>
        <button type="button" className="course-icon-button" aria-label="Cerrar s&#237;mbolos" title="Cerrar" onClick={onClose}><X size={22} aria-hidden="true" /></button>
      </header>
      <label className="symbols-search" htmlFor={`${id}-search`}>
        <Search size={20} aria-hidden="true" />
        <span className="sr-only">Buscar s&iacute;mbolos</span>
        <input id={`${id}-search`} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="S&#237;mbolo o t&#233;rmino" />
      </label>
      <p className="symbols-count" role="status">{results.length === 1 ? '1 resultado' : `${results.length} resultados`}</p>
      <div className="symbols-results">
        {results.length ? <dl>{results.map(entry => <div key={`${entry.symbol}-${entry.term}`}>
          <dt><span className="glossary-symbol">{entry.symbol}</span><span>{entry.term}</span></dt>
          <dd><p><strong>Se lee:</strong> {entry.reading}.</p><p>{entry.definition}</p><p><strong>Ejemplo:</strong> {entry.example}</p></dd>
        </div>)}</dl> : <p>No hay coincidencias.</p>}
      </div>
    </div>
  </dialog>;
}

export default function SymbolsNavbarItem({mobile = false, label = 'S\u00edmbolos'}) {
  const [opened, setOpened] = useState(false);
  const id = useId();
  const content = <>
    <button type="button" className={`${mobile ? 'menu__link' : 'navbar__item navbar__link'} symbols-trigger`} aria-haspopup="dialog" aria-expanded={opened} aria-controls={opened ? id : undefined} onClick={() => setOpened(true)}>
      <BookA size={18} aria-hidden="true" /><span>{label}</span>
    </button>
    {opened && <SymbolsDialog id={id} onClose={() => setOpened(false)} />}
  </>;
  return mobile ? <li className="menu__list-item">{content}</li> : content;
}