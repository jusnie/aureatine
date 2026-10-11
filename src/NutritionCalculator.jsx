import { useRef, useState } from 'react'
import { activityOptions, estimateNutrition, goalOptions } from '../shared/nutrition.js'
const initial = { age: '', coefficient: '', weight: '', height: '', activity: '', training: '', goal: '', suitable: false }
export default function NutritionCalculator({ status, busy, onExplain }) {
  const [values, setValues] = useState(initial)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [share, setShare] = useState(false)
  const resultHeading = useRef(null)
  function update(event) {
    const { name, value, checked, type } = event.target
    setValues(previous => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
    setResult(null); setError(''); setShare(false)
  }
  function calculate(event) {
    event.preventDefault()
    const estimate = estimateNutrition(values)
    if (!estimate.ok) { setError(estimate.error); setResult(null); return }
    setResult(estimate); setError(''); setShare(false)
    requestAnimationFrame(() => resultHeading.current?.focus({ preventScroll: false }))
  }
  return <div className="nutrition-calculator"><header className="nutrition-intro"><span className="nutrition-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="5" y="2" width="14" height="20" rx="3"/><path d="M8 6h8M8 11h2m4 0h2m-8 4h2m4 0h2m-8 4h2m4 0h2"/></svg></span><span className="chat-label">A STARTING POINT, NOT A PRESCRIPTION</span><h3>Find your everyday<br/><em>fuel estimate.</em></h3><p>Seven quick inputs. Calorie and protein estimates are calculated on your device, not guessed by AI.</p></header>
  <form className="nutrition-form" onSubmit={calculate}>
    <div className="nutrition-grid"><label>Age <span>years</span><input name="age" inputMode="numeric" type="number" step="1" min="1" max="120" required value={values.age} onChange={update} placeholder="e.g. 28"/></label><label>Equation coefficient<select name="coefficient" required value={values.coefficient} onChange={update}><option value="">Choose one</option><option value="female">Female coefficient</option><option value="male">Male coefficient</option><option value="other">Neither / unsure</option></select></label><label>Weight <span>kg</span><input name="weight" inputMode="decimal" type="number" step="0.1" min="1" max="500" required value={values.weight} onChange={update} placeholder="e.g. 70"/></label><label>Height <span>cm</span><input name="height" inputMode="decimal" type="number" step="0.1" min="1" max="300" required value={values.height} onChange={update} placeholder="e.g. 175"/></label></div>
    <p className="nutrition-helper">Use kilograms and centimeters. The formula’s sex-based coefficient is not a gender label. Choose “Neither / unsure” if it doesn’t suit your physiology.</p>
    <label>Overall activity<select name="activity" required value={values.activity} onChange={update}><option value="">Include work, daily life and exercise</option>{Object.entries(activityOptions).map(([value, info]) => <option key={value} value={value}>{info.label}</option>)}</select></label>
    <label>Current exercise days per week<select name="training" required value={values.training} onChange={update}><option value="">Choose your current routine</option>{[0,1,2,3,4,5,6,7].map(value => <option value={value} key={value}>{value} {value === 1 ? 'day' : 'days'} per week</option>)}</select></label>
    <label>Your goal<select name="goal" required value={values.goal} onChange={update}><option value="">What would you like to understand?</option>{Object.entries(goalOptions).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label className="nutrition-check"><input name="suitable" type="checkbox" checked={values.suitable} onChange={update}/><span>I am 18–75, not pregnant or breastfeeding, and do not have an eating-disorder history or a medical condition affecting nutrition needs (such as kidney disease). Otherwise I will seek professional guidance.</span></label>
    <button className="nutrition-submit" type="submit">Calculate my estimates <span aria-hidden="true">→</span></button><p className="nutrition-local">No account needed. Nothing is sent to AI by this button.</p><button type="button" className="nutrition-reset" onClick={() => { setValues(initial); setResult(null); setError(''); setShare(false) }}>Clear my inputs</button>
  </form>
  {error && <output role="alert" className="chat-error">{error}</output>}
  {result && <section className="nutrition-results" aria-label="Nutrition estimates"><h4 ref={resultHeading} tabIndex={-1}>Your estimated starting point</h4><div className="nutrition-stats"><div><span>MAINTENANCE ENERGY</span><strong>~{result.maintenance.toLocaleString()}</strong><small>kcal per day</small></div><div><span>PROTEIN REFERENCE</span><strong>{result.proteinLow === result.proteinHigh ? result.proteinLow : `${result.proteinLow}–${result.proteinHigh}`}</strong><small>grams per day</small></div></div><p>{result.note}</p><p>{result.goalNote} Activity multipliers are rough; actual needs may differ substantially. Protein includes all food and drinks—not just shakes.</p>
  <details className="nutrition-method"><summary>How this was calculated</summary><p>Mifflin–St Jeor: 10 × weight (kg) + 6.25 × height (cm) − 5 × age + {result.profile.coefficient === 'male' ? '5' : '(−161)'}. Resting estimate: {result.resting} kcal/day. Multiply by {result.factor} for activity and round to the nearest 50 kcal. Exercise is already included; don’t add workout calories again.</p><p>Protein: {result.rateLow === result.rateHigh ? result.rateLow : `${result.rateLow}–${result.rateHigh}`} g/kg/day × body weight. Two or more exercise days uses an exercise reference; the strength goal selects 1.6–2.0 within that reference. This is a transparent app rule, not an individualized assessment.</p><a href="https://pubmed.ncbi.nlm.nih.gov/2305711/" target="_blank" rel="noopener noreferrer">Mifflin–St Jeor research ↗</a><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/" target="_blank" rel="noopener noreferrer">ISSN protein & exercise reference ↗</a><a href="https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx" target="_blank" rel="noopener noreferrer">Dietary reference intakes ↗</a></details>
  <div className="nutrition-ai"><h4>Let Aureatine AI explain.</h4><p>Optional: share these seven inputs and calculated results with Google Gemini for a plain-language explanation.</p><label className="nutrition-check"><input type="checkbox" checked={share} onChange={event => setShare(event.target.checked)}/><span>I agree to send these measurements, selections and estimates to Google Gemini. <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noopener noreferrer">Provider terms</a>.</span></label><button type="button" className="nutrition-submit" disabled={!share || status !== 'ready' || busy} onClick={() => onExplain(result.profile)}>Explain with Aureatine AI <span aria-hidden="true">↗</span></button>{status !== 'ready' && <p className="nutrition-local">The calculator works offline. AI explanations need the connected chat backend.</p>}</div>
  </section>}
  <p className="nutrition-disclaimer">General adult estimates only. Not for medical diets, pregnancy, breastfeeding, minors or eating-disorder recovery. This app’s adult range and measurement limits are scope restrictions—not diagnostic cutoffs. A registered dietitian can personalize your needs.</p>
  </div>
}
