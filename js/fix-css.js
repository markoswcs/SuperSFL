const fs = require('fs');
let css = fs.readFileSync('d:/CODES/SunflowerSuperAPP/SuperSunflowerLand/css/app.css', 'utf8');

// Replace `:root {` block with light and dark themes
const rootTokensRegex = /:root\s*\{([\s\S]*?)\}/;

const lightThemeTokens = `
[data-theme="light"] {
  --obsidian-base:   #f8fafc;
  --obsidian-1:      #f1f5f9;
  --obsidian-2:      #e2e8f0;
  --obsidian-3:      #cbd5e1;
  --obsidian-4:      #94a3b8;

  --surface-1:       rgba(255, 255, 255, 0.6);
  --surface-2:       rgba(255, 255, 255, 0.45);
  --surface-3:       rgba(255, 255, 255, 0.25);
  --surface-border:  rgba(255, 255, 255, 0.6);
  --surface-hover:   rgba(255, 255, 255, 0.85);

  --amber-glow:      #f59e0b;
  --amber:           #d97706;
  --amber-dim:       #b45309;
  --amber-deep:      #78350f;
  --amber-subtle:    rgba(245, 158, 11, 0.15);
  --amber-subtle-2:  rgba(245, 158, 11, 0.08);

  --coral:           #ef4444;
  --coral-dim:       #dc2626;
  --coral-subtle:    rgba(239, 68, 68, 0.15);

  --emerald:         #10b981;
  --emerald-dim:     #059669;
  --emerald-subtle:  rgba(16, 185, 129, 0.15);

  --sky:             #0ea5e9;
  --sky-subtle:      rgba(14, 165, 233, 0.15);

  --text-primary:    #0f172a;
  --text-secondary:  #334155;
  --text-tertiary:   #64748b;
  --text-amber:      #d97706;
  --text-coral:      #ef4444;
  --text-emerald:    #10b981;

  --font-display:    'Outfit', system-ui, sans-serif;
  --font-mono:       'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body:       'Plus Jakarta Sans', system-ui, sans-serif;

  --s1: 4px;  --s2: 8px;  --s3: 12px;
  --s4: 16px; --s5: 20px; --s6: 24px;
  --s7: 28px; --s8: 32px; --s9: 40px;
  --s10: 48px; --s11: 56px; --s12: 64px;

  --r0: 0px; --r1: 4px; --r2: 8px;
  --r3: 12px; --r4: 16px; --r5: 24px; --r6: 32px;

  --shadow-amber:    0 8px 24px rgba(245, 158, 11, 0.2);
  --shadow-coral:    0 8px 24px rgba(239, 68, 68, 0.2);
  --shadow-emerald:  0 8px 24px rgba(16, 185, 129, 0.2);
  --shadow-card:     0 8px 32px 0 rgba(31, 38, 135, 0.07);
  --shadow-lift:     0 12px 48px rgba(31, 38, 135, 0.12);

  --t-fast: 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
  --t-base: 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
  --t-slow: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
  --t-linear: 250ms linear;

  --nav-h: 72px;
  --safe-bottom: env(safe-area-inset-bottom, 0px);

  --bg-gradient: radial-gradient(circle at 15% 50%, rgba(245, 158, 11, 0.15), transparent 25%), radial-gradient(circle at 85% 30%, rgba(34, 197, 94, 0.15), transparent 25%), linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  --header-bg: rgba(255, 255, 255, 0.7);
  --header-border: rgba(255, 255, 255, 0.5);
  --grain-opacity: 0.15;
}

[data-theme="dark"] {
  --obsidian-base:   #0A0D12;
  --obsidian-1:      #0F1219;
  --obsidian-2:      #131720;
  --obsidian-3:      #1A2030;
  --obsidian-4:      #1E2638;

  --surface-1:       rgba(17, 22, 34, 0.6);
  --surface-2:       rgba(22, 32, 46, 0.45);
  --surface-3:       rgba(28, 42, 58, 0.25);
  --surface-border:  rgba(255, 255, 255, 0.05);
  --surface-hover:   rgba(31, 47, 69, 0.85);

  --amber-glow:      #FFB020;
  --amber:           #F59E0B;
  --amber-dim:       #D97706;
  --amber-deep:      #92400E;
  --amber-subtle:    rgba(245, 158, 11, 0.10);
  --amber-subtle-2:  rgba(245, 158, 11, 0.04);

  --coral:           #FF4D2E;
  --coral-dim:       #E63B1F;
  --coral-subtle:    rgba(255, 77, 46, 0.10);

  --emerald:         #22C55E;
  --emerald-dim:     #16A34A;
  --emerald-subtle:  rgba(34, 197, 94, 0.10);

  --sky:             #38BDF8;
  --sky-subtle:      rgba(56, 189, 248, 0.10);

  --text-primary:    #F0EDE8;
  --text-secondary:  #8892A4;
  --text-tertiary:   #5A6478;
  --text-amber:      #F59E0B;
  --text-coral:      #FF6B4A;
  --text-emerald:    #4ADE80;

  --font-display:    'Outfit', system-ui, sans-serif;
  --font-mono:       'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body:       'Plus Jakarta Sans', system-ui, sans-serif;

  --s1: 4px;  --s2: 8px;  --s3: 12px;
  --s4: 16px; --s5: 20px; --s6: 24px;
  --s7: 28px; --s8: 32px; --s9: 40px;
  --s10: 48px; --s11: 56px; --s12: 64px;

  --r0: 0px; --r1: 4px; --r2: 8px;
  --r3: 12px; --r4: 16px; --r5: 24px; --r6: 32px;

  --shadow-amber:    0 0 32px rgba(245, 158, 11, 0.12), 0 0 8px rgba(245, 158, 11, 0.06);
  --shadow-coral:    0 0 24px rgba(255, 77, 46, 0.14);
  --shadow-emerald:  0 0 24px rgba(34, 197, 94, 0.12);
  --shadow-card:     0 4px 24px rgba(0, 0, 0, 0.4), 0 1px 4px rgba(0, 0, 0, 0.3);
  --shadow-lift:     0 8px 40px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(0, 0, 0, 0.4);

  --t-fast: 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
  --t-base: 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
  --t-slow: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
  --t-linear: 250ms linear;

  --nav-h: 72px;
  --safe-bottom: env(safe-area-inset-bottom, 0px);

  --bg-gradient: radial-gradient(circle at 15% 50%, rgba(245, 158, 11, 0.05), transparent 25%), radial-gradient(circle at 85% 30%, rgba(34, 197, 94, 0.05), transparent 25%), linear-gradient(135deg, #0A0D12 0%, #0F1219 100%);
  --header-bg: rgba(10, 13, 18, 0.7);
  --header-border: rgba(255, 255, 255, 0.05);
  --grain-opacity: 0.35;
}
`;

