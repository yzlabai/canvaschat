export const isValidUrl = (url: string): boolean => {
  const validPrefixes = ['http:', 'https:', '//', 'mailto:']
  return validPrefixes.some(prefix => url.startsWith(prefix))
}
