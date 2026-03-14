import { useState } from 'react';
import { motion } from 'motion/react';
import { PROVINCES, ProvinceType } from '../types';
import { getPlayerData, savePlayerData, generatePlayerId } from '../utils/storage';

interface WelcomeScreenProps {
  onStart: (mode: 'adventure' | 'raising', province: ProvinceType, gender: 'male' | 'female') => void;
}

const MOCK_RANKINGS = [
  { rank: 1, petName: '巨壮青蛙', province: '广东', strength: 1500 },
  { rank: 2, petName: '力量小狗', province: '江苏', strength: 1200 },
  { rank: 3, petName: '肌肉小猫', province: '浙江', strength: 980 },
];

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  const [selectedProvince, setSelectedProvince] = useState<ProvinceType>(PROVINCES[0]);
  const [playerData] = useState(() => getPlayerData() || {
    playerId: generatePlayerId(),
    selectedProvince: PROVINCES[0],
    chosenPet: null
  });

  const handleStartAdventure = () => {
    onStart('adventure', selectedProvince, 'male');
  };

  const handleStartRaising = () => {
    // 初始化玩家数据（如果还没有的话）
    savePlayerData(playerData);
    onStart('raising', selectedProvince, 'male');
  };

  return (
    <div className="h-full flex flex-col items-center justify-center bg-[var(--game-bg)] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <h1 className="title-font mb-8 text-center text-3xl text-[#3a2612]">
          选择你的省份
        </h1>

        <div className="mb-6">
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value as ProvinceType)}
            className="w-full rounded-xl border-2 border-[#3a2612]/20 bg-white/90 px-4 py-3 text-lg font-bold text-[#3a2612]"
          >
            {PROVINCES.map((province) => (
              <option key={province} value={province}>
                {province}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartAdventure}
            className="relative w-full overflow-hidden rounded-2xl border-2 border-[#3a2612]/20 bg-gradient-to-br from-[#fef3c7] to-[#ffe6b8] p-6 shadow-[0_8px_24px_rgba(58,38,18,0.2)]"
          >
            <div className="flex items-start gap-4">
              <div className="text-5xl">🎯</div>
              <div className="flex-1 text-left">
                <div className="title-font text-2xl font-bold text-[#3a2612]">
                  闯关模式
                </div>
                <div className="text-sm text-[#5a4a3a]">经典投喂挑战</div>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartRaising}
            className="relative w-full overflow-hidden rounded-2xl border-2 border-[#3a2612]/20 bg-gradient-to-br from-[#dbeafe] to-[#bfdbfe] p-6 shadow-[0_8px_24px_rgba(37,99,235,0.2)]"
          >
            <div className="flex items-start gap-4">
              <div className="text-5xl">🏆</div>
              <div className="flex-1 text-left">
                <div className="title-font text-2xl font-bold text-[#1e40af]">
                  天选宠物
                </div>
                <div className="text-sm text-[#5a4a3a]">专属养成系统</div>
              </div>
            </div>
            {playerData.chosenPet && (
              <div className="absolute bottom-2 right-2 rounded-full bg-[#1e40af]/10 px-2 py-1 text-xs font-bold text-[#1e40af]">
                ✨ 已激活
              </div>
            )}
          </motion.button>
        </div>

        <div className="mt-8 rounded-xl border border-[#3a2612]/10 bg-white/50 p-4">
          <div className="mb-2 text-center font-bold text-[#3a2612]">🏆 排行榜预览 - {selectedProvince}</div>
          <div className="space-y-2">
            {MOCK_RANKINGS.slice(0, 3).map((item) => (
              <div key={item.rank} className="flex items-center justify-between rounded-lg bg-white/60 px-3 py-2">
                <span className="font-bold text-[#3a2612]">{item.rank}. {item.petName}</span>
                <span className="text-sm text-gray-600">{item.strength} 强壮度</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
