import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {conditionalMean, conditionalVariance, conditionalSd, marginalX, conditionalPdf, jointPdf, z, tail, range} from './model.mjs';
export * from './model.mjs';

export const integrate = (fn, start, end, steps = 12000) => {
  const delta = (end - start) / steps;
  let total = (fn(start) + fn(end)) / 2;
  for (let index = 1; index < steps; index++) total += fn(start + index * delta);
  return total * delta;
};
export function verifyMath() {
  const cutArea = integrate((value) => jointPdf(40, value), -30, 170);
  const conditionalArea = integrate(conditionalPdf, -30, 170);
  const numericalTail = integrate(conditionalPdf, 82, 170);
  assert.equal(conditionalMean(40), 74);
  assert.equal(conditionalVariance, 60);
  assert.ok(Math.abs(conditionalArea - 1) < 1e-10);
  assert.ok(Math.abs(cutArea - marginalX(40)) < 1e-12);
  assert.ok(Math.abs(tail - 0.15084979123917397) < 1e-12);
  assert.ok(Math.abs(numericalTail - tail) < 1e-7);
  for (const value of range(40, 110, 101)) assert.ok(Math.abs(jointPdf(40, value) / marginalX(40) - conditionalPdf(value)) < 1e-14);
  const affineChecks = range(0, 1, 5).map((fraction) => {
    const scale = conditionalSd ** fraction;
    const offset = 74 * fraction;
    const threshold = (82 - offset) / scale;
    const transformedArea = integrate((value) => scale * conditionalPdf(offset + scale * value), (-30 - offset) / scale, (170 - offset) / scale);
    const transformedTail = integrate((value) => scale * conditionalPdf(offset + scale * value), threshold, (170 - offset) / scale);
    assert.ok(Math.abs(transformedArea - 1) < 1e-10);
    assert.ok(Math.abs(transformedTail - tail) < 1e-7);
    return {fraction, scale, offset, threshold, transformedArea, transformedTail};
  });
  return {mean: conditionalMean(40), variance: conditionalVariance, sd: conditionalSd, z, tail, cutArea, conditionalArea, numericalTail, marginalX40: marginalX(40), affineChecks};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) console.log(JSON.stringify(verifyMath(), null, 2));