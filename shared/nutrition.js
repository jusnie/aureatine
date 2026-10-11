export const activityOptions = {
  sedentary: { label: 'Mostly seated · little daily movement', factor: 1.2 },
  light: { label: 'Light activity · some walking / exercise', factor: 1.375 },
  moderate: { label: 'Moderate activity · regular active routine', factor: 1.55 },
  high: { label: 'Very active · demanding daily routine', factor: 1.725 }
}
export const goalOptions = { gain: 'Gain weight', loss: 'Lose weight', strength: 'Build muscle', maintain: 'Maintain & stay fit' }
export const experienceOptions = { beginner: 'New to the gym', returning: 'Returning after a break', regular: 'Already training regularly' }
export const mealOptions = { unsure: 'Not sure what I need', regular_meals: 'Making time for regular meals', protein_foods: 'Including protein-rich foods', balanced: 'Meals already feel balanced' }
const goalActions = {
  gain: ['Start with regular meals and add a nourishing snack when needed; avoid forcing rapid changes.', 'Use progressive, technique-focused strength training and allow recovery between sessions.', 'Review appetite, energy and progress over time with a dietitian if gaining weight is difficult.'],
  loss: ['Build satisfying meals with protein-rich foods, fiber and variety; avoid crash diets or skipping meals.', 'Keep strength training and add enjoyable movement that fits your current capacity.', 'The calorie number here is maintenance, not a weight-loss target. A dietitian can help decide whether and how to adjust it safely.'],
  strength: ['Practice the basics with a qualified trainer; increase difficulty gradually as technique improves.', 'Include a protein-rich food at regular meals and enough overall food to support training.', 'Make recovery and consistency part of the plan; supplements are optional, not a shortcut.'],
  maintain: ['Keep meals regular and varied, with protein-rich foods spread through the day.', 'Choose a repeatable mix of strength training, enjoyable movement and recovery.', 'Use energy, performance and how you feel to guide adjustments—not one calculator number.']
}
function supplementGuidance(goal, meals) {
  if (goal === 'gain' && meals === 'regular_meals') return { title: 'Food first; a mass gainer is not automatic.', text: 'A mass gainer typically adds calories and protein. First try regular meals or a food-based snack. An adult might consider one only when extra energy is genuinely needed and food is difficult to manage. Check ingredients, allergens and suitability with a dietitian; this form cannot confirm a need.' }
  if (meals === 'protein_foods' || goal === 'strength') return { title: 'Protein powder may be optional—not required.', text: 'Protein powder can be a convenience if normal food does not cover an adult’s protein needs. The form has not measured your diet, so it cannot tell whether you need one. A mass gainer is different: it also adds substantial energy and is not automatically better for muscle.' }
  return { title: 'Neither product is automatically needed.', text: 'Protein powder mainly helps fill a protein gap; mass gainers add energy as well as protein. Your goal alone cannot establish either need. Start with meals, then discuss any actual gap, product label and health considerations with a qualified professional. No Aureatine product nutrition has been verified yet.' }
}
export function estimateNutrition(input) {
  if (!input || typeof input !== 'object') return { ok: false, error: 'Please complete the form.' }
  const age = Number(input.age), training = Number(input.training)
  if (!Number.isInteger(age) || age < 18 || age > 75) return { ok: false, error: 'This calculator is for adults ages 18–75 only. Please seek qualified professional guidance outside that range.' }
  if (input.suitable !== true) return { ok: false, error: 'Please read and confirm the suitability statement, or seek individualized guidance from a registered dietitian or clinician.' }
  if (!Number.isInteger(training) || training < 0 || training > 7 || input.training === '' || input.training === undefined || input.training === null || typeof input.training === 'boolean') return { ok: false, error: 'Select your current gym or exercise days per week, from 0 to 7.' }
  if (!Object.hasOwn(activityOptions, input.activity) || !Object.hasOwn(experienceOptions,input.experience) || !Object.hasOwn(mealOptions,input.meals)) return { ok: false, error: 'Choose your activity level, gym experience and meal challenge.' }
  const weight = Number(input.weight), height = Number(input.height)
  if (!Number.isFinite(weight) || weight < 35 || weight > 250 || !Number.isFinite(height) || height < 130 || height > 220) return { ok: false, error: 'Check units: kilograms (35–250 kg) and centimeters (130–220 cm). These are tool limits, not health targets.' }
  if (!['female','male'].includes(input.coefficient)) return { ok: false, error: 'This equation uses a male or female coefficient. If neither suits your physiology, a dietitian can offer a better estimate.' }
  if (!Object.hasOwn(goalOptions,input.goal)) return { ok: false, error: 'Choose gain weight, lose weight, build muscle, or maintain.' }
  const sizeIndex = weight / ((height / 100) ** 2)
  if (sizeIndex < 18.5 || sizeIndex >= 40 || (input.goal === 'loss' && sizeIndex < 20)) return { ok: false, error: 'Your measurements and selected goal are outside this simple tool’s intended scope. This is not a diagnosis. A registered dietitian can help decide an appropriate goal and estimate your needs.' }
  const resting = 10 * weight + 6.25 * height - 5 * age + (input.coefficient === 'male' ? 5 : -161)
  const factor = activityOptions[input.activity].factor
  const maintenance = Math.round(resting * factor / 50) * 50
  const active = training >= 2
  const rateLow = active ? (input.goal === 'strength' ? 1.6 : 1.4) : .8
  const rateHigh = active ? 2 : .8
  return { ok: true, mode: 'adult', maintenance, proteinLow: Math.round(weight * rateLow), proteinHigh: Math.round(weight * rateHigh), resting: Math.round(resting), factor, rateLow, rateHigh, active,
    profile: { age, weight, height, coefficient: input.coefficient, activity: input.activity, training, goal: input.goal, experience: input.experience, meals: input.meals, suitable: true },
    note: active ? 'Exercise reference for a generally healthy adult; individual needs can differ.' : 'General adult reference (0.8 g/kg/day), not an upper limit. Some adults need more.',
    goalNote: 'Energy shown is a maintenance baseline—not a prescribed deficit or surplus for your goal.', actions: goalActions[input.goal], supplement: supplementGuidance(input.goal,input.meals) }
}
export function nutritionContext(result) {
  const profile = result.profile
  return `ADULT SERVER-CALCULATED ESTIMATES, not a prescription: approximately ${result.maintenance} kcal/day to MAINTAIN weight and ${result.proteinLow}–${result.proteinHigh} g/day protein. Resting Mifflin–St Jeor ${result.resting} kcal × activity ${result.factor}, rounded to 50 kcal. Protein ${result.rateLow}–${result.rateHigh} g/kg. Goal: ${goalOptions[profile.goal]}; experience: ${experienceOptions[profile.experience]}; current training days ${profile.training}; meal challenge: ${mealOptions[profile.meals]}. Explain the maintenance baseline, then 3 practical next steps for this goal: ${result.actions.join(' ')} Product guidance: ${result.supplement.title} ${result.supplement.text} Do not invent a numeric deficit/surplus, serving size, supplement dose or product nutrition. No clinical or guaranteed recommendation: dietary intake was not assessed. Ask one useful follow-up about meals or training, not sensitive medical records. Use headings: Your starting point; What to do next; Protein or mass gainer? Preserve exact server numbers, uncertainty and food-first framing. Do not repeat raw body measurements unnecessarily.`
}
