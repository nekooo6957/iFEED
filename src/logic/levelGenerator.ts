import {
  ALL_FOODS,
  ANIMALS,
  AnimalEntity,
  FoodType,
  LEVEL_CONFIG,
  LevelConfig,
} from '../types';

const random = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const clampHunger = (value: number) => Math.max(0, value);

const emptyInventory = (): Record<FoodType, number> =>
  ALL_FOODS.reduce(
    (acc, food) => {
      acc[food] = 0;
      return acc;
    },
    {} as Record<FoodType, number>,
  );

const snapshotKey = (hunger: number[], inventory: Record<FoodType, number>) => {
  const hungerKey = hunger.map(clampHunger).join(',');
  const invKey = ALL_FOODS.map((f) => inventory[f]).join(',');
  return `${hungerKey}|${invKey}`;
};

export const getLevelConfig = (level: number): LevelConfig => {
  return LEVEL_CONFIG[Math.max(0, Math.min(level - 1, LEVEL_CONFIG.length - 1))];
};

export const createHungerValue = ([min, max]: [number, number]) => {
  if (min === max) return min;
  return min + Math.floor(Math.random() * (max - min + 1));
};

export const buildBaseFeedingPlan = (
  animals: AnimalEntity[],
  unlockedFoods: FoodType[],
): Record<FoodType, number> => {
  const inventory = emptyInventory();

  for (const animal of animals) {
    let remaining = animal.hungerCurrent;
    const effectEntries = Object.entries(ANIMALS[animal.type].foodEffects)
      .filter(([food]) => unlockedFoods.includes(food as FoodType))
      .map(([food, effect]) => ({ food: food as FoodType, effect: effect ?? 0 }))
      .sort((a, b) => b.effect - a.effect);

    if (effectEntries.length === 0) {
      continue;
    }

    while (remaining > 0) {
      const exactOrLower = effectEntries.find((entry) => entry.effect <= remaining);
      const selected = exactOrLower ?? effectEntries[0];
      inventory[selected.food] += 1;
      remaining -= selected.effect;
    }
  }

  return inventory;
};

const applySurplusAndTraps = (
  base: Record<FoodType, number>,
  config: LevelConfig,
  animals: AnimalEntity[],
): Record<FoodType, number> => {
  const result = { ...base };
  const edibleFoodsInLevel = new Set<FoodType>();

  animals.forEach((animal) => {
    Object.keys(ANIMALS[animal.type].foodEffects).forEach((food) => {
      edibleFoodsInLevel.add(food as FoodType);
    });
  });

  for (const food of config.unlockedFoods) {
    if (base[food] > 0) {
      const bonus = Math.ceil(base[food] * config.surplusRatio);
      result[food] += bonus;
    }
  }

  if (config.trapFoodMax > 0) {
    const trapCandidates = config.unlockedFoods.filter((food) => !edibleFoodsInLevel.has(food));
    const trapCount = Math.min(config.trapFoodMax, trapCandidates.length);
    for (let i = 0; i < trapCount; i += 1) {
      const trap = random(trapCandidates);
      result[trap] += 1;
    }
  }

  return result;
};

export const isSolvableWithoutAds = (
  animals: AnimalEntity[],
  inventory: Record<FoodType, number>,
): boolean => {
  const memo = new Set<string>();
  const hungerStart = animals.map((a) => clampHunger(a.hungerCurrent));

  const dfs = (hunger: number[], stock: Record<FoodType, number>): boolean => {
    if (hunger.every((value) => value <= 0)) {
      return true;
    }

    const key = snapshotKey(hunger, stock);
    if (memo.has(key)) {
      return false;
    }
    memo.add(key);

    for (let animalIndex = 0; animalIndex < animals.length; animalIndex += 1) {
      if (hunger[animalIndex] <= 0) continue;

      const foodEffects = ANIMALS[animals[animalIndex].type].foodEffects;
      for (const food of ALL_FOODS) {
        const effect = foodEffects[food];
        if (!effect) continue;
        if (stock[food] <= 0) continue;

        const nextHunger = [...hunger];
        nextHunger[animalIndex] = clampHunger(nextHunger[animalIndex] - effect);

        const nextStock = { ...stock, [food]: stock[food] - 1 };
        if (dfs(nextHunger, nextStock)) {
          return true;
        }
      }
    }

    return false;
  };

  return dfs(hungerStart, { ...inventory });
};

export const generateSolvableInventory = (
  animals: AnimalEntity[],
  config: LevelConfig,
  retryLimit = 50,
): Record<FoodType, number> => {
  let fallback = emptyInventory();

  for (let i = 0; i < retryLimit; i += 1) {
    const base = buildBaseFeedingPlan(animals, config.unlockedFoods);
    fallback = base;
    const candidate = applySurplusAndTraps(base, config, animals);
    if (isSolvableWithoutAds(animals, candidate)) {
      return candidate;
    }
  }

  return fallback;
};

export const hasAnyValidFeedAction = (
  animals: AnimalEntity[],
  inventory: Record<FoodType, number>,
): boolean => {
  return animals.some((animal) => {
    if (animal.status !== 'hungry' || animal.hungerCurrent <= 0) return false;
    const effects = ANIMALS[animal.type].foodEffects;
    return ALL_FOODS.some((food) => effects[food] && inventory[food] > 0);
  });
};
