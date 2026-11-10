import {planFoundations} from './native-foundations.mjs';
import {planUnivariate} from './native-univariate.mjs';
import {planMultivariate} from './native-multivariate.mjs';
import {planExercise} from './native-exercises.mjs';
import {validateNativePlan} from './native-plan.mjs';

export function createNativePlan(item) {
  const plans = [planFoundations, planUnivariate, planMultivariate, planExercise].map(prepare => prepare(item)).filter(Boolean);
  if (plans.length !== 1) throw new RangeError(`${item.id}: expected exactly one native scene implementation, got ${plans.length}`);
  return validateNativePlan(item, plans[0]);
}