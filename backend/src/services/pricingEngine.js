/**
 * Dynamic Pricing Rules Engine
 * Evaluates multi-tiered rules, applies percentage/fixed adjustments,
 * and enforces strict price floor (minPrice) and ceiling (maxPrice) clamping.
 */

function evaluateRuleOnProduct(rule, product, targetDate = new Date()) {
  const capacity = product.capacity || 1;
  const occupied = product.occupiedUnits || 0;
  const occupancyRate = Math.round((occupied / capacity) * 100);

  // 1. Check if product is in scope
  if (!rule.targetScope?.applyToAll) {
    const inCategory = rule.targetScope?.categories?.includes(product.category);
    const inProducts = rule.targetScope?.productIds?.some(
      (pId) => pId.toString() === product._id.toString()
    );
    if (!inCategory && !inProducts) {
      return { triggered: false, reason: 'Product out of target scope' };
    }
  }

  // 2. Evaluate Rule Conditions
  let conditionMet = false;
  let triggerReason = '';

  if (rule.ruleType === 'occupancy') {
    const threshold = rule.conditions?.occupancyThreshold ?? 80;
    const operator = rule.conditions?.occupancyOperator || '>=';

    switch (operator) {
      case '>=':
        conditionMet = occupancyRate >= threshold;
        break;
      case '>':
        conditionMet = occupancyRate > threshold;
        break;
      case '<=':
        conditionMet = occupancyRate <= threshold;
        break;
      case '<':
        conditionMet = occupancyRate < threshold;
        break;
      default:
        conditionMet = occupancyRate >= threshold;
    }
    if (conditionMet) {
      triggerReason = `Occupancy is ${occupancyRate}% (${operator} ${threshold}% threshold)`;
    }
  } else if (rule.ruleType === 'weekend') {
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = dayNames[targetDate.getDay()];
    const targetDays = rule.conditions?.daysOfWeek || ['Friday', 'Saturday', 'Sunday'];
    conditionMet = targetDays.includes(currentDay);
    if (conditionMet) {
      triggerReason = `Day is ${currentDay} (Weekend Premium)`;
    }
  } else if (rule.ruleType === 'seasonal') {
    const now = targetDate.getTime();
    const start = rule.conditions?.seasonStart ? new Date(rule.conditions.seasonStart).getTime() : 0;
    const end = rule.conditions?.seasonEnd ? new Date(rule.conditions.seasonEnd).getTime() : Infinity;
    conditionMet = now >= start && now <= end;
    if (conditionMet) {
      triggerReason = `Within active seasonal schedule`;
    }
  } else {
    // Custom / Default
    conditionMet = true;
    triggerReason = 'Custom rule triggered';
  }

  if (!conditionMet) {
    return { triggered: false, reason: 'Condition not met' };
  }

  // 3. Compute price adjustment delta
  let adjustmentDelta = 0;
  const { adjustmentType, adjustmentValue } = rule.action;

  switch (adjustmentType) {
    case 'percentage_increase':
      adjustmentDelta = (product.basePrice * Math.abs(adjustmentValue)) / 100;
      break;
    case 'percentage_decrease':
      adjustmentDelta = -(product.basePrice * Math.abs(adjustmentValue)) / 100;
      break;
    case 'fixed_increase':
      adjustmentDelta = Math.abs(adjustmentValue);
      break;
    case 'fixed_decrease':
      adjustmentDelta = -Math.abs(adjustmentValue);
      break;
    default:
      adjustmentDelta = 0;
  }

  return {
    triggered: true,
    ruleId: rule._id,
    ruleName: rule.name,
    ruleType: rule.ruleType,
    adjustmentType,
    adjustmentValue,
    adjustmentDelta: Math.round(adjustmentDelta * 100) / 100,
    triggerReason,
  };
}

function calculateProductPrice(product, rules = [], targetDate = new Date()) {
  const capacity = product.capacity || 1;
  const occupied = product.occupiedUnits || 0;
  const occupancyRate = Math.round((occupied / capacity) * 100);

  // Active rules sorted by priority (highest first)
  const activeRules = rules
    .filter((r) => r.isActive)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const triggeredRules = [];
  let totalDelta = 0;

  for (const rule of activeRules) {
    const evalResult = evaluateRuleOnProduct(rule, product, targetDate);
    if (evalResult.triggered) {
      triggeredRules.push(evalResult);
      totalDelta += evalResult.adjustmentDelta;
    }
  }

  // Base calculation
  const rawPrice = Math.round((product.basePrice + totalDelta) * 100) / 100;

  // Safeguard Clamping
  let clampedPrice = rawPrice;
  let wasClamped = false;
  let clampReason = null;

  if (rawPrice < product.minPrice) {
    clampedPrice = product.minPrice;
    wasClamped = true;
    clampReason = `Floor Safeguard: Computed $${rawPrice} was below minimum limit ($${product.minPrice})`;
  } else if (rawPrice > product.maxPrice) {
    clampedPrice = product.maxPrice;
    wasClamped = true;
    clampReason = `Ceiling Safeguard: Computed $${rawPrice} exceeded maximum limit ($${product.maxPrice})`;
  }

  const priceDifference = Math.round((clampedPrice - product.basePrice) * 100) / 100;
  const percentageChange =
    product.basePrice > 0
      ? Math.round((priceDifference / product.basePrice) * 1000) / 10
      : 0;

  return {
    productId: product._id,
    name: product.name,
    category: product.category,
    location: product.location,
    capacity,
    occupiedUnits: occupied,
    availableUnits: product.availableUnits,
    occupancyRate,
    basePrice: product.basePrice,
    minPrice: product.minPrice,
    maxPrice: product.maxPrice,
    currentPrice: product.currentPrice,
    rawPrice,
    recommendedPrice: clampedPrice,
    wasClamped,
    clampReason,
    priceDifference,
    percentageChange,
    triggeredRules,
  };
}

module.exports = {
  evaluateRuleOnProduct,
  calculateProductPrice,
};
