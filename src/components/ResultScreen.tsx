import { motion } from 'motion/react';
import { GameResult } from '../types';

interface ResultScreenProps {
  result: GameResult | null;
  region: string;
  gender: 'male' | 'female';
  onRestart: () => void;
  onBackToWelcome: () => void;
}

export function ResultScreen({
  result,
  region,
  gender,
  onRestart,
  onBackToWelcome,
}: ResultScreenProps) {
  const isWin = Boolean(result?.isWin);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className={`game-card w-full max-w-md p-6 text-center ${
          isWin ? 'bg-gradient-to-b from-[#f4ffd2] to-[#d2ff8f]' : 'bg-gradient-to-b from-[#fff7ef] to-[#ffe0b4]'
        }`}
      >
        <h2 className="title-font mb-1 text-5xl text-[#2f210f]">{isWin ? 'Victory' : 'Failed'}</h2>
        <p className="mb-5 text-sm font-black text-[#6b3f1c]">
          {region || 'Farm'} · {gender === 'male' ? 'Player A' : 'Player B'}
        </p>

        {result?.reason && (
          <div className="mb-4 rounded-xl border-2 border-black bg-white px-3 py-2 text-left text-sm font-bold text-[#5f2e0b]">
            {result.reason}
          </div>
        )}

        <div className="mb-5 rounded-xl border-2 border-black/80 bg-white/90 px-3 py-2 text-sm font-black text-[#2f210f]">
          {isWin ? `Level ${result?.levelReached ?? 4} completed` : `Stopped at level ${result?.levelReached ?? 1}`}
        </div>

        <div className="space-y-3">
          <button
            onClick={onRestart}
            className="game-pill-btn w-full bg-black py-3.5 text-base text-white hover:brightness-110"
          >
            Play Again
          </button>
          <button
            onClick={onBackToWelcome}
            className="game-pill-btn w-full bg-white py-3 text-sm text-black hover:brightness-95"
          >
            Back To Home
          </button>
        </div>
      </motion.div>
    </div>
  );
}
