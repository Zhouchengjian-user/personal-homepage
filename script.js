// ============ 导航栏与滚动进度 ============
const navbar = document.getElementById("navbar");
const scrollProgress = document.getElementById("scrollProgress");

const updateScrollState = () => {
  navbar.classList.toggle("scrolled", window.scrollY > 10);

  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
  scrollProgress.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
};

window.addEventListener("scroll", updateScrollState, { passive: true });
window.addEventListener("resize", updateScrollState);
updateScrollState();

// ============ 主题切换 ============
const root = document.documentElement;
const themeColor = document.getElementById("themeColor");
const themeOptions = document.querySelectorAll(".theme-option");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
const themeColors = {
  ember: "#ffffff",
  midnight: "#14111c",
  mint: "#f4f8f4",
};

const applyTheme = (theme, persist = true) => {
  const validTheme = themeColors[theme] ? theme : "mint";
  root.dataset.theme = validTheme;
  themeColor.setAttribute("content", themeColors[validTheme]);

  themeOptions.forEach((option) => {
    const isActive = option.dataset.theme === validTheme;
    option.classList.toggle("is-active", isActive);
    option.setAttribute("aria-pressed", String(isActive));
  });

  if (persist) {
    try {
      localStorage.setItem("portfolio-theme", validTheme);
    } catch (_) {
      // 在禁用本地存储的浏览器中仍然保持当前主题。
    }
  }
};

let savedTheme = "mint";
try {
  savedTheme = localStorage.getItem("portfolio-theme") || "mint";
} catch (_) {
  savedTheme = "mint";
}
applyTheme(savedTheme, false);

themeOptions.forEach((option) => {
  option.addEventListener("click", () => {
    const nextTheme = option.dataset.theme;
    if (root.dataset.theme === nextTheme) return;

    if (document.startViewTransition && !prefersReducedMotion.matches) {
      document.startViewTransition(() => applyTheme(nextTheme));
    } else {
      applyTheme(nextTheme);
    }
  });
});

// ============ 移动端菜单 ============
const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");

const setMenuState = (isOpen) => {
  navToggle.classList.toggle("active", isOpen);
  navMenu.classList.toggle("active", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
};

navToggle.addEventListener("click", () => {
  setMenuState(!navMenu.classList.contains("active"));
});

navMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenuState(false));
});

// ============ 产品介绍视频封面 ============
document.querySelectorAll(".playground-video-card").forEach((card) => {
  const video = card.querySelector(".playground-video");
  const cover = card.querySelector(".video-cover");
  const durationLabel = card.querySelector(".video-duration");

  if (!video || !cover) return;

  const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  const updateDuration = () => {
    if (durationLabel && Number.isFinite(video.duration)) {
      durationLabel.textContent = formatDuration(video.duration);
    }
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

// 当前区块的导航高亮
const sectionLinks = new Map(
  [...navMenu.querySelectorAll('a[href^="#"]')].map((link) => [
    link.getAttribute("href").slice(1),
    link,
  ])
);

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      sectionLinks.forEach((link) => link.classList.remove("active"));
      sectionLinks.get(entry.target.id)?.classList.add("active");
    });
  },
  { rootMargin: "-32% 0px -58% 0px", threshold: 0 }
);

document.querySelectorAll("section[id]").forEach((section) => {
  sectionObserver.observe(section);
});

// ============ 首屏指针光晕 ============
const hero = document.querySelector(".hero");

hero.addEventListener("pointermove", (event) => {
  if (prefersReducedMotion.matches) return;
  const rect = hero.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 100;
  const y = ((event.clientY - rect.top) / rect.height) * 100;
  hero.style.setProperty("--pointer-x", `${x.toFixed(1)}%`);
  hero.style.setProperty("--pointer-y", `${y.toFixed(1)}%`);
});

hero.addEventListener("pointerleave", () => {
  hero.style.setProperty("--pointer-x", "76%");
  hero.style.setProperty("--pointer-y", "18%");
});

// CTA 磁吸效果与卡片 3D 倾斜
if (canHover.matches && !prefersReducedMotion.matches) {
  document.querySelectorAll(".hero-cta .text-link").forEach((link) => {
    link.addEventListener("pointermove", (event) => {
      const rect = link.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.18;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.24;
      link.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });

    link.addEventListener("pointerleave", () => {
      link.style.transform = "translate3d(0, 0, 0)";
    });
  });

  document.querySelectorAll(".skill-card, .project-card, .stat").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const relativeX = (event.clientX - rect.left) / rect.width;
      const relativeY = (event.clientY - rect.top) / rect.height;
      const tiltX = (0.5 - relativeY) * 5;
      const tiltY = (relativeX - 0.5) * 5;
      card.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
      card.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
    });
  });
}

// ============ 联系表单 ============
const contactForm = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

contactForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(contactForm);
  const name = formData.get("name");
  const email = formData.get("email");

  formStatus.textContent = `感谢您的留言，${name}！我会尽快回复到：${email}`;
  formStatus.classList.add("visible");
  contactForm.reset();

  setTimeout(() => {
    formStatus.classList.remove("visible");
  }, 6000);
});

// ============ 入场动画 ============
const revealElements = document.querySelectorAll(
  ".section-header, .collection-heading, .about-text, .skill-card, .project-card, .stat, .influence-card, .writing-link, .contact-item, .contact-form"
);

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

revealElements.forEach((element, index) => {
  element.classList.add("reveal");
  element.style.setProperty("--reveal-delay", `${(index % 4) * 70}ms`);
  revealObserver.observe(element);
});

// ============ 经验数字增长动画 ============
const statNumbers = document.querySelectorAll(".stat-number");

if (!prefersReducedMotion.matches) {
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const element = entry.target;
        const target = Number(element.dataset.countTarget);
        const suffix = element.dataset.countSuffix;
        const startTime = performance.now();
        const duration = target >= 1000 ? 1300 : 950;

        const tick = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          element.textContent = `${Math.round(target * eased)}${suffix}`;

          if (progress < 1) {
            requestAnimationFrame(tick);
          }
        };

        requestAnimationFrame(tick);
        counterObserver.unobserve(element);
      });
    },
    { threshold: 0.55 }
  );

  statNumbers.forEach((element) => {
    const originalText = element.textContent.trim();
    element.dataset.countTarget = originalText.replace(/\D/g, "");
    element.dataset.countSuffix = originalText.replace(/[\d,]/g, "");
    element.textContent = `0${element.dataset.countSuffix}`;
    counterObserver.observe(element);
  });
}
