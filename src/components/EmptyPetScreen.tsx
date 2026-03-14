import { motion } from 'motion/react';
import { ProvinceType } from '../types';

interface EmptyPetScreenProps {
  onBack: () => void;
  onGoToAdventure: () => void;
  province: ProvinceType;
}

export function EmptyPetScreen({ onBack, onGoToAdventure, province }: EmptyPetScreenProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[var(--game-bg)] px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm text-center"
      >
        <button
          onClick={onBack}
          className="absolute right-4 top-4 text-2xl text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>

        <div className="mb-8 text-6xl">🐾</div>

        <h2 className="title-font mb-4 text-2xl font-bold text-[#3a2612]">
          您还没有专属天选宠物哦
        </h2>

        <p className="mb-8 text-lg text-gray-600">
          在闯关模式中投喂某个动物达到 100 次，
          <br />
          它将成为你的天选宠物。
        </p>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onGoToAdventure}
          className="w-full rounded-xl border-2 border-[#3a2612] bg-[#fbbf24] px-8 py-4 text-lg font-bold text-white shadow-[0_4px_12px_rgba(251,191,36,0.3)]"
        >
          去闯关模式投喂动物吧
        </motion.button>

        <div className="mt-8 text-sm text-gray-500">
          当前选择省份: {province}
        </div>
      </motion.div>
    </div>
  );
}
