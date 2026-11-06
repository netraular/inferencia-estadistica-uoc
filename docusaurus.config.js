export default {
  title: 'Inferencia estadistica',
  tagline: 'Aula de estadistica con ejemplos de biologia',
  url: 'https://webs.raular.com',
  baseUrl: '/inferencia/',
  trailingSlash: true,
  organizationName: 'netraular',
  projectName: 'inferencia-estadistica-uoc',
  onBrokenLinks: 'throw',
  i18n: {defaultLocale: 'es', locales: ['es']},
  presets: [['classic', {
    docs: {routeBasePath: '/', sidebarPath: './sidebars.js', editUrl: 'https://github.com/netraular/inferencia-estadistica-uoc/edit/main/'},
    blog: false,
    theme: {customCss: './src/css/custom.css'}
  }]],
  themes: [['@easyops-cn/docusaurus-search-local', {hashed: true, language: ['es'], docsRouteBasePath: '/', indexBlog: false, highlightSearchTermsOnTargetPage: true}]],
  themeConfig: {
    colorMode: {defaultMode: 'light', disableSwitch: true},
    navbar: {
      title: 'Inferencia',
      items: [
        {to: '/progreso/', label: 'Mi progreso', position: 'right'},
        {href: 'https://github.com/netraular/inferencia-estadistica-uoc', label: 'GitHub', position: 'right'}
      ]
    },
    footer: {style: 'light', copyright: 'Material de apoyo independiente. No es una web oficial de la UOC.'},
    docs: {sidebar: {hideable: true}}
  }
};