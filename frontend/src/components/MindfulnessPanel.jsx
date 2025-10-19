import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Heart, Brain, Sparkles, X } from 'lucide-react';

const mindfulnessQuotes = [
  {
    text: "Coloring is a form of meditation. Each stroke is a breath, each color a moment of peace.",
    category: "Mindfulness"
  },
  {
    text: "Art therapy reduces stress and anxiety. Take your time, there's no rush.",
    category: "Mental Health"
  },
  {
    text: "Focus on the present moment. Let the colors flow and your worries fade.",
    category: "Meditation"
  },
  {
    text: "Creative expression promotes emotional well-being. Color your way to calm.",
    category: "Wellness"
  },
  {
    text: "Studies show coloring activates both hemispheres of the brain, improving focus and reducing stress.",
    category: "Science"
  },
  {
    text: "Each color you choose is a reflection of your inner self. Express freely.",
    category: "Self-Expression"
  },
  {
    text: "Mindful coloring can lower your heart rate and blood pressure naturally.",
    category: "Health Benefits"
  },
  {
    text: "Take a deep breath. Hold it. Release. Now, let's color with intention.",
    category: "Breathing"
  }
];

const breathingExercises = [
  { name: "4-7-8 Breathing", inhale: 4, hold: 7, exhale: 8 },
  { name: "Box Breathing", inhale: 4, hold: 4, exhale: 4, pause: 4 },
  { name: "Calming Breath", inhale: 4, hold: 2, exhale: 6 }
];

const MindfulnessPanel = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasSeenToday, setHasSeenToday] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [showBreathing, setShowBreathing] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState('inhale');
  const [breathingCount, setBreathingCount] = useState(4);
  const [isBreathing, setIsBreathing] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(breathingExercises[0]);

  // Check if user has seen the panel today
  useEffect(() => {
    const lastSeen = localStorage.getItem('mindfulness_last_seen');
    const today = new Date().toDateString();
    
    if (lastSeen !== today) {
      // Show panel for first time today
      setIsExpanded(true);
      localStorage.setItem('mindfulness_last_seen', today);
    }
    
    setHasSeenToday(lastSeen === today);
  }, []);

  useEffect(() => {
    // Rotate quotes every 2 minutes
    const quoteInterval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % mindfulnessQuotes.length);
    }, 120000);

    return () => clearInterval(quoteInterval);
  }, []);

  useEffect(() => {
    if (!isBreathing) return;

    const timer = setInterval(() => {
      setBreathingCount((prev) => {
        if (prev > 1) return prev - 1;

        // Move to next phase
        if (breathingPhase === 'inhale') {
          setBreathingPhase('hold');
          return selectedExercise.hold || selectedExercise.inhale;
        } else if (breathingPhase === 'hold') {
          setBreathingPhase('exhale');
          return selectedExercise.exhale;
        } else if (breathingPhase === 'exhale' && selectedExercise.pause) {
          setBreathingPhase('pause');
          return selectedExercise.pause;
        } else {
          setBreathingPhase('inhale');
          return selectedExercise.inhale;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBreathing, breathingPhase, selectedExercise]);

  const quote = mindfulnessQuotes[currentQuote];

  const handleClose = () => {
    setIsExpanded(false);
    setShowBreathing(false);
    setIsBreathing(false);
  };

  return (
    <>
      {/* Minimized Button */}
      {!isExpanded && (
        <div className="fixed top-20 left-4 z-50">
          <Button
            onClick={() => setIsExpanded(true)}
            className="h-14 w-14 rounded-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 shadow-2xl border-4 border-white hover:scale-110 transition-transform duration-300"
            size="icon"
            title="Mindfulness & Mental Health"
          >
            <Heart className={`h-7 w-7 ${isBreathing ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
      )}

      {/* Expanded Panel */}
      {isExpanded && (
        <div className="fixed top-20 left-4 z-50 max-w-xs animate-in slide-in-from-left duration-300">
          <Card className="shadow-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-blue-50">
            <CardContent className="p-4">
              {!showBreathing ? (
                <>
              {/* Header with Close Button */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-green-600" />
                  <h3 className="font-bold text-green-800">Mindful Moment</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0 hover:bg-red-100"
                  title="Minimize"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Mindfulness Quote */}
              <div className="mb-4">
                
                <div className="bg-white p-4 rounded-lg border-2 border-green-200 mb-3">
                  <p className="text-sm text-gray-700 leading-relaxed mb-2">
                    "{quote.text}"
                  </p>
                  <p className="text-xs text-green-600 font-semibold">
                    — {quote.category}
                  </p>
                </div>
              </div>

              {/* Mental Health Benefits */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-3 rounded-lg border border-purple-200 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="h-4 w-4 text-purple-600" />
                  <p className="text-xs font-semibold text-purple-800">Mental Health Benefits</p>
                </div>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>✓ Reduces stress & anxiety</li>
                  <li>✓ Improves focus & concentration</li>
                  <li>✓ Promotes mindfulness & calm</li>
                  <li>✓ Boosts creativity & mood</li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBreathing(true)}
                  className="border-blue-300 hover:bg-blue-50 text-blue-700"
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Breathe
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentQuote((prev) => (prev + 1) % mindfulnessQuotes.length)}
                  className="border-green-300 hover:bg-green-50 text-green-700"
                >
                  Next Quote
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Breathing Exercise */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <h3 className="font-bold text-blue-800">Breathing Exercise</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowBreathing(false);
                      setIsBreathing(false);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Exercise Selection */}
                <div className="mb-4">
                  <select
                    value={breathingExercises.indexOf(selectedExercise)}
                    onChange={(e) => {
                      setSelectedExercise(breathingExercises[e.target.value]);
                      setIsBreathing(false);
                      setBreathingPhase('inhale');
                    }}
                    className="w-full p-2 border-2 border-blue-200 rounded-lg text-sm"
                  >
                    {breathingExercises.map((exercise, index) => (
                      <option key={index} value={index}>
                        {exercise.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Breathing Animation */}
                <div className="flex flex-col items-center justify-center py-8">
                  <div
                    className={`w-32 h-32 rounded-full transition-all duration-1000 ${
                      breathingPhase === 'inhale'
                        ? 'bg-gradient-to-br from-blue-400 to-blue-600 scale-110'
                        : breathingPhase === 'hold' || breathingPhase === 'pause'
                        ? 'bg-gradient-to-br from-purple-400 to-purple-600 scale-110'
                        : 'bg-gradient-to-br from-green-400 to-green-600 scale-75'
                    } flex items-center justify-center shadow-2xl`}
                  >
                    <div className="text-white text-center">
                      <p className="text-3xl font-bold">{breathingCount}</p>
                      <p className="text-sm capitalize">{breathingPhase}</p>
                    </div>
                  </div>
                </div>

                {/* Start/Stop Button */}
                <Button
                  onClick={() => {
                    if (!isBreathing) {
                      setBreathingPhase('inhale');
                      setBreathingCount(selectedExercise.inhale);
                    }
                    setIsBreathing(!isBreathing);
                  }}
                  className={`w-full ${
                    isBreathing
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600'
                  }`}
                >
                  {isBreathing ? 'Stop' : 'Start Breathing'}
                </Button>

                <p className="text-xs text-center text-gray-600 mt-3">
                  Follow the circle and breathe with intention
                </p>
              </div>
            </>
          )}
          
          {/* Helpful Tip */}
          {!showBreathing && (
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-600 bg-white/80 px-3 py-1 rounded-full inline-block">
                💚 New message daily
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MindfulnessPanel;
