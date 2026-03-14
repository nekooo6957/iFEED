import { PointerEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ALL_FOODS,
  ANIMALS,
  AnimalEntity,
  FoodType,
  FOODS,
  GameResult,
  MAX_LEVEL,
} from '../types';
import {
  createHungerValue,
  generateSolvableInventory,
  getLevelConfig,
  hasAnyValidFeedAction,
} from '../logic/levelGenerator';
import { getPlayerData, updateAnimalFeedCount, setChosenPet } from '../utils/storage';

const random = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const uid = () => Math.random().toString(36).slice(2, 11);

const getHitScaleByY = (level: number, globalScale: number) => {
  if (level === 4) return 1.2 * globalScale;
  return 1.3 * globalScale;
};

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

interface GameScreenProps {
  onGameOver: (result: GameResult) => void;
  onWin: (result: GameResult) => void;
}

type ToolMode = 'cure' | 'biscuit' | null;

const buildEmptyInventory = (): Record<FoodType, number> =>
  ALL_FOODS.reduce(
    (acc, food) => {
      acc[food] = 0;
      return acc;
    },
    {} as Record<FoodType, number>,
  );

export function GameScreen({ onGameOver, onWin }: GameScreenProps) {
  const [level, setLevel] = useState(1);
  const [animals, setAnimals] = useState<AnimalEntity[]>([]);
  const [foodInventory, setFoodInventory] = useState<Record<FoodType, number>>(buildEmptyInventory());
  const [currentFood, setCurrentFood] = useState<FoodType>('carrot');
  const [totalHunger, setTotalHunger] = useState(0);
  const [adUsedThisLevel, setAdUsedThisLevel] = useState(false);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [pendingTool, setPendingTool] = useState<ToolMode>(null);

  const [isCharging, setIsCharging] = useState(false);
  const [chargePercent, setChargePercent] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [flyingFoods, setFlyingFoods] = useState<FlyingFood[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [levelBanner, setLevelBanner] = useState<string | null>(null);

  const [gameDimensions, setGameDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1000,
    height: typeof window !== 'undefined' ? window.innerHeight : 1000,
  });

  const globalScale = Math.max(0.85, 1 - (level - 1) * 0.05);
  const baseHitRadiusPct = 9.8;
  const foodHitRadiusPct = 2.5;
  const visualScaleMultiplier = (gameDimensions.width * (baseHitRadiusPct / 100) * 2) / 60;
  const maxDragDistance = 120;
  const xDeadZonePx = 8;
  const forceMultiplierX = 3.0;
  const forceMultiplierY = 4.8;

  const levelConfig = getLevelConfig(level);
  const unlockedFoods = levelConfig.unlockedFoods;

  const remainingHunger = useMemo(
    () => animals.reduce((sum, animal) => sum + Math.max(0, animal.hungerCurrent), 0),
    [animals],
  );
  const clearedHunger = Math.max(0, totalHunger - remainingHunger);
  const progressPercent = totalHunger > 0 ? Math.round((clearedHunger / totalHunger) * 100) : 0;
  const sickCount = useMemo(
    () => animals.filter((animal) => animal.status === 'sick').length,
    [animals],
  );
  const totalFoodCount = useMemo(
    () => ALL_FOODS.reduce((sum, food) => sum + foodInventory[food], 0),
    [foodInventory],
  );

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const chargeButtonRef = useRef<HTMLButtonElement>(null);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const animalsRef = useRef<AnimalEntity[]>([]);
  const processedFoodIdsRef = useRef<Set<string>>(new Set());
  const feedbackTimerRef = useRef<number | null>(null);
  const levelBannerTimerRef = useRef<number | null>(null);
  const levelTransitioningRef = useRef(false);
  const gameEndedRef = useRef(false);

  useEffect(() => {
    animalsRef.current = animals;
  }, [animals]);

  const showFeedback = (text: string, x: number, y: number) => {
    setFeedback({ id: uid(), text, x, y });
    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
    }, 1200);
  };

  const buildAnimals = (targetLevel: number): AnimalEntity[] => {
    const config = getLevelConfig(targetLevel);

    if (config.fixedPositions?.length) {
      return config.fixedPositions.map((pos) => {
        const type = random(config.animalPool);
        const hunger = createHungerValue(config.hungerRange);
        return {
          id: uid(),
          type,
          x: pos.x,
          y: pos.y,
          status: 'hungry',
          hungerMax: hunger,
          hungerCurrent: hunger,
        };
      });
    }

    const minRow = 40;
    const maxRow = 80;
    let minCol = 20;
    let maxCol = 80;
    if (config.level === 4) {
      minCol = 15;
      maxCol = 85;
    }

    const getRowPos = (i: number) =>
      config.gridSize === 1
        ? (minRow + maxRow) / 2
        : minRow + (i * (maxRow - minRow)) / (config.gridSize - 1);
    const getColPos = (j: number) =>
      config.gridSize === 1
        ? 50
        : minCol + (j * (maxCol - minCol)) / (config.gridSize - 1);

    const slots = Array.from({ length: config.animalCount }, (_, i) => i);
    for (let i = slots.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    const generated: AnimalEntity[] = [];
    for (let i = 0; i < config.animalCount; i += 1) {
      const slot = slots[i];
      const row = Math.floor(slot / config.gridSize);
      const col = slot % config.gridSize;
      const type = random(config.animalPool);
      const hunger = createHungerValue(config.hungerRange);
      generated.push({
        id: uid(),
        type,
        x: getColPos(col),
        y: getRowPos(row),
        status: 'hungry',
        hungerMax: hunger,
        hungerCurrent: hunger,
      });
    }
    return generated;
  };

  const startLevel = (targetLevel: number) => {
    const config = getLevelConfig(targetLevel);
    levelTransitioningRef.current = false;
    setLevel(config.level);
    setAdUsedThisLevel(false);
    setSelectedAnimalId(null);
    setPendingTool(null);
    setFlyingFoods([]);
    processedFoodIdsRef.current.clear();
    setChargePercent(0);
    setDragOffset({ x: 0, y: 0 });
    setIsCharging(false);

    const newAnimals = buildAnimals(config.level);
    const inventory = generateSolvableInventory(newAnimals, config);
    const hungerTotal = newAnimals.reduce((sum, animal) => sum + animal.hungerCurrent, 0);
    const firstAvailable =
      config.unlockedFoods.find((food) => inventory[food] > 0) ?? config.unlockedFoods[0];

    setAnimals(newAnimals);
    setFoodInventory(inventory);
    setTotalHunger(hungerTotal);
    setCurrentFood(firstAvailable);

    if (levelBannerTimerRef.current) {
      window.clearTimeout(levelBannerTimerRef.current);
    }
    setLevelBanner(`LEVEL ${config.level}`);
    levelBannerTimerRef.current = window.setTimeout(() => setLevelBanner(null), 900);
  };

  const triggerGameOver = (reason: string) => {
    if (gameEndedRef.current) return;
    gameEndedRef.current = true;
    onGameOver({
      isWin: false,
      reason,
      levelReached: level,
    });
  };

  const triggerGameWin = () => {
    if (gameEndedRef.current) return;
    gameEndedRef.current = true;
    onWin({
      isWin: true,
      levelReached: MAX_LEVEL,
    });
  };

  useEffect(() => {
    gameEndedRef.current = false;
    startLevel(1);
    return () => {
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
      if (levelBannerTimerRef.current) {
        window.clearTimeout(levelBannerTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!gameAreaRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setGameDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(gameAreaRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (foodInventory[currentFood] > 0) return;
    const nextAvailable = unlockedFoods.find((food) => foodInventory[food] > 0);
    if (nextAvailable) {
      setCurrentFood(nextAvailable);
    }
  }, [currentFood, foodInventory, unlockedFoods]);

  useEffect(() => {
    if (levelTransitioningRef.current || gameEndedRef.current) return;
    if (totalHunger <= 0) return;

    const allCleared = animals.length === 0 || animals.every((animal) => animal.hungerCurrent <= 0);
    if (!allCleared) return;

    levelTransitioningRef.current = true;
    showFeedback('本关完成', 50, 86);
    setLevelBanner('CLEAR!');

    window.setTimeout(() => {
      if (level >= MAX_LEVEL) {
        triggerGameWin();
        return;
      }
      startLevel(level + 1);
    }, 1000);
  }, [animals, level, totalHunger]);

  useEffect(() => {
    if (!animals.length || levelTransitioningRef.current || gameEndedRef.current) return;
    if (isCharging || flyingFoods.length > 0) return;
    if (animals.every((animal) => animal.hungerCurrent <= 0)) return;

    if (totalFoodCount <= 0) {
      triggerGameOver('食物耗尽，仍有动物未喂饱');
      return;
    }

    const hasValidAction = hasAnyValidFeedAction(animals, foodInventory);
    if (!hasValidAction && adUsedThisLevel) {
      triggerGameOver('已进入死局：无可用食物且广告机会已用');
    }
  }, [animals, foodInventory, adUsedThisLevel, totalFoodCount, isCharging, flyingFoods.length]);

  const getVisualScale = () => {
    const hitScale = getHitScaleByY(level, globalScale);
    return hitScale * visualScaleMultiplier;
  };

  const getAnimalStyle = (animal: AnimalEntity) => {
    const zIndex = 100 - Math.floor(animal.y);
    return {
      left: `${animal.x}%`,
      bottom: `${animal.y}%`,
      transform: `translate(-50%, 50%) scale(${getVisualScale()})`,
      zIndex,
    };
  };

  const getThrowVector = (dx: number, dy: number) => {
    const chargeRatio = Math.min(Math.max(dy / maxDragDistance, 0), 1);
    const stableDx = Math.abs(dx) <= xDeadZonePx ? 0 : dx;
    // 轻拉时横向影响更小，避免“方向对但明显偏斜”
    const weightedDx = stableDx * chargeRatio;
    return {
      throwVecX: -weightedDx * forceMultiplierX,
      throwVecY: -dy * forceMultiplierY,
    };
  };

  const aimAngleDeg = (() => {
    if (!isCharging) return 0;
    const { throwVecX, throwVecY } = getThrowVector(dragOffset.x, dragOffset.y);
    // 0度表示正上方，与箭头默认朝上保持一致
    return (Math.atan2(throwVecX, -throwVecY || 0.0001) * 180) / Math.PI;
  })();

  const resetDrag = () => {
    setIsCharging(false);
    setChargePercent(0);
    setDragOffset({ x: 0, y: 0 });
    startPosRef.current = null;
  };

  const handlePointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (!gameAreaRef.current || !chargeButtonRef.current) return;
    if (foodInventory[currentFood] <= 0) {
      showFeedback('该食物已用完', 50, 20);
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    const gameRect = gameAreaRef.current.getBoundingClientRect();
    const buttonRect = chargeButtonRef.current.getBoundingClientRect();
    startPosRef.current = {
      x: buttonRect.left + buttonRect.width / 2 - gameRect.left,
      y: buttonRect.top + buttonRect.height / 2 - gameRect.top,
    };

    setIsCharging(true);
  };

  const handlePointerMove = (e: PointerEvent<HTMLButtonElement>) => {
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

  const handlePointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    if (!isCharging || !startPosRef.current || !gameAreaRef.current) {
      resetDrag();
      return;
    }

    e.currentTarget.releasePointerCapture(e.pointerId);

    if (foodInventory[currentFood] <= 0) {
      showFeedback('该食物已用完', 50, 20);
      resetDrag();
      return;
    }

    const gameRect = gameAreaRef.current.getBoundingClientRect();
    // 抛投使用固定发射点，避免“手当前位置 + 反向向量”的双重偏移导致歪斜
    const spawnPxX = startPosRef.current.x;
    const spawnPxY = startPosRef.current.y;
    const { throwVecX, throwVecY } = getThrowVector(dragOffset.x, dragOffset.y);

    const targetPxX = spawnPxX + throwVecX;
    const targetPxY = spawnPxY + throwVecY;

    const foodType = currentFood;
    const charge = Math.min((dragOffset.y / maxDragDistance) * 100, 100);
    const newFood: FlyingFood = {
      id: uid(),
      type: foodType,
      startX: (spawnPxX / gameRect.width) * 100,
      startY: ((gameRect.height - spawnPxY) / gameRect.height) * 100,
      targetX: (targetPxX / gameRect.width) * 100,
      targetY: ((gameRect.height - targetPxY) / gameRect.height) * 100,
      duration: 0.8,
      charge,
    };

    setFlyingFoods((prev) => [...prev, newFood]);

    let nextInventory = buildEmptyInventory();
    setFoodInventory((prev) => {
      nextInventory = { ...prev, [foodType]: Math.max(0, prev[foodType] - 1) };
      return nextInventory;
    });

    if (nextInventory[foodType] <= 0) {
      const nextAvailable = unlockedFoods.find((food) => nextInventory[food] > 0);
      if (nextAvailable) {
        setCurrentFood(nextAvailable);
      }
    }

    resetDrag();
  };

  const handleHit = (animalId: string, foodType: FoodType) => {
    let feedbackText = '命中';
    let feedbackX = 50;
    let feedbackY = 50;

    setAnimals((prev) => {
      const nextAnimals: AnimalEntity[] = [];

      for (const animal of prev) {
        if (animal.id !== animalId) {
          nextAnimals.push(animal);
          continue;
        }

        feedbackX = animal.x;
        feedbackY = animal.y;

        if (animal.hungerCurrent <= 0 || animal.status === 'full') {
          feedbackText = `${ANIMALS[animal.type].name}已经吃饱`;
          continue;
        }

        if (animal.status === 'sick') {
          feedbackText = `${ANIMALS[animal.type].name}生病了，吃不下`;
          nextAnimals.push(animal);
          continue;
        }

        const effect = ANIMALS[animal.type].foodEffects[foodType];
        if (!effect) {
          feedbackText = `${ANIMALS[animal.type].name}吃错了，生病`;
          nextAnimals.push({ ...animal, status: 'sick' });
          continue;
        }

        const nextHunger = Math.max(0, animal.hungerCurrent - effect);
        if (nextHunger <= 0) {
          feedbackText = `${ANIMALS[animal.type].name}吃饱了`;
          // 吃饱后直接从场上移除
          continue;
        }

        feedbackText = `${ANIMALS[animal.type].name} -${effect}`;
        nextAnimals.push({ ...animal, hungerCurrent: nextHunger, status: 'hungry' });

        // 更新动物投喂统计并检查天选宠物
        updateAnimalFeedCount(animal.type);
        const playerData = getPlayerData();
        if (!playerData?.chosenPet) {
          // 没有天选宠物，检查是否达到100次
          const allFeedCounts = JSON.parse(localStorage.getItem('animal_feed_counts') || '{}');
          allFeedCounts[animal.type] = (allFeedCounts[animal.type] || 0) + 1;
          localStorage.setItem('animal_feed_counts', JSON.stringify(allFeedCounts));

          if (allFeedCounts[animal.type] >= 100) {
            setChosenPet(animal.type, ANIMALS[animal.type].name);
            showFeedback('🎉 天选宠物诞生！', 50, 70);
          }
        }
      }

      return nextAnimals;
    });

    showFeedback(feedbackText, feedbackX, feedbackY);
  };

  const checkCollision = (food: FlyingFood) => {
    const { width, height } = gameDimensions;
    const aspectRatio = height / width;

    let closestAnimal: AnimalEntity | null = null;
    let minDist = Number.POSITIVE_INFINITY;

    for (const animal of animalsRef.current) {
      if (animal.hungerCurrent <= 0 || animal.status === 'full') continue;

      const scale = getHitScaleByY(level, globalScale);
      const effectiveHitRadius = baseHitRadiusPct * scale;
      const effectiveFoodRadius = foodHitRadiusPct * scale;
      const dx = animal.x - food.targetX;
      const dy = (animal.y - food.targetY) * aspectRatio;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < effectiveHitRadius + effectiveFoodRadius && dist < minDist) {
        minDist = dist;
        closestAnimal = animal;
      }
    }

    if (closestAnimal) {
      handleHit(closestAnimal.id, food.type);
      return;
    }

    if (food.targetY < 35) {
      showFeedback('落在前方太近', food.targetX, food.targetY);
      return;
    }
    if (food.targetY > 90) {
      showFeedback('飞过头顶', food.targetX, food.targetY);
      return;
    }
    showFeedback('未命中', food.targetX, food.targetY);
  };

  useEffect(() => {
    flyingFoods.forEach((food) => {
      if (processedFoodIdsRef.current.has(food.id)) return;
      processedFoodIdsRef.current.add(food.id);

      window.setTimeout(() => {
        checkCollision(food);
        setFlyingFoods((prev) => prev.filter((item) => item.id !== food.id));
        processedFoodIdsRef.current.delete(food.id);
      }, food.duration * 1000);
    });
  }, [flyingFoods, gameDimensions, level, globalScale]);

  const armTool = (tool: Exclude<ToolMode, null>) => {
    if (adUsedThisLevel) {
      showFeedback('本关道具机会已用', 50, 22);
      return;
    }

    if (pendingTool === tool) {
      setPendingTool(null);
      showFeedback('已取消道具选择', 50, 22);
      return;
    }

    setPendingTool(tool);
    showFeedback(tool === 'cure' ? '已选择救治针' : '已选择万能饼干', 50, 22);
  };

  const handleAnimalClick = (animal: AnimalEntity) => {
    setSelectedAnimalId(animal.id);

    if (!pendingTool) return;
    if (adUsedThisLevel) {
      showFeedback('本关道具机会已用', 50, 22);
      setPendingTool(null);
      return;
    }

    if (pendingTool === 'cure') {
      if (animal.status !== 'sick') {
        showFeedback('该动物未生病', animal.x, animal.y);
        return;
      }

      setAdUsedThisLevel(true);
      setPendingTool(null);
      setAnimals((prev) =>
        prev.map((item) =>
          item.id === animal.id
            ? { ...item, status: item.hungerCurrent <= 0 ? 'full' : 'hungry' }
            : item,
        ),
      );
      showFeedback('救治成功', animal.x, animal.y);
      return;
    }

    if (animal.hungerCurrent <= 0) {
      showFeedback('该动物已吃饱', animal.x, animal.y);
      return;
    }

    setAdUsedThisLevel(true);
    setPendingTool(null);
    setSelectedAnimalId(null);
    setAnimals((prev) => prev.filter((item) => item.id !== animal.id));
    showFeedback('喂饱成功', animal.x, animal.y);
  };

  return (
    <div
      ref={gameAreaRef}
      className="relative h-full w-full select-none overflow-hidden touch-none bg-gradient-to-b from-[#f8efdc] via-[#f4e5c8] to-[#ecd8b5] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-50 flex items-start justify-between gap-2 px-3 pb-2 pt-[calc(0.6rem+env(safe-area-inset-top))] sm:px-4">
        <div className="min-w-0 flex-1 px-1 py-1 font-bold sm:px-2">
          <div className="flex items-center justify-between text-sm sm:text-base">
            <span className="title-font text-base text-[#3a2612] sm:text-lg">第 {level} 关 / 4</span>
            <span className="text-xs text-gray-700 sm:text-sm">{progressPercent}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full border border-black/20 bg-black/10">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-gray-700 sm:text-sm">
            已消除饥饿值：{clearedHunger}/{totalHunger}
          </div>
        </div>
        <div className="px-1 py-1 text-right text-[#2a1e15] sm:px-2">
          <div className="text-sm font-black sm:text-base">🍱 {totalFoodCount}</div>
          <div className="text-xs sm:text-sm">🤒 {sickCount}</div>
        </div>
      </div>

      <AnimatePresence>
        {levelBanner && (
          <motion.div
            initial={{ y: -18, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -12, opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            className="pointer-events-none absolute left-1/2 top-[15%] z-[280] -translate-x-1/2 rounded-full border border-black/20 bg-white/90 px-5 py-2 shadow-[0_8px_18px_rgba(0,0,0,0.18)]"
          >
            <span className="title-font text-2xl text-[#3b260f]">{levelBanner}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {animals.map((animal) => {
        const config = ANIMALS[animal.type];
        const isSelected = selectedAnimalId === animal.id;
        const canEatCurrentFood = Boolean(config.foodEffects[currentFood]) && animal.hungerCurrent > 0;
        return (
          <button
            key={animal.id}
            type="button"
            onClick={() => handleAnimalClick(animal)}
            aria-label={`${config.name}，当前饥饿值${Math.max(0, animal.hungerCurrent)}`}
            className="absolute transition-all duration-200 hover:scale-[1.03] active:scale-95"
            style={getAnimalStyle(animal)}
          >
            <div className="relative flex flex-col items-center">
              <div
                className={`absolute -top-5 -right-5 h-7 min-w-7 rounded-full border px-2 text-xs font-black shadow-[0_4px_10px_rgba(0,0,0,0.15)] ${
                  animal.status === 'full'
                    ? 'border-green-700 bg-green-200 text-green-900'
                    : animal.status === 'sick'
                      ? 'border-rose-700 bg-rose-200 text-rose-900'
                      : 'border-black/30 bg-yellow-200 text-black'
                }`}
              >
                {animal.status === 'full' ? '饱' : animal.hungerCurrent}
              </div>

              {animal.status === 'sick' && (
                <div className="absolute -top-8 rounded-full border border-rose-700 bg-rose-100 px-2 text-xs font-bold text-rose-700">
                  生病
                </div>
              )}

              {canEatCurrentFood && (
                <div
                  className={`absolute -top-10 left-1/2 -translate-x-1/2 rounded-full border border-black/20 bg-white/95 px-1.5 text-sm shadow ${
                    animal.status === 'sick' ? 'opacity-45' : 'opacity-100'
                  }`}
                >
                  {FOODS[currentFood].emoji}
                </div>
              )}

              <div
                className={`text-6xl drop-shadow-lg transition-all ${
                  animal.status === 'full' ? 'opacity-70' : ''
                } ${isSelected ? 'scale-110' : 'animate-[pulse_2.2s_ease-in-out_infinite]'}`}
              >
                {config.emoji}
              </div>

              {isSelected && (
                <div className="pointer-events-none absolute -inset-3 rounded-full border-4 border-cyan-400/80" />
              )}

              <div className="mt-[-5px] h-4 w-12 rounded-full bg-black/20 blur-sm" />
            </div>
          </button>
        );
      })}

      <AnimatePresence>
        {flyingFoods.map((food) => (
          <div key={food.id} className="pointer-events-none absolute inset-0 z-[200]">
            {(() => {
              const baseScale = getVisualScale();
              const edgeScale = baseScale * 0.72;
              const peakScale = baseScale * (1.22 + food.charge / 420);

              return (
                <>
            <motion.div
              initial={{
                left: `${food.startX}%`,
                bottom: `${food.startY}%`,
                scale: edgeScale,
                opacity: 0.5,
              }}
              animate={{
                left: `${food.targetX}%`,
                bottom: `${food.targetY}%`,
                scale: edgeScale,
                opacity: 0.2,
              }}
              transition={{ duration: food.duration, ease: 'linear' }}
              className="absolute h-4 w-12 rounded-full bg-black blur-sm"
              style={{ transform: 'translate(-50%, 50%)' }}
            />
            <motion.div
              initial={{
                left: `${food.startX}%`,
                bottom: `${food.startY}%`,
                scale: edgeScale,
                rotate: 0,
              }}
              animate={{
                left: `${food.targetX}%`,
                bottom: `${food.targetY}%`,
                scale: [edgeScale, peakScale, edgeScale],
                rotate: 360 * (1 + food.charge / 20),
              }}
              transition={{
                left: { duration: food.duration, ease: 'linear' },
                bottom: { duration: food.duration, ease: 'linear' },
                scale: { duration: food.duration, ease: 'easeInOut', times: [0, 0.5, 1] },
                rotate: { duration: food.duration, ease: 'linear' },
              }}
              className="absolute flex h-12 w-12 items-center justify-center text-4xl"
              style={{ transform: 'translate(-50%, 50%)' }}
            >
              {FOODS[food.type].emoji}
            </motion.div>
                </>
              );
            })()}
          </div>
        ))}
      </AnimatePresence>

      <AnimatePresence>
        {feedback && (
          <motion.div
            key={feedback.id}
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -24, scale: 1.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="pointer-events-none absolute z-[300] whitespace-nowrap rounded-full border border-black/20 bg-white/92 px-3 py-1 text-sm font-black text-[#2f2012] shadow-[0_8px_18px_rgba(0,0,0,0.15)]"
            style={{ left: `${feedback.x}%`, bottom: `${feedback.y}%`, transform: 'translate(-50%, 0)' }}
          >
            {feedback.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-[calc(5rem+env(safe-area-inset-bottom))] left-0 right-0 z-[120] grid grid-cols-[1.05fr_auto_0.95fr] items-end gap-2 px-2 pt-3 sm:bottom-12 sm:gap-3 sm:px-4">
        <div className="p-1.5 sm:p-2">
          <div className="mb-2 text-sm font-black">食物库存</div>
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {unlockedFoods.map((food) => {
              const isSelected = currentFood === food;
              const count = foodInventory[food];
              return (
                <button
                  key={food}
                  type="button"
                  onClick={() => setCurrentFood(food)}
                  aria-label={`${FOODS[food].name}，剩余${count}`}
                  className={`min-h-[54px] rounded-xl border px-1 py-1 text-center transition sm:min-h-[60px] sm:px-2 sm:py-2 ${
                    isSelected ? 'border-cyan-500 bg-cyan-50 shadow-[0_4px_12px_rgba(14,165,233,0.28)]' : 'border-black/15 bg-white/90'
                  } ${count <= 0 ? 'opacity-40 grayscale-[0.2]' : ''}`}
                >
                  <div className="text-xl sm:text-2xl">{FOODS[food].emoji}</div>
                  <div className="text-xs font-bold">{count}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 px-1 py-1.5">
          {isCharging && (
            <div className="w-28 overflow-hidden rounded-full border border-black bg-gray-200">
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
                rotate: isCharging ? aimAngleDeg : 0,
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

        <div className="p-1.5 sm:p-2">
          <div className="mb-2 text-sm font-black">道具</div>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => armTool('cure')}
              aria-label="选择救治针"
              className={`game-pill-btn w-full px-2.5 py-2 text-xs font-bold transition sm:px-3 sm:text-sm ${
                pendingTool === 'cure'
                  ? 'border-cyan-500 bg-cyan-100'
                  : 'border-black/20 bg-white/90 hover:bg-white'
              } ${adUsedThisLevel ? 'cursor-not-allowed opacity-50' : ''}`}
              disabled={adUsedThisLevel}
            >
              💉 救治针
            </button>
            <button
              type="button"
              onClick={() => armTool('biscuit')}
              aria-label="选择万能饼干"
              className={`game-pill-btn w-full px-2.5 py-2 text-xs font-bold transition sm:px-3 sm:text-sm ${
                pendingTool === 'biscuit'
                  ? 'border-cyan-500 bg-cyan-100'
                  : 'border-black/20 bg-white/90 hover:bg-white'
              } ${adUsedThisLevel ? 'cursor-not-allowed opacity-50' : ''}`}
              disabled={adUsedThisLevel}
            >
              🍪 万能饼干
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
