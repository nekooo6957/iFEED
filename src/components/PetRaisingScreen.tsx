import { useState, useEffect, useRef } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FoodType, FOODS, ANIMALS, PlayerData, PetDailyData } from '../types';
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

  // 投喂参数（完全复用 GameScreen 的值）
  const maxDragDistance = 120;
  const forceMultiplierX = 3.0;
  const forceMultiplierY = 4.8;
  const xDeadZonePx = 8;

  useEffect(() => {
    setPlayerData(getPlayerData());
  }, []);

  useEffect(() => {
    if (isNewDay()) {
      resetDailyData();
      setDailyData(getDailyData());
    }
  }, []);

  // 处理飞行动画结束（检测是否命中宠物）
  useEffect(() => {
    flyingFoods.forEach((food) => {
      const foodId = food.id;
      if (processedFoodIdsRef.current.has(foodId)) return;
      processedFoodIdsRef.current.add(foodId);

      setTimeout(() => {
        // 检测是否命中宠物（宠物在屏幕中央，bottom 约 65%）
        const petX = 50; // 宠物在屏幕中央
        const petY = 65; // 宠物在 top-[35%] = bottom-[65%]
        const hitRadius = 15; // 命中半径

        const dx = food.targetX - petX;
        const dy = food.targetY - petY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= hitRadius) {
          handleFeedingSuccess();
        } else if (food.targetY > 80) {
          showFeedbackFeed('飞过头了', food.targetX, food.targetY);
        } else if (food.targetY < 50) {
          showFeedbackFeed('太近了', food.targetX, food.targetY);
        } else {
          showFeedbackFeed('未命中', food.targetX, food.targetY);
        }

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

  // 获取称号
  const getTitle = (): string => {
    if (playerData.chosenPet.strength >= 1000) {
      return `${playerData.selectedProvince}最强${pet.name}`;
    }
    return '';
  };

  const formName = getFormName(playerData.chosenPet.strength);
  const title = getTitle();

  // 计算瞄准角度（复用 GameScreen 逻辑）
  const aimAngleDeg = (() => {
    if (!isCharging) return 0;
    const chargeRatio = Math.min(Math.max(dragOffset.y / maxDragDistance, 0), 1);
    const stableDx = Math.abs(dragOffset.x) <= xDeadZonePx ? 0 : dragOffset.x;
    const weightedDx = stableDx * chargeRatio;
    const throwVecX = -weightedDx * forceMultiplierX;
    const throwVecY = -dragOffset.y * forceMultiplierY;
    // 0度表示正上方，与箭头默认朝上保持一致
    return (Math.atan2(throwVecX, -throwVecY || 0.0001) * 180) / Math.PI;
  })();

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
        adButton.textContent = `📺 看广告\n今日剩余：${getRemainingAds()}/3`;
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

  // 弹弓处理函数（完全复用 GameScreen 逻辑）
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!gameAreaRef.current || !chargeButtonRef.current) return;
    if (getRemainingFeeds() <= 0) {
      showFeedbackFeed('请先打卡或看广告获取投喂次数', 50, 20);
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    const gameRect = gameAreaRef.current.getBoundingClientRect();
    const buttonRect = chargeButtonRef.current.getBoundingClientRect();
    startPosRef.current = {
      x: buttonRect.left + buttonRect.width / 2 - gameRect.left,
      y: buttonRect.top + buttonRect.height / 2 - gameRect.top
    };

    setIsCharging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
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

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!isCharging || !startPosRef.current || !gameAreaRef.current) {
      resetDrag();
      return;
    }

    e.currentTarget.releasePointerCapture(e.pointerId);

    if (getRemainingFeeds() <= 0) {
      showFeedbackFeed('请先打卡或看广告获取投喂次数', 50, 20);
      resetDrag();
      return;
    }

    const gameRect = gameAreaRef.current.getBoundingClientRect();
    const spawnPxX = startPosRef.current.x;
    const spawnPxY = startPosRef.current.y;

    // 计算抛投向量（与 GameScreen 相同的逻辑）
    const chargeRatio = Math.min(Math.max(dragOffset.y / maxDragDistance, 0), 1);
    const stableDx = Math.abs(dragOffset.x) <= xDeadZonePx ? 0 : dragOffset.x;
    const weightedDx = stableDx * chargeRatio;
    const throwVecX = -weightedDx * forceMultiplierX;
    const throwVecY = -dragOffset.y * forceMultiplierY;

    // 起点：手的当前位置（包括拖拽偏移）
    // 手的视觉位置 = 按钮中心 + 偏移 * 系数
    const handX = spawnPxX + dragOffset.x * 0.45;
    const handY = spawnPxY + dragOffset.y * 0.65;
    const startXPct = (handX / gameRect.width) * 100;
    const startYPct = ((gameRect.height - handY) / gameRect.height) * 100;

    // 终点：根据抛投向量计算，但限制在合理范围内
    const targetPxX = spawnPxX + throwVecX;
    const targetPxY = spawnPxY + throwVecY;
    let targetXPct = (targetPxX / gameRect.width) * 100;
    let targetYPct = ((gameRect.height - targetPxY) / gameRect.height) * 100;

    // 限制目标位置在屏幕范围内（宠物区域：X 20-80%，Y 50-75%）
    targetXPct = Math.max(20, Math.min(80, targetXPct));
    targetYPct = Math.max(50, Math.min(75, targetYPct));

    const newFood: FlyingFood = {
      id: `food_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: currentFood,
      startX: startXPct,
      startY: startYPct,
      targetX: targetXPct,
      targetY: targetYPct,
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

    playerData.chosenPet.strength = newStrength;
    savePlayerData(playerData);
    setPlayerData({ ...playerData });

    showFeedbackFeed('+5 强壮度', 50, 55);

    // 检查形态升级
    const previousForm = getFormName(previousStrength);
    const newForm = getFormName(newStrength);

    if (previousForm !== newForm && animalType) {
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
      {/* 顶部导航 */}
      <div className="absolute left-0 right-0 top-0 z-[50] flex items-start justify-between gap-2 px-3 pb-2 pt-[calc(0.6rem+env(safe-area-inset-top))]">
        <button
          onClick={onBack}
          className="rounded-full bg-white/80 px-3 py-2 text-lg font-bold text-[#3a2612] hover:bg-white/95 shadow-lg"
        >
          返回
        </button>

        <div className="flex-1" />

        <button
          onClick={onGoToAdventure}
          className="rounded-full bg-gradient-to-r from-blue-400 to-blue-500 px-3 py-2 text-lg font-bold text-white hover:from-blue-500 hover:to-blue-600 shadow-lg"
        >
          闯关模式
        </button>
      </div>

      {/* 称号、强壮度和进化进度 */}
      <div className="absolute left-1/2 top-[12%] z-[50] -translate-x-1/2 flex flex-col items-center">
        {title && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="title-font text-xl font-bold bg-gradient-to-r from-yellow-200 to-amber-200 bg-clip-text text-transparent drop-shadow-lg"
          >
            {title}
          </motion.div>
        )}

        {/* 进化进度条 */}
        <div className="mt-2 flex flex-col items-center gap-1">
          <div className="text-xs text-gray-600 whitespace-nowrap">
            {playerData.chosenPet.strength % 1000}/1000 → {formName}
          </div>
          <div className="h-3 overflow-hidden rounded-full border-2 border-black/10 bg-gray-100 w-[80%]">
            <div
              className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-500"
              style={{ width: `${Math.min(100, (playerData.chosenPet.strength % 1000) / 10)}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="text-xs text-gray-600">强壮度</div>
          <div className="title-font text-2xl font-bold text-[#1e40af]">
            {playerData.chosenPet.strength}
          </div>
        </div>
      </div>

      {/* 天选宠物 */}
      <div className="absolute left-1/2 top-[35%] z-[80] -translate-x-1/2 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          className="relative cursor-pointer"
          onClick={handleNameEdit}
        >
          <div className="text-[80px] leading-none drop-shadow-2xl sm:text-[100px]">
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
                className={`title-font text-xl font-bold ${
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
              {formName}
            </div>
          </div>
        </motion.div>
      </div>

      {/* 底部控制区 - 完全复用 GameScreen 布局 */}
      <div
        ref={gameAreaRef}
        className="absolute bottom-[calc(5rem+env(safe-area-inset-bottom))] left-0 right-0 z-[120] grid grid-cols-[1.05fr_auto_0.95fr] items-end gap-2 px-2 sm:bottom-12 sm:gap-3 sm:px-4"
      >
        {/* 左侧：食物选择器 */}
        <div className="p-1.5 sm:p-2">
          <div className="mb-2 text-sm font-black">食物库存</div>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {FOOD_TYPES.map((food) => {
              const isSelected = currentFood === food;
              return (
                <button
                  key={food}
                  type="button"
                  onClick={() => setCurrentFood(food)}
                  aria-label={`${FOODS[food].name}，选中${isSelected ? '是' : '否'}`}
                  className={`min-h-[54px] rounded-xl border px-1 py-1 text-center transition sm:min-h-[60px] sm:px-2 sm:py-2 ${
                    isSelected ? 'border-cyan-500 bg-cyan-50 shadow-[0_4px_12px_rgba(14,165,233,0.28)]' : 'border-black/15 bg-white/90'
                  }`}
                >
                  <div className="text-xl sm:text-2xl">{FOODS[food].emoji}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 中间：弹弓按钮 */}
        <div className="flex flex-col items-center gap-2 px-1 py-1.5">
          {isCharging && (
            <div className="w-28 overflow-hidden rounded-full border border-black bg-gray-200 sm:w-32">
              <div className="h-2 bg-orange-500" style={{ width: `${chargePercent}%` }} />
            </div>
          )}
          <button
            ref={chargeButtonRef}
            type="button"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            aria-label={`当前食物${FOODS[currentFood].name}，按住下拉后抛投`}
            className="relative mb-1 h-28 w-28 cursor-grab border-0 bg-transparent p-0 active:cursor-grabbing sm:mb-2 sm:h-32 sm:w-32"
          >
            <motion.div
              className="absolute inset-0 flex items-center justify-center origin-bottom"
              style={{
                x: isCharging ? dragOffset.x * 0.45 : 0,
                y: isCharging ? dragOffset.y * 0.65 : 0,
                rotate: aimAngleDeg,
                transition: isCharging ? 'none' : 'all 0.2s ease-out',
              }}
            >
              <svg width="102" height="102" viewBox="0 0 100 100" className="drop-shadow-xl sm:h-[112px] sm:w-[112px]">
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
              <div className="pointer-events-none absolute top-[40%] text-3xl sm:text-4xl">
                {FOODS[currentFood].emoji}
              </div>
              {isCharging && (Math.abs(dragOffset.x) > 5 || Math.abs(dragOffset.y) > 5) && (
                <div className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 -translate-y-full">
                  <div className="h-0 w-0 border-l-[10px] border-r-[10px] border-b-[20px] border-l-transparent border-r-transparent border-b-black" />
                </div>
              )}
            </motion.div>
          </button>
          <div className="rounded-full bg-[#2a1d14]/85 px-2.5 py-1 text-[11px] font-bold text-white sm:px-3 sm:text-xs">
            向下拖拽蓄力并抛投
          </div>
        </div>

        {/* 右侧：打卡、投喂次数、广告 */}
        <div className="p-1.5 sm:p-2">
          <div className="mb-2 text-sm font-black">操作</div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleCheckIn}
              disabled={dailyData.checkedIn}
              className={`game-pill-btn w-full px-2.5 py-2 text-xs font-bold transition sm:px-3 sm:text-sm ${
                dailyData.checkedIn
                  ? 'cursor-not-allowed opacity-50 bg-gray-300'
                  : 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-600'
              }`}
            >
              {dailyData.checkedIn ? '✓ 已打卡' : '📋 打卡'}
            </button>

            <div className="rounded-lg bg-white/80 px-2 py-1.5 text-center sm:px-3 sm:py-2">
              <div className="text-xs text-gray-700">今日剩余</div>
              <div className="title-font text-xl font-bold text-[#2a1e15]">
                {getRemainingFeeds()}
              </div>
            </div>

            <button
              type="button"
              onClick={handleWatchAd}
              disabled={getRemainingAds() <= 0}
              className={`ad-button game-pill-btn w-full px-2.5 py-2 text-xs font-bold transition sm:px-3 sm:text-sm ${
                getRemainingAds() <= 0
                  ? 'cursor-not-allowed opacity-50 bg-gray-300'
                  : 'bg-gradient-to-r from-purple-400 to-pink-400 text-white hover:from-purple-500 hover:to-pink-500'
              }`}
            >
              📺 看广告
              <span className="text-[10px] block">
                今日剩余：{getRemainingAds()}/3
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 飞行的食物 */}
      <AnimatePresence>
        {flyingFoods.map((food) => (
          <div key={food.id} className="pointer-events-none absolute inset-0 z-[200]">
            {(() => {
              const edgeScale = 0.8;
              const peakScale = 1.0 + food.charge / 200;

              return (
                <>
                  <motion.div
                    initial={{
                      left: `${food.startX}%`,
                      bottom: `${food.startY}%`,
                      scale: edgeScale,
                      opacity: 0.8
                    }}
                    animate={{
                      left: `${food.targetX}%`,
                      bottom: `${food.targetY}%`,
                      scale: [edgeScale, peakScale, edgeScale],
                      rotate: 360 * (1 + food.charge / 20)
                    }}
                    transition={{
                      left: { duration: food.duration, ease: 'linear' },
                      bottom: { duration: food.duration, ease: 'linear' },
                      scale: { duration: food.duration, ease: 'easeInOut', times: [0, 0.5, 1] },
                      rotate: { duration: food.duration, ease: 'linear' }
                    }}
                    className="absolute flex h-12 w-12 items-center justify-center"
                    style={{ transform: 'translate(-50%, 50%)' }}
                  >
                    <div className="text-4xl">{FOODS[food.type].emoji}</div>
                  </motion.div>
                </>
              );
            })()}
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

      {/* 进化弹窗 */}
      <AnimatePresence>
        {evolutionPopup.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="absolute left-1/2 top-1/2 z-[400] -translate-x-1/2 -translate-y-1/2 w-[80%] max-w-sm"
          >
            <div className="rounded-2xl border-2 border-yellow-400 bg-gradient-to-b from-yellow-50 to-yellow-100 p-6 shadow-2xl text-center">
              <div className="text-5xl mb-3">✨</div>
              <h3 className="title-font mb-3 text-2xl font-bold text-yellow-700">
                {evolutionPopup.title}
              </h3>
              <p className="text-lg text-yellow-600 whitespace-pre-line">
                {evolutionPopup.message}
              </p>
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
