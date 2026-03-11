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
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm sm:p-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className={`w-full max-w-md p-5 text-center sm:p-6 ${
          isWin ? 'text-[#2f210f]' : 'text-[#2f210f]'
        }`}
      >
        <h2 className="title-font mb-1 text-5xl text-[#2f210f]">{isWin ? '通关成功' : '挑战失败'}</h2>
        <p className="mb-4 text-sm font-black text-[#6b3f1c]">
          {region || '农场'} · {gender === 'male' ? '玩家A' : '玩家B'}
        </p>

        {result?.reason && (
          <div className="mb-4 px-1 text-left text-sm font-bold text-[#5f2e0b]">
            {result.reason}
          </div>
        )}

        <div className="mb-5 px-1 text-sm font-black text-[#2f210f]">
          {isWin ? `已通过第 ${result?.levelReached ?? 4} 关` : `止步于第 ${result?.levelReached ?? 1} 关`}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onRestart}
            className="game-pill-btn w-full bg-black py-3.5 text-base text-white hover:brightness-110"
          >
            再来一局
          </button>
          <button
            onClick={onBackToWelcome}
            className="game-pill-btn w-full bg-white py-3 text-sm text-black hover:brightness-95"
          >
            返回首页
          </button>
        </div>
      </motion.div>
    </div>
  );
}
