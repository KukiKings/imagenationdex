/**
 * indx-wallet.js — IN$DEX Phantom/Backpack Wallet Adapter
 * Handles Solana wallet connection, signing, and SPL token balance.
 * Version: 1.0.0 | Built: 2026-07-04 | SIINDEX CSIO
 *
 * Usage:
 *   <script src="js/indx-wallet.js"></script>
 *   const result = await INDXWallet.connect();
 *   const balance = await INDXWallet.getINDXBalance();
 */

(function (global) {
  'use strict';

  // ── INDX SPL Token config ──────────────────────────────────────
  // Placeholder mint — replace with live mint address at TGE (2026-09-24)
  const INDX_MINT_ADDRESS  = 'INDXmintAddressPlaceholderReplaceAtTGE';
  const SOLANA_RPC_DEVNET  = 'https://api.devnet.solana.com';
  const SOLANA_RPC_MAINNET = 'https://api.mainnet-beta.solana.com';
  const TGE_DATE           = new Date('2026-09-24T00:00:00+11:00');
  const IS_POST_TGE        = Date.now() >= TGE_DATE.getTime();
  const RPC_ENDPOINT       = IS_POST_TGE ? SOLANA_RPC_MAINNET : SOLANA_RPC_DEVNET;

  // ── State ──────────────────────────────────────────────────────
  let _provider    = null;
  let _publicKey   = null;
  let _walletType  = null; // 'phantom' | 'backpack' | null
  let _listeners   = {};

  // ── Provider detection ─────────────────────────────────────────
  function detectProvider() {
    // Phantom
    if (global.phantom?.solana?.isPhantom) {
      return { provider: global.phantom.solana, type: 'phantom' };
    }
    // Phantom legacy injection
    if (global.solana?.isPhantom) {
      return { provider: global.solana, type: 'phantom' };
    }
    // Backpack
    if (global.backpack?.solana) {
      return { provider: global.backpack.solana, type: 'backpack' };
    }
    // xNFT Backpack
    if (global.xnft?.solana) {
      return { provider: global.xnft.solana, type: 'backpack' };
    }
    return null;
  }

  function getProviderName() {
    return _walletType ? (_walletType.charAt(0).toUpperCase() + _walletType.slice(1)) : 'Wallet';
  }

  // ── Connection ─────────────────────────────────────────────────
  /**
   * Connect wallet. Returns { publicKey, type } or null on failure.
   */
  async function connect(options) {
    const detected = detectProvider();
    if (!detected) {
      _emit('error', {
        code: 'NO_WALLET',
        message: 'No Solana wallet detected. Install Phantom or Backpack to continue.'
      });
      return null;
    }

    _provider   = detected.provider;
    _walletType = detected.type;

    try {
      const opts = options || { onlyIfTrusted: false };
      const response = await _provider.connect(opts);
      _publicKey = response.publicKey.toString();

      // Persist to sessionStorage
      sessionStorage.setItem('wallet_address',  _publicKey);
      sessionStorage.setItem('wallet_type',     _walletType);

      // Register disconnect/account-change listeners
      _provider.on('disconnect',      _onDisconnect);
      _provider.on('accountChanged',  _onAccountChanged);

      _emit('connect', { publicKey: _publicKey, type: _walletType });
      return { publicKey: _publicKey, type: _walletType };

    } catch (err) {
      if (err.code === 4001) {
        _emit('error', { code: 'USER_REJECTED', message: 'Connection rejected by user.' });
      } else {
        _emit('error', { code: 'CONNECT_FAILED', message: err.message });
      }
      return null;
    }
  }

  /** Attempt silent reconnect if previously connected (onlyIfTrusted). */
  async function reconnectSilent() {
    const saved = sessionStorage.getItem('wallet_address');
    if (!saved) return null;
    return connect({ onlyIfTrusted: true });
  }

  async function disconnect() {
    if (!_provider) return;
    try {
      await _provider.disconnect();
    } catch (_) {}
    _onDisconnect();
  }

  function _onDisconnect() {
    _publicKey  = null;
    _provider   = null;
    _walletType = null;
    sessionStorage.removeItem('wallet_address');
    sessionStorage.removeItem('wallet_type');
    _emit('disconnect', {});
  }

  function _onAccountChanged(newPublicKey) {
    if (newPublicKey) {
      _publicKey = newPublicKey.toString();
      sessionStorage.setItem('wallet_address', _publicKey);
      _emit('accountChanged', { publicKey: _publicKey });
    } else {
      _onDisconnect();
    }
  }

  // ── Signing ────────────────────────────────────────────────────
  /**
   * Sign a message for auth/identity verification.
   * Returns base58-encoded signature string or null.
   */
  async function signMessage(message) {
    if (!_provider || !_publicKey) return null;
    try {
      const encoded = new TextEncoder().encode(message);
      const { signature } = await _provider.signMessage(encoded, 'utf8');
      // Convert Uint8Array to base58-ish hex for storage
      return Array.from(signature).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (err) {
      _emit('error', { code: 'SIGN_FAILED', message: err.message });
      return null;
    }
  }

  /**
   * Sign and send a transaction.
   * @param {object} transaction - Solana Transaction object (from @solana/web3.js)
   * @returns {string|null} transaction signature
   */
  async function signAndSendTransaction(transaction) {
    if (!_provider || !_publicKey) return null;
    try {
      const { signature } = await _provider.signAndSendTransaction(transaction);
      return signature;
    } catch (err) {
      if (err.code === 4001) {
        _emit('error', { code: 'USER_REJECTED', message: 'Transaction rejected by user.' });
      } else {
        _emit('error', { code: 'TX_FAILED', message: err.message });
      }
      return null;
    }
  }

  // ── Balance queries ────────────────────────────────────────────
  /**
   * Get native SOL balance for connected wallet.
   * @returns {number} SOL balance (lamports / 1e9)
   */
  async function getSOLBalance() {
    if (!_publicKey) return 0;
    try {
      const body = JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'getBalance',
        params: [_publicKey, { commitment: 'confirmed' }]
      });
      const res  = await fetch(RPC_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      const json = await res.json();
      return (json.result?.value || 0) / 1e9;
    } catch (_) { return 0; }
  }

  /**
   * Get INDX SPL token balance for connected wallet.
   * Falls back to sessionStorage citizen_balance before TGE.
   * @returns {number} INDX balance
   */
  async function getINDXBalance() {
    // Pre-TGE: return sessionStorage value (demo/alpha)
    if (!IS_POST_TGE) {
      return parseFloat(sessionStorage.getItem('citizen_balance') || '0');
    }

    if (!_publicKey) return 0;
    try {
      const body = JSON.stringify({
        jsonrpc: '2.0', id: 1, method: 'getTokenAccountsByOwner',
        params: [
          _publicKey,
          { mint: INDX_MINT_ADDRESS },
          { encoding: 'jsonParsed', commitment: 'confirmed' }
        ]
      });
      const res  = await fetch(RPC_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      const json = await res.json();
      const accounts = json.result?.value || [];
      if (!accounts.length) return 0;
      const amount = accounts[0]?.account?.data?.parsed?.info?.tokenAmount?.uiAmount || 0;
      return amount;
    } catch (_) { return 0; }
  }

  // ── Wallet UI helpers ──────────────────────────────────────────
  /**
   * Inject a standard "Connect Wallet" button into a target element.
   * Handles connected/disconnected states automatically.
   * @param {string|HTMLElement} target - selector or DOM element
   */
  function injectConnectButton(target) {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;

    function render() {
      if (_publicKey) {
        const short = _publicKey.slice(0, 4) + '…' + _publicKey.slice(-4);
        el.innerHTML =
          '<button class="indx-wallet-btn connected" onclick="INDXWallet.disconnect()">' +
          '<span class="wbtn-dot"></span>' + short + ' · Disconnect' +
          '</button>';
      } else {
        const detected = detectProvider();
        const label = detected ? ('Connect ' + (detected.type === 'phantom' ? 'Phantom' : 'Backpack')) : 'Install Phantom';
        el.innerHTML =
          '<button class="indx-wallet-btn" onclick="INDXWallet.connect()">' +
          '◎ ' + label +
          '</button>';
        if (!detected) {
          el.querySelector('button').onclick = function () {
            global.open('https://phantom.app', '_blank');
          };
        }
      }
    }

    on('connect',    render);
    on('disconnect', render);
    render();
  }

  // ── Event emitter ──────────────────────────────────────────────
  function on(event, handler) {
    if (!_listeners[event]) _listeners[event] = [];
    _listeners[event].push(handler);
  }

  function off(event, handler) {
    if (!_listeners[event]) return;
    _listeners[event] = _listeners[event].filter(function (h) { return h !== handler; });
  }

  function _emit(event, data) {
    (_listeners[event] || []).forEach(function (h) { try { h(data); } catch (_) {} });
  }

  // ── State getters ──────────────────────────────────────────────
  function isConnected()  { return !!_publicKey; }
  function getPublicKey() { return _publicKey; }
  function getType()      { return _walletType; }
  function isPhantom()    { return _walletType === 'phantom'; }
  function isBackpack()   { return _walletType === 'backpack'; }

  // ── Auto-reconnect on load ─────────────────────────────────────
  // If wallet was previously connected this session, reconnect silently.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      if (sessionStorage.getItem('wallet_address')) reconnectSilent();
    });
  } else {
    if (sessionStorage.getItem('wallet_address')) reconnectSilent();
  }

  // ── Public API ─────────────────────────────────────────────────
  global.INDXWallet = {
    // Config
    INDX_MINT_ADDRESS,
    RPC_ENDPOINT,
    IS_POST_TGE,

    // Connection
    connect,
    disconnect,
    reconnectSilent,
    isConnected,
    getPublicKey,
    getType,
    getProviderName,
    isPhantom,
    isBackpack,
    detectProvider,

    // Signing
    signMessage,
    signAndSendTransaction,

    // Balances
    getSOLBalance,
    getINDXBalance,

    // UI
    injectConnectButton,

    // Events
    on,
    off
  };

})(window);
