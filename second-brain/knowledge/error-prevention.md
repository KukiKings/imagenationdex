# IN$DEX Error Prevention Playbook
**Canonised:** 27 Jun 2026 | **Status:** LOCKED — engineering standard
**Author:** SIINDEX (Claude) + AJ Henry

---

## Why This Exists

The #1 reason IN$DEX screens break is null dereference — JS calling `.textContent` or `.style` on an element that doesn't exist at runtime. The #2 reason is double `DOMContentLoaded` listeners firing twice. Both are preventable with a consistent pattern. This document is the canonical standard for every screen, past and future.

---

## The Golden Rules

1. **Never call `document.getElementById().property` directly.** Always null-check first.
2. **Never add a second `DOMContentLoaded` listener.** Find the existing one and append to it.
3. **Always load `assets/indx-shield.js` before the main `<script>` block.**
4. **Every new `fetch()` call must have a `.catch()` handler.**
5. **Every `JSON.parse()` must be wrapped in `try/catch`.**
6. **Every `localStorage`/`sessionStorage` access must have a fallback default.**
7. **Run the 3-line audit check before every `git push`.**

---

## The SIINDEX Error Shield

**File:** `assets/indx-shield.js`

Load it on every screen, right before the main `<script>` block:

```html
<script src="assets/indx-shield.js"></script>
<script>
  // ... screen-specific code ...
</script>
```

### What the shield does

| Layer | What it catches |
|-------|----------------|
| `window.onerror` | Any uncaught JS exception — shows user-friendly toast or banner |
| `window.unhandledrejection` | Uncaught promise rejections (async/await failures) |
| `window.fetch` wrapper | Network errors that would otherwise crash Supabase calls |
| `$id(id)` helper | Drop-in for `document.getElementById()` — returns null safely |
| `$safe(id, fn)` helper | Runs a function only if the element exists |
| `$setText(id, text)` | Sets `.textContent` safely |
| `$setHTML(id, html)` | Sets `.innerHTML` safely |
| `$session` / `$local` | Safe wrappers for sessionStorage and localStorage |

### Shield helper usage

```javascript
// BEFORE (breaks if element missing):
document.getElementById('balanceEl').textContent = '100';

// AFTER (safe):
$setText('balanceEl', '100');

// BEFORE (breaks if element missing):
const el = document.getElementById('myBtn');
el.style.display = 'none';

// AFTER (safe):
$safe('myBtn', function(el) { el.style.display = 'none'; });

// BEFORE (breaks if key missing or storage blocked):
const balance = localStorage.getItem('indx_wallet_balance');

// AFTER (safe):
const balance = $local.get('indx_wallet_balance', '0');
```

---

## Double DOMContentLoaded — The Fix

**Root cause:** Script blocks at the bottom of `<body>` already have a loaded DOM. Any `DOMContentLoaded` listener inside them is redundant AND dangerous — it can fire twice if a second listener is accidentally added.

### Detection

```bash
grep -n "DOMContentLoaded" [screen].html
```

If the count > 1, there is a double DCL bug.

### Fix pattern

```javascript
// WRONG — adds a second DCL listener inside an already-loaded script block
document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('myBtn');
  btn.onclick = doSomething;
});

// RIGHT — DOM is already loaded; call directly with null guard
const _btn = document.getElementById('myBtn');
if (_btn) _btn.onclick = doSomething;
```

### Screens fixed (Session 56/57)

- `dex-swap.html` — duplicate DCL at line 1561 → merged as direct call
- `quickstart-onboarding.html` — DCL wrapper for `nameCta` → null-safe inline
- `genesis-offer.html` — two DCLs (forwardRef + QR code) → both converted to direct calls

---

## Null Dereference Risk — By Screen

Ranked by unguarded `getElementById().property` call count (pre-shield audit, Jun 2026):

| Screen | Risk Count | Shield Added |
|--------|-----------|-------------|
| send.html | 77 | ✅ Session 57 |
| sovereign-lending.html | 71 | ✅ Session 57 |
| buy-indx.html | 66 | ✅ Session 57 |
| sovereignpay.html | 57 | ✅ Session 57 |
| dex-swap.html | 52 | ✅ Session 57 |

Remaining screens (lower risk) to receive shield in next pass: `withdraw.html`, `staking.html`, `citizen-dashboard.html`, `login.html`.

---

## Fetch Error Pattern

Every Supabase / RPC / token price call must handle failure gracefully:

```javascript
// WRONG — if network fails, the whole screen crashes
const { data } = await sb.rpc('get_balance');
document.getElementById('bal').textContent = data.balance;

// RIGHT — always catch, always have a UI fallback
try {
  const { data, error } = await sb.rpc('get_balance');
  if (error) throw error;
  $setText('bal', data.balance || '0.00');
} catch (e) {
  console.error('[SIINDEX] Balance fetch failed:', e);
  $setText('bal', '--');
  // Do NOT crash. Show "--" and let user retry.
}
```

---

## JSON Parse Pattern

```javascript
// WRONG — throws SyntaxError if value is null or malformed
const history = JSON.parse(localStorage.getItem('indx_swap_history'));

// RIGHT — always default to safe value
const history = $local.getJSON('indx_swap_history', []);
```

---

## Storage Pattern

```javascript
// sessionStorage — citizen session data
const citizenId   = $session.get('citizen_id', null);
const citizenName = $session.get('citizen_name', 'Citizen');
const balance     = $session.get('citizen_balance', '0.00');

// localStorage — screen-persistent state
const swapHistory = $local.getJSON('indx_swap_history', []);
const lastToken   = $local.get('indx_swap_lastToken', 'SOL');
```

---

## Pre-Push Audit (3 Lines — Run Every Time)

```bash
grep -n -E "0\.35\b" [screen].html | grep -v "cubic-bezier\|opacity\|animation\|ease\|transition\|rgba"
grep -n "A\$" [screen].html | grep -v "cubic-bezier\|opacity\|animation"
grep -ni "seed phrase\|seed words\|12.word\|24.word\|mnemonic" [screen].html
```

All three must return empty. No exceptions.

---

## New Screen Checklist

When building any new IN$DEX screen, the following must be present before the screen is considered **done**:

- [ ] `<script src="assets/indx-shield.js"></script>` before main `<script>` block
- [ ] Only ONE `DOMContentLoaded` listener (or zero — use direct calls at bottom of body)
- [ ] Every `getElementById()` result is null-checked before `.property` access
- [ ] Every `fetch()` / Supabase call has `.catch()` or `try/catch`
- [ ] Every `JSON.parse()` is wrapped in `try/catch` or uses `$local.getJSON()`
- [ ] Every `localStorage`/`sessionStorage` get has a default fallback
- [ ] Cybertron hex canvas (God Mode Pattern A or B)
- [ ] 4 God Mode interactive features
- [ ] 3-line pre-push audit returns clean
- [ ] Voice check passes

---

## Error Classes Never to Suppress Silently

These errors indicate a real problem and must be logged to console even if swallowed from the UI:

1. Supabase `{ error }` response on any write operation (save, update, transfer)
2. `citizen_id` missing from sessionStorage on a screen that requires authentication
3. INDX price fetch returning 0 or null (would cause $0 display)
4. Any `error.code === 'PGRST'` (PostgREST schema mismatch — indicates DB migration needed)

---

*Locked: 27 Jun 2026. Update when new error class is discovered or a new shield version ships.*
