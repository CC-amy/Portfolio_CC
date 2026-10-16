const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".navigation");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

// 明暗模式切換：記住使用者選擇，預設亮色
const THEME_KEY = "cc-portfolio-theme";
const themeToggle = document.querySelector(".theme-toggle");
const applyTheme = (theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  if (themeToggle) {
    const isDark = theme === "dark";
    themeToggle.textContent = isDark ? "LIGHT" : "DARK";
    themeToggle.setAttribute("aria-pressed", String(isDark));
  }
};
applyTheme(localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}

// Hero 視差 + 煙霧：合併成同一組捲動監聽，避免重複讀取版面造成卡頓
const hero = document.querySelector(".hero");
const heroSmoke = document.querySelector(".hero-smoke");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (hero && !prefersReducedMotion) {
  // 背景實際移動速度相對內容的比例：0 = 完全不動，1 = 跟內容同速
  const speedFactor = 0.4;
  const scrollStrength = 0.15;
  let ticking = false;
  const updateOnScroll = () => {
    const rect = hero.getBoundingClientRect();
    // 夾限在 CSS inset 預留的緩衝範圍內，避免背景移出邊界露出底色
    const maxOffset = rect.height * 0.17;
    // 用 (speedFactor - 1) 補償 hero 本身的捲動量，讓背景淨移動速度變成 speedFactor 倍
    const rawOffset = rect.top * (speedFactor - 1);
    const offset = Math.max(-maxOffset, Math.min(maxOffset, rawOffset));
    hero.style.setProperty("--hero-parallax", `${offset}px`);

    if (heroSmoke) {
      const maxShift = rect.height * 0.1;
      const rawShift = rect.top * -scrollStrength;
      const shift = Math.max(-maxShift, Math.min(maxShift, rawShift));
      hero.style.setProperty("--smoke-scroll-y", `${shift}px`);
    }
    ticking = false;
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        window.requestAnimationFrame(updateOnScroll);
        ticking = true;
      }
    },
    { passive: true }
  );
  updateOnScroll();
}

// Hero 煙霧：滑鼠位置即時影響飄動幅度（用 rAF 節流，避免每個 mousemove 都觸發樣式重算）
if (hero && heroSmoke && !prefersReducedMotion) {
  const mouseStrength = 18;
  let pendingEvent = null;
  let mouseTicking = false;
  const applyPointerOffset = () => {
    if (pendingEvent) {
      const rect = hero.getBoundingClientRect();
      const relX = (pendingEvent.clientX - rect.left) / rect.width - 0.5;
      const relY = (pendingEvent.clientY - rect.top) / rect.height - 0.5;
      hero.style.setProperty("--smoke-mouse-x", `${relX * mouseStrength}px`);
      hero.style.setProperty("--smoke-mouse-y", `${relY * mouseStrength}px`);
      pendingEvent = null;
    }
    mouseTicking = false;
  };
  hero.addEventListener("pointermove", (event) => {
    pendingEvent = event;
    if (!mouseTicking) {
      window.requestAnimationFrame(applyPointerOffset);
      mouseTicking = true;
    }
  });
  hero.addEventListener("pointerleave", () => {
    hero.style.setProperty("--smoke-mouse-x", "0px");
    hero.style.setProperty("--smoke-mouse-y", "0px");
  });
}

// 回到頂部按鈕：捲動離開頂部才顯示
const backToTop = document.querySelector(".back-to-top");
if (backToTop) {
  const updateBackToTopVisibility = () => {
    backToTop.classList.toggle("is-visible", window.scrollY > 10);
  };
  window.addEventListener("scroll", updateBackToTopVisibility, { passive: true });
  updateBackToTopVisibility();
}
