const root = document.documentElement;
const navbar = document.getElementById("navbar");
const scrollProgress = document.getElementById("scrollProgress");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
let redrawSignal = () => {};

const updateScrollState = () => {
  navbar?.classList.toggle("scrolled", window.scrollY > 10);
  const scrollableHeight = root.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
  if (scrollProgress) scrollProgress.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
};

window.addEventListener("scroll", updateScrollState, { passive: true });
window.addEventListener("resize", updateScrollState);
updateScrollState();

// 主题切换
const themeColor = document.getElementById("themeColor");
const themeOptions = document.querySelectorAll(".theme-option");
const themeColors = { volt: "#07110f", pulse: "#140c0b", cloud: "#eef4f7" };

const applyTheme = (theme, persist = true) => {
  const nextTheme = themeColors[theme] ? theme : "volt";
  root.classList.add("theme-swap");
  root.dataset.theme = nextTheme;
  themeColor?.setAttribute("content", themeColors[nextTheme]);
  themeOptions.forEach((option) => {
    const isActive = option.dataset.theme === nextTheme;
    option.classList.toggle("is-active", isActive);
    option.setAttribute("aria-pressed", String(isActive));
  });
  redrawSignal();
  requestAnimationFrame(() => root.classList.remove("theme-swap"));
  if (persist) {
    try { localStorage.setItem("portfolio-theme", nextTheme); } catch (_) {}
  }
};

let savedTheme = "volt";
try { savedTheme = localStorage.getItem("portfolio-theme") || "volt"; } catch (_) {}
applyTheme(savedTheme, false);

themeOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const nextTheme = option.dataset.theme;
    if (root.dataset.theme === nextTheme) return;
    applyTheme(nextTheme);
  });
});

// 首屏 Canvas 信号场：用流动线路表现从复杂技术到清晰产品的收束过程
const signalCanvas = document.getElementById("signalCanvas");
const hero = document.querySelector(".hero");

if (signalCanvas && hero) {
  const context = signalCanvas.getContext("2d");
  const pointer = { x: .68, y: .38, targetX: .68, targetY: .38 };
  let width = 0;
  let height = 0;
  let frame = 0;
  let running = !prefersReducedMotion.matches;

  const resizeSignal = () => {
    const rect = hero.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    signalCanvas.width = Math.round(width * dpr);
    signalCanvas.height = Math.round(height * dpr);
    signalCanvas.style.width = `${width}px`;
    signalCanvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawSignal(performance.now());
  };

  const signalY = (x, band, time) => {
    const base = height * (.13 + band * .105);
    const wave = Math.sin(x * .007 + time * .00055 + band * .8) * (14 + band * 1.5);
    const cursorX = pointer.x * width;
    const cursorY = pointer.y * height;
    const distance = Math.abs(x - cursorX);
    const pull = Math.max(0, 1 - distance / Math.max(240, width * .26));
    return base + wave + (cursorY - base) * pull * .2;
  };

  function drawSignal(time) {
    if (!width || !height) return;
    context.clearRect(0, 0, width, height);
    const accent = getComputedStyle(root).getPropertyValue("--accent").trim();
    pointer.x += (pointer.targetX - pointer.x) * .045;
    pointer.y += (pointer.targetY - pointer.y) * .045;

    for (let band = 0; band < 8; band += 1) {
      context.beginPath();
      for (let x = -30; x <= width + 30; x += 22) {
        const y = signalY(x, band, time);
        if (x === -30) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.globalAlpha = .08 + band * .012;
      context.strokeStyle = accent;
      context.lineWidth = band % 3 === 0 ? 1.3 : .75;
      context.stroke();

      const nodeX = ((time * (.018 + band * .0015) + band * 153) % (width + 100)) - 50;
      const nodeY = signalY(nodeX, band, time);
      context.globalAlpha = .28 + band * .025;
      context.fillStyle = accent;
      const nodeSize = band % 3 === 0 ? 5 : 3;
      context.fillRect(nodeX - nodeSize / 2, nodeY - nodeSize / 2, nodeSize, nodeSize);
    }

    context.globalAlpha = .13;
    context.beginPath();
    context.arc(pointer.x * width, pointer.y * height, 42 + Math.sin(time * .002) * 5, 0, Math.PI * 2);
    context.strokeStyle = accent;
    context.lineWidth = 1;
    context.stroke();
    context.globalAlpha = 1;
  }

  const animateSignal = (time) => {
    drawSignal(time);
    if (running) frame = requestAnimationFrame(animateSignal);
  };

  hero.addEventListener("pointermove", (event) => {
    if (prefersReducedMotion.matches) return;
    const rect = hero.getBoundingClientRect();
    pointer.targetX = (event.clientX - rect.left) / rect.width;
    pointer.targetY = (event.clientY - rect.top) / rect.height;
  });
  hero.addEventListener("pointerleave", () => {
    pointer.targetX = .68;
    pointer.targetY = .38;
  });

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden && !prefersReducedMotion.matches;
    cancelAnimationFrame(frame);
    if (running) frame = requestAnimationFrame(animateSignal);
  });

  new ResizeObserver(resizeSignal).observe(hero);
  redrawSignal = () => drawSignal(performance.now());
  resizeSignal();
  if (running) frame = requestAnimationFrame(animateSignal);
}

// 移动端导航
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");
const setMenuState = (isOpen) => {
  navToggle?.classList.toggle("active", isOpen);
  navMenu?.classList.toggle("active", isOpen);
  navToggle?.setAttribute("aria-expanded", String(isOpen));
  navToggle?.setAttribute("aria-label", isOpen ? "关闭菜单" : "打开菜单");
};

