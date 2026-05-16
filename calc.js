/* =========================================================
   calc.js — LÓGICA DE CÁLCULO.
   Funções puras: entram dados, saem dados. NADA de mexer na
   tela aqui (isso é trabalho do app.js). Assim fica fácil testar.
   ========================================================= */

const Calc = {

  /* Acha uma ilha pelo id. Retorna o objeto ou null. */
  getIsland(islandId) {
    return GAME_DATA.islands.find(i => i.id === islandId) || null;
  },

  /* Soma os custos totais de TODAS as ilhas a partir de uma ilha inicial
     (inclui o custo de upgrade/Prestige entre elas).
     Útil para responder: "quanto custa do meu ponto atual até o fim?" */
  totalFromIsland(islandId) {
    const islands = GAME_DATA.islands;
    const start = islands.findIndex(i => i.id === islandId);
    if (start === -1) return {};

    const totals = {};
    const add = (cost) => {
      for (const [res, amount] of Object.entries(cost || {})) {
        totals[res] = (totals[res] || 0) + amount;
      }
    };

    for (let i = start; i < islands.length; i++) {
      add(islands[i].totalCost);
      // o custo de upgrade leva da ilha i para a i+1
      if (i < islands.length - 1) add(islands[i].upgradeCost);
    }
    return totals;
  },

  /* Dado um custo e o que o jogador JÁ tem, calcula o que falta.
     cost e owned são objetos tipo { wood: 100, stone: 20 }. */
  remaining(cost, owned) {
    const result = {};
    for (const [res, needed] of Object.entries(cost || {})) {
      const have = (owned && owned[res]) || 0;
      result[res] = Math.max(0, needed - have);
    }
    return result;
  },

  /* Quanto do custo total já foi suprido, em % (0 a 100). */
  progressPercent(cost, owned) {
    const entries = Object.entries(cost || {});
    if (entries.length === 0) return 100;
    let totalNeeded = 0, totalHave = 0;
    for (const [res, needed] of entries) {
      totalNeeded += needed;
      totalHave   += Math.min(needed, (owned && owned[res]) || 0);
    }
    return totalNeeded === 0 ? 100 : Math.round((totalHave / totalNeeded) * 100);
  },

  /* ---------- PLANTAÇÕES ----------
     Valores BASE (sem boosts de skills/NFTs). 1 plot = 1 unidade. */

  /* Lucro por plantio: o que vende menos o que custou a semente. */
  cropProfit(crop) {
    return crop.sellPrice - crop.seedCost;
  },

  /* Lucro por hora de uma plantação — a métrica que mais importa
     para decidir o que plantar. */
  cropProfitPerHour(crop) {
    const hours = crop.growSeconds / 3600;
    return hours === 0 ? 0 : this.cropProfit(crop) / hours;
  },

  /* Margem em % sobre o custo da semente. */
  cropMargin(crop) {
    return crop.seedCost === 0 ? Infinity : (this.cropProfit(crop) / crop.seedCost) * 100;
  },

  /* Ranking de plantações por lucro/hora.
     maxLevel (opcional): só inclui o que o Bumpkin já desbloqueou. */
  rankCrops(maxLevel) {
    return GAME_DATA.crops
      .filter(c => maxLevel == null || c.level <= maxLevel)
      .map(c => ({
        ...c,
        profit:        this.cropProfit(c),
        profitPerHour: this.cropProfitPerHour(c),
        margin:        this.cropMargin(c)
      }))
      .sort((a, b) => b.profitPerHour - a.profitPerHour);
  },

  /* ---------- RECURSOS ----------
     Quanto um nó rende por dia: (24h / tempo de recovery) * rendimento base.
     Para `oil` (sem recovery cadastrado) retorna null. */
  resourcePerDay(resKey, nodeCount) {
    const r = GAME_DATA.resources[resKey];
    if (!r || !r.gatherable || !r.recoverySeconds) return null;
    const cyclesPerDay = 86400 / r.recoverySeconds;
    // nodeCount undefined => 1 (uso padrão); 0 explícito => 0 (produção zero)
    const n = (nodeCount === undefined || nodeCount === null) ? 1 : nodeCount;
    return cyclesPerDay * r.baseYield * n;
  },

  /* Lista os recursos coletáveis com o rendimento diário calculado. */
  listResources(nodeCounts) {
    return Object.entries(GAME_DATA.resources)
      .filter(([, r]) => r.gatherable)
      .map(([key, r]) => {
        const n = (nodeCounts && nodeCounts[key]) || 1;
        return {
          key, ...r, nodeCount: n,
          perDay: this.resourcePerDay(key, n)
        };
      });
  },

  /* ---------- COZINHA ----------
     XP por hora de uma receita — métrica chave para subir de nível.
     Receitas com cookSeconds 0 (itens instantâneos) retornam Infinity. */
  recipeXpPerHour(recipe) {
    if (recipe.cookSeconds === 0) return Infinity;
    return recipe.xp / (recipe.cookSeconds / 3600);
  },

  /* Custo estimado dos ingredientes em Coins.
     Só conta ingredientes que são plantações (usa o sellPrice da crop).
     Ingredientes não-crops (ovo, peixe...) entram como "?" e são ignorados
     na soma — então é uma ESTIMATIVA mínima. */
  recipeCropCost(recipe) {
    let cost = 0, hasUnknown = false;
    for (const [ing, qty] of Object.entries(recipe.ingredients)) {
      const crop = GAME_DATA.crops.find(c => c.name === ing);
      if (crop) cost += crop.sellPrice * qty;
      else hasUnknown = true;
    }
    return { cost, hasUnknown };
  },

  /* Ranking de receitas por XP/hora. building (opcional) filtra a construção. */
  rankRecipes(building) {
    return GAME_DATA.recipes
      .filter(r => !building || r.building === building)
      .map(r => ({ ...r, xpPerHour: this.recipeXpPerHour(r) }))
      .sort((a, b) => b.xpPerHour - a.xpPerHour);
  },

  /* ---------- BUMPKIN ----------
     Converte XP no nível atual + progresso pro próximo. */
  bumpkinLevel(xp) {
    const tbl = GAME_DATA.bumpkinLevels;
    let lvl = 1;
    for (let i = 0; i < tbl.length; i++) {
      if (xp >= tbl[i]) lvl = i + 1;
      else break;
    }
    const curThreshold = tbl[lvl - 1] ?? 0;
    const nextThreshold = tbl[lvl] ?? curThreshold;
    const progressXp = xp - curThreshold;
    const neededXp = nextThreshold - curThreshold;
    const pct = neededXp > 0 ? Math.floor((progressXp / neededXp) * 100) : 100;
    return {
      level: lvl,
      currentXp: xp,
      currentLevelXp: curThreshold,
      nextLevelXp: nextThreshold,
      progressXp, neededXp,
      progressPercent: pct
    };
  },

  /* ---------- PRODUÇÃO REAL DA FAZENDA ----------
     Conta os nós de recurso da fazenda (vindos do inventário da API). */
  farmNodeCounts(farmData) {
    const inv = (farmData && farmData.farm && farmData.farm.inventory) || {};
    const num = (n) => parseFloat(inv[n] || "0") || 0;
    return {
      wood:      num("Tree"),
      stone:     num("Stone Rock"),
      iron:      num("Iron Rock"),
      gold:      num("Gold Rock"),
      crimstone: num("Crimstone Rock"),
      sunstone:  num("Sunstone Rock")
    };
  },

  /* Dado o que FALTA e quantos nós a fazenda tem, calcula o ETA (em dias)
     de cada recurso. Recursos sem produção por nó (coins, gem, oil)
     ficam com days = null. Retorna também o gargalo (recurso mais lento). */
  expansionEta(missing, nodeCounts) {
    const perRes = {};
    let maxDays = 0;
    let bottleneck = null;
    for (const [res, needed] of Object.entries(missing || {})) {
      if (needed <= 0) continue;
      const perDay = this.resourcePerDay(res, (nodeCounts && nodeCounts[res]) || 0);
      const days = (perDay && perDay > 0) ? needed / perDay : null;
      perRes[res] = { needed, perDay: perDay || 0, days };
      if (days != null && days > maxDays) { maxDays = days; bottleneck = res; }
    }
    return { perRes, maxDays, bottleneck };
  }
};

/* ---------- Helper de tempo ----------
   Transforma segundos em texto curto: 90000 → "1d 1h" */
function formatDuration(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d) parts.push(d + "d");
  if (h) parts.push(h + "h");
  if (m && !d) parts.push(m + "min");
  return parts.join(" ") || "0min";
}
