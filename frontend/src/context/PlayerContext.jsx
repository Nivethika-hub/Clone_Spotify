import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { getYouTubeVideoId, uniqueTracks } from '../lib/youtube';
import { useAuth } from './AuthContext';

const PlayerContext = createContext();

const YT_SCRIPT_SRC = 'https://www.youtube.com/iframe_api';

export const usePlayer = () => useContext(PlayerContext);

const loadYouTubeApi = () =>
  new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve(window.YT);
      return;
    }

    const existingScript = document.querySelector(`script[src="${YT_SCRIPT_SRC}"]`);
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = YT_SCRIPT_SRC;
      script.async = true;
      document.body.appendChild(script);
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousReady?.();
      resolve(window.YT);
    };
  });

export const PlayerProvider = ({ children }) => {
  const { api, isAuthenticated } = useAuth();
  const playerRef = useRef(null);
  const hostRef = useRef(null);
  const progressTimerRef = useRef(null);
  const queueRef = useRef([]);
  const repeatModeRef = useRef('off');
  const shuffleEnabledRef = useRef(false);
  const currentIndexRef = useRef(-1);
  const volumeRef = useRef(0.8);
  const [queue, setQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off');
  const [ytReady, setYtReady] = useState(false);

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;
  const queueTrackIds = queue.map((track) => track.id);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    shuffleEnabledRef.current = shuffleEnabled;
  }, [shuffleEnabled]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  const stopProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      window.clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const startProgressTimer = useCallback(() => {
    stopProgressTimer();
    progressTimerRef.current = window.setInterval(() => {
      if (!playerRef.current?.getCurrentTime || !playerRef.current?.getDuration) {
        return;
      }
      setProgress(playerRef.current.getCurrentTime() || 0);
      setDuration(playerRef.current.getDuration() || 0);
    }, 500);
  }, [stopProgressTimer]);

  const moveQueue = useCallback((step) => {
    setCurrentIndex((current) => {
      const liveQueue = queueRef.current;
      const liveRepeatMode = repeatModeRef.current;
      const liveShuffle = shuffleEnabledRef.current;
      if (!liveQueue.length) {
        return -1;
      }
      if (liveRepeatMode === 'one' && current >= 0) {
        playerRef.current?.seekTo?.(0, true);
        playerRef.current?.playVideo?.();
        return current;
      }
      if (liveShuffle && liveQueue.length > 1) {
        let randomIndex = current;
        while (randomIndex === current) {
          randomIndex = Math.floor(Math.random() * liveQueue.length);
        }
        return randomIndex;
      }
      const nextIndex = current + step;
      if (nextIndex >= liveQueue.length) {
        if (liveRepeatMode === 'all') {
          return 0;
        }
        setIsPlaying(false);
        return current;
      }
      if (nextIndex < 0) {
        return liveRepeatMode === 'all' ? liveQueue.length - 1 : 0;
      }
      return nextIndex;
    });
  }, []);

  useEffect(() => {
    loadYouTubeApi().then((YT) => {
      if (hostRef.current || !YT?.Player) {
        return;
      }

      const host = document.createElement('div');
      host.id = 'youtube-audio-host';
      host.style.position = 'fixed';
      host.style.left = '-9999px';
      host.style.top = '0';
      host.style.width = '1px';
      host.style.height = '1px';
      document.body.appendChild(host);
      hostRef.current = host;

      playerRef.current = new YT.Player(host, {
        height: '1',
        width: '1',
        videoId: '',
        playerVars: {
          autoplay: 0,
          controls: 0,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event) => {
            event.target.setVolume(volumeRef.current * 100);
            setYtReady(true);
          },
          onStateChange: (event) => {
            const playerState = window.YT?.PlayerState;
            if (!playerState) {
              return;
            }
            if (event.data === playerState.PLAYING) {
              setIsPlaying(true);
              startProgressTimer();
            } else if (event.data === playerState.PAUSED) {
              setIsPlaying(false);
            } else if (event.data === playerState.ENDED) {
              moveQueue(1);
            }
          },
        },
      });
    });

    return () => {
      stopProgressTimer();
      playerRef.current?.destroy?.();
      hostRef.current?.remove?.();
    };
  }, [moveQueue, startProgressTimer, stopProgressTimer]);

  useEffect(() => {
    if (!isAuthenticated) {
      playerRef.current?.stopVideo?.();
      setQueue([]);
      setCurrentIndex(-1);
      setIsPlaying(false);
      setProgress(0);
      setDuration(0);
      setVolumeState(0.8);
      setShuffleEnabled(false);
      setRepeatMode('off');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!currentTrack || !playerRef.current) {
      return;
    }

    const videoId = getYouTubeVideoId(currentTrack.title);
    if (!videoId) {
      console.error('No YouTube video configured for track:', currentTrack.title);
      return;
    }

    playerRef.current.loadVideoById(videoId, 0);
    setProgress(0);
    api.post('/library/tracks/' + currentTrack.id + '/recent').catch(() => {});
  }, [api, currentTrack, ytReady]);

  useEffect(() => {
    if (!playerRef.current?.setVolume) {
      return;
    }
    playerRef.current.setVolume(volume * 100);
  }, [volume]);

  const playTrack = async (track, nextQueue = []) => {
    const preparedQueue = uniqueTracks(nextQueue.length ? nextQueue : [track]);
    const nextIndex = preparedQueue.findIndex((item) => item.id === track.id);
    setQueue(preparedQueue);
    setCurrentIndex(nextIndex >= 0 ? nextIndex : 0);
  };

  const playCollection = async (tracks, startTrack = null) => {
    const preparedQueue = uniqueTracks(tracks);
    if (!preparedQueue.length) {
      return;
    }
    const targetTrack = startTrack || preparedQueue[0];
    await playTrack(targetTrack, preparedQueue);
  };

  const togglePlay = async () => {
    if (!playerRef.current || !currentTrack) {
      return;
    }
    if (isPlaying) {
      playerRef.current.pauseVideo();
      return;
    }
    playerRef.current.playVideo();
  };

  const nextTrack = async () => {
    moveQueue(1);
  };

  const previousTrack = async () => {
    if (progress > 3) {
      playerRef.current?.seekTo?.(0, true);
      setProgress(0);
      return;
    }
    moveQueue(-1);
  };

  const toggleShuffle = async () => {
    setShuffleEnabled((current) => !current);
  };

  const cycleRepeatMode = async () => {
    setRepeatMode((current) => (current === 'off' ? 'all' : current === 'all' ? 'one' : 'off'));
  };

  const seek = async (time) => {
    playerRef.current?.seekTo?.(time, true);
    setProgress(time);
  };

  const setVolume = async (nextVolume) => {
    setVolumeState(nextVolume);
  };

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        volume,
        progress,
        duration,
        queueTrackIds,
        shuffleEnabled,
        repeatMode,
        playTrack,
        playCollection,
        togglePlay,
        nextTrack,
        previousTrack,
        toggleShuffle,
        cycleRepeatMode,
        setVolume,
        seek,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
