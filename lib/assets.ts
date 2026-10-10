export function asset(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  return path.startsWith('/') && !path.startsWith('//') && !path.startsWith(base + '/') ? base + path : path;
}
