/* ==========================================================================
   CONFIGURAÇÃO — troque só estes valores (veja o README.md)
   ========================================================================== */
var CHECKOUT_URL    = "https://pay.cakto.com.br/966yqov_1312461"; // ex.: https://pay.cakto.com.br/abc123
var UPSELL_URL      = "https://pay.cakto.com.br/j2mdbbi_1313183"; // Diagnóstico Estratégico da Loja (R$ 97)
var META_PIXEL_ID   = "1123355403977678";                // só números, ex.: 123456789012345
var WHATSAPP_NUMBER = "5511992137608";                // DDI + DDD + número, só números, ex.: 5519999999999
var WHATSAPP_TEXT   = "Oi, Vitor! Tenho uma dúvida sobre o Kit Fim de Ano do Lojista.";
var PRODUCT_VALUE   = 37;

/* Datas reais usadas no contador de dias (fuso America/Sao_Paulo) */
var BLACK_FRIDAY = "2026-11-27";
var NATAL        = "2026-12-25";

/* ========================================================================== */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  var isSet = function (v) { return v && v.indexOf("[PREENCHER") !== 0; };

  /* ---------- Meta Pixel ---------- */
  var pixelOn = isSet(META_PIXEL_ID);
  if (pixelOn) {
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", META_PIXEL_ID);
    window.fbq("track", "PageView");
  }
  var track = function (event, data) {
    if (pixelOn && window.fbq) window.fbq("track", event, data || {});
    // Mesmo evento no dataLayer, para usar como acionador no Google Tag Manager
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "vtr_" + event, value: PRODUCT_VALUE, currency: "BRL" });
  };
  var contentData = { content_name: "Kit Fim de Ano do Lojista", content_type: "product", value: PRODUCT_VALUE, currency: "BRL" };

  /* ---------- Repasse de UTM e parâmetros para o checkout ---------- */
  var withParams = function (base) {
    if (!isSet(base)) return null;
    try {
      var url = new URL(base);
      var incoming = new URLSearchParams(window.location.search);
      incoming.forEach(function (value, key) {
        if (!url.searchParams.has(key)) url.searchParams.set(key, value);
      });
      return url.toString();
    } catch (e) { return base; }
  };
  var checkout = withParams(CHECKOUT_URL);
  var upsell = withParams(UPSELL_URL);

  var bindLinks = function (selector, href, event) {
    document.querySelectorAll(selector).forEach(function (a) {
      if (href) a.setAttribute("href", href);
      a.addEventListener("click", function (e) {
        if (!href) return; // sem link configurado, o botão rola até a oferta
        track(event, contentData);
        // Dá tempo do pixel enviar o evento antes de sair da página
        if (pixelOn && !e.metaKey && !e.ctrlKey && !e.shiftKey && a.target !== "_blank") {
          e.preventDefault();
          setTimeout(function () { window.location.href = href; }, 180);
        }
      });
    });
  };
  bindLinks(".js-checkout", checkout, "InitiateCheckout");
  bindLinks(".js-upsell", upsell, "InitiateCheckout");

  /* ---------- WhatsApp ---------- */
  if (isSet(WHATSAPP_NUMBER)) {
    document.querySelectorAll(".js-whatsapp").forEach(function (a) {
      var text = a.getAttribute("data-wa-text") || WHATSAPP_TEXT;
      a.href = "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
      a.target = "_blank"; a.rel = "noopener";
    });
  }

  /* ---------- ViewContent ao rolar 50% ---------- */
  if (document.body.dataset.page === "vendas") {
    var viewed = false;
    var onScroll = function () {
      if (viewed) return;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      if (max > 0 && (window.scrollY / max) >= 0.5) {
        viewed = true;
        track("ViewContent", contentData);
        window.removeEventListener("scroll", onScroll);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Contador de dias (data real, não reinicia) ----------
     Até 26/11: "Faltam X dias para a Black Friday" · 27/11: "Hoje é Black Friday"
     28/11 a 23/12: "Faltam X dias para o Natal" · 24/12: "Último dia para o presente de Natal"
     A partir de 25/12: escondido. Usa a data do navegador no fuso de São Paulo. */
  var pills = document.querySelectorAll(".js-countdown");
  if (pills.length) {
    var todaySP;
    try {
      todaySP = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    } catch (e) { todaySP = new Date().toISOString().slice(0, 10); }
    var dayNum = function (ymd) { var p = ymd.split("-"); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 864e5; };
    var t = dayNum(todaySP), bf = dayNum(BLACK_FRIDAY), xmas = dayNum(NATAL);
    var plural = function (n, alvo) { return n === 1 ? "Falta <b>1 dia</b> para " + alvo : "Faltam <b>" + n + " dias</b> para " + alvo; };
    var text = "";
    if (t < bf) text = plural(bf - t, "a Black Friday");
    else if (t === bf) text = "<b>Hoje</b> é Black Friday";
    else if (t === xmas - 1) text = "<b>Último dia</b> para o presente de Natal";
    else if (t < xmas) text = plural(xmas - t, "o Natal");
    if (text) pills.forEach(function (p) { p.innerHTML = text; p.hidden = false; });
  }

  /* ---------- Simulador de margem ----------
     Margem (m) = lucro líquido por venda, em % do preço, já descontados custo e taxas.
     Taxas (f) = custos proporcionais ao preço (maquininha, plataforma, impostos).
     Numa peça de R$ 100: custo = 100 - f - m. Com desconto d, o lucro vira
     (100 - d) x (1 - f/100) - custo = m - d x (1 - f/100). */
  var sim = document.getElementById("sim");
  if (sim) {
    var mIn = document.getElementById("sim-margin");
    var dIn = document.getElementById("sim-discount");
    var fIn = document.getElementById("sim-fee");
    var mOut = document.getElementById("sim-margin-out");
    var dOut = document.getElementById("sim-discount-out");
    var fOut = document.getElementById("sim-fee-out");
    var value = document.getElementById("sim-value");
    var label = document.getElementById("sim-label");
    var detail = document.getElementById("sim-detail");
    var fmt = function (n) { return n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    var fill = function (el) {
      var p = (el.value - el.min) / (el.max - el.min) * 100;
      el.style.setProperty("--fill", p + "%");
    };
    var update = function (e) {
      var m = +mIn.value, d = +dIn.value, f = +fIn.value;
      // margem + taxas não podem passar de 95% do preço (sobra pelo menos 5% de custo)
      if (m + f > 95) {
        if (e && e.target === fIn) { m = 95 - f; mIn.value = m; } else { f = 95 - m; fIn.value = f; }
      }
      mOut.textContent = m + "%"; dOut.textContent = d + "%"; fOut.textContent = f + "%";
      fill(mIn); fill(dIn); fill(fIn);
      var cost = 100 - f - m;
      var profitBefore = m;
      var profitAfter = m - d * (1 - f / 100);
      if (profitAfter <= 0) {
        var received = 100 - d, fees = received * f / 100;
        value.textContent = "Prejuízo";
        value.classList.add("bad");
        label.textContent = "Com esse desconto, cada venda";
        detail.innerHTML = "Numa peça de R$ 100, você recebe R$ " + fmt(received) + ", paga R$ " + fmt(fees) + " de taxas e R$ " + fmt(cost) + " de custo. <strong>Quanto mais vender, mais perde.</strong>";
      } else {
        var mult = profitBefore / profitAfter;
        var extra = Math.round((mult - 1) * 100);
        value.classList.toggle("bad", mult >= 1.5);
        value.textContent = "+" + extra + "%";
        label.textContent = "Você precisa vender a mais";
        detail.innerHTML = "Numa peça de R$ 100, depois das taxas, o lucro cai de R$ " + fmt(profitBefore) + " para R$ " + fmt(profitAfter) + ". Para lucrar o mesmo, você precisa vender <strong>" + mult.toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "x</strong> o volume normal.";
      }
    };
    mIn.addEventListener("input", update);
    dIn.addEventListener("input", update);
    fIn.addEventListener("input", update);
    update();
  }

  /* ---------- Foto do Vitor (mostra as iniciais se a foto não existir) ---------- */
  var photo = document.querySelector(".photo img");
  if (photo) {
    var ok = function () { photo.parentNode.classList.add("has-img"); };
    var fail = function () { photo.remove(); };
    if (photo.complete) { photo.naturalWidth ? ok() : fail(); }
    else { photo.addEventListener("load", ok); photo.addEventListener("error", fail); }
  }

  /* ---------- Barra fixa do CTA no mobile ---------- */
  var sticky = document.querySelector(".sticky-cta");
  var heroCta = document.getElementById("hero-cta");
  var heroHead = document.querySelector(".hero-a");
  var offer = document.getElementById("oferta");
  var final = document.getElementById("final");
  if (sticky && heroCta && "IntersectionObserver" in window) {
    document.body.classList.add("has-sticky");
    // Aparece quando a headline sai da tela e o botão do topo não está visível;
    // some quando o botão da oferta ou o do final está na tela.
    var state = { headVisible: true, heroVisible: true, offerVisible: false, finalVisible: false };
    var render = function () {
      var show = !state.headVisible && !state.heroVisible && !state.offerVisible && !state.finalVisible;
      sticky.classList.toggle("show", show);
      sticky.setAttribute("aria-hidden", show ? "false" : "true");
      sticky.querySelector("a").tabIndex = show ? 0 : -1;
    };
    var watch = function (el, key) {
      if (!el) return;
      new IntersectionObserver(function (entries) {
        state[key] = entries[0].isIntersecting; render();
      }, { threshold: 0 }).observe(el);
    };
    watch(heroHead, "headVisible");
    watch(heroCta, "heroVisible");
    watch(offer && offer.querySelector(".btn"), "offerVisible");
    watch(final && final.querySelector(".btn"), "finalVisible");
  }

  /* ---------- Revelação suave ao rolar ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Ano no rodapé ---------- */
  document.querySelectorAll(".js-year").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
