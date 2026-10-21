const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".navigation");
if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  // 點擊選單以外的範圍時自動收合
  document.addEventListener("click", (event) => {
    const isOpen = nav.classList.contains("is-open");
    const clickedInsideNav = nav.contains(event.target);
    const clickedToggle = toggle.contains(event.target);
    if (isOpen && !clickedInsideNav && !clickedToggle) {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

// 明暗模式切換：優先使用使用者手動選擇的紀錄，沒有紀錄時依裝置系統設定
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
const savedTheme = localStorage.getItem(THEME_KEY);
const systemPrefersDark = window.matchMedia(
  "(prefers-color-scheme: dark)",
).matches;
applyTheme(savedTheme ? savedTheme : systemPrefersDark ? "dark" : "light");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const next =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  });
}

// Hero 視差 + 煙霧：合併成同一組捲動監聽，避免重複讀取版面造成卡頓
const hero = document.querySelector(".hero");
const heroSmoke = document.querySelector(".hero-smoke");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;
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
    { passive: true },
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
  window.addEventListener("scroll", updateBackToTopVisibility, {
    passive: true,
  });
  updateBackToTopVisibility();
}

// 作品集手風琴：沒有 hover 時自動輪流展開，hover 時停在滑鼠所在的區塊（手機版螢幕較窄時不啟用）
const portfolioGrid = document.querySelector(".work-grid");
const workItems = portfolioGrid
  ? Array.from(portfolioGrid.querySelectorAll(".work-col"))
  : [];
const isDesktopViewport = window.matchMedia("(min-width: 701px)").matches;
if (
  portfolioGrid &&
  workItems.length > 0 &&
  !prefersReducedMotion &&
  isDesktopViewport
) {
  const cycleInterval = 2800;
  let activeIndex = 0;
  let timerId = null;

  const setActive = (index) => {
    workItems.forEach((item, i) => {
      item.classList.toggle("is-active", i === index);
    });
  };

  const startCycle = () => {
    stopCycle();
    setActive(activeIndex);
    timerId = window.setInterval(() => {
      activeIndex = (activeIndex + 1) % workItems.length;
      setActive(activeIndex);
    }, cycleInterval);
  };

  const stopCycle = () => {
    if (timerId !== null) {
      window.clearInterval(timerId);
      timerId = null;
    }
  };

  portfolioGrid.addEventListener("pointerenter", () => {
    stopCycle();
    workItems.forEach((item) => item.classList.remove("is-active"));
  });

  portfolioGrid.addEventListener("pointerleave", () => {
    startCycle();
  });

  startCycle();
}

// Experience：左側 tab 點擊切換右側對應的內容區塊
const expTabs = Array.from(document.querySelectorAll(".exp-tab"));
if (expTabs.length > 0) {
  expTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetId = tab.dataset.target;
      const targetPanel = document.getElementById(targetId);
      if (!targetPanel) return;

      expTabs.forEach((t) => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      tab.classList.add("is-active");
      tab.setAttribute("aria-selected", "true");

      document.querySelectorAll(".exp-panel").forEach((panel) => {
        panel.classList.toggle("is-active", panel === targetPanel);
      });
    });
  });
}

// Selected Works 卡片列：用自製短捲軸反映實際捲動位置，取代原生滿版捲軸
const expCards = document.querySelector(".exp-cards");
const expScrollbar = document.querySelector(".exp-scrollbar");
const expScrollbarThumb = document.querySelector(".exp-scrollbar-thumb");
if (expCards && expScrollbar && expScrollbarThumb) {
  const updateScrollbar = () => {
    const scrollable = expCards.scrollWidth - expCards.clientWidth;
    if (scrollable <= 0) {
      expScrollbar.classList.add("is-hidden");
      return;
    }
    expScrollbar.classList.remove("is-hidden");
    const progress = expCards.scrollLeft / scrollable;
    const trackWidth = expScrollbar.clientWidth;
    const thumbWidth = expScrollbarThumb.clientWidth;
    const maxThumbOffset = trackWidth - thumbWidth;
    expScrollbarThumb.style.transform = `translateX(${progress * maxThumbOffset}px)`;
  };

  expCards.addEventListener("scroll", updateScrollbar, { passive: true });
  window.addEventListener("resize", updateScrollbar);
  updateScrollbar();
}
