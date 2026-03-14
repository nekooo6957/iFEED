import { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GameScreen } from './components/GameScreen';
import { ResultScreen } from './components/ResultScreen';
import { PetRaisingScreen } from './components/PetRaisingScreen';
import { GameResult, ProvinceType } from './types';

type Phase = 'welcome' | 'playing_adventure' | 'playing_raising' | 'result';

export default function App() {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [province, setProvince] = useState<ProvinceType>('广东');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [result, setResult] = useState<GameResult | null>(null);

  const handleStartAdventure = (nextProvince: ProvinceType, nextGender: string) => {
    setProvince(nextProvince);
    setGender(nextGender as 'male' | 'female');
    setResult(null);
    setPhase('playing_adventure');
  };

  const handleStartRaising = (nextProvince: ProvinceType, nextGender: string) => {
    setProvince(nextProvince);
    setGender(nextGender as 'male' | 'female');
    setResult(null);
    setPhase('playing_raising');
  };

  const handleGameOver = (gameResult: GameResult) => {
    setResult(gameResult);
    setPhase('result');
  };

  const handleWin = (gameResult: GameResult) => {
    setResult(gameResult);
    setPhase('result');
  };

  const handleBackToWelcome = () => {
    setResult(null);
    setPhase('welcome');
  };

  const handleStartFromWelcome = (mode: 'adventure' | 'raising', nextProvince: ProvinceType, nextGender: 'male' | 'female') => {
    setProvince(nextProvince);
    setGender(nextGender);
    setResult(null);
    if (mode === 'adventure') {
      setPhase('playing_adventure');
    } else {
      setPhase('playing_raising');
    }
  };

  const handleGoToAdventureFromRaising = () => {
    setPhase('playing_adventure');
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[var(--game-bg)] px-0 sm:px-6">
      <div className="relative mx-auto h-full w-full max-w-[440px] overflow-hidden bg-[var(--game-bg)] sm:my-4 sm:h-[calc(100%-2rem)] sm:rounded-[30px] sm:border sm:border-black/20 sm:shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
        {phase === 'welcome' && (
          <WelcomeScreen
            onStart={handleStartFromWelcome}
          />
        )}

        {phase === 'playing_adventure' && (
          <GameScreen onGameOver={handleGameOver} onWin={handleWin} />
        )}

        {phase === 'playing_raising' && (
          <PetRaisingScreen
            onBack={handleBackToWelcome}
            onGoToAdventure={handleGoToAdventureFromRaising}
          />
        )}

        {phase === 'result' && (
          <ResultScreen
            result={result}
            region={province}
            gender={gender}
            onRestart={handleGoToAdventureFromRaising}
            onBackToWelcome={handleBackToWelcome}
          />
        )}
      </div>
    </div>
  );
}
