/* =========================================================
   Birthday Site — Script
   Sliders + no audio
========================================================= */

const intro       = document.getElementById("intro");
const main        = document.getElementById("main");
const startButton = document.getElementById("startButton");
const replay      = document.getElementById("replay");

const envelope    = document.getElementById("envelope");
const viewLetter  = document.getElementById("viewLetter");
const letterModal = document.getElementById("letterModal");
const closeLetter = document.getElementById("closeLetter");

const photoModal    = document.getElementById("photoModal");
const closePhoto    = document.getElementById("closePhoto");
const expandedPhoto = document.getElementById("expandedPhoto");
const photoCaption  = document.getElementById("photoCaption");

const mainVideo = document.getElementById("mainVideo");
const particles = document.getElementById("particles");

/* ---------- Force mute forever ---------- */
if (mainVideo) {
  mainVideo.muted = true;
  mainVideo.volume = 0;
  mainVideo.addEventListener("volumechange", () => {
    mainVideo.muted = true;
    mainVideo.volume = 0;
  });
}

/* ---------- Generic Slider ---------- */
function createSlider({ trackId, dotsId, prevId, nextId, onChange }) {
  const track = document.getElementById(trackId);
  const dotsContainer = document.getElementById(dotsId);
  const prevBtn = document.getElementById(prevId);
  const nextBtn = document.getElementById(nextId);
  const slides = track ? Array.from(track.children) : [];
  let index = 0;
  let startX = 0;
  let isDragging = false;

  if (!track || slides.length === 0) return { goTo: () => {}, getIndex: () => 0 };

  // Create dots
  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "dot" + (i === 0 ? " active" : "");
    dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
    dot.addEventListener("click", () => goTo(i));
    dotsContainer.appendChild(dot);
  });

  const dots = Array.from(dotsContainer.children);

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, di) => d.classList.toggle("active", di === index));
    if (onChange) onChange(index, slides[index]);
  }

  prevBtn.addEventListener("click", () => goTo(index - 1));
  nextBtn.addEventListener("click", () => goTo(index + 1));

  // Touch / swipe
  track.addEventListener("touchstart", e => {
    startX = e.touches[0].clientX;
    isDragging = true;
  }, { passive: true });

  track.addEventListener("touchend", e => {
    if (!isDragging) return;
    isDragging = false;
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 50) {
      goTo(diff < 0 ? index + 1 : index - 1);
    }
  }, { passive: true });

  // Mouse drag (optional nicety)
  track.addEventListener("mousedown", e => {
    startX = e.clientX;
    isDragging = true;
  });
  window.addEventListener("mouseup", e => {
    if (!isDragging) return;
    isDragging = false;
    const diff = e.clientX - startX;
    if (Math.abs(diff) > 60) {
      goTo(diff < 0 ? index + 1 : index - 1);
    }
  });

  return { goTo, getIndex: () => index };
}

/* ---------- Photo Slider ---------- */
const photoSlider = createSlider({
  trackId: "photoTrack",
  dotsId: "photoDots",
  prevId: "photoPrev",
  nextId: "photoNext"
});

/* ---------- Video Slider ---------- */
const videoSlides = document.querySelectorAll(".video-slide");

const videoSlider = createSlider({
  trackId: "videoTrack",
  dotsId: "videoDots",
  prevId: "videoPrev",
  nextId: "videoNext",
  onChange: (i, slide) => {
    // Update active class
    videoSlides.forEach(s => s.classList.remove("active"));
    slide.classList.add("active");

    // Switch video
    const src = slide.dataset.src;
    if (mainVideo && src) {
      mainVideo.pause();
      mainVideo.muted = true;
      mainVideo.volume = 0;
      mainVideo.src = src;
      mainVideo.load();
      mainVideo.play().catch(() => {});
    }
  }
});

// Also allow clicking a video slide directly
videoSlides.forEach((slide, i) => {
  slide.addEventListener("click", () => {
    videoSlider.goTo(i);
  });
});

/* ---------- Opening ---------- */
startButton.addEventListener("click", () => {
  intro.classList.add("hide");

  setTimeout(() => {
    intro.classList.add("hidden");
    main.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "auto" });
    observeReveals();
  }, 900);
});

/* ---------- Full reset on replay ---------- */
function fullReset() {
  closePhotoModal();
  closeLetterModal();

  envelope.classList.remove("open");
  viewLetter.classList.remove("visible");
  viewLetter.classList.add("hidden-btn");

  if (mainVideo) {
    mainVideo.pause();
    mainVideo.currentTime = 0;
    mainVideo.muted = true;
    mainVideo.volume = 0;
  }

  // Reset both sliders to first slide
  photoSlider.goTo(0);
  videoSlider.goTo(0);

  document.querySelectorAll(".reveal").forEach(el => {
    el.classList.remove("visible", "observed");
  });
}

replay.addEventListener("click", () => {
  fullReset();
  main.classList.add("hidden");
  intro.classList.remove("hidden", "hide");
  window.scrollTo({ top: 0, behavior: "auto" });
});

/* ---------- Floating particles ---------- */
function makeParticle() {
  const el = document.createElement("span");
  el.className = "particle";
  el.textContent = Math.random() > 0.3 ? "♡" : "✦";
  el.style.left = Math.random() * 100 + "%";
  el.style.fontSize = (11 + Math.random() * 14) + "px";
  el.style.animationDuration = (7 + Math.random() * 6) + "s";
  particles.appendChild(el);
  setTimeout(() => el.remove(), 14000);
}
setInterval(makeParticle, 1300);

/* ---------- Scroll reveal ---------- */
function observeReveals() {
  const items = document.querySelectorAll(".reveal:not(.observed)");
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible", "observed");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach(item => observer.observe(item));
}

/* ---------- Photos lightbox ---------- */
document.querySelectorAll(".photo-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    expandedPhoto.src = btn.dataset.src;
    expandedPhoto.alt = btn.querySelector("img").alt;
    photoCaption.textContent = btn.dataset.caption || "";
    photoModal.classList.add("show");
    photoModal.setAttribute("aria-hidden", "false");
  });
});

function closePhotoModal() {
  photoModal.classList.remove("show");
  photoModal.setAttribute("aria-hidden", "true");
  expandedPhoto.src = "";
}
closePhoto.addEventListener("click", closePhotoModal);
photoModal.addEventListener("click", e => {
  if (e.target === photoModal) closePhotoModal();
});

/* ---------- Envelope ---------- */
function toggleEnvelope() {
  envelope.classList.toggle("open");
  if (envelope.classList.contains("open")) {
    viewLetter.classList.remove("hidden-btn");
    setTimeout(() => viewLetter.classList.add("visible"), 400);
  } else {
    viewLetter.classList.remove("visible");
    viewLetter.classList.add("hidden-btn");
  }
}
envelope.addEventListener("click", toggleEnvelope);
envelope.addEventListener("keydown", e => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    toggleEnvelope();
  }
});

/* ---------- Letter modal ---------- */
function openLetterModal() {
  letterModal.classList.add("show");
  letterModal.setAttribute("aria-hidden", "false");
}
function closeLetterModal() {
  letterModal.classList.remove("show");
  letterModal.setAttribute("aria-hidden", "true");
}
viewLetter.addEventListener("click", openLetterModal);
closeLetter.addEventListener("click", closeLetterModal);
letterModal.addEventListener("click", e => {
  if (e.target === letterModal) closeLetterModal();
});

/* ---------- Escape ---------- */
document.addEventListener("keydown", e => {
  if (e.key === "Escape") {
    closePhotoModal();
    closeLetterModal();
  }
});

/* ---------- Init ---------- */
observeReveals();
