import { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GameScreen } from './components/GameScreen';
import { ResultScreen } from './components/ResultScreen';
import { GameResult } from './types';

type Phase = 'welcome' | 'playing' | 'result';

export default function App() {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [region, setRegion] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [result, setResult] = useState<GameResult | null>(null);

  const handleStart = (nextRegion: string, nextGender: string) => {
    setRegion(nextRegion);
    setGender(nextGender as 'male' | 'female');
    setResult(null);
    setPhase('playing');
  };

  const handleGameOver = (gameResult: GameResult) => {
    setResult(gameResult);
    setPhase('result');
  };

  const handleWin = (gameResult: GameResult) => {
    setResult(gameResult);
    setPhase('result');
  };

  const handleRestart = () => {
    setResult(null);
    setPhase('playing');
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#f5ebd4] px-0 sm:px-6">
      <div className="relative mx-auto h-full w-full max-w-[440px] overflow-hidden bg-[#f5ebd4] sm:my-4 sm:h-[calc(100%-2rem)] sm:rounded-[28px] sm:border-4 sm:border-black/60 sm:shadow-[0_16px_44px_rgba(0,0,0,0.25)]">
        {phase === 'welcome' && <WelcomeScreen onStart={handleStart} />}

        {phase === 'playing' && <GameScreen onGameOver={handleGameOver} onWin={handleWin} />}

        {phase === 'result' && (
          <ResultScreen
            result={result}
            region={region}
            gender={gender}
            onRestart={handleRestart}
            onBackToWelcome={() => setPhase('welcome')}
          />
        )}
      </div>
    </div>
  );
}
