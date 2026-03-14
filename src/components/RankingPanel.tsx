import { AnimatePresence, motion } from 'motion/react';
import React from 'react';

export interface RankingData {
  rank: number;
  petName: string;
  province: string;
  strength: number;
}

interface RankingPanelProps {
  province: string;
  yourRank?: number;
  yourPetName?: string;
  onClose?: () => void;
}

const MOCK_RANKINGS: RankingData[] = [
  { rank: 1, petName: '巨壮青蛙', province: '广东', strength: 1500 },
  { rank: 2, petName: '力量小狗', province: '江苏', strength: 1200 },
  { rank: 3, petName: '肌肉小猫', province: '浙江', strength: 980 },
  { rank: 4, petName: '铁臂乌龟', province: '山东', strength: 850 },
  { rank: 5, petName: '霸气老虎', province: '四川', strength: 720 },
  { rank: 6, petName: '结实小兔', province: '湖北', strength: 600 },
  { rank: 7, petName: '强壮小羊', province: '湖南', strength: 480 },
  { rank: 8, petName: '灵活小鱼', province: '福建', strength: 350 },
  { rank: 9, petName: '萌萌小鸡', province: '安徽', strength: 200 },
  { rank: 10, petName: '初生小牛', province: '河北', strength: 100 },
];

export function RankingPanel({ province, yourRank, yourPetName, onClose }: RankingPanelProps) {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose?.();
  };

  return (
    <div className="absolute left-0 right-0 top-0 z-[150] max-h-[60vh] overflow-y-auto bg-white/95 backdrop-blur-sm" onClick={onClose}>
      <div className="p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="title-font text-xl font-bold text-[#3a2612]">
            🏆 排行榜 - {province}
          </h3>
          <button
            onClick={handleClose}
            className="rounded-full bg-gray-200 px-3 py-1 text-sm font-bold text-gray-600 hover:bg-gray-300"
          >
            关闭
          </button>
        </div>

        <div className="space-y-2">
          {MOCK_RANKINGS.map((item) => (
            <motion.div
              key={item.rank}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: item.rank * 0.05 }}
              className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                yourPetName === item.petName
                  ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`title-font text-2xl font-bold ${
                  item.rank <= 3 ? 'text-yellow-500' : 'text-gray-600'
                }`}>
                  {item.rank}
                </span>
                <div className="flex-1">
                  <div className="font-bold text-[#3a2612]">{item.petName}</div>
                  <div className="text-xs text-gray-500">{item.province}</div>
                </div>
              </div>
              <div className="text-lg font-bold text-[#1e40af]">
                {item.strength}
              </div>
            </motion.div>
          ))}
        </div>

        {yourRank !== undefined && (
          <div className="mt-4 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-center">
            <div className="text-sm text-gray-600">你当前排名第</div>
            <div className="title-font text-2xl font-bold text-[#3a2612]">
              第 {yourRank} 名
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
