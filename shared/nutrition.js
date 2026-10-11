export const activityOptions = {
  sedentary: { label: 'Mostly seated · little daily movement', factor: 1.2 },
  light: { label: 'Light activity · some walking / exercise', factor: 1.375 },
  moderate: { label: 'Moderate activity · regular active routine', factor: 1.55 },
  high: { label: 'Very active · demanding daily routine', factor: 1.725 }
}
export const goalOptions = { general: 'Understand my daily needs', maintain: 'Maintain my weight', strength: 'Support strength training', recovery: 'Support exercise recovery' }
export function estimateNutrition(input) {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Please complete the form.' }
  if (input.suitable !== true) return { ok: false, error: 'This general calculator is not suitable for everyone. Please confirm the suitability statement, or ask a registered dietitian for individualized guidance.' }
  const age = Number(input.age), weight = Number(input.weight), height = Number(input.height), training = Number(input.training)
  if (!Number.isInteger(age) || age < 18 || age > 75) return { ok: false, error: 'This calculator is limited to adults aged 18–75. Younger people and older adults should use individualized professional guidance instead.' }
  if (!Number.isFinite(weight) || weight < 35 || weight > 250 || !Number.isFinite(height) || height < 130 || height > 220) return { ok: false, error: 'Check your units: use kilograms (35–250 kg) and centimeters (130–220 cm). These are the limits of this calculator, not health targets.' }
  if (!Number.isInteger(training) || training < 0 || training > 7 || input.training === '' || input.training === undefined || input.training === null || typeof input.training === 'boolean') return { ok: false, error: 'Select your current exercise days per week, from 0 to 7.' }
  if (!['female','male'].includes(input.coefficient)) return { ok: false, error: 'This equation uses a male or female coefficient. If neither is appropriate for your physiology, a dietitian can offer a better estimate.' }
  if (!Object.hasOwn(activityOptions, input.activity) || !Object.hasOwn(goalOptions,input.goal)) return { ok: false, error: 'Choose your overall activity level and goal.' }
  const sizeIndex = weight / ((height / 100) ** 2)
  if (sizeIndex < 18.5 || sizeIndex >= 40) return { ok: false, error: 'Your measurements are outside this simple calculator’s intended scope. This is not a diagnosis; a registered dietitian can estimate your needs more appropriately.' }
  const resting = 10 * weight + 6.25 * height - 5 * age + (input.coefficient === 'male' ? 5 : -161)
  const factor = activityOptions[input.activity].factor
  const maintenance = Math.round(resting * factor / 50) * 50
  const active = training >= 2
  const rateLow = active ? (input.goal === 'strength' ? 1.6 : 1.4) : .8
  const rateHigh = active ? 2 : .8
  const proteinLow = Math.round(weight * rateLow), proteinHigh = Math.round(weight * rateHigh)
  return { ok: true, maintenance, proteinLow, proteinHigh, resting: Math.round(resting), factor, rateLow, rateHigh, active,
    profile: { age, weight, height, coefficient: input.coefficient, activity: input.activity, training, goal: input.goal, suitable: true },
    note: active ? 'Exercise reference range for a generally healthy adult; individual requirements can differ.' : 'General adult protein reference (0.8 g/kg/day), not an upper limit. Some adults need more.',
    goalNote: input.goal === 'strength' ? 'Calories shown are maintenance—not a prescribed muscle-gain surplus.' : 'Calories shown are maintenance—not a weight-loss or medical meal plan.' }
}
export function nutritionContext(result) {
  return `Server-calculated estimate, not a medical prescription: approximately ${result.maintenance} kcal/day to maintain weight; protein ${result.proteinLow}–${result.proteinHigh} g/day. Formula: Mifflin–St Jeor resting estimate ${result.resting} kcal/day multiplied by an approximate activity factor ${result.factor}, rounded to the nearest 50 kcal. Protein reference ${result.rateLow}–${result.rateHigh} g/kg/day. Goal: ${goalOptions[result.profile.goal]}. ${result.note} ${result.goalNote} Explain these exact estimates and uncertainty in plain language. Do not invent a deficit, surplus, supplement dose, nutrition diagnosis, or different numeric targets. Do not repeat the raw measurements unnecessarily. Mention food-first protein and individualized advice where appropriate.`
}