css = css.replace(rootTokensRegex, lightThemeTokens);

// Use CSS vars for backgrounds
css = css.replace(/body \{\s*font-family: var\(--font-body\);\s*background:[\s\S]*?;\s*color:/, `body {
  font-family: var(--font-body);
  background: var(--bg-gradient);
  color:`);

css = css.replace(/body::before \{\s*content: '';[\s\S]*?opacity: 0\.15;/m, `body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
  opacity: var(--grain-opacity);`);

// .top-header
css = css.replace(/\.top-header \{\s*position: sticky;\s*top: 0;\s*z-index: 100;\s*background: rgba\(255, 255, 255, 0\.7\);\s*padding: var\(--s4\) var\(--s4\) var\(--s3\);\s*border-bottom: 1px solid var\(--surface-border\);/m, `.top-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--header-bg);
  padding: var(--s4) var(--s4) var(--s3);
  border-bottom: 1px solid var(--header-border);`);

// .bottom-nav
css = css.replace(/\.bottom-nav \{\s*position: fixed;\s*bottom: 0;[\s\S]*?background: rgba\(255, 255, 255, 0\.7\);\s*border-top: 1px solid rgba\(255, 255, 255, 0\.5\);/m, `.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 480px;
  height: calc(var(--nav-h) + var(--safe-bottom));
  padding-bottom: var(--safe-bottom);
  background: var(--header-bg);
  border-top: 1px solid var(--header-border);`);

fs.writeFileSync('d:/CODES/SunflowerSuperAPP/SuperSunflowerLand/css/app.css', css);
console.log('CSS updated for themes.');
