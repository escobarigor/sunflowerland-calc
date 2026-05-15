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
     se algo der errado. */
  async fetchFarm(farmId) {
    const key = this.getKey();
    if (!key)    throw new Error("Nenhuma chave de API configurada. Vá em ⚙️ Config.");
    if (!farmId) throw new Error("Informe o ID da fazenda.");

    const url = `${API_BASE}/community/farms/${encodeURIComponent(farmId)}`;

    let res;
    try {
      res = await fetch(url, {
        headers: { "Authorization": `Bearer ${key}` }
      });
    } catch (e) {
      throw new Error("Falha de rede. O carteiro (Worker) pode estar fora do ar.");
    }

    if (res.status === 401) throw new Error("Chave de API inválida ou expirada.");
    if (res.status === 403) throw new Error("Acesso negado (caminho não autorizado pelo proxy).");
    if (res.status === 404) throw new Error("Fazenda não encontrada.");
    if (!res.ok)            throw new Error(`Erro da API: ${res.status}`);

    return res.json();
  }
};
