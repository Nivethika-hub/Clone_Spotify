export const YOUTUBE_TRACKS = [
  { title: 'Oo Antava', videoUrl: 'https://www.youtube.com/embed/u_wB6byrl5k' },
  { title: 'Naatu Naatu', videoUrl: 'https://www.youtube.com/embed/79IEesucPo8' },
  { title: 'Megham Karukatha', videoUrl: 'https://www.youtube.com/embed/cEWwJxEq9Lg' },
  { title: 'Vaseegara', videoUrl: 'https://www.youtube.com/embed/ew1fKCWb_M4' },
  { title: 'Munbe Vaa', videoUrl: 'https://www.youtube.com/embed/rp3_FhRnIRw' },
  { title: 'Arabic Kuthu', videoUrl: 'https://www.youtube.com/embed/KUN5Uf9mObQ' },
  { title: 'Enjoy Enjaami', videoUrl: 'https://www.youtube.com/embed/eYq7WapuDLU' },
  { title: 'Why This Kolaveri Di', videoUrl: 'https://www.youtube.com/embed/YR12Z8f1Dh8' },
  { title: 'Rowdy Baby', videoUrl: 'https://www.youtube.com/embed/x6Q7c9RyMzk' },
  { title: 'Vaathi Coming', videoUrl: 'https://www.youtube.com/embed/fRD_3vJagxk' },
];

const normalizeTitle = (title = '') =>
  title
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const getYouTubeVideoId = (trackTitle = '') => {
  const normalizedTrack = normalizeTitle(trackTitle);
  const match = YOUTUBE_TRACKS.find((item) => {
    const normalizedItem = normalizeTitle(item.title);
    return normalizedTrack === normalizedItem || normalizedTrack.startsWith(normalizedItem);
  });

  if (!match) {
    return null;
  }

  const parts = match.videoUrl.split('/embed/');
  return parts[1] || null;
};

export const uniqueTracks = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) {
      return false;
    }
    seen.add(item.id);
    return true;
  });
};
