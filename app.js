/* =========================================================
   app.js — PONTO DE ENTRADA.
   Liga tudo, controla idioma/tema e desenha as abas.
   Todos os textos de interface passam por t() (ver i18n.js).
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  Lang.init();
  Tabs.init();
  initTheme();
  initLang();
  renderAll();
});

/* Redesenha tudo — usado na carga e ao trocar de idioma. */
function renderAll() {
  applyStaticText();
  renderExpansionTab();
  renderCropsTab();
  renderResourcesTab();
  renderCookingTab();
  renderSummaryTab();
  renderInventoryTab();
  renderTasksTab();
  renderSettingsTab();
}

/* ---------------------------------------------------------
   IDIOMA — seletor PT / EN / ES no cabeçalho
   --------------------------------------------------------- */
function initLang() {
  const buttons = document.querySelectorAll("#lang-switch button");
  buttons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.lang === Lang.current);
    btn.addEventListener("click", () => {
      Lang.set(btn.dataset.lang);
      buttons.forEach(b => b.classList.toggle("active", b.dataset.lang === Lang.current));
      renderAll();
    });
  });
}

/* Textos fixos fora das abas: subtítulo, abas, rodapé. */
function applyStaticText() {
  document.documentElement.lang = Lang.current;
  document.querySelector(".brand-text p").textContent = t("app.subtitle");

  document.querySelectorAll(".tab-btn").forEach(btn => {
    const tab = btn.dataset.tab;
    const badge = (tab === "summary" || tab === "inventory" || tab === "tasks")
      ? ' <span class="badge">API</span>' : "";
    btn.innerHTML = t("tab." + tab) + badge;
  });

  const footer = document.querySelectorAll(".app-footer p");
  if (footer[0]) footer[0].textContent = t("footer.disclaimer");
  if (footer[1]) footer[1].textContent = t("footer.datasource");
}

/* ---------------------------------------------------------
   TEMA claro/escuro
   --------------------------------------------------------- */
function initTheme() {
  const saved = localStorage.getItem("sfl_eco_theme") || "light";
  applyTheme(saved);
  document.getElementById("theme-toggle").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    applyTheme(next);
    localStorage.setItem("sfl_eco_theme", next);
  });
}
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector(".theme-icon").textContent = theme === "light" ? "🌙" : "☀️";
}

/* ---------------------------------------------------------
   Helpers
   --------------------------------------------------------- */
function fmt(n) {
  return Number.isInteger(n) ? n.toString() : n.toFixed(2);
}
function localeTime(ts) {
  return new Date(ts).toLocaleTimeString(Lang.locale());
}
function localeDate(ts) {
  return new Date(ts).toLocaleDateString(Lang.locale());
}

/* Pega a fazenda: do cache se já carregada, senão busca via API.
   Lança Error (mensagem traduzida) se faltar chave/ID ou a chamada falhar. */
async function getFarm() {
  const cached = Api.getCachedFarm();
  if (cached) return cached.data;
  await Api.loadFarm();
  return Api.getCachedFarm().data;
}

/* Grade de "chips" de custo. */
function costGrid(cost, stateMap) {
  const entries = Object.entries(cost);
  if (entries.length === 0) {
    return `<p class="note">${t("exp.no_data")}</p>`;
  }
  const chips = entries.map(([res, amount]) => {
    const info = GAME_DATA.resources[res] || { label: res, icon: "❓" };
    const state = stateMap ? (stateMap[res] || "") : "";
    return `
      <div class="cost-chip ${state}">
        <span class="ico">${info.icon}</span>
        <div>
          <div class="val">${fmt(amount)}</div>
          <div class="name">${info.label}</div>
        </div>
      </div>`;
  }).join("");
  return `<div class="cost-grid">${chips}</div>`;
}

/* =========================================================
   ABA: EXPANSÃO
   ========================================================= */
