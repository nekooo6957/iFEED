import { motion } from 'motion/react';
import { useState } from 'react';
import { REGIONS } from '../types';

interface WelcomeScreenProps {
  onStart: (region: string, gender: string) => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [selectedRegion, setSelectedRegion] = useState(REGIONS[0]);
  const [gender, setGender] = useState<'male' | 'female'>('male');

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#ffb648] via-[#ff9d3b] to-[#ff7f2c] p-5 text-black">
      <div className="pointer-events-none absolute -top-12 right-[-35px] h-44 w-44 rounded-full bg-white/25 blur-2xl" />
      <div className="pointer-events-none absolute bottom-14 left-[-55px] h-52 w-52 rounded-full bg-yellow-200/25 blur-2xl" />

      <motion.div
        initial={{ y: 8, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="game-card relative w-full max-w-md p-6 sm:p-8"
      >
        <div className="pointer-events-none absolute -top-3 right-5 rounded-full border-2 border-black bg-yellow-200 px-3 py-1 text-xs font-black">
          V2
        </div>

        <h1 className="title-font mb-1 text-center text-4xl text-[#3a2612]">动物投喂大作战</h1>
        <p className="mb-6 text-center text-sm font-bold text-[#8f3d08]">四关制 · 库存解谜 · 抛投玩法</p>

        <div className="space-y-5">
          <div className="game-card rounded-2xl p-3 shadow-none">
            <label className="mb-2 block text-sm font-black">选择形象</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setGender('male')}
                className={`game-pill-btn p-3 text-sm ${
                  gender === 'male'
                    ? 'bg-sky-500 text-white'
                    : 'bg-white text-black hover:brightness-95'
                }`}
              >
                👦 小哥
              </button>
              <button
                onClick={() => setGender('female')}
                className={`game-pill-btn p-3 text-sm ${
                  gender === 'female'
                    ? 'bg-pink-500 text-white'
                    : 'bg-white text-black hover:brightness-95'
                }`}
              >
                👧 小姐姐
              </button>
            </div>
          </div>

          <div className="game-card rounded-2xl p-3 shadow-none">
            <label className="mb-2 block text-sm font-black">选择农场</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full rounded-xl border-2 border-black bg-white px-4 py-3 text-sm font-bold outline-none ring-0"
            >
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border-2 border-black/80 bg-yellow-100 px-3 py-2 text-xs font-bold leading-relaxed text-[#60330f]">
            提示：每关食物数量固定。合理分配可减少饥饿值的食物，把所有动物都喂饱即可过关。
          </div>

          <button
            onClick={() => onStart(selectedRegion, gender)}
            className="game-pill-btn w-full bg-black py-4 text-lg text-white hover:brightness-110"
          >
            开始挑战
          </button>
        </div>
      </motion.div>
    </div>
  );
}
