import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FoodType, FOODS, ANIMALS, PlayerData, PetDailyData, ProvinceType } from '../types';
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

interface FlyingFood {
  id: string;
  type: FoodType;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  duration: number;
  charge: number;
}

interface Feedback {
  id: string;
  text: string;
  x: number;
  y: number;
}

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

  // 弹弓投喂状态
  const [isCharging, setIsCharging] = useState(false);
  const [chargePercent, setChargePercent] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [flyingFoods, setFlyingFoods] = useState<FlyingFood[]>([]);
  const [feedbackFoods, setFeedbackFoods] = useState<Feedback[]>([]);
  const [currentFood, setCurrentFood] = useState<FoodType>('carrot');

  // 食物列表
  const FOOD_TYPES: FoodType[] = ['carrot', 'bug', 'bone', 'greens', 'shrimp', 'feed'];

  // Refs
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const chargeButtonRef = useRef<HTMLButtonElement>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const processedFoodIdsRef = useRef<Set<string>>(new Set());

  // 投喂参数（复用 GameScreen 的值）
  const maxDragDistance = 120;
  const forceMultiplierX = 3.0;
  const forceMultiplierY = 4.8;

  useEffect(() => {
    setPlayerData(getPlayerData());
  }, []);

  useEffect(() => {
    if (isNewDay()) {
      resetDailyData();
      setDailyData(getDailyData());
    }
  }, []);

  // 处理飞行动画结束
  useEffect(() => {
    flyingFoods.forEach((food) => {
      const foodId = food.id;
      if (processedFoodIdsRef.current.has(foodId)) return;
      processedFoodIdsRef.current.add(foodId);

      setTimeout(() => {
        handleFeedingSuccess();
        setFlyingFoods((prev) => prev.filter(item => item.id !== foodId));
        processedFoodIdsRef.current.delete(foodId);
      }, food.duration * 1000);
    });
  }, [flyingFoods]);

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

  // 弹弓处理函数
  const getThrowVector = (dx: number, dy: number) => {
    const chargeRatio = Math.min(Math.max(dy / maxDragDistance, 0), 1);
    const weightedDx = dx * chargeRatio;
    return {
      throwVecX: -weightedDx * forceMultiplierX,
      throwVecY: -dy * forceMultiplierY
    };
  };

  const handlePointerDown = (e: PointerEvent) => {
    if (!gameAreaRef.current || !chargeButtonRef.current) return;
    if (getRemainingFeeds() <= 0) {
      showFeedbackFeed('请先打卡或看广告获取投喂次数', 50, 20);
      return;
    }

    (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
    const gameRect = gameAreaRef.current.getBoundingClientRect();
    const buttonRect = chargeButtonRef.current.getBoundingClientRect();
    startPosRef.current = {
      x: buttonRect.left + buttonRect.width / 2 - gameRect.left,
      y: buttonRect.top + buttonRect.height / 2 - gameRect.top
    };
    setIsCharging(true);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isCharging || !startPosRef.current || !gameAreaRef.current) return;
    const gameRect = gameAreaRef.current.getBoundingClientRect();
    const currentX = e.clientX - gameRect.left;
    const currentY = e.clientY - gameRect.top;
    const dx = currentX - startPosRef.current.x;
    const dy = Math.max(0, currentY - startPosRef.current.y);
    setDragOffset({ x: dx, y: dy });

    const percent = Math.min((dy / maxDragDistance) * 100, 100);
    setChargePercent(percent);
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!isCharging || !startPosRef.current || !gameAreaRef.current) {
      resetDrag();
      return;
    }

    (e.currentTarget as HTMLButtonElement).releasePointerCapture(e.pointerId);

    if (getRemainingFeeds() <= 0) {
      showFeedbackFeed('请先打卡或看广告获取投喂次数', 50, 20);
      resetDrag();
      return;
    }

    const gameRect = gameAreaRef.current.getBoundingClientRect();
    const spawnPxX = startPosRef.current.x;
    const spawnPxY = startPosRef.current.y;
    const { throwVecX, throwVecY } = getThrowVector(dragOffset.x, dragOffset.y);

    const targetPxX = spawnPxX + throwVecX;
    const targetPxY = spawnPxY + throwVecY;

    const newFood: FlyingFood = {
      id: `food_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: currentFood,
      startX: (spawnPxX / gameRect.width) * 100,
      startY: ((gameRect.height - spawnPxY) / gameRect.height) * 100,
      targetX: (targetPxX / gameRect.width) * 100,
      targetY: ((gameRect.height - targetPxY) / gameRect.height) * 100,
      duration: 0.8,
      charge: Math.min((dragOffset.y / maxDragDistance) * 100, 100)
    };

    setFlyingFoods((prev) => [...prev, newFood]);

    consumeFeedCount();
    setDailyData(getDailyData());

    resetDrag();
  };

  const resetDrag = () => {
    setIsCharging(false);
    setChargePercent(0);
    setDragOffset({ x: 0, y: 0 });
    startPosRef.current = null;
  };

  const showFeedbackFeed = (text: string, x: number, y: number) => {
    const feedbackId = `feedback_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    setFeedbackFoods((prev) => [...prev, { id: feedbackId, text, x, y }]);

    setTimeout(() => {
      setFeedbackFoods((prev) => prev.filter(f => f.id !== feedbackId));
    }, 1200);
  };

  // 投喂成功处理函数
  const handleFeedingSuccess = () => {
    if (!playerData?.chosenPet) return;

    const previousStrength = playerData.chosenPet.strength;
    const newStrength = previousStrength + 5;
    const animalType = playerData.chosenPet.animalType;

    // 更新强壮度
    playerData.chosenPet.strength = newStrength;
    savePlayerData(playerData);
    setPlayerData({ ...playerData });

    // 显示漂浮反馈
    showFeedbackFeed('+5 强壮度', 50, 45);

    // 检查形态升级
    const previousForm = getFormName(previousStrength);
    const newForm = getFormName(newStrength);

    if (previousForm !== newForm && animalType) {
      // 形态变化，显示弹窗
      let title = '';
      let message = '';

      if (newStrength >= 1000) {
        title = '🏆 超级无敌！';
        message = `恭喜！你的${playerData.chosenPet.customName}进化为超级无敌大肌肉形态！\n解锁称号：${playerData.selectedProvince}最强${ANIMALS[animalType].name}！`;
      } else if (newStrength >= 500) {
        title = '💪 肌肉发达！';
        message = `恭喜！你的${playerData.chosenPet.customName}进化为肌肉形态！`;
      } else if (newStrength >= 100) {
        title = '✨ 健康匀称！';
        message = `恭喜！你的${playerData.chosenPet.customName}进化为匀称形态！`;
      }

      setEvolutionPopup({ show: true, message, title });
    }
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

      {/* 弹弓投喂区域 - 底部中央 */}
      <div
        ref={gameAreaRef}
        className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-[calc(5rem+env(safe-area-inset-bottom))]"
      >
        {/* 食物选择器 */}
        <div className="absolute bottom-32 left-4 z-[110]">
          <div className="mb-2 text-sm font-bold text-[#3a2612]">选择食物</div>
          <div className="flex gap-2">
            {FOOD_TYPES.map((food) => (
              <button
                key={food}
                onClick={() => setCurrentFood(food)}
                className={`rounded-xl px-3 py-2 text-center transition ${
                  currentFood === food
                    ? 'bg-cyan-500 border-2 border-cyan-600 text-white'
                    : 'bg-white/80 border-2 border-gray-300 hover:bg-white'
                }`}
              >
                <div className="text-2xl">{FOODS[food].emoji}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 蓄力条 */}
        {isCharging && (
          <div className="absolute bottom-28 w-48 overflow-hidden rounded-full border-2 border-black/20 bg-gray-200">
            <div
              className="h-3 bg-gradient-to-r from-orange-400 to-red-400 transition-all duration-75"
              style={{ width: `${chargePercent}%` }}
            />
          </div>
        )}

        {/* 弹弓按钮 */}
        <button
          ref={chargeButtonRef}
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative mb-1 h-28 w-28 cursor-grab border-0 bg-transparent p-0 active:cursor-grabbing"
          aria-label={`投喂 ${FOODS[currentFood].name}`}
        >
          <motion.div
            className="absolute inset-0 flex items-center justify-center origin-bottom"
            animate={{
              x: isCharging ? dragOffset.x * 0.45 : 0,
              y: isCharging ? dragOffset.y * 0.65 : 0,
              rotate: isCharging ? (Math.atan2(dragOffset.x, -dragOffset.y) * 180 / Math.PI) : 0
            }}
            transition={{ type: 'spring', duration: 0.05 }}
          >
            {/* 复用 GameScreen 的 SVG hand */}
            <svg width="90" height="90" viewBox="0 0 100 100" className="drop-shadow-xl">
              <path
                d="M30,100 L30,60 Q30,30 50,30 Q70,30 70,60 L70,100 Z"
                fill="#FFCCAA"
                stroke="black"
                strokeWidth="3"
              />
              <path
                d="M70,70 Q90,70 90,50 Q90,30 70,40"
                fillOpacity="0"
                stroke="black"
                strokeWidth="3"
              />
              <path d="M40,30 L40,60" stroke="black" strokeWidth="2" opacity="0.3" />
              <path d="M50,30 L50,60" stroke="black" strokeWidth="2" opacity="0.3" />
              <path d="M60,30 L60,60" stroke="black" strokeWidth="2" opacity="0.3" />
            </svg>

            <div className="pointer-events-none absolute top-[35%] text-2xl">
              {FOODS[currentFood].emoji}
            </div>
          </motion.div>
        </button>

        <div className="rounded-full bg-[#2a1d14]/85 px-2 py-1 text-[10px] font-bold text-white">
          向下拖动蓄力投喂
        </div>
      </div>

      {/* 飞行的食物 */}
      <AnimatePresence>
        {flyingFoods.map((food) => (
          <div key={food.id} className="pointer-events-none absolute inset-0 z-[200]">
            <motion.div
              initial={{
                left: `${food.startX}%`,
                bottom: `${food.startY}%`,
                scale: 0.5,
                opacity: 0.8
              }}
              animate={{
                left: `${food.targetX}%`,
                bottom: `${food.targetY}%`,
                scale: [0.5, 1.2, 0.5],
                rotate: 360 * (1 + food.charge / 20)
              }}
              transition={{
                left: { duration: food.duration, ease: 'linear' },
                bottom: { duration: food.duration, ease: 'linear' },
                scale: { duration: food.duration, ease: 'easeInOut', times: [0, 0.5, 1] },
                rotate: { duration: food.duration, ease: 'linear' }
              }}
              className="absolute flex items-center justify-center"
              style={{ transform: 'translate(-50%, 50%)' }}
            >
              <div className="text-4xl">{FOODS[food.type].emoji}</div>
            </motion.div>
          </div>
        ))}
      </AnimatePresence>

      {/* 漂浮反馈 */}
      <AnimatePresence>
        {feedbackFoods.map((feedback) => (
          <motion.div
            key={feedback.id}
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -24, scale: 1.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="pointer-events-none absolute z-[300] whitespace-nowrap rounded-full border-2 border-black/20 bg-white/92 px-4 py-2 text-sm font-bold text-[#2f2012] shadow-[0_8px_18px_rgba(0,0,0,0.15)]"
            style={{
              left: `${feedback.x}%`,
              bottom: `${feedback.y}%`,
              transform: 'translate(-50%, 0)'
            }}
          >
            {feedback.text}
          </motion.div>
        ))}
      </AnimatePresence>

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
