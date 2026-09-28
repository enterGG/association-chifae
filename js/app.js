/* Association Chifae — interactions */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- sticky nav + scroll progress + back to top ---------- */
  var nav = document.getElementById("nav");
  var bar = document.getElementById("scrollProgress");
  var toTop = document.getElementById("toTop");

  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;

    nav.classList.toggle("scrolled", y > 40);
    bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    toTop.classList.toggle("show", y > window.innerHeight * 0.9);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  });

  /* ---------- mobile menu ---------- */
  var burger = document.getElementById("burger");
  var navLinks = document.getElementById("navLinks");

  burger.addEventListener("click", function () {
    var open = navLinks.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
  });

  navLinks.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      navLinks.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- reveal on scroll (starts after the intro) ---------- */
  var revealables = document.querySelectorAll(".reveal");
  var revealsStarted = false;

  function startReveals() {
    if (revealsStarted) return;
    revealsStarted = true;

    if (!("IntersectionObserver" in window) || reduced) {
      revealables.forEach(function (el) {
        el.classList.add("in");
      });
      return;
    }

    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("in");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );
    revealables.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---------- animated counters ---------- */
  var counters = document.querySelectorAll(".count");

  function runCounter(el) {
    var target = parseInt(el.dataset.count, 10) || 0;
    var suffix = el.dataset.suffix || "";
    var duration = 1600;
    var start = performance.now();

    function step(now) {
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (!("IntersectionObserver" in window) || reduced) {
    counters.forEach(function (el) {
      el.textContent = el.dataset.count + (el.dataset.suffix || "");
    });
  } else {
    var countObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          countObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach(function (el) {
      countObserver.observe(el);
    });
  }

  /* ---------- active section in nav ---------- */
  var links = Array.prototype.slice.call(navLinks.querySelectorAll("a"));
  var sections = links
    .map(function (a) {
      return document.querySelector(a.getAttribute("href"));
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    var sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          links.forEach(function (a) {
            a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id);
          });
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sections.forEach(function (s) {
      sectionObserver.observe(s);
    });
  }

  /* ---------- hero video sound ---------- */
  var video = document.getElementById("heroVideo");
  var soundBtn = document.getElementById("soundBtn");

  var SOUND_LABELS = {
    fr: { on: "Couper le son", off: "Activer le son" },
    ar: { on: "كتم الصوت", off: "تشغيل الصوت" }
  };

  function syncSoundLabel() {
    if (!video || !soundBtn) return;
    var set = SOUND_LABELS[root.lang] || SOUND_LABELS.fr;
    soundBtn.setAttribute("aria-label", video.muted ? set.off : set.on);
  }

  if (video && soundBtn) {
    soundBtn.addEventListener("click", function () {
      video.muted = !video.muted;
      soundBtn.classList.toggle("on", !video.muted);
      syncSoundLabel();
      if (!video.muted) video.play();
    });

    // Autoplay can be refused before any user gesture; retry on first interaction.
    var kick = function () {
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    };
    kick();
    window.addEventListener("pointerdown", kick, { once: true });
  }

  /* ---------- language switch FR / AR ---------- */
  var langToggle = document.getElementById("langToggle");
  var translatables = document.querySelectorAll("[data-ar]");

  translatables.forEach(function (el) {
    el.dataset.fr = el.textContent.trim();
  });

  function setLang(lang) {
    var ar = lang === "ar";

    translatables.forEach(function (el) {
      el.textContent = ar ? el.dataset.ar : el.dataset.fr;
    });

    root.lang = ar ? "ar" : "fr";
    root.dir = ar ? "rtl" : "ltr";

    langToggle.querySelectorAll(".lang-opt").forEach(function (opt) {
      opt.classList.toggle("is-on", opt.dataset.lang === lang);
    });

    langToggle.setAttribute("aria-label", ar ? "التبديل إلى الفرنسية" : "Passer à l'arabe");
    syncSoundLabel();

    try {
      localStorage.setItem("chifae-lang", lang);
    } catch (e) {
      /* storage blocked */
    }
  }

  langToggle.addEventListener("click", function () {
    setLang(root.lang === "ar" ? "fr" : "ar");
  });

  try {
    var saved = localStorage.getItem("chifae-lang");
    if (saved === "ar") setLang("ar");
  } catch (e) {
    /* storage blocked */
  }

  /* ---------- logo intro ---------- */
  var intro = document.getElementById("intro");

  function closeIntro() {
    if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
    root.classList.remove("is-intro");
    startReveals();
  }

  if (!intro || reduced) {
    closeIntro();
  } else {
    root.classList.add("is-intro");

    var introLogo = document.getElementById("introLogo");
    var introSkip = document.getElementById("introSkip");
    var brandLogo = document.querySelector(".brand img");
    var introTimer = 0;
    var leaving = false;

    function leaveIntro() {
      if (leaving) return;
      leaving = true;
      window.clearTimeout(introTimer);

      var from = introLogo.getBoundingClientRect();
      var to = brandLogo ? brandLogo.getBoundingClientRect() : null;
      var canFly = to && to.width > 0 && from.width > 0;

      intro.classList.add("is-leaving");

      if (canFly) {
        var dx = to.left + to.width / 2 - (from.left + from.width / 2);
        var dy = to.top + to.height / 2 - (from.top + from.height / 2);
        var scale = to.width / from.width;
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            introLogo.style.transform =
              "translate(" + dx + "px, " + dy + "px) scale(" + scale + ")";
          });
        });
      }

      window.setTimeout(closeIntro, canFly ? 980 : 520);
    }

    introTimer = window.setTimeout(leaveIntro, 2100);
    introSkip.addEventListener("click", leaveIntro);
    intro.addEventListener("click", function (e) {
      if (e.target === intro || e.target.classList.contains("intro-glow")) leaveIntro();
    });
  }

  /* ---------- contact form -> mailto ---------- */
  var form = document.getElementById("contactForm");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      var data = new FormData(form);
      var to = document.getElementById("emailValue").textContent.trim();
      var subject = "[Site Chifae] " + data.get("subject");
      var body =
        "Nom : " + data.get("name") + "\n" + "E-mail : " + data.get("email") + "\n\n" + data.get("message");

      window.location.href =
        "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  }
})();