function renderExpansionTab() {
  const panel = document.getElementById("tab-expansion");

  const islandOptions = GAME_DATA.islands
    .map(i => `<option value="${i.id}">${i.name}</option>`)
    .join("");

  panel.innerHTML = `
    <div class="card">
      <h2>${t("exp.title")}</h2>
      <p class="note">${t("exp.intro")}<br><em>${t("exp.note_totals")}</em></p>

      <div class="field-row">
        <div>
          <label for="exp-island">${t("exp.your_island")}</label>
          <select id="exp-island">${islandOptions}</select>
        </div>
        <div style="flex:0">
          <button class="btn" id="exp-calc">${t("exp.calculate")}</button>
        </div>
      </div>
      <div id="exp-result"></div>
    </div>

    <div class="card">
      <h3>${t("exp.owned_title")}</h3>
      <p class="note">${t("exp.owned_intro")}</p>
      <div id="exp-owned-inputs" class="cost-grid"></div>
      <div style="margin-top:14px">
        <button class="btn btn-ghost" id="exp-check">${t("exp.see_missing")}</button>
      </div>
      <div id="exp-missing"></div>
    </div>

    <div class="card">
      <h2>${t("exp.plan_title")}</h2>
      <p class="note">${t("exp.plan_intro")}</p>
      <div class="field-row">
        <div style="flex:0">
          <button class="btn" id="exp-use-farm">${t("common.use_my_farm")}</button>
        </div>
        <div id="exp-plan-status" style="align-self:center;font-size:13px;"></div>
      </div>
      <div id="exp-plan-result"></div>
    </div>
  `;

  const islandSelect = panel.querySelector("#exp-island");
  const ownedWrap    = panel.querySelector("#exp-owned-inputs");

  function showTotal() {
    const total = Calc.totalFromIsland(islandSelect.value);
    panel.querySelector("#exp-result").innerHTML = `
      <h3>${t("exp.total_title")}</h3>
      ${costGrid(total)}
    `;
    ownedWrap.innerHTML = Object.keys(total).map(res => {
      const info = GAME_DATA.resources[res] || { label: res, icon: "❓" };
      return `
        <div class="cost-chip">
          <span class="ico">${info.icon}</span>
          <div style="flex:1">
            <div class="name">${info.label}</div>
            <input type="number" min="0" value="0" data-res="${res}" />
          </div>
        </div>`;
    }).join("");
    panel.querySelector("#exp-missing").innerHTML = "";
  }

  function showMissing() {
    const total = Calc.totalFromIsland(islandSelect.value);
    const owned = {};
    ownedWrap.querySelectorAll("input[data-res]").forEach(inp => {
      owned[inp.dataset.res] = parseFloat(inp.value) || 0;
    });
    const missing = Calc.remaining(total, owned);
    const pct = Calc.progressPercent(total, owned);
    const stateMap = {};
    for (const [res, falta] of Object.entries(missing)) {
      stateMap[res] = falta === 0 ? "done" : "missing";
    }
    panel.querySelector("#exp-missing").innerHTML = `
      <h3>${t("exp.missing_title", { pct })}</h3>
      ${costGrid(missing, stateMap)}
    `;
  }

  /* Nome do recurso no inventário da API, por chave interna */
  const INV_NAME = {
    wood: "Wood", stone: "Stone", iron: "Iron", gold: "Gold",
    crimstone: "Crimstone", gem: "Gem", oil: "Oil"
  };

  /* Puxa a fazenda, preenche tudo e calcula o ETA. */
  async function useFarm() {
    const status = panel.querySelector("#exp-plan-status");
    const result = panel.querySelector("#exp-plan-result");
    status.textContent = t("common.loading");
    result.innerHTML = "";
    try {
      const farm = await getFarm();
      const islandType = farm.farm.island?.type || "basic";
      const inv = farm.farm.inventory || {};

      // ajusta o seletor pra ilha real e re-monta os inputs
      if (Calc.getIsland(islandType)) islandSelect.value = islandType;
      showTotal();

      // preenche "o que você tem" com o inventário real
      ownedWrap.querySelectorAll("input[data-res]").forEach(inp => {
        const res = inp.dataset.res;
        let have = 0;
        if (res === "coins") have = farm.farm.coins || 0;
        else if (INV_NAME[res]) have = parseFloat(inv[INV_NAME[res]] || "0") || 0;
        inp.value = have;
      });

      // calcula o que falta + ETA
      const total = Calc.totalFromIsland(islandSelect.value);
      const owned = {};
      ownedWrap.querySelectorAll("input[data-res]").forEach(inp => {
        owned[inp.dataset.res] = parseFloat(inp.value) || 0;
      });
      const missing = Calc.remaining(total, owned);
      const nodeCounts = Calc.farmNodeCounts(farm);
      const eta = Calc.expansionEta(missing, nodeCounts);

      renderEta(eta, islandSelect.value, nodeCounts);
      status.textContent = t("exp.filled_from_farm");
    } catch (e) {
      status.innerHTML = `<span class="warn-text">❌ ${e.message}</span>`;
    }
  }

  /* Desenha o painel de produção + tabela de ETA. */
  function renderEta(eta, islandId, nodeCounts) {
    const result = panel.querySelector("#exp-plan-result");
    const islandName = (Calc.getIsland(islandId) || {}).name || islandId;

    // produção diária (Painel de Produção)
    const prodChips = Object.entries(nodeCounts)
      .filter(([, n]) => n > 0)
      .map(([res, n]) => {
        const info = GAME_DATA.resources[res] || { label: res, icon: "❓" };
        const perDay = Calc.resourcePerDay(res, n);
        return `<div class="cost-chip"><span class="ico">${info.icon}</span>
          <div><div class="val">${perDay ? perDay.toFixed(1) : "—"}/d</div>
          <div class="name">${info.label} (${n})</div></div></div>`;
      }).join("");

    // tabela de ETA por recurso
    const rows = Object.entries(eta.perRes).map(([res, d]) => {
      const info = GAME_DATA.resources[res] || { label: res, icon: "❓" };
      const etaText = d.days == null
        ? `<span class="muted">${t("exp.eta_not_passive")}</span>`
        : t("exp.eta_days", { days: d.days.toFixed(1) });
      return `<tr>
        <td>${info.icon} ${info.label}</td>
        <td class="num">${fmt(d.needed)}</td>
        <td class="num">${d.perDay ? d.perDay.toFixed(1) : "—"}</td>
        <td class="num strong">${etaText}</td>
      </tr>`;
    }).join("");

    // resumo
    let summary;
    if (Object.keys(eta.perRes).length === 0) {
      summary = `<p class="note" style="border-left-color:var(--accent-2)">${t("exp.eta_all_ready")}</p>`;
    } else if (eta.bottleneck) {
      const bn = GAME_DATA.resources[eta.bottleneck] || { label: eta.bottleneck };
      summary = `<p class="note">${t("exp.eta_summary", {
        island: islandName, days: Math.ceil(eta.maxDays), res: bn.label
      })}</p>`;
    } else {
      summary = `<p class="note warn">${t("exp.eta_no_node")}</p>`;
    }

    result.innerHTML = `
      <h3>${t("exp.prod_title")}</h3>
      ${prodChips ? `<div class="cost-grid">${prodChips}</div>`
                  : `<p class="note warn">${t("exp.no_nodes")}</p>`}
      <h3>${t("exp.eta_title")}</h3>
      ${summary}
      ${rows ? `<div class="table-wrap"><table class="data-table">
        <thead><tr>
          <th>${t("exp.eta_col_res")}</th><th class="num">${t("exp.eta_col_need")}</th>
          <th class="num">${t("exp.eta_col_perday")}</th><th class="num">${t("exp.eta_col_eta")}</th>
        </tr></thead><tbody>${rows}</tbody></table></div>` : ""}
    `;
  }

  islandSelect.addEventListener("change", showTotal);
  panel.querySelector("#exp-calc").addEventListener("click", showTotal);
  panel.querySelector("#exp-check").addEventListener("click", showMissing);
  panel.querySelector("#exp-use-farm").addEventListener("click", useFarm);
  showTotal();
}

/* =========================================================
   ABA: PLANTAÇÕES
   ========================================================= */
