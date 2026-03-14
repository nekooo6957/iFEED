import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimalEntity, FoodType, FOODS, ANIMALS, AnimalType, PlayerData, PetDailyData, ProvinceType } from '../types';
import { EmptyPetScreen } from './EmptyPetScreen';
import {
  getPlayerData,
  savePlayerData,
  getDailyData,
  saveDailyData,
  isNewDay,
  resetDailyData,
  checkInDaily,
  consumeFeedCount,
  getRemainingFeeds,
  getRemainingAds,
  consumeAdCount
} from '../utils/storage';

interface PetRaisingScreenProps {
  onBack: () => void;
  onGoToAdventure: () => void;
}

export function PetRaisingScreen({ onBack, onGoToAdventure }: PetRaisingScreenProps) {
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);
  const [dailyData, setDailyData] = useState<PetDailyData>(getDailyData());
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');
  const [showRanking, setShowRanking] = useState(false);
  const [evolutionPopup, setEvolutionPopup] = useState<{ show: boolean; message: string; title: string }>({
    show: false,
    message: '',
    title: ''
  });

  useEffect(() => {
    setPlayerData(getPlayerData());
  }, []);

  useEffect(() => {
    if (isNewDay()) {
      resetDailyData();
      setDailyData(getDailyData());
    }
  }, []);

  if (!playerData?.chosenPet) {
    return <EmptyPetScreen onBack={onBack} onGoToAdventure={onGoToAdventure} province={playerData?.selectedProvince || '广东'} />;
  }

  const pet = ANIMALS[playerData.chosenPet.animalType];

  // 获取当前形态
  const getFormName = (strength: number): string => {
    if (strength >= 1000) return '超级肌肉';
    if (strength >= 500) return '肌肉';
    if (strength >= 100) return '匀称';
    return '病怏怏';
  };

  // 获取下一个形态目标
  const getNextFormTarget = (strength: number): { name: string; current: number; target: number } => {
    if (strength < 100) return { name: '匀称', current: strength, target: 100 };
    if (strength < 500) return { name: '肌肉', current: strength, target: 500 };
    if (strength < 1000) return { name: '超级肌肉', current: strength, target: 1000 };
    return { name: 'MAX', current: strength, target: 1000 };
  };

  const formName = getFormName(playerData.chosenPet.strength);
  const nextTarget = getNextFormTarget(playerData.chosenPet.strength);
  const progressPercent = (nextTarget.current / nextTarget.target) * 100;

  // 获取称号
  const getTitle = (): string => {
    if (playerData.chosenPet.strength >= 1000) {
      return `${playerData.selectedProvince}最强${pet.name}`;
    }
    return '';
  };

  const title = getTitle();

  const handleCheckIn = () => {
    checkInDaily();
    setDailyData(getDailyData());
  };

  const handleWatchAd = () => {
    if (getRemainingAds() <= 0) return;

    // 模拟广告播放
    const adButton = document.querySelector('.ad-button');
    if (adButton) {
      adButton.textContent = '广告播放中...';
      adButton.classList.add('opacity-50', 'cursor-not-allowed');
    }

    setTimeout(() => {
      consumeAdCount();
      setDailyData(getDailyData());
      if (adButton) {
        adButton.textContent = `今日剩余广告：${getRemainingAds()}/3`;
        adButton.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    }, 3000);
  };

  const handleNameEdit = () => {
    setEditNameInput(playerData.chosenPet.customName);
    setIsEditingName(true);
  };

  const handleNameSave = () => {
    if (editNameInput.trim()) {
      playerData.chosenPet.customName = editNameInput.trim();
      savePlayerData(playerData);
      setPlayerData({ ...playerData });
    }
    setIsEditingName(false);
  };

  const handleEvolutionPopupClose = () => {
    setEvolutionPopup({ show: false, message: '', title: '' });
  };

  return (
    <div className="relative h-full w-full bg-gradient-to-b from-[#f8efdc] via-[#f4e5c8] to-[#ecd8b5]">
      {/* 返回按钮 */}
      <button
        onClick={onBack}
        className="absolute right-4 top-4 z-[200] rounded-full bg-white/80 px-3 py-2 text-lg font-bold text-[#3a2612] hover:bg-white/95 shadow-lg"
      >
        返回
      </button>

      {/* 排行榜按钮 */}
      <button
        onClick={() => setShowRanking(!showRanking)}
        className="absolute left-4 top-4 z-[200] rounded-full bg-white/80 px-3 py-2 text-lg font-bold text-[#3a2612] hover:bg-white/95 shadow-lg"
      >
        🏆 排名
      </button>

      {/* 固定属性面板 */}
      <div className="absolute left-1/2 top-[25%] z-[100] -translate-x-1/2 w-[85%] max-w-sm">
        <div className="rounded-2xl border-2 border-black/10 bg-white/95 shadow-[0_8px_24px_rgba(0,0,0,0.12)] p-4">
          {title && (
            <div className="mb-3 text-center">
              <span className="title-font text-2xl font-bold bg-gradient-to-r from-yellow-200 to-amber-200 bg-clip-text text-transparent">
                {title}
              </span>
            </div>
          )}

          <div className="mb-3">
            <div className="mb-1 text-sm font-bold text-gray-600">形态进化</div>
            <div className="h-4 overflow-hidden rounded-full border-2 border-black/10 bg-gray-100">
              <div
                className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <div className="text-center text-sm font-bold text-[#3a2612]">
            {formName} → {nextTarget.name}
          </div>

          <div className="mt-4 text-center">
            <div className="text-sm text-gray-600">强壮度</div>
            <div className="title-font text-3xl font-black text-[#1e40af]">
              {playerData.chosenPet.strength}
            </div>
            <div className="text-sm text-gray-500">
              / {nextTarget.target}
            </div>
          </div>
        </div>
      </div>

      {/* 天选宠物 */}
      <div className="absolute left-1/2 top-[40%] z-[50] -translate-x-1/2 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative cursor-pointer"
          onClick={handleNameEdit}
        >
          <div className="text-[120px] leading-none drop-shadow-2xl">
            {pet.emoji}
          </div>
          <div className="mt-2 text-center">
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editNameInput}
                  onChange={(e) => setEditNameInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameSave()}
                  className="w-24 rounded-lg border-2 border-[#3a2612] bg-white/90 px-3 py-2 text-center font-bold text-[#3a2612]"
                  maxLength={12}
                />
                <button
                  onClick={handleNameSave}
                  className="rounded-lg bg-green-500 px-3 py-2 text-sm font-bold text-white hover:bg-green-600"
                >
                  ✓
                </button>
              </div>
            ) : (
              <div
                className={`title-font text-2xl font-bold ${
                  playerData.chosenPet.strength >= 1000
                    ? 'bg-gradient-to-r from-yellow-300 to-amber-300 bg-clip-text text-transparent'
                    : playerData.chosenPet.strength >= 500
                      ? 'text-red-500'
                      : playerData.chosenPet.strength >= 100
                        ? 'text-blue-500'
                        : 'text-gray-600'
                }`}
              >
                {playerData.chosenPet.customName || pet.name}
                <span className="ml-2 text-sm text-gray-500">✎</span>
              </div>
            )}
            <div className={`text-sm ${
              playerData.chosenPet.strength >= 1000
                ? 'text-yellow-600'
                : playerData.chosenPet.strength >= 500
                  ? 'text-red-600'
                  : 'text-gray-600'
            }`}>
              (当前形态: {formName})
            </div>
          </div>
        </motion.div>
      </div>

      {/* 底部栏 */}
      <div className="absolute bottom-0 left-0 right-0 z-[120] flex items-end justify-between gap-2 border-t-2 border-black/10 bg-gradient-to-t from-white/95 to-white/90 px-4 pb-[env(safe-area-inset-bottom)] pt-4">
        {/* 打卡按钮 */}
        <button
          onClick={handleCheckIn}
          disabled={dailyData.checkedIn}
          className={`game-pill-btn px-3 py-2 text-sm font-bold transition sm:text-sm ${
            dailyData.checkedIn
              ? 'cursor-not-allowed opacity-50 bg-gray-300'
              : 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-600'
          }`}
        >
          {dailyData.checkedIn ? '✓ 已打卡' : '📋 打卡'}
        </button>

        {/* 剩余投喂次数 */}
        <div className="rounded-lg bg-white/80 px-4 py-2">
          <div className="text-xs text-gray-600">今日剩余投喂</div>
          <div className="title-font text-xl font-bold text-[#3a2612]">
            {getRemainingFeeds()}次
          </div>
        </div>

        {/* 广告按钮 */}
        <button
          onClick={handleWatchAd}
          disabled={getRemainingAds() <= 0}
          className={`ad-button game-pill-btn px-3 py-2 text-xs font-bold transition sm:text-sm ${
            getRemainingAds() <= 0
              ? 'cursor-not-allowed opacity-50 bg-gray-300'
              : 'bg-gradient-to-r from-purple-400 to-pink-400 text-white hover:from-purple-500 hover:to-pink-500'
          }`}
        >
          📺 看广告<br />
          <span className="text-[10px]">
            今日剩余广告：{getRemainingAds()}/3
          </span>
        </button>
      </div>

      {/* 排行榜覆盖 */}
      <AnimatePresence>
        {showRanking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[300] flex items-center justify-center bg-black/50"
          >
            <div className="relative w-full max-w-md">
              <div className="rounded-2xl border-2 border-black/20 bg-white p-6">
                <h3 className="title-font mb-4 text-center text-2xl font-bold text-[#3a2612]">
                  🏆 排行榜 - {playerData.selectedProvince}
                </h3>
                <div className="space-y-2">
                  {MOCK_RANKINGS.map((item) => (
                    <div
                      key={item.rank}
                      className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                        playerData.chosenPet.customName === item.petName
                          ? 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-2 border-yellow-400'
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <span className={`title-font text-xl font-bold ${
                        item.rank <= 3 ? 'text-yellow-500' : 'text-gray-600'
                      }`}>
                        {item.rank}
                      </span>
                      <span className="flex-1 text-center font-bold text-[#3a2612]">
                        {item.petName}
                      </span>
                      <span className="text-lg font-bold text-[#1e40af]">
                        {item.strength}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl bg-gray-50 px-4 py-3 text-center">
                  <div className="text-sm text-gray-600">你当前排名第</div>
                  <div className="title-font text-xl font-bold text-[#3a2612]">
                    第 15 名
                  </div>
                </div>
                <button
                  onClick={() => setShowRanking(false)}
                  className="w-full mt-4 rounded-xl bg-gray-200 px-4 py-3 font-bold text-gray-700 hover:bg-gray-300"
                >
                  关闭
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 进化弹窗 */}
      <AnimatePresence>
        {evolutionPopup.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute left-1/2 top-1/2 z-[400] -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-sm"
          >
            <div className="rounded-2xl border-2 border-yellow-400 bg-gradient-to-b from-yellow-50 to-yellow-100 p-6 shadow-2xl text-center">
              <div className="text-5xl mb-2">✨</div>
              <h3 className="title-font mb-2 text-2xl font-bold text-yellow-700">
                {evolutionPopup.title}
              </h3>
              <p className="text-lg text-yellow-600">{evolutionPopup.message}</p>
              <button
                onClick={handleEvolutionPopupClose}
                className="mt-4 w-full rounded-xl bg-yellow-500 px-6 py-3 text-lg font-bold text-white hover:bg-yellow-600"
              >
                太棒了！
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// 模拟排行榜数据
const MOCK_RANKINGS = [
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
