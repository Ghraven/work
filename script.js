'use strict';

/* ============================================================
   PAGE LOAD ANIMATION
   ============================================================ */
window.addEventListener('load', () => {
  document.body.classList.remove('page-loading');
  document.body.classList.add('page-loaded');
});

/* ============================================================
   THEME TOGGLE
   ============================================================ */
const html = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');

themeToggle.addEventListener('click', () => {
  const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

/* ============================================================
   SCROLL PROGRESS BAR
   ============================================================ */
const progressBar = document.getElementById('scroll-progress');
let scrollTicking = false;

window.addEventListener('scroll', () => {
  if (!scrollTicking) {
    window.requestAnimationFrame(() => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? scrollTop / docHeight : 0;
      progressBar.style.transform = `scaleX(${pct})`;
      scrollTicking = false;
    });
    scrollTicking = true;
  }
}, { passive: true });

/* ============================================================
   NAVBAR SHADOW + ACTIVE LINK HIGHLIGHT
   ============================================================ */
const navbar  = document.getElementById('navbar');
const sections = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
  navbar.style.boxShadow = window.scrollY > 16
    ? '0 2px 28px rgba(0,0,0,0.35)'
    : 'none';
}, { passive: true });

const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinkEls.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
      });
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => sectionObserver.observe(s));

/* ============================================================
   HAMBURGER MENU
   ============================================================ */
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('nav-links');

hamburger.addEventListener('click', () => {
  const isOpen = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  });
});

document.addEventListener('click', e => {
  if (!navLinks.contains(e.target) && !hamburger.contains(e.target)) {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }
});

/* ============================================================
   TYPEWRITER EFFECT
   ============================================================ */
const typeEl  = document.getElementById('typewriter');
const phrases = [
  'Python Developer & AI Automation Builder',
  'Local LLM Tool Builder',
  'Open Source Contributor',
  'Developer Workflow Builder',
];

let phraseIndex = 0;
let charIndex   = 0;
let isDeleting  = false;

const TYPING_SPEED = 80;
const DELETE_SPEED = 40;
const PAUSE_END    = 2200;
const PAUSE_START  = 450;

function type() {
  const current = phrases[phraseIndex];

  if (!isDeleting) {
    typeEl.textContent = current.slice(0, charIndex + 1);
    charIndex++;
    if (charIndex === current.length) {
      setTimeout(() => { isDeleting = true; type(); }, PAUSE_END);
      return;
    }
  } else {
    typeEl.textContent = current.slice(0, charIndex - 1);
    charIndex--;
    if (charIndex === 0) {
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      setTimeout(type, PAUSE_START);
      return;
    }
  }

  setTimeout(type, isDeleting ? DELETE_SPEED : TYPING_SPEED);
}

setTimeout(type, 700);

/* ============================================================
   SCROLL ANIMATIONS (IntersectionObserver)
   ============================================================ */
const animateEls = document.querySelectorAll('.animate-on-scroll');

// Apply staggered entrance delays to grid items.
// Capped so even a long row finishes quickly (motion should feel instant).
const STAGGER_STEP = 0.06; // seconds
const STAGGER_MAX = 0.24;  // seconds
const grids = document.querySelectorAll('.skills-grid, .projects-grid, .services-grid, .oss-repos');
grids.forEach(grid => {
  Array.from(grid.children).forEach((child, index) => {
    child.style.transitionDelay = `${Math.min(index * STAGGER_STEP, STAGGER_MAX)}s`;
  });
});

const animObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      animObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

animateEls.forEach(el => animObserver.observe(el));

/* ============================================================
   HERO PARALLAX
   ============================================================ */
const heroGrid = document.querySelector('.hero-bg-grid');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (heroGrid && !prefersReducedMotion) {
  let parallaxTicking = false;
  document.addEventListener('mousemove', (e) => {
    if (parallaxTicking) return;
    parallaxTicking = true;
    window.requestAnimationFrame(() => {
      const x = (window.innerWidth / 2 - e.pageX) / 50;
      const y = (window.innerHeight / 2 - e.pageY) / 50;
      heroGrid.style.transform = `translate(${x}px, ${y}px)`;
      parallaxTicking = false;
    });
  }, { passive: true });
}

