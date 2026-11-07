// First physical page (as used by "#page=N" in PDF viewers) of the section
// each lesson starts from, located by searching the section heading in the
// supplied PDFs. Kept outside course.js on purpose: lesson.source is part of
// the frozen narration signature and must not change for a navigation aid.
export const PDF_PAGES = {
  sucesos:1, axiomas:2, combinatoria:7, condicionada:5, 'independencia-sucesos':6, 'bayes-diagnostico':6,
  'variable-cdf':1, masa:5, densidad:9, esperanza:11, varianza:13, 'momentos-transformaciones':14,
  'bernoulli-binomial':1, poisson:6, hipergeometrica:8, 'geometrica-negativa':9, 'uniforme-montecarlo':7,
  exponencial:14, normal:15, gamma:16, 'cauchy-weibull':17, 'calculo-modelos':11, 'familia-exponencial':19,
  'conjunta-discreta':1, multinomial:6, marginales:8, 'conjunta-condicional':9, 'normal-bivariante':11,
  'independencia-variables':13, 'covarianza-matrices':14, 'combinaciones-incorrelacion':17
};

const TOPIC = /FundamentosInferencia_Tema(\d+)\.pdf$/;

export function pdfReference(lesson) {
  const match = TOPIC.exec(lesson?.source?.document || '');
  if (!match) return null;
  return {topic:Number(match[1]), file:lesson.source.document, section:lesson.source.section, page:PDF_PAGES[lesson.id]};
}
