/* =========================================================
   api.js — CAMADA DE DADOS.
   Este é o ÚNICO arquivo que conversa com a API do Sunflower Land.
   Se um dia precisarmos de um proxy (por causa de CORS), muda só
   o API_BASE aqui — o resto do app nem fica sabendo.

   Pense nisto como uma "interface" em Kotlin: o app pede dados,
   não importa de onde venham.
   ========================================================= */

const API_BASE = "https://api.sunflower-land.com";  // trocar por proxy se houver CORS
const STORAGE_KEY = "sfl_eco_api_key";

const Api = {

  /* ---------- Gestão da chave de API ----------
     A chave fica SÓ no navegador do usuário (localStorage).
     Nunca é enviada para nenhum servidor além da API oficial. */
  getKey()   { return localStorage.getItem(STORAGE_KEY) || ""; },
  setKey(k)  { localStorage.setItem(STORAGE_KEY, (k || "").trim()); },
  clearKey() { localStorage.removeItem(STORAGE_KEY); },
  hasKey()   { return this.getKey().length > 0; },

  /* Mostra a chave parcialmente mascarada (para a tela de Config) */
  maskedKey() {
    const k = this.getKey();
    if (!k) return "";
    if (k.length <= 12) return "•".repeat(k.length);
    return k.slice(0, 6) + "…" + k.slice(-4);
  },

  /* ---------- Chamada à API ----------
     Busca os dados de uma fazenda pelo ID.
     Retorna o JSON da fazenda OU lança um Error com mensagem amigável.

     OBS p/ a Onda 2: ainda precisamos confirmar com uma chave válida
     (1) o caminho exato do endpoint e
     (2) se a chave vai no header "Authorization" ou "x-api-key". */
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
      // fetch só lança assim em erro de rede — quase sempre é CORS bloqueado.
      throw new Error("Falha de rede (provável CORS). Talvez precisemos de um proxy.");
    }

    if (res.status === 401) throw new Error("Chave de API inválida ou sem permissão.");
    if (res.status === 404) throw new Error("Fazenda não encontrada.");
    if (!res.ok)            throw new Error(`Erro da API: ${res.status}`);

    return res.json();
  }
};
