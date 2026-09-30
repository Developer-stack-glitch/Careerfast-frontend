export const getPlaceholderSvg = (text = "Logo", width = 100, height = 100) => {
  const cleanText = text ? String(text).trim() : "Logo";
  
  // Create initials
  let displayText = cleanText;
  const words = cleanText.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    displayText = (words[0][0] + words[1][0]).toUpperCase();
  } else if (cleanText.length > 2) {
    displayText = cleanText.substring(0, 2).toUpperCase();
  } else {
    displayText = cleanText.toUpperCase();
  }

  // Consistent pleasant color palette
  const palettes = [
    { bg: "#EEF2FF", fg: "#4F46E5" }, // Indigo
    { bg: "#F0FDF4", fg: "#16A34A" }, // Emerald
    { bg: "#FFF7ED", fg: "#EA580C" }, // Amber
    { bg: "#FDF2F8", fg: "#DB2777" }, // Pink
    { bg: "#F0F9FF", fg: "#0284C7" }, // Sky
    { bg: "#FAF5FF", fg: "#9333EA" }, // Purple
    { bg: "#FEF2F2", fg: "#DC2626" }, // Rose
    { bg: "#F0FDFA", fg: "#0D9488" }  // Teal
  ];
  
  const hash = cleanText.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const color = palettes[hash % palettes.length];
  const fontSize = Math.max(12, Math.floor(Math.min(width, height) * 0.42));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="${color.bg}" rx="12"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="${color.fg}" font-family="Outfit, system-ui, -apple-system, sans-serif" font-size="${fontSize}px" font-weight="700">${displayText}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const getImageUrl = (url, fallbackText) => {
  if (!url || url === "undefined" || url === "null") {
    return fallbackText ? getPlaceholderSvg(fallbackText) : null;
  }

  // Handle Next.js static image imports/Modules which are objects
  if (typeof url === 'object') {
    if (url.default) return getImageUrl(url.default, fallbackText);
    if (url.src) return url.src;
    return url; // fallback for other objects (though this might still cause React errors if rendered)
  }

  if (typeof url !== 'string') return url;

  // Return if it's already a full URL or a Next.js static media path
  if (
    url.startsWith('http') ||
    url.startsWith('data:') ||
    url.startsWith('/_next/') ||
    url.startsWith('static/') ||
    // Common image extensions and we assume they are local if they don't have http
    (url.startsWith('/') && (url.endsWith('.svg') || url.endsWith('.png') || url.endsWith('.jpg') || url.endsWith('.jpeg') || url.endsWith('.webp') || url.endsWith('.gif')))
  ) {
    return url;
  }

  const baseUrl = process.env.REACT_APP_API_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.careerfast.com';
  // If it's just a filename or a path that doesn't look like a local asset, prepend API URL
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${cleanUrl}`;
};

