/**
 * indx-db.js — IN$DEX Shared Supabase Client
 * Single source of truth for all database interactions.
 * Version: 1.0.0 | Built: 2026-07-04 | SIINDEX CSIO
 *
 * Usage:
 *   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
 *   <script src="js/indx-db.js"></script>
 *   const citizen = await INDXDB.getCitizen();
 */

(function (global) {
  'use strict';

  // ── Constants ─────────────────────────────────────────────────
  const SUPABASE_URL      = 'https://zljgthfzbalsunuoohcd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
  const INDX_PRICE_USD    = 0.24;

  // ── Client initialisation ──────────────────────────────────────
  let _sb = null;
  function getClient() {
    if (_sb) return _sb;
    if (!global.supabase) {
      console.error('[INDXDB] supabase-js not loaded. Add CDN script before indx-db.js.');
      return null;
    }
    _sb = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true }
    });
    return _sb;
  }

  // ── Auth helpers ───────────────────────────────────────────────
  async function getSession() {
    const sb = getClient(); if (!sb) return null;
    const { data } = await sb.auth.getSession();
    return data?.session || null;
  }

  async function getAuthUserId() {
    const session = await getSession();
    return session?.user?.id || null;
  }

  /** Hydrate sessionStorage from DB on page load. Safe to call on every screen. */
  async function hydrateSession() {
    const sb = getClient(); if (!sb) return false;
    const uid = await getAuthUserId();
    if (!uid) return false;

    const { data: citizen, error } = await sb
      .from('citizens')
      .select('id,citizen_name,web3_domain,wisdom_score,indx_balance,genesis_citizen,kyc_tier,referral_code,email')
      .eq('auth_user_id', uid)
      .single();

    if (error || !citizen) return false;

    sessionStorage.setItem('citizen_id',         citizen.id);
    sessionStorage.setItem('citizen_name',        citizen.citizen_name     || '');
    sessionStorage.setItem('citizen_web3_domain', citizen.web3_domain      || '');
    sessionStorage.setItem('citizen_wisdom',      String(citizen.wisdom_score   || 0));
    sessionStorage.setItem('citizen_balance',     String(citizen.indx_balance   || 0));
    sessionStorage.setItem('citizen_genesis',     String(citizen.genesis_citizen || false));
    sessionStorage.setItem('citizen_kyc_tier',    String(citizen.kyc_tier  || 0));
    sessionStorage.setItem('citizen_referral',    citizen.referral_code    || '');

    // Bump last_seen_at
    await sb.from('citizens').update({ last_seen_at: new Date().toISOString() }).eq('id', citizen.id);
    return true;
  }

  // ── Citizen CRUD ───────────────────────────────────────────────
  async function getCitizen() {
    const sb = getClient(); if (!sb) return null;
    const uid = await getAuthUserId(); if (!uid) return null;
    const { data, error } = await sb
      .from('citizens')
      .select('*')
      .eq('auth_user_id', uid)
      .single();
    if (error) { console.error('[INDXDB] getCitizen:', error.message); return null; }
    return data;
  }

  async function getCitizenById(citizenId) {
    const sb = getClient(); if (!sb) return null;
    const { data, error } = await sb
      .from('citizens')
      .select('id,citizen_name,web3_domain,wisdom_score,indx_balance,genesis_citizen,kyc_tier')
      .eq('id', citizenId)
      .single();
    if (error) return null;
    return data;
  }

  async function updateCitizen(fields) {
    const sb = getClient(); if (!sb) return false;
    const uid = await getAuthUserId(); if (!uid) return false;
    const { error } = await sb
      .from('citizens')
      .update({ ...fields, last_seen_at: new Date().toISOString() })
      .eq('auth_user_id', uid);
    if (error) { console.error('[INDXDB] updateCitizen:', error.message); return false; }
    return true;
  }

  async function addWisdomPoints(points, actionKey, source) {
    const sb = getClient(); if (!sb) return false;
    const citizenId = sessionStorage.getItem('citizen_id'); if (!citizenId) return false;

    // Insert wisdom action log
    await sb.from('wisdom_actions').insert({
      citizen_id: citizenId,
      action_key: actionKey,
      points:     points,
      source:     source || null
    });

    // Increment wisdom_score on citizen
    const { error } = await sb.rpc('increment_wisdom_score', { p_citizen_id: citizenId, p_points: points });
    if (error) {
      // Fallback: direct update
      const current = parseInt(sessionStorage.getItem('citizen_wisdom') || '0');
      await updateCitizen({ wisdom_score: Math.min(200, current + points) });
    }

    const current = parseInt(sessionStorage.getItem('citizen_wisdom') || '0');
    sessionStorage.setItem('citizen_wisdom', String(Math.min(200, current + points)));
    return true;
  }

  // ── Transactions ───────────────────────────────────────────────
  async function getTransactions(limit, direction) {
    const sb = getClient(); if (!sb) return [];
    const citizenId = sessionStorage.getItem('citizen_id'); if (!citizenId) return [];

    let query = sb
      .from('transactions')
      .select('*')
      .eq('citizen_id', citizenId)
      .order('created_at', { ascending: false })
      .limit(limit || 100);

    if (direction) query = query.eq('direction', direction);

    const { data, error } = await query;
    if (error) { console.error('[INDXDB] getTransactions:', error.message); return []; }
    return data || [];
  }

  /**
   * insertTransaction — creates a transaction record.
   * @param {object} tx - { direction, amount_indx, counterparty_address?, memo?, token?, corridor?, metadata? }
   * @returns {object|null} inserted row
   */
  async function insertTransaction(tx) {
    const sb = getClient(); if (!sb) return null;
    const citizenId = sessionStorage.getItem('citizen_id'); if (!citizenId) return null;

    const row = {
      citizen_id:            citizenId,
      direction:             tx.direction,
      amount_indx:           tx.amount_indx,
      amount_usd:            tx.amount_usd  || (tx.amount_indx * INDX_PRICE_USD),
      token:                 tx.token       || 'INDX',
      counterparty_address:  tx.counterparty_address || null,
      memo:                  tx.memo        || null,
      corridor:              tx.corridor    || null,
      metadata:              tx.metadata    || null,
      status:                tx.status      || 'complete',
      tx_hash:               tx.tx_hash     || null
    };

    const { data, error } = await sb.from('transactions').insert(row).select().single();
    if (error) { console.error('[INDXDB] insertTransaction:', error.message); return null; }

    // Update local balance optimistically
    const currentBal = parseFloat(sessionStorage.getItem('citizen_balance') || '0');
    const delta = ['receive','earn','deposit'].includes(tx.direction) ? tx.amount_indx : -tx.amount_indx;
    sessionStorage.setItem('citizen_balance', String(Math.max(0, currentBal + delta)));

    return data;
  }

  // ── Listings (Marketplace) ─────────────────────────────────────
  async function getListings(filters) {
    const sb = getClient(); if (!sb) return [];
    const f = filters || {};

    let query = sb
      .from('listings')
      .select('*, seller:seller_id(citizen_name, web3_domain, kyc_tier)')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(f.limit || 50);

    if (f.category)  query = query.eq('category', f.category);
    if (f.maxPrice)  query = query.lte('price_indx', f.maxPrice);
    if (f.minPrice)  query = query.gte('price_indx', f.minPrice);
    if (f.sellerId)  query = query.eq('seller_id', f.sellerId);
    if (f.search)    query = query.ilike('title', '%' + f.search + '%');

    const { data, error } = await query;
    if (error) { console.error('[INDXDB] getListings:', error.message); return []; }
    return data || [];
  }

  async function insertListing(listing) {
    const sb = getClient(); if (!sb) return null;
    const citizenId = sessionStorage.getItem('citizen_id'); if (!citizenId) return null;

    const { data, error } = await sb
      .from('listings')
      .insert({ ...listing, seller_id: citizenId })
      .select()
      .single();

    if (error) { console.error('[INDXDB] insertListing:', error.message); return null; }
    return data;
  }

  async function submitOffer(listingId, offerIndx, message) {
    const sb = getClient(); if (!sb) return null;
    const citizenId = sessionStorage.getItem('citizen_id'); if (!citizenId) return null;

    const { data, error } = await sb
      .from('marketplace_offers')
      .insert({ listing_id: listingId, buyer_id: citizenId, offer_indx: offerIndx, message: message || null })
      .select()
      .single();

    if (error) { console.error('[INDXDB] submitOffer:', error.message); return null; }
    return data;
  }

  // ── Staking ────────────────────────────────────────────────────
  async function getStakingPositions() {
    const sb = getClient(); if (!sb) return [];
    const citizenId = sessionStorage.getItem('citizen_id'); if (!citizenId) return [];
    const { data, error } = await sb
      .from('staking_positions')
      .select('*')
      .eq('citizen_id', citizenId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  }

  async function insertStake(stake) {
    const sb = getClient(); if (!sb) return null;
    const citizenId = sessionStorage.getItem('citizen_id'); if (!citizenId) return null;
    const { data, error } = await sb
      .from('staking_positions')
      .insert({ ...stake, citizen_id: citizenId })
      .select()
      .single();
    if (error) { console.error('[INDXDB] insertStake:', error.message); return null; }
    return data;
  }

  // ── Governance ─────────────────────────────────────────────────
  async function getProposals(status) {
    const sb = getClient(); if (!sb) return [];
    let query = sb
      .from('governance_proposals')
      .select('*')
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) return [];
    return data || [];
  }

  async function castVote(proposalId, vote) {
    const sb = getClient(); if (!sb) return false;
    const citizenId = sessionStorage.getItem('citizen_id'); if (!citizenId) return false;
    const wisdom = parseInt(sessionStorage.getItem('citizen_wisdom') || '0');

    const { error } = await sb.from('governance_votes').insert({
      proposal_id: proposalId,
      citizen_id:  citizenId,
      vote:        vote,
      wisdom_score: wisdom
    });
    if (error) { console.error('[INDXDB] castVote:', error.message); return false; }

    // Award wisdom points for voting
    await addWisdomPoints(5, 'governance_vote', 'governance');
    return true;
  }

  // ── Referrals ──────────────────────────────────────────────────
  async function getReferrals() {
    const sb = getClient(); if (!sb) return [];
    const citizenId = sessionStorage.getItem('citizen_id'); if (!citizenId) return [];
    const { data, error } = await sb
      .from('referrals')
      .select('*, referred:referred_id(citizen_name, web3_domain, created_at)')
      .eq('referrer_id', citizenId)
      .order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  }

  async function createReferral(referralCode) {
    const sb = getClient(); if (!sb) return null;
    const citizenId = sessionStorage.getItem('citizen_id'); if (!citizenId) return null;
    const { data, error } = await sb
      .from('referrals')
      .insert({ referrer_id: citizenId, referral_code: referralCode })
      .select()
      .single();
    if (error) return null;
    return data;
  }

  // ── Realtime subscriptions ─────────────────────────────────────
  /**
   * Subscribe to incoming transactions for the current citizen.
   * @param {function} onReceive - called with the new transaction row
   * @returns {object} subscription — call .unsubscribe() to clean up
   */
  function subscribeToIncomingPayments(onReceive) {
    const sb = getClient(); if (!sb) return null;
    const citizenId = sessionStorage.getItem('citizen_id'); if (!citizenId) return null;

    return sb
      .channel('incoming_payments_' + citizenId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: 'citizen_id=eq.' + citizenId + ',direction=eq.receive'
        },
        function (payload) { if (onReceive) onReceive(payload.new); }
      )
      .subscribe();
  }

  /**
   * Subscribe to citizen balance changes (wisdom score, INDX balance).
   * @param {function} onChange - called with updated citizen fields
   */
  function subscribeToCitizenUpdates(onChange) {
    const sb = getClient(); if (!sb) return null;
    const citizenId = sessionStorage.getItem('citizen_id'); if (!citizenId) return null;

    return sb
      .channel('citizen_updates_' + citizenId)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'citizens',
          filter: 'id=eq.' + citizenId
        },
        function (payload) {
          const c = payload.new;
          if (c.wisdom_score !== undefined)
            sessionStorage.setItem('citizen_wisdom', String(c.wisdom_score));
          if (c.indx_balance !== undefined)
            sessionStorage.setItem('citizen_balance', String(c.indx_balance));
          if (onChange) onChange(c);
        }
      )
      .subscribe();
  }

  // ── Utility ────────────────────────────────────────────────────
  function indxToUsd(indx) {
    return (parseFloat(indx) * INDX_PRICE_USD).toFixed(2);
  }

  function formatIndx(amount) {
    const n = parseFloat(amount);
    if (isNaN(n)) return '0';
    return n % 1 === 0 ? n.toString() : n.toFixed(2).replace(/\.?0+$/, '');
  }

  function relativeTime(isoString) {
    const s = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (s < 60)   return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60)   return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24)   return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
  }

  // ── Public API ─────────────────────────────────────────────────
  global.INDXDB = {
    // Config
    SUPABASE_URL,
    INDX_PRICE_USD,
    getClient,

    // Auth
    getSession,
    getAuthUserId,
    hydrateSession,

    // Citizens
    getCitizen,
    getCitizenById,
    updateCitizen,
    addWisdomPoints,

    // Transactions
    getTransactions,
    insertTransaction,

    // Marketplace
    getListings,
    insertListing,
    submitOffer,

    // Staking
    getStakingPositions,
    insertStake,

    // Governance
    getProposals,
    castVote,

    // Referrals
    getReferrals,
    createReferral,

    // Realtime
    subscribeToIncomingPayments,
    subscribeToCitizenUpdates,

    // Utils
    indxToUsd,
    formatIndx,
    relativeTime
  };

})(window);
