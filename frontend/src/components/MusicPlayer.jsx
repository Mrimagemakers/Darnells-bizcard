import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music } from 'lucide-react';

const tracks = [
  {
    id: 1,
    name: 'Peaceful Journey',
    artist: 'Relaxing Sounds',
    description: 'Gentle ambient sounds for deep relaxation',
    // Free music from Bensound (royalty-free)
    url: 'https://www.bensound.com/bensound-music/bensound-relaxing.mp3'
  },
  {
    id: 2,
    name: 'Calm Waters',
    artist: 'Meditation Vibes',
    description: 'Flowing melodies for peaceful coloring',
    url: 'https://www.bensound.com/bensound-music/bensound-slowmotion.mp3'
  },
  {
    id: 3,
    name: 'Zen Garden',
    artist: 'Tranquil Moments',
    description: 'Serene tones for mindful creativity',
    url: 'https://www.bensound.com/bensound-music/bensound-dreams.mp3'
  }
];

const MusicPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => handleNext();

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => console.error('Playback failed:', err));
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    setCurrentTrack((prev) => (prev + 1) % tracks.length);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play().catch(err => console.error('Playback failed:', err));
    }, 100);
  };

  const handlePrevious = () => {
    setCurrentTrack((prev) => (prev - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
    setTimeout(() => {
      audioRef.current?.play().catch(err => console.error('Playback failed:', err));
    }, 100);
  };

  const handleVolumeChange = (e) => {
    setVolume(Number(e.target.value));
    setIsMuted(false);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
    setCurrentTime(audio.currentTime);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const track = tracks[currentTrack];

  return (
    <>
      <audio ref={audioRef} src={track.url} />
      
      {/* Minimized Player */}
      {!isExpanded && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button
            onClick={() => setIsExpanded(true)}
            className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-2xl"
            size="icon"
          >
            <Music className={`h-6 w-6 ${isPlaying ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
      )}

      {/* Expanded Player */}
      {isExpanded && (
        <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96">
          <Card className="shadow-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Music className="h-5 w-5 text-purple-600" />
                  <h3 className="font-bold text-gray-800">Relaxing Music</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-8 w-8 p-0"
                >
                  ✕
                </Button>
              </div>

              {/* Track Info */}
              <div className="mb-4 text-center">
                <p className="font-semibold text-lg text-gray-800">{track.name}</p>
                <p className="text-sm text-gray-600">{track.artist}</p>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  className="h-10 w-10 rounded-full border-purple-300 hover:bg-purple-100"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={togglePlay}
                  className="h-12 w-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  size="icon"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  className="h-10 w-10 rounded-full border-purple-300 hover:bg-purple-100"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              {/* Volume Control */}
              <div className="flex items-center gap-3 mb-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="h-8 w-8 p-0"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <span className="text-xs text-gray-600 w-10 text-right">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>

              {/* Track List */}
              <div className="space-y-1">
                {tracks.map((t, index) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setCurrentTrack(index);
                      setIsPlaying(true);
                      setTimeout(() => {
                        audioRef.current?.play().catch(err => console.error('Playback failed:', err));
                      }, 100);
                    }}
                    className={`w-full text-left p-2 rounded-lg transition-all duration-200 ${
                      index === currentTrack
                        ? 'bg-purple-200 text-purple-900'
                        : 'hover:bg-purple-100 text-gray-700'
                    }`}
                  >
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-gray-600">{t.artist}</p>
                  </button>
                ))}
              </div>

              {/* Tip */}
              <div className="mt-3 p-2 bg-purple-100 rounded-lg">
                <p className="text-xs text-purple-800 text-center">
                  🎵 Relax and enjoy while coloring
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default MusicPlayer;