function renderCropsTab() {
  const panel = document.getElementById("tab-crops");

  panel.innerHTML = `
    <div class="card">
      <h2>${t("crops.title")}</h2>
      <p class="note">${t("crops.intro")}</p>

      <div class="field-row">
        <div>
          <label for="crop-level">${t("crops.your_level")}</label>
          <input type="number" id="crop-level" min="1" max="100" value="100" />
        </div>
        <div>
          <label for="crop-plots">${t("crops.plots")}</label>
          <input type="number" id="crop-plots" min="1" value="1" />
        </div>
      </div>
      <div class="field-row">
        <div style="flex:0">
          <button class="btn btn-ghost" id="crop-use-farm">${t("common.use_my_farm")}</button>
        </div>
        <div id="crop-farm-status" style="align-self:center;font-size:13px;"></div>
      </div>
      <div id="crop-result"></div>
    </div>
  `;

  const levelInput = panel.querySelector("#crop-level");
  const plotsInput = panel.querySelector("#crop-plots");

  async function useFarm() {
    const status = panel.querySelector("#crop-farm-status");
    status.textContent = t("common.loading");
    try {
      const farm = await getFarm();
      const xp = farm.farm.bumpkin?.experience || 0;
      const plots = parseFloat(farm.farm.inventory?.["Crop Plot"] || "1") || 1;
      levelInput.value = Calc.bumpkinLevel(xp).level;
      plotsInput.value = plots;
      render();
      status.textContent = t("crops.filled_from_farm");
    } catch (e) {
      status.innerHTML = `<span class="warn-text">❌ ${e.message}</span>`;
    }
  }

  function render() {
    const level = parseInt(levelInput.value) || 1;
    const plots = Math.max(1, parseInt(plotsInput.value) || 1);
    const ranked = Calc.rankCrops(level);

    if (ranked.length === 0) {
      panel.querySelector("#crop-result").innerHTML =
        `<p class="note warn">${t("crops.none")}</p>`;
      return;
    }

    const rows = ranked.map((c, i) => `
      <tr class="${i === 0 ? "best-row" : ""}">
        <td>${c.icon} ${c.name}</td>
        <td class="num">Lv ${c.level}</td>
        <td class="num">${fmt(c.seedCost)}</td>
        <td class="num">${fmt(c.sellPrice)}</td>
        <td class="num">${formatDuration(c.growSeconds)}</td>
        <td class="num">${c.profit.toFixed(2)}</td>
        <td class="num strong">${c.profitPerHour.toFixed(2)}</td>
        <td class="num strong">${(c.profitPerHour * plots).toFixed(2)}</td>
      </tr>`).join("");

    panel.querySelector("#crop-result").innerHTML = `
      <p class="note">${t("crops.best", {
        name: `${ranked[0].icon} ${ranked[0].name}`,
        value: ranked[0].profitPerHour.toFixed(2)
      })}</p>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>${t("crops.col_crop")}</th><th class="num">${t("crops.col_level")}</th>
              <th class="num">${t("crops.col_seed")}</th><th class="num">${t("crops.col_sell")}</th>
              <th class="num">${t("crops.col_time")}</th><th class="num">${t("crops.col_profit")}</th>
              <th class="num">${t("crops.col_pph")}</th>
              <th class="num">${t("crops.col_pph_plots", { plots })}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  levelInput.addEventListener("input", render);
  plotsInput.addEventListener("input", render);
  panel.querySelector("#crop-use-farm").addEventListener("click", useFarm);
  render();
}

/* =========================================================
   ABA: RECURSOS
   ========================================================= */
function renderResourcesTab() {
  const panel = document.getElementById("tab-resources");
  const resList = Calc.listResources();

  const rows = resList.map(r => `
    <tr data-res="${r.key}">
      <td>${r.icon} ${r.label}</td>
      <td class="num">${r.recoverySeconds ? formatDuration(r.recoverySeconds) : "—"}</td>
      <td class="num">${fmt(r.baseYield)}</td>
      <td class="num">
        <input type="number" min="0" value="1" data-node="${r.key}" style="width:80px" />
      </td>
      <td class="num strong" data-perday="${r.key}">—</td>
    </tr>
  `).join("");

  panel.innerHTML = `
    <div class="card">
      <h2>${t("res.title")}</h2>
      <p class="note">${t("res.intro")}<br><strong>Oil:</strong> ${t("res.note_oil")}</p>
      <div class="field-row">
        <div style="flex:0">
          <button class="btn" id="res-use-farm">${t("common.use_my_farm")}</button>
        </div>
        <div id="res-farm-status" style="align-self:center;font-size:13px;"></div>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>${t("res.col_resource")}</th><th class="num">${t("res.col_respawn")}</th>
              <th class="num">${t("res.col_yield")}</th><th class="num">${t("res.col_nodes")}</th>
              <th class="num">${t("res.col_perday")}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  `;

  function recalc() {
    panel.querySelectorAll("input[data-node]").forEach(inp => {
      const key = inp.dataset.node;
      const n = Math.max(0, parseInt(inp.value) || 0);
      const perDay = Calc.resourcePerDay(key, n);
      const cell = panel.querySelector(`[data-perday="${key}"]`);
      cell.textContent = perDay == null ? "—" : perDay.toFixed(2);
    });
  }

  async function useFarm() {
    const status = panel.querySelector("#res-farm-status");
    status.textContent = t("common.loading");
    try {
      const farm = await getFarm();
      const counts = Calc.farmNodeCounts(farm);
      panel.querySelectorAll("input[data-node]").forEach(inp => {
        const key = inp.dataset.node;
        if (counts[key] != null) inp.value = counts[key];
      });
      recalc();
      status.textContent = t("res.filled_from_farm");
    } catch (e) {
      status.innerHTML = `<span class="warn-text">❌ ${e.message}</span>`;
    }
  }

  panel.querySelectorAll("input[data-node]").forEach(inp =>
    inp.addEventListener("input", recalc));
  panel.querySelector("#res-use-farm").addEventListener("click", useFarm);
  recalc();
}

/* =========================================================
   ABA: COZINHA
   ========================================================= */
function renderCookingTab() {
  const panel = document.getElementById("tab-cooking");

  const buildings = [...new Set(GAME_DATA.recipes.map(r => r.building))];
  const buildingOpts = [`<option value="">${t("cook.all_buildings")}</option>`]
    .concat(buildings.map(b => `<option value="${b}">${b}</option>`))
    .join("");

  panel.innerHTML = `
    <div class="card">
      <h2>${t("cook.title")}</h2>
      <p class="note">${t("cook.intro")}</p>

      <div class="field-row">
        <div>
          <label for="cook-building">${t("cook.building")}</label>
          <select id="cook-building">${buildingOpts}</select>
        </div>
      </div>
      <div id="cook-result"></div>
    </div>

    <div class="card">
      <h2>${t("cook.plan_title")}</h2>
      <p class="note">${t("cook.plan_intro")}</p>
      <div class="field-row">
        <div>
          <label for="plan-cur">${t("cook.cur_level")}</label>
          <input type="number" id="plan-cur" min="1" max="100" value="1" />
        </div>
        <div>
          <label for="plan-target">${t("cook.target_level")}</label>
          <input type="number" id="plan-target" min="2" max="100" value="11" />
        </div>
        <div style="flex:0; align-self:flex-end">
          <button class="btn" id="plan-calc">${t("cook.plan_btn")}</button>
        </div>
      </div>
      <div class="field-row">
        <div style="flex:0">
          <button class="btn btn-ghost" id="plan-use-farm">${t("common.use_my_farm")}</button>
        </div>
        <div id="plan-farm-status" style="align-self:center;font-size:13px;"></div>
      </div>
      <div id="plan-result"></div>
    </div>
  `;

  const buildingSelect = panel.querySelector("#cook-building");

  function render() {
    const ranked = Calc.rankRecipes(buildingSelect.value || null);

    const rows = ranked.map((r, i) => {
      const ingText = Object.entries(r.ingredients)
        .map(([ing, qty]) => `${fmt(qty)}× ${ing}`).join(", ");
      const { cost, hasUnknown } = Calc.recipeCropCost(r);
      const costText = (cost > 0 ? cost.toFixed(2) : "0") + (hasUnknown ? " + ?" : "");
      const xph = r.xpPerHour === Infinity ? "∞" : r.xpPerHour.toFixed(0);
      const time = r.cookSeconds === 0 ? t("cook.instant") : formatDuration(r.cookSeconds);
      return `
        <tr class="${i === 0 ? "best-row" : ""}">
          <td>${r.name}</td>
          <td>${r.building}</td>
          <td class="num">${r.xp}</td>
          <td class="num">${time}</td>
          <td class="num strong">${xph}</td>
          <td class="num">${costText}</td>
          <td>${ingText}</td>
        </tr>`;
    }).join("");

    const scope = buildingSelect.value
      ? t("cook.scope_in", { building: buildingSelect.value })
      : t("cook.scope_overall");

    panel.querySelector("#cook-result").innerHTML = `
      <p class="note">${t("cook.best", {
        scope,
        name: ranked[0].name,
        value: ranked[0].xpPerHour === Infinity ? "∞" : ranked[0].xpPerHour.toFixed(0)
      })}</p>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>${t("cook.col_recipe")}</th><th>${t("cook.col_building")}</th>
              <th class="num">XP</th><th class="num">${t("cook.col_time")}</th>
              <th class="num">XP/h</th><th class="num">${t("cook.col_cost")}</th>
              <th>${t("cook.col_ing")}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  buildingSelect.addEventListener("change", render);
  render();

  /* ----- Planejador de Nível ----- */
  const curInput    = panel.querySelector("#plan-cur");
  const targetInput = panel.querySelector("#plan-target");

  function renderPlan() {
    const cur = parseInt(curInput.value) || 1;
    const target = parseInt(targetInput.value) || (cur + 1);
    const box = panel.querySelector("#plan-result");

    if (target <= cur) {
      box.innerHTML = `<p class="note warn">${t("cook.plan_invalid")}</p>`;
      return;
    }

    const gap = Calc.xpForLevel(target) - Calc.xpForLevel(cur);

    // melhores receitas pra grindar: ignora as instantâneas (especiais)
    const recipes = Calc.rankRecipes()
      .filter(r => r.cookSeconds > 0)
      .slice(0, 6);

    const rows = recipes.map(r => {
      const cooks = Math.ceil(gap / r.xp);
      const totalSec = cooks * r.cookSeconds;
      return `<tr>
        <td>${r.name}</td>
        <td>${r.building}</td>
        <td class="num">${r.xp}</td>
        <td class="num strong">${cooks}×</td>
        <td class="num">${formatDuration(totalSec)}</td>
      </tr>`;
    }).join("");

    box.innerHTML = `
      <p class="note">${t("cook.plan_gap", {
        xp: gap.toLocaleString(Lang.locale()), from: cur, to: target
      })}</p>
      <p class="note">${t("cook.plan_recipes")}</p>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>${t("cook.col_recipe")}</th><th>${t("cook.col_building")}</th>
            <th class="num">XP</th><th class="num">${t("cook.plan_col_cooks")}</th>
            <th class="num">${t("cook.plan_col_time")}</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  async function planUseFarm() {
    const status = panel.querySelector("#plan-farm-status");
    status.textContent = t("common.loading");
    try {
      const farm = await getFarm();
      const lvl = Calc.bumpkinLevel(farm.farm.bumpkin?.experience || 0).level;
      curInput.value = lvl;
      if (parseInt(targetInput.value) <= lvl) targetInput.value = lvl + 1;
      renderPlan();
      status.textContent = t("cook.plan_filled", { level: lvl });
    } catch (e) {
      status.innerHTML = `<span class="warn-text">❌ ${e.message}</span>`;
    }
  }

  curInput.addEventListener("input", renderPlan);
  targetInput.addEventListener("input", renderPlan);
  panel.querySelector("#plan-calc").addEventListener("click", renderPlan);
  panel.querySelector("#plan-use-farm").addEventListener("click", planUseFarm);
  renderPlan();
}

/* =========================================================
   ABA: RESUMO  (usa API)
   ========================================================= */
function renderSummaryTab() {
  const panel = document.getElementById("tab-summary");

  /* readyAt (ms) de cada nó de uma coleção. tsPath ex: ["wood","choppedAt"] */
  function nodeReadyAts(coll, tsPath, recoverySec) {
    return Object.values(coll || {}).map(node => {
      let ts = node;
      for (const p of tsPath) ts = ts && ts[p];
      return (ts || 0) + recoverySec * 1000;
    });
  }
  /* readyAt de cada plantio — usa o boostedTime que a própria API fornece */
  function cropReadyAts(crops) {
    return Object.values(crops || {}).map(c => {
      const crop = c.crop || {};
      const def = GAME_DATA.crops.find(x => x.name === crop.name);
      const growMs = def ? def.growSeconds * 1000 : 0;
      return (crop.plantedAt || 0) + growMs - (crop.boostedTime || 0);
    });
  }

  /* Seção "Pronto Agora" — o que dá pra colher já */
  function readyNowSection(farm) {
    const groups = [
      { icon: "🌳", label: t("sum.trees"),     ats: nodeReadyAts(farm.trees,      ["wood","choppedAt"], 7200) },
      { icon: "🪨", label: t("sum.stones"),    ats: nodeReadyAts(farm.stones,     ["stone","minedAt"], 14400) },
      { icon: "⛓️", label: t("sum.iron"),      ats: nodeReadyAts(farm.iron,       ["stone","minedAt"], 28800) },
      { icon: "🟡", label: t("sum.gold"),      ats: nodeReadyAts(farm.gold,       ["stone","minedAt"], 86400) },
      { icon: "🔴", label: t("sum.crimstone"), ats: nodeReadyAts(farm.crimstones, ["stone","minedAt"], 86400) },
      { icon: "🌾", label: t("sum.plots"),     ats: cropReadyAts(farm.crops) }
    ].filter(g => g.ats.length > 0);
    if (!groups.length) return "";

    const cards = groups.map(g => {
      const r = Calc.readinessFromReadyAts(g.ats);
      const next = r.nextInSec == null
        ? `<div class="stat-sub" style="color:var(--accent-2)">${t("sum.ready_all")}</div>`
        : `<div class="stat-sub">${t("sum.ready_next", { time: formatDuration(r.nextInSec) })}</div>`;
      return `<div class="stat">
        <div class="stat-value">${g.icon} ${r.ready}/${r.total}</div>
        <div class="stat-sub">${g.label}</div>
        ${next}
      </div>`;
    }).join("");
    return `<h3>${t("sum.ready_title")}</h3>
      <p class="note">${t("sum.ready_intro")}</p>
      <div class="stat-grid stat-grid-small">${cards}</div>`;
  }

  /* Seção "Histórico" — evolução de coins/FLOWER/nível entre carregamentos */
  function historySection() {
    const hist = Api.getHistory();
    if (hist.length < 2) {
      return `<h3>${t("sum.hist_title")}</h3><p class="note">${t("sum.hist_empty")}</p>`;
    }
    const recent = hist.slice(-8).reverse();
    const delta = (cur, prev, dec) => {
      if (prev == null) return "";
      const d = cur - prev;
      if (Math.abs(d) < (dec ? 0.01 : 1)) return "";
      const sign = d > 0 ? "+" : "";
      const cls = d > 0 ? "delta-up" : "delta-down";
      return ` <span class="${cls}">${sign}${dec ? d.toFixed(2) : Math.round(d)}</span>`;
    };
    const rows = recent.map((s, i) => {
      const prev = recent[i + 1];
      const lvl = Calc.bumpkinLevel(s.xp).level;
      return `<tr>
        <td>${localeDate(s.t)} ${localeTime(s.t)}</td>
        <td class="num">${s.coins.toFixed(0)}${delta(s.coins, prev && prev.coins, false)}</td>
        <td class="num">${s.flower.toFixed(2)}${delta(s.flower, prev && prev.flower, true)}</td>
        <td class="num">Lv ${lvl}</td>
      </tr>`;
    }).join("");
    return `<h3>${t("sum.hist_title")}</h3>
      <p class="note">${t("sum.hist_intro")}</p>
      <div class="table-wrap"><table class="data-table">
        <thead><tr>
          <th>${t("sum.hist_when")}</th><th class="num">🪙 Coins</th>
          <th class="num">🌸 FLOWER</th><th class="num">${t("sum.bumpkin")}</th>
        </tr></thead><tbody>${rows}</tbody></table></div>
      <div style="margin-top:10px">
        <button class="btn btn-danger" id="hist-clear">${t("sum.hist_clear")}</button>
      </div>`;
  }

  function render() {
    const cached = Api.getCachedFarm();
    if (!cached) {
      panel.innerHTML = `
        <div class="card">
          <h2>${t("sum.title")}</h2>
          <p class="note">${t("sum.intro")}</p>
          <button class="btn" id="summary-load">${t("sum.load")}</button>
          <div id="summary-status" style="margin-top:14px"></div>
        </div>
      `;
      panel.querySelector("#summary-load").addEventListener("click", loadFarm);
      return;
    }
    renderWithData(cached.data, cached.fetchedAt);
  }

  async function loadFarm() {
    const status = panel.querySelector("#summary-status");
    if (status) status.innerHTML = `<p class="note">${t("sum.loading")}</p>`;
    try {
      await Api.loadFarm();
      render();
    } catch (e) {
      if (status) status.innerHTML = `<p class="note warn">❌ ${e.message}</p>`;
    }
  }

  function renderWithData(farmData, fetchedAt) {
    const farm = farmData.farm;
    const bumpkin = farm.bumpkin || {};
    const inv = farm.inventory || {};
    const item = (n) => parseFloat(inv[n] || "0");
    const lvl = Calc.bumpkinLevel(bumpkin.experience || 0);
    const vipActive = farm.vip?.expiresAt > Date.now();
    const islandName = (farm.island?.type || "?").replace(/^./, c => c.toUpperCase());
    const skills = Object.keys(bumpkin.skills || {});
    const achievements = Object.keys(bumpkin.achievements || {});

    panel.innerHTML = `
      <div class="card">
        <h2>${farm.username ? t("sum.farm_of", { name: farm.username }) : t("sum.farm")}
          <span class="muted">#${farmData.id}</span></h2>
        <p class="note">${t("sum.updated_at", { time: localeTime(fetchedAt) })}</p>

        <div class="stat-grid">
          <div class="stat">
            <div class="stat-label">${t("sum.bumpkin")}</div>
            <div class="stat-value">Lv ${lvl.level}</div>
            <div class="stat-sub">${Math.floor(lvl.currentXp).toLocaleString(Lang.locale())} XP</div>
            <div class="progress-bar"><div class="progress-fill" style="width:${lvl.progressPercent}%"></div></div>
            <div class="stat-sub">${t("sum.level_progress", { pct: lvl.progressPercent, n: lvl.level + 1 })}</div>
          </div>
          <div class="stat">
            <div class="stat-label">${t("sum.island")}</div>
            <div class="stat-value">${islandName}</div>
          </div>
          <div class="stat">
            <div class="stat-label">🪙 Coins</div>
            <div class="stat-value">${farm.coins?.toFixed(2) || "0"}</div>
          </div>
          <div class="stat">
            <div class="stat-label">🌸 FLOWER</div>
            <div class="stat-value">${parseFloat(farm.balance || "0").toFixed(2)}</div>
          </div>
          <div class="stat">
            <div class="stat-label">💎 Gems</div>
            <div class="stat-value">${item("Gem")}</div>
          </div>
          ${vipActive ? `
            <div class="stat">
              <div class="stat-label">⭐ VIP</div>
              <div class="stat-value">✓</div>
              <div class="stat-sub">${t("sum.until", { date: localeDate(farm.vip.expiresAt) })}</div>
            </div>
          ` : ""}
        </div>

        <h3>${t("sum.nodes_title")}</h3>
        <div class="stat-grid stat-grid-small">
          <div class="stat"><div class="stat-value">🌾 ${item("Crop Plot")}</div><div class="stat-sub">${t("sum.plots")}</div></div>
          <div class="stat"><div class="stat-value">🌳 ${item("Tree")}</div><div class="stat-sub">${t("sum.trees")}</div></div>
          <div class="stat"><div class="stat-value">🪨 ${item("Stone Rock")}</div><div class="stat-sub">${t("sum.stones")}</div></div>
          <div class="stat"><div class="stat-value">⛓️ ${item("Iron Rock")}</div><div class="stat-sub">${t("sum.iron")}</div></div>
          <div class="stat"><div class="stat-value">🟡 ${item("Gold Rock")}</div><div class="stat-sub">${t("sum.gold")}</div></div>
          <div class="stat"><div class="stat-value">🔴 ${item("Crimstone Rock")}</div><div class="stat-sub">${t("sum.crimstone")}</div></div>
        </div>

        ${skills.length ? `
          <h3>${t("sum.skills", { n: skills.length })}</h3>
          <div class="chip-row">${skills.map(s => `<span class="chip">${s}</span>`).join("")}</div>
        ` : ""}

        ${achievements.length ? `
          <h3>${t("sum.achievements", { n: achievements.length })}</h3>
          <div class="chip-row">${achievements.map(a => `<span class="chip chip-gold">${a}</span>`).join("")}</div>
        ` : ""}

        ${readyNowSection(farm)}
        ${historySection()}

        <div style="margin-top:18px">
          <button class="btn btn-ghost" id="summary-reload">${t("common.update")}</button>
        </div>
        <div id="summary-status" style="margin-top:14px"></div>
      </div>
    `;
    panel.querySelector("#summary-reload").addEventListener("click", loadFarm);
    const histClear = panel.querySelector("#hist-clear");
    if (histClear) histClear.addEventListener("click", () => {
      Api.clearHistory();
      render();
    });
  }

  render();
}

/* =========================================================
   ABA: INVENTÁRIO  (usa API)
   ========================================================= */
function renderInventoryTab() {
  const panel = document.getElementById("tab-inventory");

  const CROP_NAMES = new Set(GAME_DATA.crops.map(c => c.name));
  const RESOURCES  = new Set(["Wood","Stone","Iron","Gold","Crimstone","Sunstone","Oil","Gem","Salt Rock"]);
  const TOOLS      = new Set(["Axe","Pickaxe","Stone Pickaxe","Iron Pickaxe","Gold Pickaxe","Rod","Oil Drill","Sand Shovel","Sand Drill","Shovel","Rusty Shovel","Salt Rake","Crab Pot","Mariner Pot"]);
  const BUILDINGS  = new Set(["Town Center","Market","Workbench","Fire Pit","Water Well","Compost Bin","Kitchen","Bakery","Deli","Smoothie Shack","Hen House","Barn","Greenhouse","Crafting Box","Tent","House","Manor","Mansion","Crop Machine","Toolshed","Warehouse"]);
  const COLLECT    = new Set(["Basic Scarecrow","Scary Mike","Laurie the Chuckle Crow","Basic Bear","Time Warp Totem","Treasure Map","Magic Mushroom"]);

  /* devolve a CHAVE de categoria (i18n) de um item */
  function categorize(name) {
    if (name.endsWith(" Seed") || name.endsWith(" Plant")) return "inv.cat_seeds";
    if (CROP_NAMES.has(name)) return "inv.cat_crops";
    if (RESOURCES.has(name)) return "inv.cat_resources";
    if (TOOLS.has(name)) return "inv.cat_tools";
    if (BUILDINGS.has(name)) return "inv.cat_buildings";
    if (name.endsWith(" Land") || name === "Crop Plot" || name.endsWith(" Rock") || name === "Tree") return "inv.cat_land";
    if (COLLECT.has(name)) return "inv.cat_collect";
    if (["Wild Mushroom","Earthworm","Dung","Weed","Sprout Mix","Love Charm"].includes(name)) return "inv.cat_misc";
    return "inv.cat_other";
  }

  function render() {
    const cached = Api.getCachedFarm();
    if (!cached) {
      panel.innerHTML = `
        <div class="card">
          <h2>${t("inv.title")}</h2>
          <p class="note">${t("inv.intro")}</p>
          <button class="btn" id="inv-load">${t("inv.load")}</button>
          <div id="inv-status" style="margin-top:14px"></div>
        </div>
      `;
      panel.querySelector("#inv-load").addEventListener("click", loadFarm);
      return;
    }
    renderWithData(cached.data, cached.fetchedAt);
  }

  async function loadFarm() {
    const status = panel.querySelector("#inv-status");
    if (status) status.innerHTML = `<p class="note">${t("inv.loading")}</p>`;
    try {
      await Api.loadFarm();
      render();
    } catch (e) {
      if (status) status.innerHTML = `<p class="note warn">❌ ${e.message}</p>`;
    }
  }

  function renderWithData(farmData, fetchedAt) {
    const inv = farmData.farm.inventory || {};
    const groups = {};
    for (const [name, count] of Object.entries(inv)) {
      const c = parseFloat(count);
      if (c === 0) continue;
      const cat = categorize(name);
      (groups[cat] = groups[cat] || []).push({ name, count: c });
    }

    const order = [
      "inv.cat_land", "inv.cat_seeds", "inv.cat_crops", "inv.cat_resources",
      "inv.cat_tools", "inv.cat_buildings", "inv.cat_collect",
      "inv.cat_misc", "inv.cat_other"
    ];
    const sortedCats = order.filter(c => groups[c]);
    const totalItems = Object.values(groups).reduce((a, g) => a + g.length, 0);

    const sectionsHtml = sortedCats.map(catKey => {
      const items = groups[catKey].sort((a, b) => a.name.localeCompare(b.name));
      const chips = items.map(i => `
        <div class="inv-chip">
          <div class="inv-name">${i.name}</div>
          <div class="inv-count">${Number.isInteger(i.count) ? i.count : i.count.toFixed(2)}</div>
        </div>
      `).join("");
      return `
        <h3>${t(catKey)} <span class="muted">(${items.length})</span></h3>
        <div class="inv-grid">${chips}</div>
      `;
    }).join("");

    panel.innerHTML = `
      <div class="card">
        <h2>${t("inv.title")}</h2>
        <p class="note">${t("inv.count", { n: totalItems, time: localeTime(fetchedAt) })}</p>
        ${sectionsHtml}
        <div style="margin-top:18px">
          <button class="btn btn-ghost" id="inv-reload">${t("common.update")}</button>
        </div>
        <div id="inv-status" style="margin-top:14px"></div>
      </div>
    `;
    panel.querySelector("#inv-reload").addEventListener("click", loadFarm);
  }

  render();
}

/* =========================================================
   ABA: TAREFAS  (entregas + bounties da API)
   ========================================================= */
function renderTasksTab() {
  const panel = document.getElementById("tab-tasks");

  /* Formata uma recompensa { coins?, sfl?, items? } */
  function fmtReward(r) {
    if (!r) return "—";
    const parts = [];
    if (r.coins) parts.push(`${r.coins} 🪙`);
    if (r.sfl)   parts.push(`${r.sfl} 🌸`);
    if (r.items) for (const [n, q] of Object.entries(r.items)) parts.push(`${q}× ${n}`);
    return parts.length ? parts.join(", ") : "—";
  }
  /* Valor pra ordenar — só coins vira número; resto vai pro fim */
  function rewardValue(r) {
    return (r && r.coins) ? r.coins : -1;
  }

  function render() {
    const cached = Api.getCachedFarm();
    if (!cached) {
      panel.innerHTML = `
        <div class="card">
          <h2>${t("tasks.title")}</h2>
          <p class="note">${t("tasks.intro")}</p>
          <button class="btn" id="tasks-load">${t("tasks.load")}</button>
          <div id="tasks-status" style="margin-top:14px"></div>
        </div>`;
      panel.querySelector("#tasks-load").addEventListener("click", loadFarm);
      return;
    }
    renderWithData(cached.data, cached.fetchedAt);
  }

  async function loadFarm() {
    const status = panel.querySelector("#tasks-status");
    if (status) status.innerHTML = `<p class="note">${t("tasks.loading")}</p>`;
    try {
      await Api.loadFarm();
      render();
    } catch (e) {
      if (status) status.innerHTML = `<p class="note warn">❌ ${e.message}</p>`;
    }
  }

  function renderWithData(farmData, fetchedAt) {
    const farm = farmData.farm;
    const orders   = (farm.delivery && farm.delivery.orders) || [];
    const bounties = (farm.bounties && farm.bounties.requests) || [];

    // entregas — ordenadas por valor de coins
    const delRows = [...orders]
      .sort((a, b) => rewardValue(b.reward) - rewardValue(a.reward))
      .map(o => {
        const wants = Object.entries(o.items || {})
          .map(([n, q]) => `${q}× ${n}`).join(", ");
        return `<tr>
          <td>${o.from || "?"}</td>
          <td>${wants || "—"}</td>
          <td class="num strong">${fmtReward(o.reward)}</td>
        </tr>`;
      }).join("");

    // bounties — a recompensa fica no próprio objeto
    const bRows = [...bounties]
      .sort((a, b) => rewardValue(b) - rewardValue(a))
      .map(b => `<tr>
        <td>${b.name || "?"}${b.level ? ` <span class="muted">Lv ${b.level}</span>` : ""}</td>
        <td class="num strong">${fmtReward(b)}</td>
      </tr>`).join("");

    panel.innerHTML = `
      <div class="card">
        <h2>${t("tasks.title")}</h2>
        <p class="note">${t("tasks.updated", { time: localeTime(fetchedAt) })}</p>

        <h3>${t("tasks.deliveries_title")} <span class="muted">(${orders.length})</span></h3>
        ${orders.length ? `<div class="table-wrap"><table class="data-table">
          <thead><tr>
            <th>${t("tasks.del_from")}</th><th>${t("tasks.del_wants")}</th>
            <th class="num">${t("tasks.del_reward")}</th>
          </tr></thead><tbody>${delRows}</tbody></table></div>`
          : `<p class="note">${t("tasks.none_del")}</p>`}

        <h3>${t("tasks.bounties_title")} <span class="muted">(${bounties.length})</span></h3>
        ${bounties.length ? `<div class="table-wrap"><table class="data-table">
          <thead><tr>
            <th>${t("tasks.bounty_deliver")}</th><th class="num">${t("tasks.bounty_reward")}</th>
          </tr></thead><tbody>${bRows}</tbody></table></div>`
          : `<p class="note">${t("tasks.none_bounty")}</p>`}

        <div style="margin-top:18px">
          <button class="btn btn-ghost" id="tasks-reload">${t("common.update")}</button>
        </div>
        <div id="tasks-status" style="margin-top:14px"></div>
      </div>
    `;
    panel.querySelector("#tasks-reload").addEventListener("click", loadFarm);
  }

  render();
}

/* =========================================================
   ABA: CONFIG
   ========================================================= */
function renderSettingsTab() {
  const panel = document.getElementById("tab-settings");

  panel.innerHTML = `
    <div class="card">
      <h2>${t("set.key_title")}</h2>
      <p class="note warn">${t("set.key_security")}</p>
      <p class="note">${t("set.key_only")}</p>
      <label for="api-key-input">${t("set.key_paste")}</label>
      <input type="text" id="api-key-input" placeholder="sfl...." autocomplete="off" />
      <div class="field-row" style="margin-top:14px">
        <div style="flex:0"><button class="btn" id="api-save">${t("set.key_save")}</button></div>
        <div style="flex:0"><button class="btn btn-danger" id="api-clear">${t("set.delete")}</button></div>
      </div>
      <div id="api-status" style="margin-top:12px; font-size:14px;"></div>
    </div>

    <div class="card">
      <h2>${t("set.test_title")}</h2>
      <p class="note">${t("set.test_intro")}</p>
      <button class="btn" id="test-conn">${t("set.test_btn")}</button>
      <div id="test-result" style="margin-top:14px"></div>
    </div>

    <div class="card">
      <h3>${t("set.farm_title")}</h3>
      <p class="note">${t("set.farm_optional")}</p>
      <label for="farm-id-input">${t("set.farm_label")}</label>
      <input type="text" id="farm-id-input" placeholder="${t("set.farm_ph")}" autocomplete="off" />
      <div class="field-row" style="margin-top:14px">
        <div style="flex:0"><button class="btn btn-ghost" id="farm-save">${t("set.farm_save")}</button></div>
        <div style="flex:0"><button class="btn btn-danger" id="farm-clear">${t("set.farm_clear_btn")}</button></div>
        <div id="farm-status" style="align-self:center; font-size:14px;"></div>
      </div>
    </div>

    <div class="card">
      <h3>${t("set.debug_title")}</h3>
      <p class="note">${t("set.debug_intro")}</p>
      <pre class="debug" id="debug-box">${t("set.debug_empty")}</pre>
    </div>
  `;

  const keyInput   = panel.querySelector("#api-key-input");
  const keyStatus  = panel.querySelector("#api-status");
  const farmInput  = panel.querySelector("#farm-id-input");
  const farmStatus = panel.querySelector("#farm-status");
  const debugBox   = panel.querySelector("#debug-box");
  const resultBox  = panel.querySelector("#test-result");

  function refreshKey() {
    if (!Api.hasKey()) { keyStatus.innerHTML = t("set.key_none"); return; }
    const detected = Api.farmIdFromKey();
    let msg = t("set.key_saved", { key: `<code>${Api.maskedKey()}</code>` });
    msg += detected
      ? `<br>${t("set.key_detected_id", { id: `<code>${detected}</code>` })}`
      : `<br><span class="warn-text">${t("set.key_no_id")}</span>`;
    keyStatus.innerHTML = msg;
  }
  function refreshFarm() {
    const eff = Api.effectiveFarmId();
    if (!eff) { farmStatus.innerHTML = t("set.farm_none"); return; }
    const src = Api.hasFarmId() ? t("set.farm_src_manual") : t("set.farm_src_key");
    farmStatus.innerHTML = t("set.farm_using", { id: `<code>${eff}</code>`, src });
  }

  panel.querySelector("#api-save").addEventListener("click", () => {
    const v = keyInput.value.trim();
    if (!v) { keyStatus.textContent = t("set.key_empty"); return; }
    Api.setKey(v); keyInput.value = "";
    refreshKey(); refreshFarm();
  });
  panel.querySelector("#api-clear").addEventListener("click", () => {
    Api.clearKey(); refreshKey(); refreshFarm();
  });

  panel.querySelector("#farm-save").addEventListener("click", () => {
    const v = farmInput.value.trim();
    if (!v) { farmStatus.textContent = t("set.farm_empty"); return; }
    Api.setFarmId(v); farmInput.value = ""; refreshFarm();
  });
  panel.querySelector("#farm-clear").addEventListener("click", () => {
    Api.clearFarmId(); refreshFarm();
  });

  panel.querySelector("#test-conn").addEventListener("click", async () => {
    resultBox.innerHTML = `<p class="note">${t("set.testing")}</p>`;
    debugBox.textContent = t("set.requesting");
    try {
      const data = await Api.fetchFarm(Api.effectiveFarmId());
      resultBox.innerHTML = `<p class="note" style="border-left-color: var(--accent-2);">${t("set.test_ok")}</p>`;
      debugBox.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      resultBox.innerHTML = `<p class="note warn">❌ ${e.message}</p>`;
      debugBox.textContent = e.detail || e.message;
    }
  });

  refreshKey();
  refreshFarm();
}
