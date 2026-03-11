# 动物投喂大作战 V2 (Animal Feeding Frenzy V2) - 游戏设计方案

## 1. 游戏概述 (Game Overview)
V2 从“单一偏好食物 + 即死失败”升级为“饥饿值 + 固定库存 + 资源分配解谜”。

玩家仍然通过下拉蓄力抛投食物命中动物，但通关关键从“命中准确率”扩展为：
1. 在有限库存下进行正确的食物分配。
2. 控制错误投喂导致的生病风险。
3. 在广告补救次数受限的前提下完成全部喂饱。

## 2. 核心玩法 (Core Gameplay)
* **操作方式**：保留抛投。玩家向下拖拽蓄力并释放，食物按轨迹飞行并在落点判定命中。
* **目标**：消除场上所有动物的饥饿值（每只动物 `hungerCurrent <= 0`）。
* **进度显示**：左上角显示 `关卡` 和 `已消除饥饿值/总饥饿值`，其中总饥饿值为本局动态生成。
* **失败条件**：
  * 食物库存耗尽，仍有动物未喂饱。
  * 已进入无可用操作死局且本关广告机会已用。
* **通关条件**：当前关卡所有动物都喂饱后进入下一关；第4关后进入总通关结算页。

## 3. 动物、食物与状态 (Animals, Foods, Status)

### 3.1 食物列表 (Foods)
* 胡萝卜 (`carrot`)
* 虫子 (`bug`)
* 肉骨头 (`bone`)
* 青菜 (`greens`)
* 虾 (`shrimp`)
* 饲料 (`feed`)

### 3.2 动物列表 (Animals)
* 青蛙 (`frog`)
* 小鸡 (`chicken`)
* 小狗 (`dog`)
* 羊 (`sheep`)
* 乌龟 (`turtle`)
* 小猫 (`cat`)
* 兔子 (`rabbit`)
* 鱼 (`fish`)

### 3.3 食物效果矩阵 (Food Effects Matrix)
> 仅下列食物可减少饥饿值；其余食物投喂会导致生病。

| 动物 | 可吃食物与减值 |
|---|---|
| 青蛙 | 虫子 -2，虾 -1 |
| 小鸡 | 虫子 -1，饲料 -2 |
| 小狗 | 肉骨头 -1，虾 -1 |
| 羊 | 胡萝卜 -1，青菜 -1 |
| 乌龟 | 虾 -2，饲料 -1 |
| 小猫 | 肉骨头 -2，虾 -1 |
| 兔子 | 胡萝卜 -2，青菜 -1 |
| 鱼 | 虫子 -2，虾 -2，饲料 -1 |

### 3.4 动物状态机 (Animal State Machine)
* `hungry`：可正常投喂。
* `sick`：普通投喂无效且会消耗库存。
* `full`：饥饿值清零，不再需要投喂。

状态迁移：
1. `hungry + 可食物` -> 继续 `hungry` 或转 `full`。
2. `hungry + 非可食物` -> `sick`。
3. `sick + 普通投喂` -> 仍 `sick`（无效、消耗库存）。
4. `sick + 救治针` -> `hungry`。
5. `hungry/sick + 万能饼干` -> `full`。

## 4. 关卡结构与难度 (Levels & Difficulty)

### 4.1 关卡数量
固定 4 关，无尽模式移除。

### 4.2 阵型与数量
* **第1关**：中间 1 只（新手引导）
* **第2关**：前中后各 1 只（共 3 只）
* **第3关**：3x3（9 只）
* **第4关**：4x4（16 只）

### 4.3 饥饿值范围
* **第1关**：固定 `1`
* **第2关**：随机 `1~2`
* **第3关**：随机 `1~3`
* **第4关**：随机 `1~3`

### 4.4 动物与食物逐关解锁
* 动物解锁按复杂度递进：
  * L1：兔子
  * L2：兔子、羊、小鸡
  * L3/L4：8种全量参与
* 食物解锁：
  * L1：胡萝卜、青菜
  * L2：胡萝卜、青菜、虫子、饲料
  * L3/L4：6种全量

### 4.5 库存冗余策略
在“可解基础库存”上追加冗余：
* L1：约 +50%
* L2：约 +30%
* L3：约 +10%
* L4：约 +0~5%

