/**
 * Helper to resolve media URLs to full HTTPS paths
 * Handles both Cloudinary URLs (starting with http/https) and local backend relative paths (/uploads/...)
 */
export const resolveImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const apiBase =
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? '' : 'https://smartwaste-ruir.onrender.com/api');
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    const origin = apiBase.replace(/\/api\/?$/, '');
    return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
  }
  return url;
};
