export function validateUrl(urlString: string) {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}
