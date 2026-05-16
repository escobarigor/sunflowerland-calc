/* =========================================================
   data.js — Dados FIXOS do jogo Sunflower Land.
   Fontes: wiki.sfl.world, docs.sunflower-land.com, w3land.com
   --------------------------------------------------------
   IMPORTANTE: aqui só ficam números que NÃO mudam por jogador.
   Nada de lógica e nada de API — só dados.

   A FAZER (juntos):
   - Custo de CADA expansão individual (hoje só temos o TOTAL por ilha).
     Fonte boa: sfl.world/info/expansion
   - Preencher a lista `crops` (sementes) e `recipes` (cozinha).
   ========================================================= */

const GAME_DATA = {

  /* ---- ILHAS, em ordem de progressão (Prestige) ----
     totalCost  = soma de recursos p/ completar TODAS as expansões da ilha
     upgradeCost = custo p/ subir (Prestige) para a próxima ilha
     expansions  = (a preencher) custo de cada nível individual            */
  islands: [
    {
      id: "basic",
      name: "Basic Island",
      prestige: 0,
      maxExpansions: 9,
      totalCost: { coins: 60.25, wood: 108, stone: 46, iron: 9, gold: 1 },
      upgradeCost: { gold: 10 },
      nextIsland: "petal",
      expansions: [] // TODO: custo por nível
    },
    {
      id: "petal",
      name: "Petal Paradise",
      prestige: 1,
      maxExpansions: null, // TODO confirmar
      totalCost: { wood: 680, stone: 115, gold: 32, iron: 30, gem: 225, crimstone: 26 },
      upgradeCost: { crimstone: 20 },
      nextIsland: "desert",
      expansions: []
    },
    {
      id: "desert",
      name: "Desert Island",
      prestige: 2,
      maxExpansions: null,
      totalCost: { coins: 81600, wood: 6775, stone: 2416, iron: 440, gold: 350, gem: 1020, crimstone: 564, oil: 3570 },
      upgradeCost: {}, // TODO: custo p/ Volcano
      nextIsland: "volcano",
      expansions: []
    },
    {
      id: "volcano",
      name: "Volcano Island",
      prestige: 3,
      maxExpansions: null,
      totalCost: {}, // TODO
      upgradeCost: null, // última ilha (por enquanto)
      nextIsland: null,
      expansions: []
    }
  ],

  /* ---- RECURSOS ----
     label/icon  = usados em toda a UI
     recoverySeconds = tempo para o nó "respawnar" depois de coletado
     baseYield   = quanto rende por coleta (valor BASE, sem boosts)
     gatherable  = true se é um nó que se coleta no mapa
     Fonte dos tempos: código-fonte do jogo
       (src/features/game/lib/constants.ts)
     coins e gem não são nós — não têm recovery. */
  resources: {
    coins:     { label: "Coins",     icon: "🪙", gatherable: false },
    gem:       { label: "Gem",       icon: "💎", gatherable: false },
    wood:      { label: "Wood",      icon: "🪵", gatherable: true, recoverySeconds: 2 * 3600,  baseYield: 1,  tool: "Axe" },
    stone:     { label: "Stone",     icon: "🪨", gatherable: true, recoverySeconds: 4 * 3600,  baseYield: 1,  tool: "Pickaxe" },
    iron:      { label: "Iron",      icon: "⛓️", gatherable: true, recoverySeconds: 8 * 3600,  baseYield: 1,  tool: "Stone Pickaxe" },
    gold:      { label: "Gold",      icon: "🟡", gatherable: true, recoverySeconds: 24 * 3600, baseYield: 1,  tool: "Iron Pickaxe" },
    crimstone: { label: "Crimstone", icon: "🔴", gatherable: true, recoverySeconds: 24 * 3600, baseYield: 1,  tool: "Gold Pickaxe" },
    sunstone:  { label: "Sunstone",  icon: "☀️", gatherable: true, recoverySeconds: 72 * 3600, baseYield: 1,  tool: "Gold Pickaxe" },
    oil:       { label: "Oil",       icon: "🛢️", gatherable: true, recoverySeconds: null,      baseYield: 10, tool: "Oil Drill" }
  },

  /* ---- PLANTAÇÕES (crops) ----
     Fonte: código-fonte oficial do jogo
       github.com/sunflower-land/sunflower-land
       (src/features/game/types/crops.ts e seeds.ts)
     seedCost   = preço da semente em Coins
     sellPrice  = preço de venda da colheita em Coins
     growSeconds = tempo de cultivo em segundos
     level      = nível mínimo do Bumpkin para desbloquear
     OBS: valores BASE — não incluem boosts de skills, NFTs, etc.
          1 Crop Plot rende 1 unidade por plantio (sem boost). */
  crops: [
    { id: "sunflower",   name: "Sunflower",   icon: "🌻", seedCost: 0.01, sellPrice: 0.02,  growSeconds: 60,     level: 1  },
    { id: "potato",      name: "Potato",      icon: "🥔", seedCost: 0.10, sellPrice: 0.14,  growSeconds: 300,    level: 1  },
    { id: "rhubarb",     name: "Rhubarb",     icon: "🌱", seedCost: 0.15, sellPrice: 0.24,  growSeconds: 600,    level: 1  },
    { id: "pumpkin",     name: "Pumpkin",     icon: "🎃", seedCost: 0.20, sellPrice: 0.40,  growSeconds: 1800,   level: 2  },
    { id: "zucchini",    name: "Zucchini",    icon: "🥒", seedCost: 0.20, sellPrice: 0.40,  growSeconds: 1800,   level: 2  },
    { id: "carrot",      name: "Carrot",      icon: "🥕", seedCost: 0.50, sellPrice: 0.80,  growSeconds: 3600,   level: 2  },
    { id: "yam",         name: "Yam",         icon: "🍠", seedCost: 0.50, sellPrice: 0.80,  growSeconds: 3600,   level: 2  },
    { id: "cabbage",     name: "Cabbage",     icon: "🥬", seedCost: 1.00, sellPrice: 1.50,  growSeconds: 7200,   level: 3  },
    { id: "broccoli",    name: "Broccoli",    icon: "🥦", seedCost: 1.00, sellPrice: 1.50,  growSeconds: 7200,   level: 3  },
    { id: "soybean",     name: "Soybean",     icon: "🫛", seedCost: 1.50, sellPrice: 2.30,  growSeconds: 10800,  level: 3  },
    { id: "beetroot",    name: "Beetroot",    icon: "🫜", seedCost: 2.00, sellPrice: 2.80,  growSeconds: 14400,  level: 3  },
    { id: "pepper",      name: "Pepper",      icon: "🌶️", seedCost: 2.00, sellPrice: 3.00,  growSeconds: 14400,  level: 3  },
    { id: "cauliflower", name: "Cauliflower", icon: "🌼", seedCost: 3.00, sellPrice: 4.25,  growSeconds: 28800,  level: 4  },
    { id: "parsnip",     name: "Parsnip",     icon: "🥔", seedCost: 5.00, sellPrice: 6.50,  growSeconds: 43200,  level: 4  },
    { id: "eggplant",    name: "Eggplant",    icon: "🍆", seedCost: 6.00, sellPrice: 8.00,  growSeconds: 57600,  level: 5  },
    { id: "corn",        name: "Corn",        icon: "🌽", seedCost: 7.00, sellPrice: 9.00,  growSeconds: 72000,  level: 5  },
    { id: "onion",       name: "Onion",       icon: "🧅", seedCost: 7.00, sellPrice: 10.00, growSeconds: 72000,  level: 5  },
    { id: "radish",      name: "Radish",      icon: "🌶️", seedCost: 7.00, sellPrice: 9.50,  growSeconds: 86400,  level: 5  },
    { id: "wheat",       name: "Wheat",       icon: "🌾", seedCost: 5.00, sellPrice: 7.00,  growSeconds: 86400,  level: 5  },
    { id: "turnip",      name: "Turnip",      icon: "🥬", seedCost: 5.00, sellPrice: 8.00,  growSeconds: 86400,  level: 6  },
    { id: "kale",        name: "Kale",        icon: "🥬", seedCost: 7.00, sellPrice: 10.00, growSeconds: 129600, level: 7  },
    { id: "artichoke",   name: "Artichoke",   icon: "🌿", seedCost: 7.00, sellPrice: 12.00, growSeconds: 129600, level: 8  },
    { id: "barley",      name: "Barley",      icon: "🌾", seedCost: 10.00, sellPrice: 12.00, growSeconds: 172800, level: 14 }
  ],

  /* ---- COZINHA (recipes) ----
     Fonte: código-fonte oficial do jogo
       (src/features/game/types/consumables.ts)
     building   = onde se cozinha (Fire Pit, Kitchen, Bakery, Deli, Smoothie Shack)
     xp         = experiência ganha ao consumir o prato
     cookSeconds = tempo de preparo em segundos
     ingredients = o que é preciso para cozinhar
     OBS: valores BASE. Ordenado por construção e depois por XP. */
  recipes: [
    { name: "Mashed Potato", building: "Fire Pit", xp: 3, cookSeconds: 30, ingredients: { "Potato": 8 } },
    { name: "Rhubarb Tart", building: "Fire Pit", xp: 5, cookSeconds: 60, ingredients: { "Rhubarb": 3 } },
    { name: "Pumpkin Soup", building: "Fire Pit", xp: 24, cookSeconds: 180, ingredients: { "Pumpkin": 10 } },
    { name: "Reindeer Carrot", building: "Fire Pit", xp: 36, cookSeconds: 300, ingredients: { "Carrot": 5 } },
    { name: "Mushroom Soup", building: "Fire Pit", xp: 56, cookSeconds: 600, ingredients: { "Wild Mushroom": 5 } },
    { name: "Boiled Eggs", building: "Fire Pit", xp: 90, cookSeconds: 3600, ingredients: { "Egg": 10 } },
    { name: "Bumpkin Broth", building: "Fire Pit", xp: 96, cookSeconds: 1200, ingredients: { "Carrot": 10, "Cabbage": 5 } },
    { name: "Popcorn", building: "Fire Pit", xp: 200, cookSeconds: 720, ingredients: { "Sunflower": 100, "Corn": 5 } },
    { name: "Cabbers n Mash", building: "Fire Pit", xp: 250, cookSeconds: 2400, ingredients: { "Mashed Potato": 10, "Cabbage": 20 } },
    { name: "Rapid Roast", building: "Fire Pit", xp: 300, cookSeconds: 10, ingredients: { "Magic Mushroom": 1, "Pumpkin": 40 } },
    { name: "Kale Stew", building: "Fire Pit", xp: 400, cookSeconds: 7200, ingredients: { "Kale": 10 } },
    { name: "Fried Tofu", building: "Fire Pit", xp: 400, cookSeconds: 5400, ingredients: { "Soybean": 15, "Sunflower": 200 } },
    { name: "Gumbo", building: "Fire Pit", xp: 600, cookSeconds: 14400, ingredients: { "Potato": 50, "Pumpkin": 30, "Carrot": 20, "Red Snapper": 3 } },
    { name: "Furikake Sprinkle", building: "Fire Pit", xp: 1000, cookSeconds: 0, ingredients: { "Fish Flake": 1, "Seaweed": 1 } },
    { name: "Kale Omelette", building: "Fire Pit", xp: 1250, cookSeconds: 12600, ingredients: { "Egg": 40, "Kale": 5 } },
    { name: "Rice Bun", building: "Fire Pit", xp: 2600, cookSeconds: 18000, ingredients: { "Rice": 2, "Wheat": 50 } },
    { name: "Antipasto", building: "Fire Pit", xp: 3000, cookSeconds: 10800, ingredients: { "Olive": 2, "Grape": 2 } },
    { name: "Pizza Margherita", building: "Fire Pit", xp: 25000, cookSeconds: 72000, ingredients: { "Tomato": 30, "Cheese": 5, "Wheat": 20 } },
    { name: "Sunflower Crunch", building: "Kitchen", xp: 50, cookSeconds: 600, ingredients: { "Sunflower": 300 } },
    { name: "Roast Veggies", building: "Kitchen", xp: 170, cookSeconds: 7200, ingredients: { "Cauliflower": 15, "Carrot": 10 } },
    { name: "Club Sandwich", building: "Kitchen", xp: 170, cookSeconds: 10800, ingredients: { "Sunflower": 100, "Carrot": 25, "Wheat": 5 } },
    { name: "Fruit Salad", building: "Kitchen", xp: 225, cookSeconds: 1800, ingredients: { "Apple": 1, "Orange": 1, "Blueberry": 1 } },
    { name: "Mushroom Jacket Potatoes", building: "Kitchen", xp: 240, cookSeconds: 600, ingredients: { "Wild Mushroom": 10, "Potato": 5 } },
    { name: "Cauliflower Burger", building: "Kitchen", xp: 255, cookSeconds: 10800, ingredients: { "Cauliflower": 15, "Wheat": 5 } },
    { name: "Bumpkin Salad", building: "Kitchen", xp: 290, cookSeconds: 12600, ingredients: { "Beetroot": 20, "Parsnip": 10 } },
    { name: "Goblin's Treat", building: "Kitchen", xp: 500, cookSeconds: 21600, ingredients: { "Pumpkin": 10, "Radish": 20, "Cabbage": 10 } },
    { name: "Pancakes", building: "Kitchen", xp: 1000, cookSeconds: 3600, ingredients: { "Wheat": 10, "Egg": 10, "Honey": 6 } },
    { name: "Bumpkin ganoush", building: "Kitchen", xp: 1000, cookSeconds: 18000, ingredients: { "Eggplant": 30, "Potato": 50, "Parsnip": 10 } },
    { name: "Chowder", building: "Kitchen", xp: 1000, cookSeconds: 28800, ingredients: { "Beetroot": 10, "Wheat": 10, "Parsnip": 5, "Anchovy": 3 } },
    { name: "Tofu Scramble", building: "Kitchen", xp: 1000, cookSeconds: 10800, ingredients: { "Soybean": 20, "Egg": 20, "Cauliflower": 10 } },
    { name: "Fish Burger", building: "Kitchen", xp: 1300, cookSeconds: 7200, ingredients: { "Beetroot": 10, "Wheat": 10, "Horse Mackerel": 1 } },
    { name: "Fried Calamari", building: "Kitchen", xp: 1500, cookSeconds: 18000, ingredients: { "Sunflower": 200, "Wheat": 15, "Squid": 1 } },
    { name: "Fish Omelette", building: "Kitchen", xp: 1500, cookSeconds: 18000, ingredients: { "Egg": 40, "Surgeonfish": 1, "Butterflyfish": 2 } },
    { name: "Beetroot Blaze", building: "Kitchen", xp: 2000, cookSeconds: 30, ingredients: { "Magic Mushroom": 2, "Beetroot": 50 } },
    { name: "Ocean's Olive", building: "Kitchen", xp: 2000, cookSeconds: 7200, ingredients: { "Olive Flounder": 1, "Olive": 2 } },
    { name: "Fish n Chips", building: "Kitchen", xp: 2000, cookSeconds: 14400, ingredients: { "Fancy Fries": 1, "Halibut": 1 } },
    { name: "Sushi Roll", building: "Kitchen", xp: 2000, cookSeconds: 3600, ingredients: { "Angelfish": 1, "Seaweed": 1, "Rice": 2 } },
    { name: "Seafood Basket", building: "Kitchen", xp: 2200, cookSeconds: 18000, ingredients: { "Blowfish": 2, "Napoleanfish": 2, "Sunfish": 2 } },
    { name: "Bumpkin Roast", building: "Kitchen", xp: 2500, cookSeconds: 43200, ingredients: { "Mashed Potato": 20, "Roast Veggies": 5 } },
    { name: "Goblin Brunch", building: "Kitchen", xp: 2500, cookSeconds: 43200, ingredients: { "Boiled Eggs": 5, "Goblin's Treat": 1 } },
    { name: "Surimi Rice Bowl", building: "Kitchen", xp: 3000, cookSeconds: 0, ingredients: { "Fish Stick": 1, "Rice": 1, "Onion": 1 } },
    { name: "Steamed Red Rice", building: "Kitchen", xp: 3000, cookSeconds: 14400, ingredients: { "Rice": 3, "Beetroot": 50 } },
    { name: "Caprese Salad", building: "Kitchen", xp: 6000, cookSeconds: 10800, ingredients: { "Cheese": 1, "Tomato": 25, "Kale": 20 } },
    { name: "Creamy Crab Bite", building: "Kitchen", xp: 10000, cookSeconds: 0, ingredients: { "Crab Stick": 1, "Cheese": 3 } },
    { name: "Spaghetti al Limone", building: "Kitchen", xp: 15000, cookSeconds: 54000, ingredients: { "Wheat": 10, "Lemon": 15, "Cheese": 3 } },
    { name: "Crimstone Infused Fish Oil", building: "Kitchen", xp: 18000, cookSeconds: 0, ingredients: { "Fish Oil": 1, "Crimstone": 1 } },
    { name: "Sunflower Cake", building: "Bakery", xp: 525, cookSeconds: 23400, ingredients: { "Sunflower": 1000, "Wheat": 10, "Egg": 30 } },
    { name: "Cornbread", building: "Bakery", xp: 600, cookSeconds: 43200, ingredients: { "Corn": 15, "Wheat": 5, "Egg": 10 } },
    { name: "Pumpkin Cake", building: "Bakery", xp: 625, cookSeconds: 37800, ingredients: { "Pumpkin": 130, "Wheat": 10, "Egg": 30 } },
    { name: "Potato Cake", building: "Bakery", xp: 650, cookSeconds: 37800, ingredients: { "Potato": 500, "Wheat": 10, "Egg": 30 } },
    { name: "Apple Pie", building: "Bakery", xp: 720, cookSeconds: 14400, ingredients: { "Apple": 5, "Wheat": 10, "Egg": 20 } },
    { name: "Orange Cake", building: "Bakery", xp: 730, cookSeconds: 14400, ingredients: { "Orange": 5, "Egg": 30, "Wheat": 10 } },
    { name: "Carrot Cake", building: "Bakery", xp: 750, cookSeconds: 46800, ingredients: { "Carrot": 120, "Wheat": 10, "Egg": 30 } },
    { name: "Cabbage Cake", building: "Bakery", xp: 860, cookSeconds: 54000, ingredients: { "Cabbage": 90, "Wheat": 10, "Egg": 30 } },
    { name: "Wheat Cake", building: "Bakery", xp: 1100, cookSeconds: 86400, ingredients: { "Wheat": 35, "Egg": 30 } },
    { name: "Cauliflower Cake", building: "Bakery", xp: 1190, cookSeconds: 79200, ingredients: { "Cauliflower": 60, "Wheat": 10, "Egg": 30 } },
    { name: "Radish Cake", building: "Bakery", xp: 1200, cookSeconds: 86400, ingredients: { "Radish": 25, "Wheat": 10, "Egg": 30 } },
    { name: "Beetroot Cake", building: "Bakery", xp: 1250, cookSeconds: 79200, ingredients: { "Beetroot": 100, "Wheat": 10, "Egg": 30 } },
    { name: "Parsnip Cake", building: "Bakery", xp: 1300, cookSeconds: 86400, ingredients: { "Parsnip": 45, "Wheat": 10, "Egg": 30 } },
    { name: "Eggplant Cake", building: "Bakery", xp: 1400, cookSeconds: 86400, ingredients: { "Eggplant": 30, "Wheat": 10, "Egg": 30 } },
    { name: "Honey Cake", building: "Bakery", xp: 4000, cookSeconds: 28800, ingredients: { "Honey": 10, "Wheat": 10, "Egg": 20 } },
    { name: "Lemon Cheesecake", building: "Bakery", xp: 30000, cookSeconds: 108000, ingredients: { "Lemon": 20, "Cheese": 5, "Egg": 40 } },
    { name: "Cheese", building: "Deli", xp: 1, cookSeconds: 1200, ingredients: { "Milk": 3 } },
    { name: "Fermented Carrots", building: "Deli", xp: 250, cookSeconds: 86400, ingredients: { "Carrot": 20 } },
    { name: "Blueberry Jam", building: "Deli", xp: 500, cookSeconds: 43200, ingredients: { "Blueberry": 5 } },
    { name: "Sauerkraut", building: "Deli", xp: 500, cookSeconds: 86400, ingredients: { "Cabbage": 20 } },
    { name: "Fancy Fries", building: "Deli", xp: 1000, cookSeconds: 86400, ingredients: { "Sunflower": 500, "Potato": 500 } },
    { name: "Fermented Fish", building: "Deli", xp: 3000, cookSeconds: 86400, ingredients: { "Tuna": 6 } },
    { name: "Blue Cheese", building: "Deli", xp: 6000, cookSeconds: 10800, ingredients: { "Cheese": 2, "Blueberry": 10 } },
    { name: "Shroom Syrup", building: "Deli", xp: 10000, cookSeconds: 10, ingredients: { "Magic Mushroom": 3, "Honey": 20 } },
    { name: "Honey Cheddar", building: "Deli", xp: 15000, cookSeconds: 43200, ingredients: { "Cheese": 3, "Honey": 5 } },
    { name: "Quick Juice", building: "Smoothie Shack", xp: 100, cookSeconds: 1800, ingredients: { "Sunflower": 50, "Pumpkin": 40 } },
    { name: "Carrot Juice", building: "Smoothie Shack", xp: 200, cookSeconds: 3600, ingredients: { "Carrot": 30 } },
    { name: "Purple Smoothie", building: "Smoothie Shack", xp: 310, cookSeconds: 1800, ingredients: { "Blueberry": 5, "Cabbage": 10 } },
    { name: "Orange Juice", building: "Smoothie Shack", xp: 375, cookSeconds: 2700, ingredients: { "Orange": 5 } },
    { name: "Apple Juice", building: "Smoothie Shack", xp: 500, cookSeconds: 3600, ingredients: { "Apple": 5 } },
    { name: "Power Smoothie", building: "Smoothie Shack", xp: 775, cookSeconds: 5400, ingredients: { "Blueberry": 10, "Kale": 5 } },
    { name: "Bumpkin Detox", building: "Smoothie Shack", xp: 975, cookSeconds: 7200, ingredients: { "Apple": 5, "Orange": 5, "Carrot": 10 } },
    { name: "Sour Shake", building: "Smoothie Shack", xp: 1000, cookSeconds: 3600, ingredients: { "Lemon": 20 } },
    { name: "Banana Blast", building: "Smoothie Shack", xp: 1200, cookSeconds: 10800, ingredients: { "Banana": 10, "Egg": 10 } },
    { name: "The Lot", building: "Smoothie Shack", xp: 1500, cookSeconds: 12600, ingredients: { "Blueberry": 1, "Orange": 1, "Grape": 1, "Apple": 1, "Banana": 1 } },
    { name: "Grape Juice", building: "Smoothie Shack", xp: 3300, cookSeconds: 10800, ingredients: { "Grape": 5, "Radish": 20 } },
    { name: "Slow Juice", building: "Smoothie Shack", xp: 7500, cookSeconds: 86400, ingredients: { "Grape": 10, "Kale": 100 } },
  ],

  /* ---- NÍVEIS DO BUMPKIN ----
     Fonte: src/features/game/lib/level.ts no repo do SFL.
     bumpkinLevels[N-1] = XP necessária para alcançar o nível N. */
  bumpkinLevels: [
    0, 2, 22, 205, 555, 1155, 2155, 3405, 5405, 7905,
    10905, 14405, 18405, 22905, 27905, 33655, 40155, 47405, 55405, 64155,
    73905, 84655, 96405, 109155, 122905, 137405, 152905, 169405, 186905, 205405,
    225405, 246905, 269905, 294405, 320405, 348405, 378405, 410405, 444405, 480405,
    518905, 559905, 603405, 649405, 697905, 749405, 803905, 861405, 921905, 985405,
    1053905, 1127405, 1205905, 1289405, 1377905, 1476405, 1584905, 1703405, 1831905, 1970405,
    2128905, 2287405, 2485905, 2704405, 2942905, 3221405, 3539905, 3898405, 4296905, 4735405,
    5233905, 5743905, 6263905, 6793905, 7333905, 7883905, 8443905, 9013905, 9593905, 10183905,
    10783905, 11393905, 12013905, 12643905, 13283905, 13933905, 14593905, 15263905, 15943905, 16633905,
    17333905, 18043905, 18763905, 19493905, 20233905, 20983905, 21743905, 22513905, 23293905, 24083905
  ]
};
