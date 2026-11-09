import distribution from 'jstat';

export const {jStat} = distribution;
export const parameters = Object.freeze({meanX: 30, meanY: 70, sigmaX: 5, sigmaY: 8, rho: 0.25, observedX: 40, thresholdY: 82});
export const conditionalMean = (observedX) => parameters.meanY + parameters.rho * parameters.sigmaY / parameters.sigmaX * (observedX - parameters.meanX);
export const conditionalVariance = parameters.sigmaY ** 2 * (1 - parameters.rho ** 2);
export const conditionalSd = Math.sqrt(conditionalVariance);
export const marginalX = (value) => jStat.normal.pdf(value, parameters.meanX, parameters.sigmaX);
export const marginalY = (value) => jStat.normal.pdf(value, parameters.meanY, parameters.sigmaY);
export const conditionalPdf = (value, observedX = parameters.observedX) => jStat.normal.pdf(value, conditionalMean(observedX), conditionalSd);
export const jointPdf = (valueX, valueY) => marginalX(valueX) * conditionalPdf(valueY, valueX);
export const z = (parameters.thresholdY - conditionalMean(parameters.observedX)) / conditionalSd;
export const tail = 1 - jStat.normal.cdf(z, 0, 1);
export const range = (start, end, count) => Array.from({length: count}, (_, index) => start + (end - start) * index / (count - 1));
export const clamp = (value) => Math.max(0, Math.min(1, value));
export const progress = (seconds, start, end) => {
  const value = clamp((seconds - start) / (end - start));
  return value * value * (3 - 2 * value);
};