/* ============================================================
   HERO CONSTELLATION CANVAS
   Lightweight Genesis/Nebula-inspired layer for the portfolio hero.
   ============================================================ */
const heroCanvas = document.getElementById('hero-constellation');

if (heroCanvas && !prefersReducedMotion && window.innerWidth >= 640) {
  const ctx = heroCanvas.getContext('2d');
  const pointer = { x: -9999, y: -9999 };
  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let frameId = 0;

  function resizeHeroCanvas() {
    const rect = heroCanvas.getBoundingClientRect();
    width = Math.max(1, Math.floor(rect.width));
    height = Math.max(1, Math.floor(rect.height));
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    heroCanvas.width = Math.floor(width * dpr);
    heroCanvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const baseCount = width < 720 ? 46 : 76;
    particles = Array.from({ length: baseCount }, (_, index) => {
      const angle = (index / baseCount) * Math.PI * 2;
      const radius = 0.18 + Math.random() * 0.38;
      return {
        x: width * (0.5 + Math.cos(angle) * radius * 0.82) + (Math.random() - 0.5) * 90,
        y: height * (0.52 + Math.sin(angle) * radius * 0.45) + (Math.random() - 0.5) * 70,
        vx: (Math.random() - 0.5) * 0.16,
        vy: (Math.random() - 0.5) * 0.14,
        size: 1.2 + Math.random() * 2.1,
        hue: Math.random() > 0.68 ? 154 : 190 + Math.random() * 54,
      };
    });
  }

  function drawHeroCanvas() {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';

    const maxLink = width < 720 ? 118 : 150;
    particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;

      const dx = p.x - pointer.x;
      const dy = p.y - pointer.y;
      const pointerDist = Math.hypot(dx, dy);
      if (pointerDist < 120) {
        p.x += (dx / Math.max(pointerDist, 1)) * 0.45;
        p.y += (dy / Math.max(pointerDist, 1)) * 0.45;
      }

      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dist = Math.hypot(p.x - q.x, p.y - q.y);
        if (dist < maxLink) {
          const alpha = (1 - dist / maxLink) * 0.18;
          ctx.strokeStyle = `hsla(${p.hue}, 95%, 66%, ${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.stroke();
        }
      }

      const pulse = 0.75 + Math.sin(Date.now() * 0.0013 + i) * 0.25;
      ctx.fillStyle = `hsla(${p.hue}, 95%, 68%, ${0.28 + pulse * 0.18})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * pulse, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalCompositeOperation = 'source-over';
    frameId = window.requestAnimationFrame(drawHeroCanvas);
  }

  resizeHeroCanvas();
  drawHeroCanvas();

  window.addEventListener('resize', resizeHeroCanvas, { passive: true });
  document.addEventListener('pointermove', (event) => {
    const rect = heroCanvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
  }, { passive: true });
  document.addEventListener('pointerleave', () => {
    pointer.x = -9999;
    pointer.y = -9999;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      window.cancelAnimationFrame(frameId);
    } else {
      drawHeroCanvas();
    }
  });
}

/* ============================================================
   BACK TO TOP BUTTON
   ============================================================ */
const backToTop = document.getElementById('back-to-top');

window.addEventListener('scroll', () => {
  backToTop.classList.toggle('visible', window.scrollY > 400);
}, { passive: true });

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ============================================================
   CONTACT MODAL
   ============================================================
   Email delivery uses Formspree (free, no backend needed).
   Setup (2 minutes):
     1. Go to https://formspree.io and sign up (free)
     2. Click "New Form" → copy your form endpoint, e.g.:
        https://formspree.io/f/xyzabc12
     3. Replace the FORMSPREE_ENDPOINT value below with your URL.
   ============================================================ */
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID';

