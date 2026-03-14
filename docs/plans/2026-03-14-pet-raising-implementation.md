# 宠物养成系统实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 为 iFEED 游戏添加宠物养成系统，包含双入口、天选宠物判定、每日打卡、广告机制、属性成长和模拟排名。

**Architecture:** 在现有 React + Vite + TypeScript 架构基础上，新增 PetRaisingScreen 等组件，复用 GameScreen 中的弹弓交互逻辑，使用 localStorage 进行数据持久化。

**Tech Stack:** React 19, TypeScript, Vite 6, Motion (Framer Motion), Tailwind CSS 4, localStorage

---

## Task 1: 扩展类型定义

**Files:**
- Modify: `src/types.ts`

**Step 1: 添加新接口**

在 `src/types.ts` 末尾添加以下接口：

```typescript
// 玩家基础数据
export interface PlayerData {
  playerId: string;
  selectedProvince: string;
  chosenPet: {
    animalType: AnimalType | null;
    feedCount: number;
    strength: number;
    customName: string;
  } | null;
}

// 养成系统每日数据
export interface PetDailyData {
  date: string;
  checkedIn: boolean;
  feedCount: number;
  adCount: number;
}

// 排名模拟数据
export interface RankingData {
  rank: number;
  petName: string;
  province: string;
  strength: number;
}

// 省份列表（新增）
export const PROVINCES = [
  '北京', '上海', '广东', '江苏', '浙江', '山东',
  '河南', '四川', '湖北', '湖南', '福建', '安徽',
  '河北', '江西', '重庆', '辽宁', '云南', '陕西',
  '天津', '贵州', '山西', '吉林', '广西', '新疆'
] as const;

export type ProvinceType = typeof PROVINCES[number];
```

**Step 2: 验证 TypeScript 编译**

运行: `npm run lint`
预期: 无类型错误

**Step 3: 提交**

```bash
git add src/types.ts
git commit -m "feat: add pet raising system types"
```

---

## Task 2: 创建 localStorage 工具函数

**Files:**
- Create: `src/utils/storage.ts`

**Step 1: 创建工具模块**

```typescript
import { PlayerData, PetDailyData, ProvinceType, AnimalType } from '../types';

const PLAYER_KEY = 'ifeed_player';
const DAILY_KEY = 'ifeed_daily';

// 生成随机玩家ID
export const generatePlayerId = (): string => {
  return `player_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
};

