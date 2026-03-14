import { PlayerData, PetDailyData, ProvinceType, AnimalType, PROVINCES, ANIMALS } from '../types';

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
  const today = getTodayDate();
  return dailyData.date !== today;
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
