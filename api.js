/* =========================================================
   api.js — CAMADA DE DADOS.
   Este é o ÚNICO arquivo que conversa com a API do Sunflower Land.
   ========================================================= */

// Carteiro CORS (Cloudflare Worker) — a API oficial bloqueia chamadas
// diretas de navegadores, então passamos por aqui.
const API_BASE = "https://sflcalc-proxy.igorborbaescobar.workers.dev";

const STORAGE_KEY = "sfl_eco_api_key";
const FARM_ID_KEY = "sfl_eco_farm_id";

const Api = {

  /* Cache da última fazenda carregada — compartilhado entre as abas */
  _farmCache: null,

  getCachedFarm() { return this._farmCache; },

  /* Carrega a fazenda e guarda em cache */
  async loadFarm() {
    const data = await this.fetchFarm(this.getFarmId());
    this._farmCache = { data, fetchedAt: Date.now() };
    return data;
  },

  /* ---------- Chave de API (fica só no navegador) ---------- */
  getKey()   { return localStorage.getItem(STORAGE_KEY) || ""; },
  setKey(k)  { localStorage.setItem(STORAGE_KEY, (k || "").trim()); },
  clearKey() { localStorage.removeItem(STORAGE_KEY); },
  hasKey()   { return this.getKey().length > 0; },

  maskedKey() {
    const k = this.getKey();
    if (!k) return "";
    if (k.length <= 12) return "•".repeat(k.length);
    return k.slice(0, 6) + "…" + k.slice(-4);
  },

  /* ---------- ID da fazenda ---------- */
  getFarmId()   { return localStorage.getItem(FARM_ID_KEY) || ""; },
  setFarmId(id) { localStorage.setItem(FARM_ID_KEY, (id || "").trim()); },
  clearFarmId() { localStorage.removeItem(FARM_ID_KEY); },
  hasFarmId()   { return this.getFarmId().length > 0; },

  /* ---------- Chamada à API ----------
     Busca dados de uma fazenda. Lança Error com mensagem amigável
     se algo der errado. O `detail` do erro carrega o body da resposta
     pra ajudar a debugar problemas de auth. */
  async fetchFarm(farmId) {
    const key = this.getKey();
    if (!key)    throw new Error("Nenhuma chave de API configurada. Vá em ⚙️ Config.");
    if (!farmId) throw new Error("Informe o ID da fazenda.");

    const url = `${API_BASE}/community/farms/${encodeURIComponent(farmId)}`;

    let res;
    try {
      res = await fetch(url, {
        headers: { "x-api-key": key }
      });
    } catch (e) {
      throw new Error("Falha de rede. O carteiro (Worker) pode estar fora do ar.");
    }

    // Captura o body em todos os casos pra ajudar a debugar
    const bodyText = await res.text();

    if (!res.ok) {
      const messages = {
        401: "Chave de API inválida ou rejeitada (veja Debug pra o motivo).",
        403: "Acesso negado pelo proxy (caminho não autorizado).",
        404: "Fazenda não encontrada."
      };
      const err = new Error(messages[res.status] || `Erro da API: ${res.status}`);
      err.detail = `HTTP ${res.status}\n\nResposta crua da API:\n${bodyText}`;
      throw err;
    }

    try {
      return JSON.parse(bodyText);
    } catch (e) {
      throw new Error("Resposta da API não é JSON válido. Veja Debug.");
    }
  }
};