// 获取玩家数据
export const getPlayerData = (): PlayerData | null => {
  try {
    const data = localStorage.getItem(PLAYER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

// 保存玩家数据
export const savePlayerData = (data: PlayerData): void => {
  localStorage.setItem(PLAYER_KEY, JSON.stringify(data));
};

// 获取每日数据
export const getDailyData = (): PetDailyData => {
  try {
    const data = localStorage.getItem(DAILY_KEY);
    if (!data) return initDailyData();
    return JSON.parse(data);
  } catch {
    return initDailyData();
  }
};

// 保存每日数据
export const saveDailyData = (data: PetDailyData): void => {
  localStorage.setItem(DAILY_KEY, JSON.stringify(data));
};

// 初始化每日数据
const initDailyData = (): PetDailyData => {
  const today = getTodayDate();
  return {
    date: today,
    checkedIn: false,
    feedCount: 0,
    adCount: 0
  };
};

// 获取今天日期
export const getTodayDate = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 检查是否是新的一天
export const isNewDay = (): boolean => {
  const dailyData = getDailyData();
  return dailyData.date !== getTodayDate();
};

// 重置每日数据
export const resetDailyData = (): void => {
  const newData = initDailyData();
  saveDailyData(newData);
};

// 更新动物投喂次数
export const updateAnimalFeedCount = (animalType: AnimalType): void => {
  const playerData = getPlayerData();
  if (!playerData?.chosenPet) {
    // 首次初始化
    const newPlayer: PlayerData = {
      playerId: playerData?.playerId || generatePlayerId(),
      selectedProvince: playerData?.selectedProvince || PROVINCES[0],
      chosenPet: {
        animalType,
        feedCount: 1,
        strength: 0,
        customName: ''
      }
    };
    savePlayerData(newPlayer);
    return;
  }

  // 更新已有天选宠物的计数
  if (playerData.chosenPet.animalType === animalType) {
    playerData.chosenPet.feedCount += 1;
    savePlayerData(playerData);
  }
};

// 设置天选宠物（达到100次时）
export const setChosenPet = (animalType: AnimalType, customName: string): void => {
  const playerData = getPlayerData() || {
    playerId: generatePlayerId(),
    selectedProvince: PROVINCES[0],
    chosenPet: null
  };

  playerData.chosenPet = {
    animalType,
    feedCount: 100,
    strength: 0,
    customName
  };

  savePlayerData(playerData);
};

// 打卡
export const checkInDaily = (): void => {
  const dailyData = getDailyData();
  dailyData.checkedIn = true;
  dailyData.feedCount = 3;
  saveDailyData(dailyData);
};

// 使用投喂次数
export const consumeFeedCount = (): void => {
  const dailyData = getDailyData();
  dailyData.feedCount -= 1;
  saveDailyData(dailyData);
};

// 获取剩余投喂次数
export const getRemainingFeeds = (): number => {
  const dailyData = getDailyData();
  return dailyData.feedCount;
};

// 使用广告次数
export const consumeAdCount = (): void => {
  const dailyData = getDailyData();
  dailyData.adCount += 1;
  dailyData.feedCount += 1;
  saveDailyData(dailyData);
};

// 获取广告剩余次数
export const getRemainingAds = (): number => {
  const dailyData = getDailyData();
  return 3 - dailyData.adCount;
};
```

**Step 2: 验证 TypeScript 编译**

运行: `npm run lint`
预期: 无类型错误

**Step 3: 提交**

```bash
git add src/utils/storage.ts
git commit -m "feat: add localStorage utility functions for pet raising"
```

---

## Task 3: 修改 WelcomeScreen 为双入口

**Files:**
- Modify: `src/components/WelcomeScreen.tsx`

**Step 1: 修改组件为双卡片布局**

将 WelcomeScreen.tsx 的内容替换为：

```typescript
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
```

**Step 2: 验证编译**

运行: `npm run lint`
预期: 无错误

**Step 3: 提交**

```bash
git add src/components/WelcomeScreen.tsx
git commit -m "feat: update WelcomeScreen to dual-entry layout with province selection"
```

---

## Task 4: 创建无天选宠物状态页面

**Files:**
- Create: `src/components/EmptyPetScreen.tsx`

**Step 1: 创建空状态组件**

```typescript
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
```

**Step 2: 验证编译**

运行: `npm run lint`
预期: 无错误

**Step 3: 提交**

```bash
git add src/components/EmptyPetScreen.tsx
git commit -m "feat: add EmptyPetScreen component for no chosen pet state"
```

---

## Task 5: 创建排行榜组件

**Files:**
- Create: `src/components/RankingPanel.tsx`

**Step 1: 创建排名面板组件**

```typescript
import { AnimatePresence, motion } from 'motion/react';

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

export function RankingPanel({ province, yourRank, yourPetName }: RankingPanelProps) {
  return (
    <div className="absolute left-0 right-0 top-0 z-[150] max-h-[60vh] overflow-y-auto bg-white/95 backdrop-blur-sm">
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="title-font text-xl font-bold text-[#3a2612]">
            🏆 排行榜 - {province}
          </h3>
          <button
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
```

**Step 2: 验证编译**

运行: `npm run lint`
预期: 无错误

**Step 3: 提交**

```bash
git add src/components/RankingPanel.tsx
git commit -m "feat: add RankingPanel component with mock data"
```

---

## Task 6: 创建 PetRaisingScreen 主组件（基础结构）

**Files:**
- Create: `src/components/PetRaisingScreen.tsx`

**Step 1: 创建组件基础结构**

```typescript
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AnimalEntity, FoodType, FOODS, ANIMALS, AnimalType, PlayerData, PetDailyData } from '../types';
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
            </motion.div>
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
```

**Step 2: 验证编译**

运行: `npm run lint`
预期: 无错误

**Step 3: 提交**

```bash
git add src/components/PetRaisingScreen.tsx
git commit -m "feat: add PetRaisingScreen component with basic layout"
```

---

## Task 7: 修改 App.tsx 添加养成交付状态

**Files:**
- Modify: `src/App.tsx`

**Step 1: 更新状态机**

```typescript
import { useState } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { GameScreen } from './components/GameScreen';
import { ResultScreen } from './components/ResultScreen';
import { PetRaisingScreen } from './components/PetRaisingScreen';
import { GameResult } from './types';
import { ProvinceType } from './types';

type Phase = 'welcome' | 'playing_adventure' | 'playing_raising' | 'result';

export default function App() {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [province, setProvince] = useState<ProvinceType>('广东');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [result, setResult] = useState<GameResult | null>(null);

  const handleStartAdventure = (nextProvince: ProvinceType, nextGender: string) => {
    setProvince(nextProvince);
    setGender(nextGender as 'male' | 'female');
    setResult(null);
    setPhase('playing_adventure');
  };

  const handleStartRaising = (nextProvince: ProvinceType, nextGender: string) => {
    setProvince(nextProvince);
    setGender(nextGender as 'male' | 'female');
    setResult(null);
    setPhase('playing_raising');
  };

  const handleGameOver = (gameResult: GameResult) => {
    setResult(gameResult);
    setPhase('result');
  };

  const handleWin = (gameResult: GameResult) => {
    setResult(gameResult);
    setPhase('result');
  };

  const handleBackToWelcome = () => {
    setResult(null);
    setPhase('welcome');
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[var(--game-bg)] px-0 sm:px-6">
      <div className="relative mx-auto h-full w-full max-w-[440px] overflow-hidden bg-[var(--game-bg)] sm:my-4 sm:h-[calc(100%-2rem)] sm:rounded-[30px] sm:border sm:border-black/20 sm:shadow-[0_14px_36px_rgba(0,0,0,0.18)]">
        {phase === 'welcome' && (
          <WelcomeScreen
            onStart={handleStartAdventure}
          />
        )}

        {phase === 'playing_adventure' && (
          <GameScreen onGameOver={handleGameOver} onWin={handleWin} />
        )}

        {phase === 'playing_raising' && (
          <PetRaisingScreen
            onBack={handleBackToWelcome}
            onGoToAdventure={handleStartAdventure}
          />
        )}

        {phase === 'result' && (
          <ResultScreen
            result={result}
            province={province}
            gender={gender}
            onRestart={handleStartAdventure}
            onBackToWelcome={handleBackToWelcome}
          />
        )}
      </div>
    </div>
  );
}
```

**Step 2: 验证编译**

运行: `npm run lint`
预期: 无错误

**Step 3: 提交**

```bash
git add src/App.tsx
git commit -m "feat: update App.tsx to support pet raising phase"
```

---

## Task 8: 在 GameScreen 中集成天选宠物判定逻辑

**Files:**
- Modify: `src/components/GameScreen.tsx`

**Step 1: 修改投喂成功处理函数**

在 `handleHit` 函数中添加天选宠物判定逻辑：

```typescript
// 在文件顶部导入
import {
  updateAnimalFeedCount,
  setChosenPet
} from '../utils/storage';

// 修改 handleHit 函数，在成功投喂后添加
const handleHit = (animalId: string, foodType: FoodType) => {
  // ... 现有逻辑保持不变 ...

  // 新增：更新动物投喂统计
  updateAnimalFeedCount(animal.type);

  // 新增：检查是否达到100次，设置天选宠物
  const playerData = getPlayerData(); // 需要导入 getPlayerData
  if (playerData?.chosenPet?.animalType === animal.type) {
    // 已经是天选宠物，更新计数
    updateAnimalFeedCount(animal.type);
  } else if (!playerData?.chosenPet) {
    // 没有天选宠物，检查是否达到100次
    const allFeedCounts = JSON.parse(localStorage.getItem('animal_feed_counts') || '{}');
    allFeedCounts[animal.type] = (allFeedCounts[animal.type] || 0) + 1;
    localStorage.setItem('animal_feed_counts', JSON.stringify(allFeedCounts));

    if (allFeedCounts[animal.type] >= 100) {
      const firstAnimal = animal.type; // 这是最先达到100次的动物
      setChosenPet(firstAnimal, ANIMALS[firstAnimal].name);
    }
  }

  // ... 其余逻辑不变
  showFeedback(feedbackText, feedbackX, feedbackY);
};
```

**Step 2: 验证编译**

运行: `npm run lint`
预期: 无错误

**Step 3: 提交**

```bash
git add src/components/GameScreen.tsx
git commit -m "feat: integrate chosen pet detection in GameScreen"
```

---

## Task 9: 在 PetRaisingScreen 中添加弹弓投喂功能

**Files:**
- Modify: `src/components/PetRaisingScreen.tsx`

**Step 1: 添加弹弓交互逻辑**

在 PetRaisingScreen 中添加投喂逻辑，复用 GameScreen 中的弹弓机制：

```typescript
// 在组件内部添加状态
const [isCharging, setIsCharging] = useState(false);
const [chargePercent, setChargePercent] = useState(0);
const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
const [flyingFoods, setFlyingFoods] = useState<{
  id: string;
  type: FoodType;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  duration: number;
}[]>([]);
const [feedbackFoods, setFeedbackFoods] = useState<{ id: string; text: string; x: number; y: number }[]>([]);

const gameAreaRef = useRef<HTMLDivElement>(null);
const chargeButtonRef = useRef<HTMLButtonElement>(null);
const startPosRef = useRef<{ x: number; y: number } | null>(null);

// 添加食物选择状态（默认选中第一种）
const [currentFood, setCurrentFood] = useState<FoodType>('carrot');

// 投喂参数（复用 GameScreen 的值）
const maxDragDistance = 120;
const forceMultiplierX = 3.0;
const forceMultiplierY = 4.8;

const getThrowVector = (dx: number, dy: number) => {
  const chargeRatio = Math.min(Math.max(dy / maxDragDistance, 0), 1);
  const weightedDx = dx * chargeRatio;
  return {
    throwVecX: -weightedDx * forceMultiplierX,
    throwVecY: -dy * forceMultiplierY
  };
};

// 添加弹弓拖动处理函数
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
  const { throwVecX, throwVecY } = getThrowVector(dragOffset.x, dragOffset.y);

  const targetPxX = spawnPxX + throwVecX;
  const targetPxY = spawnPxY + throwVecY;

  const foodType = currentFood;
  const charge = Math.min((dragOffset.y / maxDragDistance) * 100, 100);

  const newFood = {
    id: `food_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type: foodType,
    startX: (spawnPxX / gameRect.width) * 100,
    startY: ((gameRect.height - spawnPxY) / gameRect.height) * 100,
    targetX: (targetPxX / gameRect.width) * 100,
    targetY: ((gameRect.height - targetPxY) / gameRect.height) * 100,
    duration: 0.8,
    charge
  };

  setFlyingFoods((prev) => [...prev, newFood]);

  // 扣除投喂次数
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

// 在 return 中添加弹弓区域
{/* 弹弓投喂区域 - 底部中央 */}
<div
  ref={gameAreaRef}
  className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-[calc(5rem+env(safe-area-inset-bottom))]"
>
  {/* 食物选择器 */}
  <div className="absolute bottom-32 left-4 z-[110]">
    <div className="mb-2 text-sm font-bold text-[#3a2612]">选择食物</div>
    <div className="flex gap-2">
      {['carrot', 'bug', 'bone', 'greens', 'shrimp', 'feed'] as FoodType[].map((food) => (
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
```

**Step 2: 验证编译**

运行: `npm run lint`
预期: 无错误

**Step 3: 提交**

```bash
git add src/components/PetRaisingScreen.tsx
git commit -m "feat: add slingshot feeding logic to PetRaisingScreen"
```

---

## Task 10: 添加形态升级和属性增长逻辑

**Files:**
- Modify: `src/components/PetRaisingScreen.tsx`

**Step 1: 添加投喂成功处理函数**

在 PetRaisingScreen 中添加属性增长和形态升级逻辑：

```typescript
// 在组件内添加处理飞行动画结束的 useEffect
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

// 添加 processedFoodIdsRef
const processedFoodIdsRef = useRef<Set<string>>(new Set());

// 添加投喂成功处理函数
const handleFeedingSuccess = () => {
  if (!playerData?.chosenPet) return;

  const previousStrength = playerData.chosenPet.strength;
  const newStrength = previousStrength + 5;

  // 更新强壮度
  playerData.chosenPet.strength = newStrength;
  savePlayerData(playerData);
  setPlayerData({ ...playerData });

  // 显示漂浮反馈
  showFeedbackFeed('+5 强壮度', 50, 45);

  // 检查形态升级
  const previousForm = getFormName(previousStrength);
  const newForm = getFormName(newStrength);

  if (previousForm !== newForm) {
    // 形态变化，显示弹窗
    let title = '';
    let message = '';

    if (newStrength >= 1000) {
      title = '🏆 超级无敌！';
      message = `恭喜！你的${playerData.chosenPet.customName}进化为超级无敌大肌肉形态！\n解锁称号：${playerData.selectedProvince}最强${ANIMALS[playerData.chosenPet.animalType].name}！`;
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
```

**Step 2: 验证编译**

运行: `npm run lint`
预期: 无错误

**Step 3: 提交**

```bash
git add src/components/PetRaisingScreen.tsx
git commit -m "feat: add strength growth and form evolution logic"
```

---

## Task 11: 修复导入和类型问题

**Files:**
- Modify: `src/components/GameScreen.tsx`
- Modify: `src/components/PetRaisingScreen.tsx`

**Step 1: 修复缺失的导入**

在 GameScreen.tsx 中添加：
```typescript
import { getPlayerData } from '../utils/storage';
```

在 PetRaisingScreen.tsx 中添加所有需要的导入：
```typescript
import { getPlayerData, setChosenPet, ANIMALS } from '../utils/storage';
```

**Step 2: 验证编译**

运行: `npm run lint`
预期: 无错误

**Step 3: 提交**

```bash
git add src/components/GameScreen.tsx src/components/PetRaisingScreen.tsx
git commit -m "fix: add missing imports and fix type issues"
```

---

## Task 12: 测试完整功能流程

**Step 1: 启动开发服务器**

运行: `npm run dev`
预期: 服务器在 http://localhost:3000 启动

**Step 2: 测试清单**

- [ ] 欢迎页显示两个入口卡片
- [ ] 可以选择省份
- [ ] 点击闯关模式进入 GameScreen
- [ ] 点击养成交付进入 PetRaisingScreen（无宠物时显示 EmptyPetScreen）
- [ ] 点击打卡按钮获得3次投喂机会
- [ ] 打卡后按钮显示"已打卡"且不可点击
- [ ] 点击广告按钮模拟播放3秒后获得+1次投喂
- [ ] 广告达到3次后按钮不可点击
- [ ] 弹弓拖动显示蓄力条和方向
- [ ] 投喂成功后强壮度+5
- [ ] 显示"+5 强壮度"漂浮动画
- [ ] 形态从病怏怏→匀称时显示进化弹窗
- [ ] 形态从匀称→肌肉时显示进化弹窗
- [ ] 形态从肌肉→超级肌肉时显示进化弹窗和称号解锁
- [ ] 自定义宠物名称保存成功
- [ ] 排行榜模拟数据正确显示
- [ ] localStorage 数据刷新后保持

**Step 3: 创建测试记录文档**

如果测试通过，记录测试结果：
- 所有功能正常工作
- 无 TypeScript 错误
- 无控制台报错

**Step 4: 提交最终代码**

```bash
git add .
git commit -m "test: complete pet raising system implementation with all features working"
```

---

## 验收标准

### 功能完整性
- ✅ 双入口可正常切换
- ✅ 天选宠物判定正确（闯关100次）
- ✅ 无天选宠物时显示引导页
- ✅ 每日打卡机制工作正常
- ✅ 广告模拟次数限制（上限3次）
- ✅ 弹弓投喂机制正常工作
- ✅ 强壮度+5正确累计
- ✅ 形态升级弹窗正确触发
- ✅ 称号在1000强壮度时解锁
- ✅ 自定义名称保存和显示
- ✅ 排名模拟数据正确展示
- ✅ localStorage 数据持久化正确

### 代码质量
- ✅ TypeScript 类型检查通过（npm run lint）
- ✅ 无 ESLint 错误
- ✅ 组件可复用和可维护
- ✅ 代码注释清晰

### 用户体验
- ✅ 动画流畅（使用 Motion）
- ✅ 反馈及时（漂浮、弹窗）
- ✅ 界面响应式适配移动端
- ✅ 操作直观（弹弓拖动、按钮状态）

---

## 后续扩展点（MVP 之后）

- [ ] 集成真实广告 SDK（如穿山甲）
- [ ] 后端数据库支持多玩家真实排名
- [ ] 形态升级时的光效和粒子动画
- [ ] 多宠物系统（可切换天选宠物）
- [ ] 宠物装饰系统（帽子、配饰）
- [ ] 社交功能（分享、好友列表）
- [ ] 每日任务系统
- [ ] 成就系统
