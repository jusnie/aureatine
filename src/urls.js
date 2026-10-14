export const basePath = import.meta.env.BASE_URL
export function appHref(path = '/') {
  const [pathname, fragment] = path.split('#')
  const clean = (pathname || '/').replace(/^\/+|\/+$/g, '')
  return `${basePath}${clean ? clean + '/' : ''}${fragment ? '#' + fragment : ''}`
}
export function currentRoute() {
  let pathname = window.location.pathname
  if (pathname.startsWith(basePath)) pathname = pathname.slice(basePath.length)
  return '/' + pathname.replace(/^\/+|\/+$/g, '')
}
export const shakeImage = `${basePath}images/shakes.jpg`

// Absolute links used in Supabase emails. Production always returns to the public site, never localhost.
export function publicUrl(path = '/') {
  const site = (import.meta.env.VITE_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '')
  const clean = (path.split('#')[0] || '/').replace(/^\/+|\/+$/g, '')
  if (site) return `${site}/${clean ? clean + '/' : ''}`
  return window.location.origin + appHref(path)
}
