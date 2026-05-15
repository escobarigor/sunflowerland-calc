/* =========================================================
   app.js — PONTO DE ENTRADA.
   Liga tudo e desenha o conteúdo das abas que já têm lógica.
   (As abas placeholder são HTML estático no index.html.)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  Tabs.init();
  initTheme();
  renderExpansionTab();
  renderCropsTab();
  renderResourcesTab();
  renderCookingTab();
  renderSettingsTab();
});

/* ---------------------------------------------------------
   TEMA claro/escuro — guarda a escolha no localStorage
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
   Helpers de UI
   --------------------------------------------------------- */

/* Formata número: tira casas decimais desnecessárias */
function fmt(n) {
  return Number.isInteger(n) ? n.toString() : n.toFixed(2);
}

/* Monta a grade de "chips" de custo a partir de um objeto { wood: 10, ... }.
   `state` opcional: "missing" (falta) ou "done" (já tem) muda a cor. */
function costGrid(cost, stateMap) {
  const entries = Object.entries(cost);
  if (entries.length === 0) {
    return `<p class="note">Sem dados de custo cadastrados ainda para esta etapa.</p>`;
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
   ABA: EXPANSÃO  (exemplo completo e funcional)
   ========================================================= */
function renderExpansionTab() {
  const panel = document.getElementById("tab-expansion");

  const islandOptions = GAME_DATA.islands
    .map(i => `<option value="${i.id}">${i.name}</option>`)
    .join("");

  panel.innerHTML = `
    <div class="card">
      <h2>🏝️ Custo de Expansão</h2>
      <p class="note">
        Escolha em que ilha você está. O cálculo mostra o total de recursos
        para completar dali até o fim do jogo (incluindo os upgrades de ilha).
        <br><strong>Obs:</strong> por enquanto usamos os <em>totais por ilha</em> —
        o custo de cada nível individual a gente preenche depois.
      </p>

      <div class="field-row">
        <div>
          <label for="exp-island">Sua ilha atual</label>
          <select id="exp-island">${islandOptions}</select>
        </div>
        <div style="flex:0">
          <button class="btn" id="exp-calc">Calcular</button>
        </div>
      </div>

      <div id="exp-result"></div>
    </div>

    <div class="card">
      <h3>O que você já tem (opcional)</h3>
      <p class="note">
        Preencha o que já tem no inventário para ver quanto <strong>falta</strong>.
        Na Onda 2 isso vai ser preenchido automaticamente pela API.
      </p>
      <div id="exp-owned-inputs" class="cost-grid"></div>
      <div style="margin-top:14px">
        <button class="btn btn-ghost" id="exp-check">Ver o que falta</button>
      </div>
      <div id="exp-missing"></div>
    </div>
  `;

  // --- ações ---
  const islandSelect = panel.querySelector("#exp-island");
  const ownedWrap    = panel.querySelector("#exp-owned-inputs");

  function showTotal() {
    const total = Calc.totalFromIsland(islandSelect.value);
    panel.querySelector("#exp-result").innerHTML = `
      <h3>Total até o fim do jogo</h3>
      ${costGrid(total)}
    `;
    // gera os inputs de "o que já tenho" com base nos recursos desse total
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

    // marca cada chip: verde se já tem tudo, vermelho se falta
    const stateMap = {};
    for (const [res, falta] of Object.entries(missing)) {
      stateMap[res] = falta === 0 ? "done" : "missing";
    }
    panel.querySelector("#exp-missing").innerHTML = `
      <h3>Ainda falta &mdash; ${pct}% completo</h3>
      ${costGrid(missing, stateMap)}
    `;
  }

  islandSelect.addEventListener("change", showTotal);
  panel.querySelector("#exp-calc").addEventListener("click", showTotal);
  panel.querySelector("#exp-check").addEventListener("click", showMissing);

  showTotal(); // estado inicial
}

/* =========================================================
   ABA: PLANTAÇÕES  (ranking de ROI — dados reais do jogo)
   ========================================================= */
function renderCropsTab() {
  const panel = document.getElementById("tab-crops");

  panel.innerHTML = `
    <div class="card">
      <h2>🌾 Plantações &mdash; Lucro por Hora</h2>
      <p class="note">
        Ranking das plantações pelo lucro/hora (preço de venda &minus; custo da
        semente, dividido pelo tempo de cultivo). Valores <strong>base</strong>:
        não incluem boosts de skills, NFTs ou eventos.
      </p>

      <div class="field-row">
        <div>
          <label for="crop-level">Seu nível de Bumpkin</label>
          <input type="number" id="crop-level" min="1" max="100" value="100" />
        </div>
        <div>
          <label for="crop-plots">Quantos plots você tem</label>
          <input type="number" id="crop-plots" min="1" value="1" />
        </div>
      </div>

      <div id="crop-result"></div>
    </div>
  `;

  const levelInput = panel.querySelector("#crop-level");
  const plotsInput = panel.querySelector("#crop-plots");

  function render() {
    const level = parseInt(levelInput.value) || 1;
    const plots = Math.max(1, parseInt(plotsInput.value) || 1);
    const ranked = Calc.rankCrops(level);

    if (ranked.length === 0) {
      panel.querySelector("#crop-result").innerHTML =
        `<p class="note warn">Nenhuma plantação desbloqueada nesse nível.</p>`;
      return;
    }

    const rows = ranked.map((c, i) => {
      const best = i === 0 ? "best-row" : "";
      return `
        <tr class="${best}">
          <td>${c.icon} ${c.name}</td>
          <td class="num">Lv ${c.level}</td>
          <td class="num">${fmt(c.seedCost)}</td>
          <td class="num">${fmt(c.sellPrice)}</td>
          <td class="num">${formatDuration(c.growSeconds)}</td>
          <td class="num">${c.profit.toFixed(2)}</td>
          <td class="num strong">${c.profitPerHour.toFixed(2)}</td>
          <td class="num strong">${(c.profitPerHour * plots).toFixed(2)}</td>
        </tr>`;
    }).join("");

    panel.querySelector("#crop-result").innerHTML = `
      <p class="note">
        🏆 Melhor opção agora: <strong>${ranked[0].icon} ${ranked[0].name}</strong>
        &mdash; ${ranked[0].profitPerHour.toFixed(2)} Coins/hora por plot.
      </p>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Plantação</th><th class="num">Nível</th>
              <th class="num">Semente</th><th class="num">Venda</th>
              <th class="num">Tempo</th><th class="num">Lucro</th>
              <th class="num">Lucro/h</th><th class="num">Lucro/h (${plots}× plots)</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  levelInput.addEventListener("input", render);
  plotsInput.addEventListener("input", render);
  render();
}

/* =========================================================
   ABA: RECURSOS  (tempos de respawn e rendimento por dia)
   ========================================================= */
function renderResourcesTab() {
  const panel = document.getElementById("tab-resources");
  const resList = Calc.listResources();

  // monta uma linha com input de quantidade de nós para cada recurso
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
      <h2>🪵 Recursos &mdash; Rendimento Diário</h2>
      <p class="note">
        Cada nó "respawna" depois de um tempo. Informe quantos nós de cada
        tipo você tem para ver o rendimento por dia. Valores <strong>base</strong>
        (sem boosts de skills, NFTs ou ferramentas especiais).
        <br><strong>Oil</strong> não tem tempo de respawn fixo no jogo, então
        fica sem cálculo de "por dia" aqui.
      </p>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Recurso</th><th class="num">Respawn</th>
              <th class="num">Rende/coleta</th><th class="num">Seus nós</th>
              <th class="num">Total/dia</th>
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

  panel.querySelectorAll("input[data-node]").forEach(inp =>
    inp.addEventListener("input", recalc));
  recalc();
}

/* =========================================================
   ABA: COZINHA  (ranking de receitas por XP/hora)
   ========================================================= */
function renderCookingTab() {
  const panel = document.getElementById("tab-cooking");

  // construções disponíveis (extraídas das próprias receitas)
  const buildings = [...new Set(GAME_DATA.recipes.map(r => r.building))];
  const buildingOpts = ['<option value="">Todas as construções</option>']
    .concat(buildings.map(b => `<option value="${b}">${b}</option>`))
    .join("");

  panel.innerHTML = `
    <div class="card">
      <h2>🍳 Cozinha &mdash; XP por Hora</h2>
      <p class="note">
        Ranking das receitas pela experiência ganha por hora de preparo.
        O "custo (crops)" soma só os ingredientes que são plantações &mdash;
        ingredientes como ovo, leite e peixe não entram na conta (por isso o
        <strong>?</strong>). Valores <strong>base</strong>.
      </p>

      <div class="field-row">
        <div>
          <label for="cook-building">Construção</label>
          <select id="cook-building">${buildingOpts}</select>
        </div>
      </div>

      <div id="cook-result"></div>
    </div>
  `;

  const buildingSelect = panel.querySelector("#cook-building");

  function render() {
    const ranked = Calc.rankRecipes(buildingSelect.value || null);

    const rows = ranked.map((r, i) => {
      const best = i === 0 ? "best-row" : "";
      const ingText = Object.entries(r.ingredients)
        .map(([ing, qty]) => `${fmt(qty)}× ${ing}`)
        .join(", ");
      const { cost, hasUnknown } = Calc.recipeCropCost(r);
      const costText = (cost > 0 ? cost.toFixed(2) : "0") + (hasUnknown ? " + ?" : "");
      const xph = r.xpPerHour === Infinity ? "∞" : r.xpPerHour.toFixed(0);
      const time = r.cookSeconds === 0 ? "instantâneo" : formatDuration(r.cookSeconds);
      return `
        <tr class="${best}">
          <td>${r.name}</td>
          <td>${r.building}</td>
          <td class="num">${r.xp}</td>
          <td class="num">${time}</td>
          <td class="num strong">${xph}</td>
          <td class="num">${costText}</td>
          <td>${ingText}</td>
        </tr>`;
    }).join("");

    panel.querySelector("#cook-result").innerHTML = `
      <p class="note">
        🏆 Melhor XP/hora ${buildingSelect.value ? "em " + buildingSelect.value : "no geral"}:
        <strong>${ranked[0].name}</strong>
        &mdash; ${ranked[0].xpPerHour === Infinity ? "∞" : ranked[0].xpPerHour.toFixed(0)} XP/h.
      </p>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Receita</th><th>Construção</th><th class="num">XP</th>
              <th class="num">Tempo</th><th class="num">XP/h</th>
              <th class="num">Custo (crops)</th><th>Ingredientes</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  buildingSelect.addEventListener("change", render);
  render();
}

/* =========================================================
   ABA: CONFIG  (chave de API + ID da fazenda + teste de conexão)
   ========================================================= */
function renderSettingsTab() {
  const panel = document.getElementById("tab-settings");

  panel.innerHTML = `
    <div class="card">
      <h2>⚙️ Chave de API</h2>
      <p class="note warn">
        <strong>Segurança:</strong> sua chave de API fica salva
        <em>apenas neste navegador</em> e só é enviada para a API oficial do
        Sunflower Land (através do nosso proxy). Nunca compartilhe ela em chats
        ou prints. Se vazar, gere uma nova em
        <code>Settings → Developer Options → API Key</code> no jogo.
      </p>

      <label for="api-key-input">Cole sua chave de API</label>
      <input type="text" id="api-key-input" placeholder="sfl...." autocomplete="off" />

      <div class="field-row" style="margin-top:14px">
        <div style="flex:0"><button class="btn" id="api-save">Salvar chave</button></div>
        <div style="flex:0"><button class="btn btn-danger" id="api-clear">Apagar</button></div>
        <div id="api-status" style="align-self:center; font-size:14px;"></div>
      </div>
    </div>

    <div class="card">
      <h2>🏝️ ID da Fazenda</h2>
      <p class="note">
        ID numérico da sua fazenda. Achável nas configurações do jogo,
        ou inspecionando a URL/network quando você joga.
      </p>

      <label for="farm-id-input">ID da sua fazenda</label>
      <input type="text" id="farm-id-input" placeholder="ex: 12345" autocomplete="off" />

      <div class="field-row" style="margin-top:14px">
        <div style="flex:0"><button class="btn" id="farm-save">Salvar ID</button></div>
        <div style="flex:0"><button class="btn btn-danger" id="farm-clear">Apagar</button></div>
        <div id="farm-status" style="align-self:center; font-size:14px;"></div>
      </div>
    </div>

    <div class="card">
      <h2>🔌 Testar conexão</h2>
      <p class="note">
        Faz uma chamada de verdade na API (via Cloudflare Worker) usando sua chave
        e ID salvos. Útil pra confirmar que tudo está conectado antes das abas
        Resumo e Inventário serem implementadas.
      </p>
      <button class="btn" id="test-conn">Testar agora</button>
      <div id="test-result" style="margin-top:14px"></div>
    </div>

    <div class="card">
      <h3>🐛 Debug — resposta crua da API</h3>
      <p class="note">
        Mostra o JSON cru da última requisição. <strong>Não cole isso em
        público</strong> sem revisar — pode ter dados sensíveis (endereço de
        carteira, etc).
      </p>
      <pre class="debug" id="debug-box">// nada por aqui ainda</pre>
    </div>
  `;

  const keyInput   = panel.querySelector("#api-key-input");
  const keyStatus  = panel.querySelector("#api-status");
  const farmInput  = panel.querySelector("#farm-id-input");
  const farmStatus = panel.querySelector("#farm-status");
  const debugBox   = panel.querySelector("#debug-box");
  const resultBox  = panel.querySelector("#test-result");

  function refreshKey() {
    if (Api.hasKey()) {
      keyStatus.innerHTML = `✅ Chave salva: <code>${Api.maskedKey()}</code>`;
    } else {
      keyStatus.textContent = "Nenhuma chave salva.";
    }
  }
  function refreshFarm() {
    if (Api.hasFarmId()) {
      farmStatus.innerHTML = `✅ ID salvo: <code>${Api.getFarmId()}</code>`;
    } else {
      farmStatus.textContent = "Nenhum ID salvo.";
    }
  }

  // ações: chave
  panel.querySelector("#api-save").addEventListener("click", () => {
    const v = keyInput.value.trim();
    if (!v) { keyStatus.textContent = "⚠️ Cole uma chave antes de salvar."; return; }
    Api.setKey(v); keyInput.value = ""; refreshKey();
  });
  panel.querySelector("#api-clear").addEventListener("click", () => {
    Api.clearKey(); refreshKey();
  });

  // ações: farm id
  panel.querySelector("#farm-save").addEventListener("click", () => {
    const v = farmInput.value.trim();
    if (!v) { farmStatus.textContent = "⚠️ Digite um ID antes de salvar."; return; }
    Api.setFarmId(v); farmInput.value = ""; refreshFarm();
  });
  panel.querySelector("#farm-clear").addEventListener("click", () => {
    Api.clearFarmId(); refreshFarm();
  });

  // ação: teste de conexão
  panel.querySelector("#test-conn").addEventListener("click", async () => {
    resultBox.innerHTML = `<p class="note">⏳ Testando...</p>`;
    debugBox.textContent = "// requisitando...";
    try {
      const data = await Api.fetchFarm(Api.getFarmId());
      resultBox.innerHTML = `
        <p class="note" style="border-left-color: var(--accent-2);">
          ✅ Conexão OK! A API respondeu. Veja o JSON cru abaixo —
          quando quiser, copia os campos principais (sem dados sensíveis)
          e me manda no chat pra eu construir as abas Resumo e Inventário.
        </p>`;
      debugBox.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      resultBox.innerHTML = `<p class="note warn">❌ ${e.message}</p>`;
      // mostra o detalhe (body da resposta) se houver, senão só a mensagem
      debugBox.textContent = e.detail || e.message;
    }
  });

  refreshKey();
  refreshFarm();
}
