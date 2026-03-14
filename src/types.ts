export type FoodType = 'carrot' | 'bug' | 'bone' | 'greens' | 'shrimp' | 'feed';
export type AnimalType =
  | 'frog'
  | 'chicken'
  | 'dog'
  | 'sheep'
  | 'turtle'
  | 'cat'
  | 'rabbit'
  | 'fish';

export type AnimalStatus = 'hungry' | 'sick' | 'full';

export interface FoodItem {
  type: FoodType;
  name: string;
  emoji: string;
  color: string;
}

export interface AnimalConfig {
  type: AnimalType;
  name: string;
  emoji: string;
  foodEffects: Partial<Record<FoodType, 1 | 2>>;
}

export interface AnimalEntity {
  id: string;
  type: AnimalType;
  x: number; // 0-100% (left to right)
  y: number; // 0-100% (bottom to top)
  status: AnimalStatus;
  hungerMax: number;
  hungerCurrent: number;
}

export interface LevelConfig {
  level: number;
  name: string;
  animalCount: number;
  gridSize: number;
  fixedPositions?: Array<{ x: number; y: number }>;
  animalPool: AnimalType[];
  unlockedFoods: FoodType[];
  hungerRange: [number, number];
  surplusRatio: number;
  trapFoodMax: number;
}

export interface GameResult {
  isWin: boolean;
  reason?: string;
  levelReached: number;
}

export const REGIONS = [
  '华北农场',
  '华东农场',
  '华南农场',
  '西南牧场',
  '东北牧场',
  '西北牧场',
];

export const FOODS: Record<FoodType, FoodItem> = {
  carrot: { type: 'carrot', name: '胡萝卜', emoji: '🥕', color: 'bg-orange-400' },
  bug: { type: 'bug', name: '虫子', emoji: '🐛', color: 'bg-lime-600' },
  bone: { type: 'bone', name: '肉骨头', emoji: '🦴', color: 'bg-stone-300' },
  greens: { type: 'greens', name: '青菜', emoji: '🥬', color: 'bg-green-500' },
  shrimp: { type: 'shrimp', name: '虾', emoji: '🦐', color: 'bg-red-400' },
  feed: { type: 'feed', name: '饲料', emoji: '🫘', color: 'bg-yellow-500' },
};

export const ANIMALS: Record<AnimalType, AnimalConfig> = {
  frog: {
    type: 'frog',
    name: '青蛙',
    emoji: '🐸',
    foodEffects: { bug: 2, shrimp: 1 },
  },
  chicken: {
    type: 'chicken',
    name: '小鸡',
    emoji: '🐔',
    foodEffects: { bug: 1, feed: 2 },
  },
  dog: {
    type: 'dog',
    name: '小狗',
    emoji: '🐶',
    foodEffects: { bone: 1, shrimp: 1 },
  },
  sheep: {
    type: 'sheep',
    name: '羊',
    emoji: '🐑',
    foodEffects: { carrot: 1, greens: 1 },
  },
  turtle: {
    type: 'turtle',
    name: '乌龟',
    emoji: '🐢',
    foodEffects: { shrimp: 2, feed: 1 },
  },
  cat: {
    type: 'cat',
    name: '小猫',
    emoji: '🐱',
    foodEffects: { bone: 2, shrimp: 1 },
  },
  rabbit: {
    type: 'rabbit',
    name: '兔子',
    emoji: '🐰',
    foodEffects: { carrot: 2, greens: 1 },
  },
  fish: {
    type: 'fish',
    name: '鱼',
    emoji: '🐟',
    foodEffects: { bug: 2, shrimp: 2, feed: 1 },
  },
};

export const LEVEL_CONFIG: LevelConfig[] = [
  {
    level: 1,
    name: '新手教学',
    animalCount: 1,
    gridSize: 1,
    fixedPositions: [{ x: 50, y: 58 }],
    // L1 仅解锁胡萝卜/青菜，因此池子限制为可被这两种食物喂养的动物
    animalPool: ['rabbit', 'sheep'],
    unlockedFoods: ['carrot', 'greens'],
    hungerRange: [1, 1],
    surplusRatio: 0.5,
    trapFoodMax: 0,
  },
  {
    level: 2,
    name: '前中后练习',
    animalCount: 3,
    gridSize: 1,
    fixedPositions: [
      { x: 50, y: 40 },
      { x: 50, y: 60 },
      { x: 50, y: 80 },
    ],
    // L2 食物为胡萝卜/青菜/虫子/饲料，池子仅包含可被这些食物喂养的动物
    animalPool: ['rabbit', 'sheep', 'chicken', 'frog', 'turtle', 'fish'],
    unlockedFoods: ['carrot', 'greens', 'bug', 'feed'],
    hungerRange: [1, 2],
    surplusRatio: 0.3,
    trapFoodMax: 0,
  },
  {
    level: 3,
    name: '3x3 策略局',
    animalCount: 9,
    gridSize: 3,
    animalPool: ['rabbit', 'sheep', 'chicken', 'frog', 'dog', 'cat', 'turtle', 'fish'],
    unlockedFoods: ['carrot', 'greens', 'bug', 'feed', 'bone', 'shrimp'],
    hungerRange: [1, 3],
    surplusRatio: 0.1,
    trapFoodMax: 1,
  },
  {
    level: 4,
    name: '4x4 终局',
    animalCount: 16,
    gridSize: 4,
    animalPool: ['rabbit', 'sheep', 'chicken', 'frog', 'dog', 'cat', 'turtle', 'fish'],
    unlockedFoods: ['carrot', 'greens', 'bug', 'feed', 'bone', 'shrimp'],
    hungerRange: [1, 3],
    surplusRatio: 0.05,
    trapFoodMax: 2,
  },
];

export const MAX_LEVEL = 4;

export const ALL_FOODS = Object.keys(FOODS) as FoodType[];
export const ALL_ANIMALS = Object.keys(ANIMALS) as AnimalType[];

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