navToggle?.addEventListener("click", () => setMenuState(!navMenu.classList.contains("active")));
navMenu?.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenuState(false)));

// 产品视频封面
document.querySelectorAll(".playground-video-card").forEach((card) => {
  const video = card.querySelector(".playground-video");
  const cover = card.querySelector(".video-cover");
  const durationLabel = card.querySelector(".video-duration");
  if (!video || !cover) return;

  const updateDuration = () => {
    if (!durationLabel || !Number.isFinite(video.duration)) return;
    const minutes = Math.floor(video.duration / 60);
    const seconds = Math.floor(video.duration % 60);
    durationLabel.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };
  const restoreCover = () => {
    card.classList.remove("is-playing");
    cover.disabled = false;
    video.controls = false;
  };

  video.controls = false;
  video.addEventListener("loadedmetadata", updateDuration);
  video.addEventListener("ended", restoreCover);
  cover.addEventListener("click", async () => {
    cover.disabled = true;
    video.controls = true;
    card.classList.add("is-playing");
    try {
      await video.play();
      video.focus({ preventScroll: true });
    } catch (_) {
      restoreCover();
    }
  });
});

// 当前区块高亮
if (navMenu && "IntersectionObserver" in window) {
  const sectionLinks = new Map([...navMenu.querySelectorAll('a[href^="#"]')].map((link) => [link.getAttribute("href").slice(1), link]));
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach((link) => link.classList.remove("active"));
      sectionLinks.get(entry.target.id)?.classList.add("active");
    });
  }, { rootMargin: "-32% 0px -58% 0px", threshold: 0 });
  document.querySelectorAll("section[id]").forEach((section) => sectionObserver.observe(section));
}

// 首屏按钮微交互
if (canHover.matches && !prefersReducedMotion.matches) {
  document.querySelectorAll(".hero-button").forEach((button) => {
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * .12;
      const y = (event.clientY - rect.top - rect.height / 2) * .16;
      button.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
    button.addEventListener("pointerleave", () => { button.style.transform = "translate3d(0, 0, 0)"; });
  });
}

// 复制邮箱：真实可用，失败时保留邮件直达入口
const copyEmail = document.getElementById("copyEmail");
const copyStatus = document.getElementById("copyStatus");
copyEmail?.addEventListener("click", async () => {
  const email = copyEmail.dataset.email;
  copyStatus.textContent = "正在复制邮箱…";
  try {
    await Promise.race([
      navigator.clipboard.writeText(email),
      new Promise((_, reject) => window.setTimeout(() => reject(new Error("clipboard-timeout")), 1200)),
    ]);
    copyStatus.textContent = "邮箱已复制，可以直接粘贴使用。";
    copyEmail.textContent = "已复制";
  } catch (_) {
    const fallbackInput = document.createElement("textarea");
    fallbackInput.value = email;
    fallbackInput.setAttribute("readonly", "");
    fallbackInput.style.position = "fixed";
    fallbackInput.style.opacity = "0";
    document.body.appendChild(fallbackInput);
    fallbackInput.select();
    const copied = document.execCommand("copy");
    fallbackInput.remove();
    copyStatus.textContent = copied ? "邮箱已复制，可以直接粘贴使用。" : `请手动复制：${email}`;
    if (copied) copyEmail.textContent = "已复制";
  }
  window.setTimeout(() => { copyEmail.textContent = "复制邮箱"; }, 3200);
});

// 分节入场：标题向上，档案行横向进入
const revealElements = document.querySelectorAll(".section-header, .collection-heading, .about-text, .stat, .skill-row, .project-row, .playground-video-card, .playground-note, .influence-card, .topic-row, .contact-item, .contact-actions");
if (prefersReducedMotion.matches || !("IntersectionObserver" in window)) {
  revealElements.forEach((element) => element.classList.add("in-view"));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("in-view");
      revealObserver.unobserve(entry.target);
    });
  }, { rootMargin: "12% 0px 12% 0px", threshold: .01 });

  const revealVisibleOrPassed = () => {
    revealElements.forEach((element) => {
      if (element.classList.contains("in-view")) return;
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight * 1.12) {
        element.classList.add("in-view");
        revealObserver.unobserve(element);
      }
    });
  };

  revealElements.forEach((element, index) => {
    element.classList.add("reveal");
    element.style.setProperty("--reveal-delay", `${(index % 3) * 65}ms`);
    revealObserver.observe(element);
  });

  let revealFrame = 0;
  const queueRevealCheck = () => {
    cancelAnimationFrame(revealFrame);
    revealFrame = requestAnimationFrame(revealVisibleOrPassed);
  };

  window.addEventListener("scroll", queueRevealCheck, { passive: true });
  window.addEventListener("hashchange", queueRevealCheck);
  requestAnimationFrame(revealVisibleOrPassed);
}

// 经验数字动画
if (!prefersReducedMotion.matches && "IntersectionObserver" in window) {
  const statNumbers = document.querySelectorAll(".stat-number");
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const element = entry.target;
      const target = Number(element.dataset.countTarget);
      const suffix = element.dataset.countSuffix;
      const start = performance.now();
      const duration = target >= 1000 ? 1200 : 900;
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        element.textContent = `${Math.round(target * (1 - Math.pow(1 - progress, 3)))}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      counterObserver.unobserve(element);
    });
  }, { threshold: .55 });
  statNumbers.forEach((element) => {
    const original = element.textContent.trim();
    element.dataset.countTarget = original.replace(/\D/g, "");
    element.dataset.countSuffix = original.replace(/[\d,]/g, "");
    element.textContent = `0${element.dataset.countSuffix}`;
    counterObserver.observe(element);
  });
}

document.getElementById("currentYear").textContent = String(new Date().getFullYear());
