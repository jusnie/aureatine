if ('serviceWorker' in navigator && import.meta.env.PROD) {
  const registerWorker = () => navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(() => {})
  if (document.readyState === 'complete') registerWorker()
  else window.addEventListener('load', registerWorker)
}