const modal         = document.getElementById('contact-modal');
const openBtn       = document.getElementById('open-contact-modal');
const closeBtn      = document.getElementById('modal-close');
const contactForm   = document.getElementById('contact-form');
const formState     = document.getElementById('modal-form-state');
const successState  = document.getElementById('modal-success-state');
const closeSuccess  = document.getElementById('btn-close-success');
const sendBtn       = document.getElementById('btn-send');
const emailInput    = document.getElementById('f-email');
const emailError    = document.getElementById('email-error');

/* ============================================================
   DYNAMIC FOOTER YEAR
   ============================================================ */
const footerYearEl = document.getElementById('footer-year');
if (footerYearEl) {
  footerYearEl.textContent = new Date().getFullYear();
}


function openModal() {
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => emailInput.focus(), 350);
}

function closeModal() {
  modal.classList.remove('open');
  document.body.style.overflow = '';
  // Reset after transition
  setTimeout(() => {
    contactForm.reset();
    clearEmailError();
    formState.style.display = 'block';
    successState.classList.remove('visible');
    successState.style.display = 'none';
    sendBtn.classList.remove('loading');
    sendBtn.disabled = false;
  }, 320);
}

openBtn.addEventListener('click', openModal);
closeBtn.addEventListener('click', closeModal);
closeSuccess.addEventListener('click', closeModal);

// Close on overlay click (not on card click)
modal.addEventListener('click', e => {
  if (e.target === modal) closeModal();
});

// Close on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
});

/* ---------- Form validation ---------- */
const nameInput = document.getElementById('f-name');
const msgInput  = document.getElementById('f-message');

function isValidEmail(email) {
  // Standard format: local@domain.tld — requires at least 2-char TLD
  return /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(email.trim());
}

function showEmailError(msg) {
  emailError.textContent = msg;
  emailInput.classList.add('input-error');
  emailInput.classList.remove('input-valid');
}

function clearEmailError() {
  emailError.textContent = '';
  emailInput.classList.remove('input-error');
  emailInput.classList.add('input-valid');
}

emailInput.addEventListener('input', () => {
  if (emailInput.value && !isValidEmail(emailInput.value)) {
    showEmailError('— enter a valid email address');
  } else if (emailInput.value) {
    clearEmailError();
  } else {
    emailError.textContent = '';
    emailInput.classList.remove('input-error', 'input-valid');
  }
});

nameInput.addEventListener('input', () => {
  if (nameInput.value.trim().length > 0) {
    nameInput.classList.add('input-valid');
    nameInput.classList.remove('input-error');
  } else {
    nameInput.classList.remove('input-valid');
  }
});

msgInput.addEventListener('input', () => {
  if (msgInput.value.trim().length > 0) {
    msgInput.classList.add('input-valid');
    msgInput.classList.remove('input-error');
  } else {
    msgInput.classList.remove('input-valid');
  }
});

/* ---------- Form submission ---------- */
contactForm.addEventListener('submit', async e => {
  e.preventDefault();

  const email = emailInput.value.trim();

  if (!isValidEmail(email)) {
    showEmailError('— enter a valid email address');
    emailInput.focus();
    return;
  }
  clearEmailError();

  // Loading state
  sendBtn.classList.add('loading');
  sendBtn.disabled = true;

  const data = {
    name:    document.getElementById('f-name').value.trim(),
    email,
    subject: document.getElementById('f-subject').value.trim(),
    message: document.getElementById('f-message').value.trim(),
  };

  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method:  'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
    });

    if (res.ok) {
      // Show success
      formState.style.display = 'none';
      successState.style.display = 'flex';
      successState.classList.add('visible');
    } else {
      throw new Error('Send failed');
    }
  } catch {
    // Fallback: open mailto pre-filled so the message isn't lost
    const subject = encodeURIComponent(data.subject || 'Message from portfolio');
    const body    = encodeURIComponent(`From: ${data.name} (${data.email})\n\n${data.message}`);
    window.location.href = `mailto:rolly.calma.0217@gmail.com?subject=${subject}&body=${body}`;
    sendBtn.classList.remove('loading');
    sendBtn.disabled = false;
  }
});
