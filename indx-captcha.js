/* IN$DEX shared CAPTCHA helper (Cloudflare Turnstile, free tier).
 * One file used by every page that calls sb.auth.signInWithOtp.
 * Usage:  await sb.auth.signInWithOtp({ phone, options: await IndxCaptcha.options() })
 * Set SITE_KEY below (public Turnstile site key). Empty = disabled (no widget, no token).
 * Enforcement happens in Supabase: Auth > Attack Protection > CAPTCHA (Turnstile + secret key).
 * Until that is enabled, the token is sent but ignored. Browser-side gating alone is not a security control. */
(function (w) {
  var SITE_KEY = '0x4AAAAAAFwSSoTCP42UpNvx';
  var key = w.INDX_TURNSTILE_SITEKEY || SITE_KEY;
  var API = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
  var wid = null, token = null, waiters = [], loading = null;

  function flush(t) { var q = waiters; waiters = []; q.forEach(function (f) { f(t); }); }
  function load() {
    if (loading) return loading;
    loading = new Promise(function (res, rej) {
      if (w.turnstile) return res();
      var s = document.createElement('script');
      s.src = API; s.async = true; s.onload = function () { res(); }; s.onerror = function () { rej(new Error('captcha_load')); };
      document.head.appendChild(s);
    });
    return loading;
  }
  function mount() {
    if (wid !== null || !key) return Promise.resolve();
    return load().then(function () {
      var box = document.createElement('div');
      box.id = 'indxCaptcha';
      box.style.cssText = 'position:fixed;left:50%;bottom:12px;transform:translateX(-50%);z-index:2147483000';
      (document.body || document.documentElement).appendChild(box);
      wid = w.turnstile.render(box, {
        sitekey: key,
        appearance: 'interaction-only',
        callback: function (t) { token = t; flush(t); },
        'expired-callback': function () { token = null; },
        'error-callback': function () { token = null; flush(null); }
      });
    }).catch(function () { flush(null); });
  }
  function get() {
    if (!key) return Promise.resolve(null);
    return mount().then(function () {
      if (token) { var t = token; token = null; return t; }
      return new Promise(function (res) {
        waiters.push(function (t) { token = null; res(t); });
        setTimeout(function () { flush(null); }, 20000);
      });
    });
  }
  function renew() { if (wid !== null && w.turnstile) { try { w.turnstile.reset(wid); } catch (e) {} } }

  w.IndxCaptcha = {
    enabled: function () { return !!key; },
    // Returns an options object for signInWithOtp; consumes the single-use token and starts a fresh challenge.
    options: function (extra) {
      return get().then(function (t) {
        renew();
        var o = {}; for (var k in (extra || {})) o[k] = extra[k];
        if (t) o.captchaToken = t;
        return o;
      });
    }
  };
  if (key) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount(); }
})(window);
