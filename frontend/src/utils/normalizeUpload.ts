export const normalizeUpload = (url: string | string[]): string => {
  return Array.isArray(url) ? url[0] : url;
};
