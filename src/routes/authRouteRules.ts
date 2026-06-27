export function getInitialRedirectPath(pathname: string, isAuthenticated: boolean) {
  if (!isAuthenticated) return null
  return pathname === '/' || pathname === '/login' ? '/dashboard' : null
}
