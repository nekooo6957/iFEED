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
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-[#ffc768] via-[#ffab46] to-[#ff8f30] p-4 text-black sm:p-5">
      <div className="pointer-events-none absolute -top-14 right-[-28px] h-44 w-44 rounded-full bg-white/35 blur-2xl" />
      <div className="pointer-events-none absolute bottom-8 left-[-48px] h-52 w-52 rounded-full bg-yellow-200/25 blur-2xl" />

      <motion.div
        initial={{ y: 8, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative w-full max-w-md p-5 sm:p-7"
      >
        <div className="pointer-events-none absolute -top-3 right-5 rounded-full bg-white px-3 py-1 text-[11px] font-black text-[#7e3d10]">
          MOBILE V2
        </div>

        <div className="mb-5 text-center">
          <h1 className="title-font text-4xl text-[#3a2612] sm:text-[42px]">动物投喂大作战</h1>
          <p className="mt-1 text-sm font-black text-[#7e3d10]">四关制 · 库存解谜 · 抛投玩法</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-black text-[#3a2612]">选择形象</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setGender('male')}
                className={`game-pill-btn p-3 text-sm ${
                  gender === 'male'
                    ? 'bg-sky-500 text-white'
                    : 'bg-white/90 text-black hover:brightness-95'
                }`}
              >
                👦 小哥
              </button>
              <button
                onClick={() => setGender('female')}
                className={`game-pill-btn p-3 text-sm ${
                  gender === 'female'
                    ? 'bg-pink-500 text-white'
                    : 'bg-white/90 text-black hover:brightness-95'
                }`}
              >
                👧 小姐姐
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-black text-[#3a2612]">选择农场</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full rounded-xl border border-black/20 bg-white/95 px-4 py-3 text-sm font-bold outline-none ring-0"
            >
              {REGIONS.map((region) => (
                <option key={region} value={region}>
                  {region}
                </option>
              ))}
            </select>
          </div>

          <div className="px-1 text-xs font-bold leading-relaxed text-[#60330f]">
            提示：食物数量固定，合理分配到每只动物，全部喂饱即可过关。
          </div>

          <button
            onClick={() => onStart(selectedRegion, gender)}
            className="game-pill-btn w-full bg-gradient-to-b from-[#2a221b] to-[#17110b] py-4 text-lg text-white hover:brightness-110"
          >
            开始游戏
          </button>
        </div>
      </motion.div>
    </div>
  );
}
