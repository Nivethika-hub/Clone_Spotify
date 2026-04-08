const fallbackSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#17352a"/>
        <stop offset="55%" stop-color="#1db954"/>
        <stop offset="100%" stop-color="#0b1510"/>
      </linearGradient>
    </defs>
    <rect width="400" height="400" rx="30" fill="url(#g)"/>
    <circle cx="110" cy="112" r="62" fill="rgba(255,255,255,0.18)"/>
    <circle cx="285" cy="132" r="88" fill="rgba(255,255,255,0.11)"/>
    <circle cx="248" cy="292" r="116" fill="rgba(0,0,0,0.18)"/>
    <path d="M62 282c74-56 146-63 274 38" fill="none" stroke="rgba(255,255,255,0.24)" stroke-linecap="round" stroke-width="18"/>
    <path d="M84 332c60-37 120-38 222 20" fill="none" stroke="rgba(255,255,255,0.18)" stroke-linecap="round" stroke-width="12"/>
  </svg>
`;

export const FALLBACK_ART = `data:image/svg+xml;utf8,${encodeURIComponent(fallbackSvg)}`;

export const withFallbackArt = (value) => value || FALLBACK_ART;

export const handleImageFallback = (event) => {
  if (event.currentTarget.src !== FALLBACK_ART) {
    event.currentTarget.src = FALLBACK_ART;
  }
};
