/* =========================================================
   tabs.js — Controla qual aba está visível.
   Liga os botões .tab-btn (data-tab="x") aos painéis #tab-x.
   ========================================================= */

const Tabs = {

  init() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => this.show(btn.dataset.tab));
    });
  },

  show(tabId) {
    // marca o botão ativo
    document.querySelectorAll(".tab-btn").forEach(b => {
      b.classList.toggle("active", b.dataset.tab === tabId);
    });
    // mostra só o painel correspondente
    document.querySelectorAll(".tab-panel").forEach(p => {
      p.classList.toggle("active", p.id === `tab-${tabId}`);
    });
  }
};
