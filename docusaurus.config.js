import webpack from 'webpack';
import mathjaxPackage from 'mathjax-full/package.json';

export default {
  title: 'Inferencia estadistica',
  tagline: 'Aula de estadística con ejemplos de biología',
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
  plugins: [function mathjaxBrowserVersion() {
    return {
      name: 'mathjax-browser-version',
      configureWebpack() {
        return {plugins: [new webpack.DefinePlugin({PACKAGE_VERSION: JSON.stringify(mathjaxPackage.version)})]};
      }
    };
  }],
  themeConfig: {
    prism: {additionalLanguages: ['python']},
    colorMode: {defaultMode: 'light', disableSwitch: true},
    navbar: {
      title: 'Inferencia estadística',
      items: [
        {to: '/temario/', label: 'Temario', position: 'left', activeBaseRegex: '^/inferencia/(temario|lecciones)(/|$)'},
        {to: '/materiales/', label: 'Materiales', position: 'left'},
        {href: 'https://github.com/netraular/inferencia-estadistica-uoc', label: 'GitHub', position: 'right'}
      ]
    },
    docs: {sidebar: {hideable: true}}
  }
};