import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

import EmptyState from '../components/EmptyState';
import SectionShelf from '../components/SectionShelf';
import TrackRow from '../components/TrackRow';
import { useAuth } from '../context/AuthContext';
import { usePlayer } from '../context/PlayerContext';

const SearchPage = () => {
  const { api } = useAuth();
  const { currentTrack, isPlaying, playTrack } = usePlayer();
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState('');
  const [results, setResults] = useState({ tracks: [], artists: [], albums: [] });
  const [suggestions, setSuggestions] = useState([]);
  const [likedTrackIds, setLikedTrackIds] = useState([]);

  useEffect(() => {
    const loadLibrary = async () => {
      try {
        const response = await api.get('/library');
        setLikedTrackIds(response.data.liked_tracks.map((track) => track.id));
      } catch (error) {
        console.error('Failed to load library state:', error);
      }
    };

    loadLibrary();
  }, [api]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ tracks: [], artists: [], albums: [] });
      setSuggestions([]);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        const [searchResponse, suggestionResponse] = await Promise.all([
          api.get('/search', { params: { q: query, genre: genre || undefined } }),
          api.get('/search/suggestions', { params: { q: query } }),
        ]);
        setResults(searchResponse.data);
        setSuggestions(suggestionResponse.data.suggestions);
      } catch (error) {
        console.error('Search failed:', error);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [api, genre, query]);

  const toggleLike = async (track) => {
    const isLiked = likedTrackIds.includes(track.id);
    try {
      if (isLiked) {
        await api.delete(`/library/tracks/${track.id}/like`);
        setLikedTrackIds((current) => current.filter((trackId) => trackId !== track.id));
      } else {
        await api.post(`/library/tracks/${track.id}/like`);
        setLikedTrackIds((current) => [...current, track.id]);
      }
    } catch (error) {
      console.error('Failed to update liked songs:', error);
    }
  };

  return (
    <div className="page">
      <section className="search-panel">
        <div className="search-field">
          <Search size={18} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search songs, albums, artists..."
          />
        </div>
        <input
          className="filter-field"
          value={genre}
          onChange={(event) => setGenre(event.target.value)}
          placeholder="Filter by genre"
        />
      </section>

      {suggestions.length ? (
        <div className="suggestion-row">
          {suggestions.map((item) => (
            <button key={item} className="chip" onClick={() => setQuery(item)}>
              {item}
            </button>
          ))}
        </div>
      ) : null}

      {results.tracks.length || results.artists.length || results.albums.length ? (
        <>
          <section className="content-section">
            <div className="section-header">
              <div>
                <h2>Tracks</h2>
                <p>Click any song to start playback instantly.</p>
              </div>
            </div>
            <div className="track-table">
              {results.tracks.map((track, index) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  index={index}
                  isActive={currentTrack?.id === track.id}
                  isPlaying={isPlaying}
                  isLiked={likedTrackIds.includes(track.id)}
                  onPlay={(selectedTrack) => playTrack(selectedTrack, results.tracks)}
                  onToggleLike={toggleLike}
                />
              ))}
            </div>
          </section>

          <SectionShelf title="Artists" subtitle="Matching artist profiles." items={results.artists} />
          <SectionShelf title="Albums" subtitle="Albums matching your search." items={results.albums} />
        </>
      ) : (
        <EmptyState
          title="Search the catalog"
          description="Look up tracks, artists, and albums with suggestions and genre filtering."
        />
      )}
    </div>
  );
};

export default SearchPage;