后两关允许少量干扰食物（若该食物对当前场上动物无减值效果）。

## 5. 道具与广告规则 (Ads & Rescue Tools)
每关广告总次数上限为 **1 次**（两种道具二选一）。

* **救治针**：看广告后，恢复 1 只指定生病动物为可投喂状态。
* **万能饼干**：看广告后，直接喂饱 1 只指定动物（生病状态也可用）。

设计约束：关卡必须保证“**不使用广告也可通关**”，广告仅作失误补救。

## 6. 可解库存生成算法 (Solvable Inventory Generation)

### 6.1 目标
生成满足以下条件的库存：
1. 至少存在一条无广告通关路径。
2. 满足关卡冗余比例。
3. 可在后期加入少量干扰食物提升策略性。

### 6.2 核心流程
1. 生成当局动物阵容与每只动物初始饥饿值。
2. 按食物效果构建“基础可行投喂方案”。
3. 在基础方案上追加冗余库存。
4. 加入少量干扰食物（仅高关）。
5. 用 DFS + 记忆化校验“无广告可通关”；若失败则重采样（最多50次）。

### 6.3 伪代码
```ts
function generateLevel(levelConfig):
  animals = spawnAnimals(levelConfig)
  baseInventory = buildBaseFeedingPlan(animals, levelConfig.unlockedFoods)
  for i in 1..50:
    inventory = applySurplusAndTraps(baseInventory, levelConfig, animals)
    if isSolvableWithoutAds(animals, inventory):
      return { animals, inventory }
  return { animals, baseInventory } // fallback

function buildBaseFeedingPlan(animals, unlockedFoods):
  inventory = zeroInventory()
  for animal in animals:
    remaining = animal.hungerCurrent
    options = sortDesc(foodEffects(animal) intersect unlockedFoods)
    while remaining > 0:
      choice = first(option.effect <= remaining) ?? options[0]
      inventory[choice.food] += 1
      remaining -= choice.effect
  return inventory

function isSolvableWithoutAds(state):
  // state = hungerVector + inventoryVector
  // DFS with memoization
  if all hunger <= 0: return true
  if memo has state: return false
  memo.add(state)
  for each hungry animal i:
    for each food with inventory > 0 and effect(i, food) > 0:
      next = feed(i, food)
      if isSolvableWithoutAds(next): return true
  return false
```

### 6.4 复杂度说明
* 最坏情况下为指数级搜索（组合分配问题本质）。
* 在约束 `动物<=16`、`单体饥饿<=3`、`食物种类<=6` 与记忆化剪枝下，运行可控。
* 生成端采用“失败重采样”保证稳定性。

## 7. UI 与交互规范 (UI/UX Spec)
* 左上角：`第X关/4` + `已消除饥饿值/总饥饿值`
* 左下角：各食物库存数量（固定库存、过程中不刷新）
* 中下：抛投按钮与蓄力条
* 右下：广告道具区（救治针/万能饼干）与本关广告机会状态
* 动物头顶：饥饿值数字圈；生病显示状态标签
* 一次抛投仅结算 1 只动物（落点最近命中原则）

## 8. 工程接口迁移目标 (Code Migration Targets)
* `FoodType`：替换为 6 种新食物。
* `AnimalType`：替换为 8 种新动物。
* `AnimalConfig`：从 `preferredFood/deathFood` 改为  
  `foodEffects: Partial<Record<FoodType, 1 | 2>>`
* `AnimalEntity`：新增
  * `hungerMax`
  * `hungerCurrent`
  * `status: hungry | sick | full`
* `GameState` 主目标字段替换为：
  * `foodInventory`
  * `totalHunger`
  * `clearedHunger`
  * `adUsedThisLevel`
  * `sickCount`

## 9. 测试与验收清单 (Test & Acceptance)
1. 规则正确性：非可食物必生病，可食物按矩阵减值。
2. 状态正确性：生病普通投喂无效且扣库存；救治/饼干效果正确。
3. 进度正确性：`cleared/total` 实时更新，且仅全部喂饱通关。
4. 生成正确性：每关随机局可被 `isSolvableWithoutAds` 判定为可解。
5. 难度梯度：L1/L2显著轻于L3/L4，L4接近低冗余高策略。
6. 交互一致性：保留抛投命中与单目标结算，不回退点选喂食。
