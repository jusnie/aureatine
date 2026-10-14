// Keep the provider deadline below Vercel's function limit, and allow the browser
// time to receive the server's final answer/error. Checked against vercel.json.
export const CHAT_SERVER_TIMEOUT_MS = 50_000
export const CHAT_BROWSER_TIMEOUT_MS = 65_000
export const CHAT_RECOVERY_MIN_REMAINING_MS = 12_000
