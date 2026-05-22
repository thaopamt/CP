export function resolveSocketNamespace(namespace: string) {
  const explicitSocketUrl = import.meta.env.VITE_SOCKET_URL;
  const apiUrl = import.meta.env.VITE_API_URL;
  const root =
    typeof explicitSocketUrl === 'string' && explicitSocketUrl.trim()
      ? normalizeSocketRoot(explicitSocketUrl)
      : typeof apiUrl === 'string' && apiUrl.startsWith('http')
      ? normalizeSocketRoot(apiUrl)
      : '';

  return root ? `${root}${namespace}` : namespace;
}

function normalizeSocketRoot(value: string) {
  return value.trim().replace(/\/api\/?$/, '').replace(/\/$/, '');
}
