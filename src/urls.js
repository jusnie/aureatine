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
