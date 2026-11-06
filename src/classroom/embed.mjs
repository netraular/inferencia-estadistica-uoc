import {mountAula} from '../../pages/inferencia/app.js';

export function renderScopedIcons(root, library) {
  if (!library?.createElement || !library.icons) return;
  const normalize = name => name.replace(/-/g, '').toLowerCase();
  const icons = new Map(Object.entries(library.icons).map(([name, node]) => [normalize(name), node]));
  for (const placeholder of Array.from(root.querySelectorAll('i[data-lucide]'))) {
    const node = icons.get(normalize(placeholder.getAttribute('data-lucide')));
    if (!node) continue;
    const icon = library.createElement(node);
    for (const attribute of Array.from(placeholder.attributes)) icon.setAttribute(attribute.name, attribute.value);
    icon.classList.add('lucide');
    placeholder.replaceWith(icon);
  }
}

export function scopedDocument(owner, root) {
  return new Proxy(owner, {
    get(target, property) {
      if (property === 'body') return root;
      if (['getElementById', 'querySelector', 'querySelectorAll'].includes(property)) return root[property].bind(root);
      const value = Reflect.get(target, property, target);
      return typeof value === 'function' ? value.bind(target) : value;
    },
    set(target, property, value) {
      if (property === 'title') return true;
      return Reflect.set(target, property, value, target);
    }
  });
}

export function mountEmbeddedClassroom(host, {shell, baseUrl, lessonId, storage, view = 'lab', showNavigation = true, audio, createWhiteboard}) {
  const owner = host.ownerDocument;
  const root = host.shadowRoot || host.attachShadow({mode: 'open'});
  const parsed = new owner.defaultView.DOMParser().parseFromString(shell, 'text/html');
  const fragment = owner.createDocumentFragment();
  for (const href of [`${baseUrl}aula.css`, `${baseUrl}katex/katex.min.css`]) {
    const link = owner.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    fragment.append(link);
  }
  const style = owner.createElement('style');
  style.textContent = `:host{display:block;font:17px/1.55 Atkinson,'Trebuchet MS',sans-serif;color:#253330;--paper:#fff;--bg:#f6f9f8;--ink:#253330;--muted:#63716c;--line:#dae3df;--teal:#117568;--teal-soft:#e8f3ef;--rose:#a93458;--rose-soft:#fbecf0;--gold:#d7a534;--gold-soft:#fff7dd}.topbar,.sidebar,.skip-link,.lesson-footer,.lesson-heading>div,.theory-visual{display:none!important}.aula-layout,.theory-layout{display:block;min-height:0}.workspace{padding:0!important;margin:0;max-width:none;background:none}.lesson-heading{justify-content:flex-end;margin-bottom:12px}.studied-toggle{margin:0}.theory-article>:not(.knowledge-check){display:none}.theory-article{max-width:none}.knowledge-check{margin-top:0}.embedded-utilities{display:flex;flex-wrap:wrap;gap:8px;margin:16px 0}.embedded-utilities .text-button{font-size:13px}.lesson-tabs button{font-size:13px;padding:12px 9px}.lesson-panel{min-height:200px}@media(max-width:480px){.lesson-heading{align-items:flex-end}}`;
  fragment.append(style);
  for (const child of Array.from(parsed.body.childNodes)) fragment.append(owner.importNode(child, true));
  root.replaceChildren(fragment);
  const location = {hash: `#${lessonId}/${view}`};
  const history = {replaceState(state, title, hash) {location.hash = hash;}};
  const options = {location, history, manageHistory: false, createWhiteboard, renderIcons:() => renderScopedIcons(root, owner.defaultView.lucide)};
  options.getAudio = id => {
    const track = audio?.lessons?.[id];
    return track ? {...track, src:`${baseUrl}${track.src}`} : undefined;
  };
  if (storage !== undefined) options.storage = storage;
  const aula = mountAula(scopedDocument(owner, root), options);
  if (!showNavigation) {
    root.getElementById('lessonTabs').style.setProperty('display', 'none', 'important');
    root.querySelector('.lesson-heading').style.setProperty('display', 'none', 'important');
  }
  root.getElementById('tab-theory').lastChild.textContent = 'Comprueba la idea';
  if (showNavigation) {
    const utilities = owner.createElement('div');
    utilities.className = 'embedded-utilities';
    utilities.append(root.getElementById('glossaryToggle'), root.getElementById('sourcesToggle'), root.getElementById('settingsToggle'));
    root.getElementById('lessonTabs').after(utilities);
  }
  return {aula, root, dispose() {aula.dispose(); root.replaceChildren();}};
}