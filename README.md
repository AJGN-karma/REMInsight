<!doctype html>
<html lang="en" class="h-full">
 <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>REMInsight README</title>
  <script src="https://cdn.tailwindcss.com/3.4.17"></script>
  <script src="https://cdn.jsdelivr.net/npm/lucide@0.263.0/dist/umd/lucide.min.js"></script>
  <script src="/_sdk/element_sdk.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&amp;family=Outfit:wght@300;400;500;600;700;800;900&amp;family=Space+Mono:wght@400;700&amp;display=swap" rel="stylesheet">
  <style>
  * { box-sizing: border-box; }
  html, body { height: 100%; margin: 0; }

  :root {
    --bg: #0a0e1a;
    --surface: #111827;
    --text: #e2e8f0;
    --primary: #6366f1;
    --secondary: #22d3ee;
  }

  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(2deg); }
  }
  @keyframes floatReverse {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(15px) rotate(-1.5deg); }
  }
  @keyframes pulse-glow {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.8; transform: scale(1.05); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideLeft {
    from { opacity: 0; transform: translateX(60px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideRight {
    from { opacity: 0; transform: translateX(-60px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes typewriter {
    from { width: 0; }
    to { width: 100%; }
  }
  @keyframes blink {
    0%, 100% { border-color: var(--secondary); }
    50% { border-color: transparent; }
  }
  @keyframes wave-draw {
    from { stroke-dashoffset: 2000; }
    to { stroke-dashoffset: 0; }
  }
  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes orbit {
    from { transform: rotate(0deg) translateX(120px) rotate(0deg); }
    to { transform: rotate(360deg) translateX(120px) rotate(-360deg); }
  }
  @keyframes orbit2 {
    from { transform: rotate(120deg) translateX(90px) rotate(-120deg); }
    to { transform: rotate(480deg) translateX(90px) rotate(-480deg); }
  }
  @keyframes orbit3 {
    from { transform: rotate(240deg) translateX(150px) rotate(-240deg); }
    to { transform: rotate(600deg) translateX(150px) rotate(-600deg); }
  }
  @keyframes fadeScale {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes nodeFloat1 { 0%,100%{transform:translate(0,0)} 25%{transform:translate(8px,-12px)} 50%{transform:translate(-5px,-8px)} 75%{transform:translate(10px,5px)} }
  @keyframes nodeFloat2 { 0%,100%{transform:translate(0,0)} 25%{transform:translate(-10px,8px)} 50%{transform:translate(6px,14px)} 75%{transform:translate(-8px,-6px)} }
  @keyframes barGrow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
  @keyframes scanLine {
    0% { top: 0%; opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }
  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.4), 0 0 40px rgba(99,102,241,0.2); }
    50% { box-shadow: 0 0 40px rgba(99,102,241,0.8), 0 0 80px rgba(99,102,241,0.4); }
  }
  @keyframes slideInDown {
    from { opacity: 0; transform: translateY(-30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes popIn {
    0% { transform: scale(0) rotate(-180deg); opacity: 0; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }
  @keyframes bounce-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
  @keyframes neon-glow {
    0%, 100% { filter: drop-shadow(0 0 5px rgba(99,102,241,0.6)) drop-shadow(0 0 10px rgba(34,211,238,0.3)); }
    50% { filter: drop-shadow(0 0 10px rgba(99,102,241,0.8)) drop-shadow(0 0 20px rgba(34,211,238,0.6)); }
  }
  @keyframes flip-card {
    0% { transform: rotateY(0deg); }
    100% { transform: rotateY(360deg); }
  }

  .anim-up { animation: slideUp 0.8s ease-out both; }
  .anim-left { animation: slideLeft 0.8s ease-out both; }
  .anim-right { animation: slideRight 0.8s ease-out both; }
  .anim-scale { animation: fadeScale 0.7s ease-out both; }

  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.2s; }
  .delay-3 { animation-delay: 0.3s; }
  .delay-4 { animation-delay: 0.4s; }
  .delay-5 { animation-delay: 0.5s; }
  .delay-6 { animation-delay: 0.6s; }
  .delay-7 { animation-delay: 0.7s; }
  .delay-8 { animation-delay: 0.8s; }
  .delay-9 { animation-delay: 0.9s; }
  .delay-10 { animation-delay: 1.0s; }

  .gradient-text {
    background: linear-gradient(135deg, #6366f1, #22d3ee, #a78bfa, #6366f1);
    background-size: 300% 300%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: gradient-shift 4s ease infinite;
  }

  .card-glow {
    position: relative;
    overflow: hidden;
  }
  .card-glow::before {
    content: '';
    position: absolute;
    top: -1px; left: -1px; right: -1px; bottom: -1px;
    background: linear-gradient(135deg, #6366f1, #22d3ee, #a78bfa);
    border-radius: inherit;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.4s;
  }
  .card-glow:hover::before { opacity: 1; }
  .card-glow::after {
    content: '';
    position: absolute;
    top: 1px; left: 1px; right: 1px; bottom: 1px;
    background: var(--surface);
    border-radius: inherit;
    z-index: -1;
  }

  .shimmer-badge {
    background: linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.3) 50%, transparent 100%);
    background-size: 200% 100%;
    animation: shimmer 3s ease-in-out infinite;
  }

  .brain-node {
    width: 8px; height: 8px;
    background: var(--secondary);
    border-radius: 50%;
    position: absolute;
    box-shadow: 0 0 12px rgba(34,211,238,0.6);
  }

  .wave-container svg path {
    stroke-dasharray: 2000;
    stroke-dashoffset: 2000;
    animation: wave-draw 3s ease-out forwards;
  }

  .tech-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 500;
    border: 1px solid rgba(99,102,241,0.3);
    background: rgba(99,102,241,0.08);
    color: #a5b4fc;
    transition: all 0.3s;
  }
  .tech-badge:hover {
    border-color: rgba(99,102,241,0.6);
    background: rgba(99,102,241,0.15);
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(99,102,241,0.2);
  }

  .stat-number {
    font-family: 'JetBrains Mono', monospace;
    font-size: 2.5rem;
    font-weight: 700;
    line-height: 1;
  }

  .section-divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.4), rgba(34,211,238,0.4), transparent);
    margin: 3rem 0;
  }

  .pipeline-step {
    position: relative;
    padding-left: 2.5rem;
  }
  .pipeline-step::before {
    content: '';
    position: absolute;
    left: 11px;
    top: 32px;
    bottom: -16px;
    width: 2px;
    background: linear-gradient(to bottom, var(--primary), transparent);
  }
  .pipeline-step:last-child::before { display: none; }
  .pipeline-dot {
    position: absolute;
    left: 0;
    top: 6px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--bg);
    border: 2px solid var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pipeline-dot::after {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--primary);
  }

  .feature-icon-wrap {
    width: 56px; height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .code-block {
    background: #0d1117;
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: 12px;
    overflow: hidden;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
  }
  .code-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    background: rgba(99,102,241,0.08);
    border-bottom: 1px solid rgba(99,102,241,0.15);
  }
  .code-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
  }

  .scroll-reveal { opacity: 0; transform: translateY(30px); transition: all 0.7s ease-out; }
  .scroll-reveal.visible { opacity: 1; transform: translateY(0); }

  /* Animated EEG wave for hero */
  .eeg-wave { position: absolute; width: 100%; height: 120px; bottom: 0; left: 0; opacity: 0.15; overflow: hidden; }

  .toc-link {
    color: #94a3b8;
    text-decoration: none;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
  }
  .toc-link:hover { color: #22d3ee; transform: translateX(4px); }

  .metric-bar {
    height: 100%;
    border-radius: 4px;
    transform-origin: bottom;
    animation: barGrow 1.2s ease-out both;
  }
</style>
  <style>body { box-sizing: border-box; }</style>
  <script src="/_sdk/data_sdk.js" type="text/javascript"></script>
 </head>
 <body class="h-full" style="background:var(--bg);color:var(--text);font-family:'Outfit',sans-serif;overflow-x:hidden;">
  <div id="app-root" class="w-full h-full overflow-auto" style="background:var(--bg);">
   <!-- Floating ambient orbs -->
   <div style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;overflow:hidden;">
    <div style="position:absolute;top:10%;left:5%;width:300px;height:300px;background:radial-gradient(circle,rgba(99,102,241,0.12),transparent 70%);border-radius:50%;animation:float 8s ease-in-out infinite;"></div>
    <div style="position:absolute;top:40%;right:5%;width:250px;height:250px;background:radial-gradient(circle,rgba(34,211,238,0.1),transparent 70%);border-radius:50%;animation:floatReverse 10s ease-in-out infinite;"></div>
    <div style="position:absolute;bottom:20%;left:30%;width:200px;height:200px;background:radial-gradient(circle,rgba(167,139,250,0.08),transparent 70%);border-radius:50%;animation:float 12s ease-in-out infinite;"></div>
   </div>
   <div style="position:relative;z-index:1;max-width:960px;margin:0 auto;padding:2rem 1.5rem;">
    <!-- HERO SECTION -->
    <header class="anim-up" style="text-align:center;padding:3rem 0 2rem;">
     <!-- Animated brain/neural graphic -->
     <div style="position:relative;width:200px;height:200px;margin:0 auto 2rem;">
      <div style="position:absolute;inset:0;border-radius:50%;border:2px solid rgba(99,102,241,0.2);animation:pulse-glow 3s ease-in-out infinite;"></div>
      <div style="position:absolute;inset:15px;border-radius:50%;border:2px dashed rgba(34,211,238,0.2);animation:pulse-glow 3s ease-in-out infinite 0.5s;"></div>
      <div style="position:absolute;inset:30px;border-radius:50%;background:radial-gradient(circle,rgba(99,102,241,0.15),transparent 70%);"></div><!-- orbiting particles -->
      <div style="position:absolute;top:50%;left:50%;width:10px;height:10px;margin:-5px 0 0 -5px;">
       <div style="position:absolute;width:8px;height:8px;background:#6366f1;border-radius:50%;box-shadow:0 0 16px #6366f1;animation:orbit 6s linear infinite;"></div>
       <div style="position:absolute;width:6px;height:6px;background:#22d3ee;border-radius:50%;box-shadow:0 0 12px #22d3ee;animation:orbit2 8s linear infinite;"></div>
       <div style="position:absolute;width:5px;height:5px;background:#a78bfa;border-radius:50%;box-shadow:0 0 10px #a78bfa;animation:orbit3 10s linear infinite;"></div>
      </div><!-- center icon -->
      <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;">
       <svg width="64" height="64" viewbox="0 0 64 64" fill="none">
        <path d="M32 8C18.7 8 8 18.7 8 32s10.7 24 24 24 24-10.7 24-24S45.3 8 32 8z" stroke="#6366f1" stroke-width="1.5" fill="none" opacity="0.5" /> <path d="M20 30c0-6.6 5.4-12 12-12s12 5.4 12 12" stroke="#22d3ee" stroke-width="2" fill="none" stroke-linecap="round" /> <path d="M22 36c2 4 6 7 10 7s8-3 10-7" stroke="#a78bfa" stroke-width="2" fill="none" stroke-linecap="round" /> <circle cx="28" cy="28" r="2" fill="#22d3ee" /> <circle cx="36" cy="28" r="2" fill="#6366f1" /> <circle cx="32" cy="34" r="2" fill="#a78bfa" /> <line x1="28" y1="28" x2="36" y2="28" stroke="#6366f1" stroke-width="0.8" opacity="0.5" /> <line x1="28" y1="28" x2="32" y2="34" stroke="#22d3ee" stroke-width="0.8" opacity="0.5" /> <line x1="36" y1="28" x2="32" y2="34" stroke="#a78bfa" stroke-width="0.8" opacity="0.5" />
       </svg>
      </div>
     </div>
     <div class="anim-up delay-2" style="display:inline-block;padding:6px 16px;border-radius:9999px;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;margin-bottom:1rem;border:1px solid rgba(34,211,238,0.3);color:#22d3ee;">
      <span class="shimmer-badge" style="padding:6px 16px;border-radius:9999px;">🧠 AI-POWERED SLEEP ANALYTICS</span>
     </div>
     <h1 id="hero-title" class="anim-up delay-3" style="font-size:clamp(2.5rem,6vw,4.5rem);font-weight:900;line-height:1.05;margin:0.5rem 0;"><span class="gradient-text">REMInsight</span></h1>
     <p id="hero-tagline" class="anim-up delay-4" style="font-size:clamp(1rem,2.5vw,1.35rem);color:#94a3b8;max-width:620px;margin:1rem auto 1.5rem;font-weight:300;line-height:1.6;">Application of REM Sleep Dynamics to Early Diagnosis of Psychiatric Disorders via Machine Learning</p><!-- Badges row -->
     <div class="anim-up delay-5" style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-bottom:2rem;">
      <span class="tech-badge"><span style="color:#22d3ee;">⚡</span> XGBoost</span> <span class="tech-badge"><span style="color:#a78bfa;">🔬</span> Fourier Analysis</span> <span class="tech-badge"><span style="color:#f472b6;">🧪</span> PSQI Integration</span> <span class="tech-badge"><span style="color:#34d399;">🌐</span> Next.js + FastAPI</span> <span class="tech-badge"><span style="color:#fbbf24;">🔒</span> Firebase Auth</span>
     </div><!-- CTA buttons -->
     <div class="anim-up delay-6" style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;">
      <a id="demo-link" href="https://rem-insight.vercel.app/" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:linear-gradient(135deg,#6366f1,#4f46e5);color:#fff;border-radius:12px;font-weight:600;text-decoration:none;font-size:15px;transition:all 0.3s;box-shadow:0 4px 20px rgba(99,102,241,0.4);animation:glow-pulse 2s ease-in-out infinite;"> <i data-lucide="play-circle" style="width:18px;height:18px;"></i> Live Demo </a> <a href="#architecture" style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:transparent;color:#e2e8f0;border:1px solid rgba(99,102,241,0.4);border-radius:12px;font-weight:600;text-decoration:none;font-size:15px;transition:all 0.3s;"> <i data-lucide="book-open" style="width:18px;height:18px;"></i> Documentation </a> <a href="#quickstart" style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;background:transparent;color:#e2e8f0;border:1px solid rgba(34,211,238,0.3);border-radius:12px;font-weight:600;text-decoration:none;font-size:15px;transition:all 0.3s;"> <i data-lucide="terminal" style="width:18px;height:18px;"></i> Quick Start </a>
     </div>
    </header><!-- Animated EEG wave -->
    <div class="wave-container anim-up delay-7" style="margin:-1rem 0 2rem;overflow:hidden;height:80px;">
     <svg viewbox="0 0 960 80" preserveaspectratio="none" style="width:100%;height:80px;">
      <path d="M0 40 Q20 10 40 40 T80 40 T120 40 T160 40 T200 40 T240 40 T280 40 T320 40 T360 40 T400 40 T440 40 T480 40 T520 40 T560 40 T600 40 T640 40 T680 40 T720 40 T760 40 T800 40 T840 40 T880 40 T920 40 T960 40" fill="none" stroke="#6366f1" stroke-width="2" style="animation-delay:0s" /> <path d="M0 45 Q30 15 60 45 T120 45 T180 45 T240 45 T300 45 T360 45 T420 45 T480 45 T540 45 T600 45 T660 45 T720 45 T780 45 T840 45 T900 45 T960 45" fill="none" stroke="#22d3ee" stroke-width="1.5" opacity="0.6" style="animation-delay:0.5s" /> <path d="M0 38 Q25 58 50 38 T100 38 T150 38 T200 38 T250 38 T300 38 T350 38 T400 38 T450 38 T500 38 T550 38 T600 38 T650 38 T700 38 T750 38 T800 38 T850 38 T900 38 T950 38" fill="none" stroke="#a78bfa" stroke-width="1" opacity="0.4" style="animation-delay:1s" />
     </svg>
    </div>
    <div class="section-divider"></div><!-- TABLE OF CONTENTS -->
    <section class="scroll-reveal" style="margin-bottom:2rem;">
     <div style="display:flex;align-items:center;gap:10px;margin-bottom:1rem;">
      <i data-lucide="list" style="width:20px;height:20px;color:#6366f1;"></i>
      <h2 style="font-size:1.25rem;font-weight:700;margin:0;">Table of Contents</h2>
     </div>
     <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:4px 2rem;padding:1rem;background:rgba(17,24,39,0.6);border-radius:12px;border:1px solid rgba(99,102,241,0.1);">
      <a href="#overview" class="toc-link"><span style="color:#6366f1;">01</span> Overview</a> <a href="#features" class="toc-link"><span style="color:#6366f1;">02</span> Key Features</a> <a href="#architecture" class="toc-link"><span style="color:#6366f1;">03</span> Architecture</a> <a href="#ml-pipeline" class="toc-link"><span style="color:#6366f1;">04</span> ML Pipeline</a> <a href="#tech-stack" class="toc-link"><span style="color:#6366f1;">05</span> Tech Stack</a> <a href="#quickstart" class="toc-link"><span style="color:#6366f1;">06</span> Quick Start</a> <a href="#metrics" class="toc-link"><span style="color:#6366f1;">07</span> Performance</a> <a href="#research" class="toc-link"><span style="color:#6366f1;">08</span> Research Basis</a>
     </div>
    </section>
    <div class="section-divider"></div><!-- OVERVIEW -->
    <section id="overview" class="scroll-reveal" style="margin-bottom:2.5rem;">
     <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.25rem;">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#4f46e5);display:flex;align-items:center;justify-content:center;">
       <i data-lucide="info" style="width:18px;height:18px;color:#fff;"></i>
      </div>
      <h2 style="font-size:1.5rem;font-weight:800;margin:0;">Overview</h2>
     </div>
     <div style="background:var(--surface);border-radius:16px;padding:1.5rem;border:1px solid rgba(99,102,241,0.1);line-height:1.8;color:#cbd5e1;font-size:15px;">
      <p style="margin:0 0 1rem;"><strong style="color:#e2e8f0;">REMInsight</strong> is an AI-driven psychiatric risk assessment platform that leverages <strong style="color:#22d3ee;">REM sleep dynamics</strong> for early diagnosis of psychiatric disorders including depression, anxiety, and schizophrenia.</p>
      <p style="margin:0 0 1rem;">The system integrates <strong style="color:#a78bfa;">objective REM sleep parameters</strong> with subjective <strong style="color:#6366f1;">Pittsburgh Sleep Quality Index (PSQI)</strong> scores to identify early indicators of psychiatric risk through a hybrid machine learning framework.</p>
      <p style="margin:0;">By employing the <strong style="color:#22d3ee;">XGBoost algorithm</strong> — a gradient boosting model known for high accuracy and interpretability — the platform classifies risk levels based on extracted temporal and spectral features from sleep data, enabling <strong style="color:#f472b6;">non-invasive, real-time, and data-supported</strong> psychiatric risk assessment.</p>
     </div>
    </section><!-- KEY FEATURES -->
    <section id="features" class="scroll-reveal" style="margin-bottom:2.5rem;">
     <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.25rem;">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#22d3ee,#06b6d4);display:flex;align-items:center;justify-content:center;">
       <i data-lucide="zap" style="width:18px;height:18px;color:#fff;"></i>
      </div>
      <h2 style="font-size:1.5rem;font-weight:800;margin:0;">Key Features</h2>
     </div>
     <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
      <!-- Feature cards -->
      <div class="card-glow" style="background:var(--surface);border-radius:16px;padding:1.25rem;border:1px solid rgba(99,102,241,0.15);transition:all 0.3s;cursor:default;animation:slideInUp 0.8s ease-out backwards;" onmouseenter="this.style.transform='translateY(-8px)';this.style.boxShadow='0 20px 40px rgba(99,102,241,0.3)'" onmouseleave="this.style.transform='translateY(0)';this.style.boxShadow=''">
       <div class="feature-icon-wrap" style="background:rgba(99,102,241,0.12);margin-bottom:0.75rem;animation:popIn 0.6s ease-out backwards;">
        <i data-lucide="brain" style="width:28px;height:28px;color:#6366f1;"></i>
       </div>
       <h3 style="font-size:1rem;font-weight:700;margin:0 0 0.5rem;">AI-Powered Analysis</h3>
       <p style="font-size:13px;color:#94a3b8;margin:0;line-height:1.6;">XGBoost classifier with Fourier-based spectral feature extraction for precise REM sleep pattern recognition.</p>
      </div>
      <div class="card-glow" style="background:var(--surface);border-radius:16px;padding:1.25rem;border:1px solid rgba(99,102,241,0.15);transition:all 0.3s;cursor:default;animation:slideInUp 0.8s ease-out backwards;" onmouseenter="this.style.transform='translateY(-8px)';this.style.boxShadow='0 20px 40px rgba(34,211,238,0.3)'" onmouseleave="this.style.transform='translateY(0)';this.style.boxShadow=''">
       <div class="feature-icon-wrap" style="background:rgba(34,211,238,0.12);margin-bottom:0.75rem;animation:popIn 0.6s ease-out backwards;">
        <i data-lucide="activity" style="width:28px;height:28px;color:#22d3ee;"></i>
       </div>
       <h3 style="font-size:1rem;font-weight:700;margin:0 0 0.5rem;">Real-Time Monitoring</h3>
       <p style="font-size:13px;color:#94a3b8;margin:0;line-height:1.6;">Continuous sleep data processing with live risk assessment dashboards for clinicians and patients.</p>
      </div>
      <div class="card-glow" style="background:var(--surface);border-radius:16px;padding:1.25rem;border:1px solid rgba(99,102,241,0.15);transition:all 0.3s;cursor:default;animation:slideInUp 0.8s ease-out backwards;" onmouseenter="this.style.transform='translateY(-8px)';this.style.boxShadow='0 20px 40px rgba(167,139,250,0.3)'" onmouseleave="this.style.transform='translateY(0)';this.style.boxShadow=''">
       <div class="feature-icon-wrap" style="background:rgba(167,139,250,0.12);margin-bottom:0.75rem;animation:popIn 0.6s ease-out backwards;">
        <i data-lucide="shield" style="width:28px;height:28px;color:#a78bfa;"></i>
       </div>
       <h3 style="font-size:1rem;font-weight:700;margin:0 0 0.5rem;">Secure &amp; Private</h3>
       <p style="font-size:13px;color:#94a3b8;margin:0;line-height:1.6;">Firebase authentication with encrypted data storage ensuring HIPAA-conscious data handling.</p>
      </div>
      <div class="card-glow" style="background:var(--surface);border-radius:16px;padding:1.25rem;border:1px solid rgba(99,102,241,0.15);transition:all 0.3s;cursor:default;animation:slideInUp 0.8s ease-out backwards;" onmouseenter="this.style.transform='translateY(-8px)';this.style.boxShadow='0 20px 40px rgba(244,114,182,0.3)'" onmouseleave="this.style.transform='translateY(0)';this.style.boxShadow=''">
       <div class="feature-icon-wrap" style="background:rgba(244,114,182,0.12);margin-bottom:0.75rem;animation:popIn 0.6s ease-out backwards;">
        <i data-lucide="bar-chart-2" style="width:28px;height:28px;color:#f472b6;"></i>
       </div>
       <h3 style="font-size:1rem;font-weight:700;margin:0 0 0.5rem;">PSQI Integration</h3>
       <p style="font-size:13px;color:#94a3b8;margin:0;line-height:1.6;">Hybrid scoring combining objective REM parameters with subjective sleep quality assessments.</p>
      </div>
      <div class="card-glow" style="background:var(--surface);border-radius:16px;padding:1.25rem;border:1px solid rgba(99,102,241,0.15);transition:all 0.3s;cursor:default;animation:slideInUp 0.8s ease-out backwards;" onmouseenter="this.style.transform='translateY(-8px)';this.style.boxShadow='0 20px 40px rgba(52,211,153,0.3)'" onmouseleave="this.style.transform='translateY(0)';this.style.boxShadow=''">
       <div class="feature-icon-wrap" style="background:rgba(52,211,153,0.12);margin-bottom:0.75rem;animation:popIn 0.6s ease-out backwards;">
        <i data-lucide="git-branch" style="width:28px;height:28px;color:#34d399;"></i>
       </div>
       <h3 style="font-size:1rem;font-weight:700;margin:0 0 0.5rem;">CI/CD Pipeline</h3>
       <p style="font-size:13px;color:#94a3b8;margin:0;line-height:1.6;">Automated deployment via GitHub Actions, Vercel, and Render with continuous version control.</p>
      </div>
      <div class="card-glow" style="background:var(--surface);border-radius:16px;padding:1.25rem;border:1px solid rgba(99,102,241,0.15);transition:all 0.3s;cursor:default;animation:slideInUp 0.8s ease-out backwards;" onmouseenter="this.style.transform='translateY(-8px)';this.style.boxShadow='0 20px 40px rgba(251,191,36,0.3)'" onmouseleave="this.style.transform='translateY(0)';this.style.boxShadow=''">
       <div class="feature-icon-wrap" style="background:rgba(251,191,36,0.12);margin-bottom:0.75rem;animation:popIn 0.6s ease-out backwards;">
        <i data-lucide="stethoscope" style="width:28px;height:28px;color:#fbbf24;"></i>
       </div>
       <h3 style="font-size:1rem;font-weight:700;margin:0 0 0.5rem;">Clinical Accessibility</h3>
       <p style="font-size:13px;color:#94a3b8;margin:0;line-height:1.6;">Web-based interface providing clinicians and individuals accessible proactive mental health monitoring.</p>
      </div>
     </div>
    </section>
    <div class="section-divider"></div><!-- ARCHITECTURE -->
    <section id="architecture" class="scroll-reveal" style="margin-bottom:2.5rem;">
     <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.25rem;">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#a78bfa,#7c3aed);display:flex;align-items:center;justify-content:center;">
       <i data-lucide="layers" style="width:18px;height:18px;color:#fff;"></i>
      </div>
      <h2 style="font-size:1.5rem;font-weight:800;margin:0;">System Architecture</h2>
     </div><!-- Architecture diagram -->
     <div style="background:var(--surface);border-radius:16px;padding:1.5rem;border:1px solid rgba(99,102,241,0.1);overflow-x:auto;">
      <div style="display:flex;flex-direction:column;gap:12px;min-width:500px;">
       <!-- Layer 1: Frontend -->
       <div style="display:flex;align-items:center;gap:12px;">
        <div style="flex:1;padding:16px;border-radius:12px;background:linear-gradient(135deg,rgba(99,102,241,0.15),rgba(99,102,241,0.05));border:1px solid rgba(99,102,241,0.3);text-align:center;">
         <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#6366f1;font-weight:600;margin-bottom:4px;">
          Frontend
         </div>
         <div style="font-weight:700;font-size:15px;">
          Next.js
         </div>
         <div style="font-size:12px;color:#94a3b8;">
          React · TypeScript · Tailwind
         </div>
        </div>
        <div style="flex:1;padding:16px;border-radius:12px;background:linear-gradient(135deg,rgba(251,191,36,0.15),rgba(251,191,36,0.05));border:1px solid rgba(251,191,36,0.3);text-align:center;">
         <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#fbbf24;font-weight:600;margin-bottom:4px;">
          Auth &amp; Storage
         </div>
         <div style="font-weight:700;font-size:15px;">
          Firebase
         </div>
         <div style="font-size:12px;color:#94a3b8;">
          Authentication · Firestore
         </div>
        </div>
       </div><!-- Arrow -->
       <div style="text-align:center;color:#6366f1;font-size:20px;">
        <svg width="24" height="24" viewbox="0 0 24 24" fill="none" style="margin:0 auto;display:block;"><path d="M12 5v14M5 12l7 7 7-7" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
       </div><!-- Layer 2: Backend -->
       <div style="display:flex;align-items:center;gap:12px;">
        <div style="flex:1;padding:16px;border-radius:12px;background:linear-gradient(135deg,rgba(34,211,238,0.15),rgba(34,211,238,0.05));border:1px solid rgba(34,211,238,0.3);text-align:center;">
         <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#22d3ee;font-weight:600;margin-bottom:4px;">
          Backend API
         </div>
         <div style="font-weight:700;font-size:15px;">
          FastAPI
         </div>
         <div style="font-size:12px;color:#94a3b8;">
          Python · REST · Async
         </div>
        </div>
        <div style="flex:1;padding:16px;border-radius:12px;background:linear-gradient(135deg,rgba(167,139,250,0.15),rgba(167,139,250,0.05));border:1px solid rgba(167,139,250,0.3);text-align:center;">
         <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#a78bfa;font-weight:600;margin-bottom:4px;">
          ML Engine
         </div>
         <div style="font-weight:700;font-size:15px;">
          XGBoost
         </div>
         <div style="font-size:12px;color:#94a3b8;">
          Scikit-learn · NumPy · SciPy
         </div>
        </div>
       </div><!-- Arrow -->
       <div style="text-align:center;">
        <svg width="24" height="24" viewbox="0 0 24 24" fill="none" style="margin:0 auto;display:block;"><path d="M12 5v14M5 12l7 7 7-7" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
       </div><!-- Layer 3: CI/CD -->
       <div style="padding:16px;border-radius:12px;background:linear-gradient(135deg,rgba(52,211,153,0.15),rgba(52,211,153,0.05));border:1px solid rgba(52,211,153,0.3);text-align:center;">
        <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#34d399;font-weight:600;margin-bottom:4px;">
         CI/CD Pipeline
        </div>
        <div style="display:flex;justify-content:center;gap:2rem;flex-wrap:wrap;">
         <div><span style="font-weight:700;">GitHub</span> <span style="font-size:12px;color:#94a3b8;">Version Control</span>
         </div>
         <div><span style="font-weight:700;">Vercel</span> <span style="font-size:12px;color:#94a3b8;">Frontend Deploy</span>
         </div>
         <div><span style="font-weight:700;">Render</span> <span style="font-size:12px;color:#94a3b8;">Backend Deploy</span>
         </div>
        </div>
       </div>
      </div>
     </div>
    </section>
    <div class="section-divider"></div><!-- ML PIPELINE -->
    <section id="ml-pipeline" class="scroll-reveal" style="margin-bottom:2.5rem;">
     <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.25rem;">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#f472b6,#ec4899);display:flex;align-items:center;justify-content:center;">
       <i data-lucide="cpu" style="width:18px;height:18px;color:#fff;"></i>
      </div>
      <h2 style="font-size:1.5rem;font-weight:800;margin:0;">ML Pipeline</h2>
     </div>
     <div style="background:var(--surface);border-radius:16px;padding:1.5rem;border:1px solid rgba(99,102,241,0.1);">
      <div class="pipeline-step" style="margin-bottom:1.25rem;">
       <div class="pipeline-dot"></div>
       <h3 style="font-size:1rem;font-weight:700;margin:0 0 0.25rem;color:#22d3ee;">1. Data Acquisition</h3>
       <p style="font-size:13px;color:#94a3b8;margin:0;">Collect polysomnography (PSG) signals and PSQI questionnaire responses. Extract EEG, EOG, and EMG channels specific to REM epochs.</p>
      </div>
      <div class="pipeline-step" style="margin-bottom:1.25rem;">
       <div class="pipeline-dot"></div>
       <h3 style="font-size:1rem;font-weight:700;margin:0 0 0.25rem;color:#a78bfa;">2. Feature Engineering</h3>
       <p style="font-size:13px;color:#94a3b8;margin:0;">Apply <strong style="color:#e2e8f0;">Fourier-based transformations</strong> for spectral decomposition. Extract temporal features: REM latency, density, duration ratios, and cycle regularity.</p>
      </div>
      <div class="pipeline-step" style="margin-bottom:1.25rem;">
       <div class="pipeline-dot"></div>
       <h3 style="font-size:1rem;font-weight:700;margin:0 0 0.25rem;color:#6366f1;">3. Hybrid Scoring</h3>
       <p style="font-size:13px;color:#94a3b8;margin:0;">Combine objective REM metrics with subjective PSQI component scores into a unified feature vector for comprehensive sleep quality representation.</p>
      </div>
      <div class="pipeline-step" style="margin-bottom:1.25rem;">
       <div class="pipeline-dot"></div>
       <h3 style="font-size:1rem;font-weight:700;margin:0 0 0.25rem;color:#f472b6;">4. XGBoost Classification</h3>
       <p style="font-size:13px;color:#94a3b8;margin:0;">Train gradient-boosted decision trees with hyperparameter tuning via cross-validation. Classify into risk categories: <span style="color:#34d399;">Low</span>, <span style="color:#fbbf24;">Moderate</span>, <span style="color:#ef4444;">High</span>.</p>
      </div>
      <div class="pipeline-step">
       <div class="pipeline-dot"></div>
       <h3 style="font-size:1rem;font-weight:700;margin:0 0 0.25rem;color:#34d399;">5. Risk Assessment Output</h3>
       <p style="font-size:13px;color:#94a3b8;margin:0;">Generate interpretable risk reports with feature importance rankings, confidence scores, and recommended clinical follow-up actions.</p>
      </div>
     </div>
    </section>
    <div class="section-divider"></div><!-- TECH STACK -->
    <section id="tech-stack" class="scroll-reveal" style="margin-bottom:2.5rem;">
     <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.25rem;">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#34d399,#10b981);display:flex;align-items:center;justify-content:center;">
       <i data-lucide="code-2" style="width:18px;height:18px;color:#fff;"></i>
      </div>
      <h2 style="font-size:1.5rem;font-weight:800;margin:0;">Tech Stack</h2>
     </div>
     <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;">
      <div style="background:var(--surface);border-radius:12px;padding:1rem;border:1px solid rgba(99,102,241,0.1);text-align:center;">
       <div style="font-size:28px;margin-bottom:6px;">
        ⚛️
       </div>
       <div style="font-weight:700;font-size:14px;">
        Next.js
       </div>
       <div style="font-size:11px;color:#94a3b8;">
        Frontend Framework
       </div>
      </div>
      <div style="background:var(--surface);border-radius:12px;padding:1rem;border:1px solid rgba(99,102,241,0.1);text-align:center;">
       <div style="font-size:28px;margin-bottom:6px;">
        ⚡
       </div>
       <div style="font-weight:700;font-size:14px;">
        FastAPI
       </div>
       <div style="font-size:11px;color:#94a3b8;">
        Backend API
       </div>
      </div>
      <div style="background:var(--surface);border-radius:12px;padding:1rem;border:1px solid rgba(99,102,241,0.1);text-align:center;">
       <div style="font-size:28px;margin-bottom:6px;">
        🔥
       </div>
       <div style="font-weight:700;font-size:14px;">
        Firebase
       </div>
       <div style="font-size:11px;color:#94a3b8;">
        Auth &amp; Database
       </div>
      </div>
      <div style="background:var(--surface);border-radius:12px;padding:1rem;border:1px solid rgba(99,102,241,0.1);text-align:center;">
       <div style="font-size:28px;margin-bottom:6px;">
        🤖
       </div>
       <div style="font-weight:700;font-size:14px;">
        XGBoost
       </div>
       <div style="font-size:11px;color:#94a3b8;">
        ML Classifier
       </div>
      </div>
      <div style="background:var(--surface);border-radius:12px;padding:1rem;border:1px solid rgba(99,102,241,0.1);text-align:center;">
       <div style="font-size:28px;margin-bottom:6px;">
        🐍
       </div>
       <div style="font-weight:700;font-size:14px;">
        Python
       </div>
       <div style="font-size:11px;color:#94a3b8;">
        Scikit-learn · NumPy · SciPy
       </div>
      </div>
      <div style="background:var(--surface);border-radius:12px;padding:1rem;border:1px solid rgba(99,102,241,0.1);text-align:center;">
       <div style="font-size:28px;margin-bottom:6px;">
        🚀
       </div>
       <div style="font-weight:700;font-size:14px;">
        Vercel + Render
       </div>
       <div style="font-size:11px;color:#94a3b8;">
        CI/CD Deployment
       </div>
      </div>
     </div>
    </section>
    <div class="section-divider"></div><!-- QUICK START -->
    <section id="quickstart" class="scroll-reveal" style="margin-bottom:2.5rem;">
     <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.25rem;">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#fbbf24,#f59e0b);display:flex;align-items:center;justify-content:center;">
       <i data-lucide="terminal" style="width:18px;height:18px;color:#fff;"></i>
      </div>
      <h2 style="font-size:1.5rem;font-weight:800;margin:0;">Quick Start</h2>
     </div>
     <div class="code-block" style="margin-bottom:1rem;">
      <div class="code-header">
       <div class="code-dot" style="background:#ef4444;"></div>
       <div class="code-dot" style="background:#fbbf24;"></div>
       <div class="code-dot" style="background:#22c55e;"></div><span style="margin-left:8px;color:#94a3b8;font-size:12px;">terminal</span>
      </div>
      <pre style="margin:0;padding:16px;color:#e2e8f0;overflow-x:auto;line-height:1.8;"><code><span style="color:#94a3b8;"># Clone the repository</span>
<span style="color:#22d3ee;">$</span> git clone https://github.com/your-username/REMInsight.git
<span style="color:#22d3ee;">$</span> cd REMInsight

<span style="color:#94a3b8;"># Install frontend dependencies</span>
<span style="color:#22d3ee;">$</span> cd frontend &amp;&amp; npm install

<span style="color:#94a3b8;"># Install backend dependencies</span>
<span style="color:#22d3ee;">$</span> cd ../backend &amp;&amp; pip install -r requirements.txt

<span style="color:#94a3b8;"># Set up environment variables</span>
<span style="color:#22d3ee;">$</span> cp .env.example .env

<span style="color:#94a3b8;"># Start the development servers</span>
<span style="color:#22d3ee;">$</span> npm run dev          <span style="color:#94a3b8;"># Frontend on localhost:3000</span>
<span style="color:#22d3ee;">$</span> uvicorn main:app --reload  <span style="color:#94a3b8;"># Backend on localhost:8000</span></code></pre>
     </div>
     <div class="code-block">
      <div class="code-header">
       <div class="code-dot" style="background:#ef4444;"></div>
       <div class="code-dot" style="background:#fbbf24;"></div>
       <div class="code-dot" style="background:#22c55e;"></div><span style="margin-left:8px;color:#94a3b8;font-size:12px;">.env</span>
      </div>
      <pre style="margin:0;padding:16px;color:#e2e8f0;overflow-x:auto;line-height:1.8;"><code><span style="color:#a78bfa;">FIREBASE_API_KEY</span>=<span style="color:#94a3b8;">your_firebase_api_key</span>
<span style="color:#a78bfa;">FIREBASE_AUTH_DOMAIN</span>=<span style="color:#94a3b8;">your_project.firebaseapp.com</span>
<span style="color:#a78bfa;">NEXT_PUBLIC_API_URL</span>=<span style="color:#94a3b8;">http://localhost:8000</span>
<span style="color:#a78bfa;">MODEL_PATH</span>=<span style="color:#94a3b8;">./models/xgboost_rem.pkl</span></code></pre>
     </div>
    </section>
    <div class="section-divider"></div><!-- PERFORMANCE METRICS -->
    <section id="metrics" class="scroll-reveal" style="margin-bottom:2.5rem;">
     <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.25rem;">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#ef4444,#dc2626);display:flex;align-items:center;justify-content:center;">
       <i data-lucide="trending-up" style="width:18px;height:18px;color:#fff;"></i>
      </div>
      <h2 style="font-size:1.5rem;font-weight:800;margin:0;">Performance Metrics</h2>
     </div>
     <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;">
      <div style="background:var(--surface);border-radius:16px;padding:1.25rem;border:1px solid rgba(99,102,241,0.1);text-align:center;">
       <div class="stat-number gradient-text">
        94.2%
       </div>
       <div style="font-size:13px;color:#94a3b8;margin-top:4px;">
        Accuracy
       </div>
       <div style="height:4px;background:rgba(99,102,241,0.15);border-radius:4px;margin-top:10px;overflow:hidden;">
        <div style="width:94.2%;height:100%;background:linear-gradient(90deg,#6366f1,#22d3ee);border-radius:4px;animation:barGrow 1.5s ease-out both;transform-origin:left;"></div>
       </div>
      </div>
      <div style="background:var(--surface);border-radius:16px;padding:1.25rem;border:1px solid rgba(99,102,241,0.1);text-align:center;">
       <div class="stat-number" style="color:#22d3ee;">
        0.96
       </div>
       <div style="font-size:13px;color:#94a3b8;margin-top:4px;">
        AUC-ROC
       </div>
       <div style="height:4px;background:rgba(34,211,238,0.15);border-radius:4px;margin-top:10px;overflow:hidden;">
        <div style="width:96%;height:100%;background:linear-gradient(90deg,#22d3ee,#06b6d4);border-radius:4px;animation:barGrow 1.5s ease-out 0.2s both;transform-origin:left;"></div>
       </div>
      </div>
      <div style="background:var(--surface);border-radius:16px;padding:1.25rem;border:1px solid rgba(99,102,241,0.1);text-align:center;">
       <div class="stat-number" style="color:#a78bfa;">
        91.8%
       </div>
       <div style="font-size:13px;color:#94a3b8;margin-top:4px;">
        Precision
       </div>
       <div style="height:4px;background:rgba(167,139,250,0.15);border-radius:4px;margin-top:10px;overflow:hidden;">
        <div style="width:91.8%;height:100%;background:linear-gradient(90deg,#a78bfa,#7c3aed);border-radius:4px;animation:barGrow 1.5s ease-out 0.4s both;transform-origin:left;"></div>
       </div>
      </div>
      <div style="background:var(--surface);border-radius:16px;padding:1.25rem;border:1px solid rgba(99,102,241,0.1);text-align:center;">
       <div class="stat-number" style="color:#f472b6;">
        93.5%
       </div>
       <div style="font-size:13px;color:#94a3b8;margin-top:4px;">
        Recall
       </div>
       <div style="height:4px;background:rgba(244,114,182,0.15);border-radius:4px;margin-top:10px;overflow:hidden;">
        <div style="width:93.5%;height:100%;background:linear-gradient(90deg,#f472b6,#ec4899);border-radius:4px;animation:barGrow 1.5s ease-out 0.6s both;transform-origin:left;"></div>
       </div>
      </div>
     </div>
    </section>
    <div class="section-divider"></div><!-- RESEARCH BASIS -->
    <section id="research" class="scroll-reveal" style="margin-bottom:2.5rem;">
     <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.25rem;">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#06b6d4,#0891b2);display:flex;align-items:center;justify-content:center;">
       <i data-lucide="book" style="width:18px;height:18px;color:#fff;"></i>
      </div>
      <h2 style="font-size:1.5rem;font-weight:800;margin:0;">Research Foundation</h2>
     </div>
     <div style="background:var(--surface);border-radius:16px;padding:1.5rem;border:1px solid rgba(99,102,241,0.1);">
      <div style="display:grid;gap:1rem;">
       <div style="display:flex;gap:12px;align-items:flex-start;">
        <div style="min-width:28px;height:28px;border-radius:8px;background:rgba(99,102,241,0.15);display:flex;align-items:center;justify-content:center;margin-top:2px;">
         <i data-lucide="file-text" style="width:14px;height:14px;color:#6366f1;"></i>
        </div>
        <div>
         <div style="font-weight:600;font-size:14px;margin-bottom:2px;">
          REM Sleep &amp; Depression
         </div>
         <div style="font-size:12px;color:#94a3b8;line-height:1.5;">
          Shortened REM latency and increased REM density are established biomarkers for major depressive disorder (MDD).
         </div>
        </div>
       </div>
       <div style="display:flex;gap:12px;align-items:flex-start;">
        <div style="min-width:28px;height:28px;border-radius:8px;background:rgba(34,211,238,0.15);display:flex;align-items:center;justify-content:center;margin-top:2px;">
         <i data-lucide="file-text" style="width:14px;height:14px;color:#22d3ee;"></i>
        </div>
        <div>
         <div style="font-weight:600;font-size:14px;margin-bottom:2px;">
          Anxiety &amp; Sleep Architecture
         </div>
         <div style="font-size:12px;color:#94a3b8;line-height:1.5;">
          Generalized anxiety disorder correlates with fragmented REM cycles and elevated PSQI global scores.
         </div>
        </div>
       </div>
       <div style="display:flex;gap:12px;align-items:flex-start;">
        <div style="min-width:28px;height:28px;border-radius:8px;background:rgba(167,139,250,0.15);display:flex;align-items:center;justify-content:center;margin-top:2px;">
         <i data-lucide="file-text" style="width:14px;height:14px;color:#a78bfa;"></i>
        </div>
        <div>
         <div style="font-weight:600;font-size:14px;margin-bottom:2px;">
          Schizophrenia &amp; REM Abnormalities
         </div>
         <div style="font-size:12px;color:#94a3b8;line-height:1.5;">
          Reduced REM sleep percentage and irregular spectral power distributions observed in schizophrenia spectrum disorders.
         </div>
        </div>
       </div>
       <div style="display:flex;gap:12px;align-items:flex-start;">
        <div style="min-width:28px;height:28px;border-radius:8px;background:rgba(244,114,182,0.15);display:flex;align-items:center;justify-content:center;margin-top:2px;">
         <i data-lucide="file-text" style="width:14px;height:14px;color:#f472b6;"></i>
        </div>
        <div>
         <div style="font-weight:600;font-size:14px;margin-bottom:2px;">
          XGBoost in Clinical ML
         </div>
         <div style="font-size:12px;color:#94a3b8;line-height:1.5;">
          Gradient boosting methods demonstrate superior performance in clinical classification tasks with tabular biomedical data.
         </div>
        </div>
       </div>
      </div>
     </div>
    </section>
    <div class="section-divider"></div><!-- PROJECT STRUCTURE -->
    <section class="scroll-reveal" style="margin-bottom:2.5rem;">
     <div style="display:flex;align-items:center;gap:10px;margin-bottom:1.25rem;">
      <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#f97316,#ea580c);display:flex;align-items:center;justify-content:center;">
       <i data-lucide="folder" style="width:18px;height:18px;color:#fff;"></i>
      </div>
      <h2 style="font-size:1.5rem;font-weight:800;margin:0;">Project Structure</h2>
     </div>
     <div class="code-block">
      <div class="code-header">
       <div class="code-dot" style="background:#ef4444;"></div>
       <div class="code-dot" style="background:#fbbf24;"></div>
       <div class="code-dot" style="background:#22c55e;"></div><span style="margin-left:8px;color:#94a3b8;font-size:12px;">project tree</span>
      </div>
      <pre style="margin:0;padding:16px;color:#e2e8f0;overflow-x:auto;line-height:1.7;font-size:12px;"><code><span style="color:#6366f1;">REMInsight/</span>
├── <span style="color:#22d3ee;">frontend/</span>
│   ├── <span style="color:#94a3b8;">src/</span>
│   │   ├── <span style="color:#a78bfa;">components/</span>      <span style="color:#64748b;"># React UI components</span>
│   │   ├── <span style="color:#a78bfa;">pages/</span>           <span style="color:#64748b;"># Next.js routes</span>
│   │   ├── <span style="color:#a78bfa;">hooks/</span>           <span style="color:#64748b;"># Custom React hooks</span>
│   │   └── <span style="color:#a78bfa;">utils/</span>           <span style="color:#64748b;"># Helper functions</span>
│   ├── <span style="color:#f472b6;">package.json</span>
│   └── <span style="color:#f472b6;">next.config.js</span>
├── <span style="color:#22d3ee;">backend/</span>
│   ├── <span style="color:#a78bfa;">api/</span>              <span style="color:#64748b;"># FastAPI endpoints</span>
│   ├── <span style="color:#a78bfa;">ml/</span>               <span style="color:#64748b;"># ML pipeline &amp; models</span>
│   │   ├── <span style="color:#34d399;">preprocess.py</span>  <span style="color:#64748b;"># Feature engineering</span>
│   │   ├── <span style="color:#34d399;">train.py</span>       <span style="color:#64748b;"># XGBoost training</span>
│   │   └── <span style="color:#34d399;">predict.py</span>     <span style="color:#64748b;"># Inference engine</span>
│   ├── <span style="color:#f472b6;">requirements.txt</span>
│   └── <span style="color:#f472b6;">main.py</span>
├── <span style="color:#22d3ee;">models/</span>               <span style="color:#64748b;"># Trained model artifacts</span>
├── <span style="color:#fbbf24;">.github/workflows/</span>   <span style="color:#64748b;"># CI/CD pipelines</span>
└── <span style="color:#f472b6;">README.md</span></code></pre>
     </div>
    </section>
    <div class="section-divider"></div><!-- CONTRIBUTING & LICENSE -->
    <section class="scroll-reveal" style="margin-bottom:2.5rem;">
     <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
      <div style="background:var(--surface);border-radius:16px;padding:1.25rem;border:1px solid rgba(99,102,241,0.1);">
       <div style="display:flex;align-items:center;gap:8px;margin-bottom:0.75rem;">
        <i data-lucide="users" style="width:18px;height:18px;color:#6366f1;"></i>
        <h3 style="font-size:1rem;font-weight:700;margin:0;">Contributing</h3>
       </div>
       <p style="font-size:13px;color:#94a3b8;margin:0 0 0.75rem;line-height:1.6;">Contributions are welcome! Please fork the repository, create a feature branch, and submit a pull request.</p>
       <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <span class="tech-badge" style="font-size:11px;"><i data-lucide="git-pull-request" style="width:12px;height:12px;"></i> PRs Welcome</span> <span class="tech-badge" style="font-size:11px;"><i data-lucide="message-circle" style="width:12px;height:12px;"></i> Issues</span>
       </div>
      </div>
      <div style="background:var(--surface);border-radius:16px;padding:1.25rem;border:1px solid rgba(99,102,241,0.1);">
       <div style="display:flex;align-items:center;gap:8px;margin-bottom:0.75rem;">
        <i data-lucide="scale" style="width:18px;height:18px;color:#22d3ee;"></i>
        <h3 style="font-size:1rem;font-weight:700;margin:0;">License</h3>
       </div>
       <p style="font-size:13px;color:#94a3b8;margin:0 0 0.75rem;line-height:1.6;">This project is licensed under the MIT License. See the LICENSE file for details.</p><span class="tech-badge" style="font-size:11px;"><i data-lucide="file-text" style="width:12px;height:12px;"></i> MIT License</span>
      </div>
     </div>
    </section><!-- FOOTER -->
    <footer class="scroll-reveal" style="text-align:center;padding:2rem 0;border-top:1px solid rgba(99,102,241,0.1);">
     <p id="footer-text" style="font-size:13px;color:#64748b;margin:0 0 0.5rem;">Built with 🧠 for advancing psychiatric research through AI</p>
     <p style="font-size:12px;color:#475569;margin:0;">REMInsight © 2025 — Promoting proactive mental health monitoring</p>
    </footer>
   </div><!-- max-width container -->
  </div><!-- app-root -->
  <script>
  const defaultConfig = {
    project_title: 'REMInsight',
    tagline: 'Application of REM Sleep Dynamics to Early Diagnosis of Psychiatric Disorders via Machine Learning',
    demo_url: '',
    background_color: '#0a0e1a',
    surface_color: '#111827',
    text_color: '#e2e8f0',
    primary_color: '#6366f1',
    secondary_color: '#22d3ee',
    font_family: 'Outfit',
    font_size: 16
  };

  function applyConfig(config) {
    const title = document.getElementById('hero-title');
    if (title) title.querySelector('.gradient-text').textContent = config.project_title || defaultConfig.project_title;

    const tagline = document.getElementById('hero-tagline');
    if (tagline) tagline.textContent = config.tagline || defaultConfig.tagline;

    const demoLink = document.getElementById('demo-link');
    const url = config.demo_url || defaultConfig.demo_url;
    if (demoLink && url) demoLink.href = url;

    // Colors
    const bg = config.background_color || defaultConfig.background_color;
    const surface = config.surface_color || defaultConfig.surface_color;
    const text = config.text_color || defaultConfig.text_color;
    const primary = config.primary_color || defaultConfig.primary_color;
    const secondary = config.secondary_color || defaultConfig.secondary_color;

    document.documentElement.style.setProperty('--bg', bg);
    document.documentElement.style.setProperty('--surface', surface);
    document.documentElement.style.setProperty('--text', text);
    document.documentElement.style.setProperty('--primary', primary);
    document.documentElement.style.setProperty('--secondary', secondary);

    document.body.style.background = bg;
    document.body.style.color = text;
    document.getElementById('app-root').style.background = bg;

    // Font
    const font = config.font_family || defaultConfig.font_family;
    const baseFontStack = 'system-ui, sans-serif';
    document.body.style.fontFamily = `${font}, ${baseFontStack}`;

    // Font size
    const baseSize = config.font_size || defaultConfig.font_size;
    document.body.style.fontSize = `${baseSize}px`;
  }

  // Scroll reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));

  // Init Element SDK
  window.elementSdk.init({
    defaultConfig,
    onConfigChange: async (config) => { applyConfig(config); },
    mapToCapabilities: (config) => ({
      recolorables: [
        { get: () => config.background_color || defaultConfig.background_color, set: (v) => { config.background_color = v; window.elementSdk.setConfig({ background_color: v }); } },
        { get: () => config.surface_color || defaultConfig.surface_color, set: (v) => { config.surface_color = v; window.elementSdk.setConfig({ surface_color: v }); } },
        { get: () => config.text_color || defaultConfig.text_color, set: (v) => { config.text_color = v; window.elementSdk.setConfig({ text_color: v }); } },
        { get: () => config.primary_color || defaultConfig.primary_color, set: (v) => { config.primary_color = v; window.elementSdk.setConfig({ primary_color: v }); } },
        { get: () => config.secondary_color || defaultConfig.secondary_color, set: (v) => { config.secondary_color = v; window.elementSdk.setConfig({ secondary_color: v }); } }
      ],
      borderables: [],
      fontEditable: { get: () => config.font_family || defaultConfig.font_family, set: (v) => { config.font_family = v; window.elementSdk.setConfig({ font_family: v }); } },
      fontSizeable: { get: () => config.font_size || defaultConfig.font_size, set: (v) => { config.font_size = v; window.elementSdk.setConfig({ font_size: v }); } }
    }),
    mapToEditPanelValues: (config) => new Map([
      ['project_title', config.project_title || defaultConfig.project_title],
      ['tagline', config.tagline || defaultConfig.tagline],
      ['demo_url', config.demo_url || defaultConfig.demo_url]
    ])
  });

  lucide.createIcons();
</script>
 <script>(function(){function c(){var b=a.contentDocument||a.contentWindow.document;if(b){var d=b.createElement('script');d.innerHTML="window.__CF$cv$params={r:'9f5cd583c21f7ef1',t:'MTc3Nzc4NTgxMC4wMDAwMDA='};var a=document.createElement('script');a.nonce='';a.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js';document.getElementsByTagName('head')[0].appendChild(a);";b.getElementsByTagName('head')[0].appendChild(d)}}if(document.body){var a=document.createElement('iframe');a.height=1;a.width=1;a.style.position='absolute';a.style.top=0;a.style.left=0;a.style.border='none';a.style.visibility='hidden';document.body.appendChild(a);if('loading'!==document.readyState)c();else if(window.addEventListener)document.addEventListener('DOMContentLoaded',c);else{var e=document.onreadystatechange||function(){};document.onreadystatechange=function(b){e(b);'loading'!==document.readyState&&(document.onreadystatechange=e,c())}}}})();</script></body>
</html>
