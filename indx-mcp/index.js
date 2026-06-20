#!/usr/bin/env node
/**
 * IN$DEX Sovereign MCP Server
 * Ties Supabase citizens, Wisdom Scores, marketplace, referrals,
 * and governance into one place — accessible from Claude, Cursor, or any AI tool.
 *
 * Tools exposed:
 *   get_platform_stats     — citizen count, wisdom tiers, listings, referrals
 *   get_citizen            — lookup by domain, email, or id
 *   get_citizens           — list citizens with optional filters
 *   get_wisdom_score       — wisdom score + tier for a citizen
 *   award_wisdom           — add wisdom points (SIINDEX-initiated, logged)
 *   get_listings           — marketplace listings with optional filters
 *   get_referral_stats     — referral performance for a citizen
 *   get_governance         — active MemeDAO governance proposals
 *   get_days_to_launch     — days remaining to L99 (24 September 2026)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';

// ─── Config ───────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zljgthfzbalsunuoohcd.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNjM3MjUsImV4cCI6MjA1ODYzOTcyNX0.SRSVRhNYKBRuFqMBpBaFyshFAVafxqBiPGj6N2ZwYGo';
const L99_LAUNCH = new Date('2026-09-24T00:00:00+10:00'); // AEST
const INDX_PRICE = 0.24;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Wisdom Tier Helper ────────────────────────────────────────────────────────
function wisdomTier(score) {
  if (score >= 200) return 'Sovereign Elder';
  if (score >= 150) return 'Fee Reducer';
  if (score >= 100) return 'Sovereign Yield';
  if (score >= 50)  return 'Governor';
  return 'Newcomer';
}

function daysToLaunch() {
  const now = new Date();
  const diff = L99_LAUNCH - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ─── Tool Handlers ────────────────────────────────────────────────────────────
async function getPlatformStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [
    { count: totalCitizens },
    { count: newToday },
    { count: newcomers },
    { count: governors },
    { count: sovereignYield },
    { count: feeReducers },
    { count: elders },
    { count: totalListings },
    { count: listingsToday },
    { count: totalReferrals },
  ] = await Promise.all([
    supabase.from('citizens').select('*', { count: 'exact', head: true }),
    supabase.from('citizens').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
    supabase.from('citizens').select('*', { count: 'exact', head: true }).lt('wisdom_score', 50),
    supabase.from('citizens').select('*', { count: 'exact', head: true }).gte('wisdom_score', 50).lt('wisdom_score', 100),
    supabase.from('citizens').select('*', { count: 'exact', head: true }).gte('wisdom_score', 100).lt('wisdom_score', 150),
    supabase.from('citizens').select('*', { count: 'exact', head: true }).gte('wisdom_score', 150).lt('wisdom_score', 200),
    supabase.from('citizens').select('*', { count: 'exact', head: true }).gte('wisdom_score', 200),
    supabase.from('listings').select('*', { count: 'exact', head: true }),
    supabase.from('listings').select('*', { count: 'exact', head: true }).gte('created_at', todayISO),
    supabase.from('referrals').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
  ]);

  return {
    citizens: {
      total: totalCitizens ?? 0,
      new_today: newToday ?? 0,
      wisdom_tiers: {
        newcomers: newcomers ?? 0,
        governors: governors ?? 0,
        sovereign_yield: sovereignYield ?? 0,
        fee_reducers: feeReducers ?? 0,
        sovereign_elders: elders ?? 0,
      }
    },
    marketplace: {
      total_listings: totalListings ?? 0,
      new_today: listingsToday ?? 0,
    },
    referrals: {
      total_completed: totalReferrals ?? 0,
    },
    token: {
      indx_price_usd: INDX_PRICE,
      supply: 100000000,
    },
    launch: {
      l99_date: '24 September 2026',
      days_remaining: daysToLaunch(),
    }
  };
}

async function getCitizen({ id, domain, email }) {
  let query = supabase.from('citizens').select('*');
  if (id)     query = query.eq('id', id);
  else if (domain) query = query.ilike('web3_domain', domain.replace('.index', ''));
  else if (email)  query = query.eq('email', email);
  else return { error: 'Provide id, domain, or email' };

  const { data, error } = await query.single();
  if (error) return { error: error.message };

  return {
    ...data,
    wisdom_tier: wisdomTier(data.wisdom_score ?? 0),
  };
}

async function getCitizens({ limit = 20, offset = 0, min_wisdom, max_wisdom, genesis_only }) {
  let query = supabase.from('citizens').select('id, citizen_name, web3_domain, wisdom_score, genesis_citizen, created_at').range(offset, offset + limit - 1).order('created_at', { ascending: false });
  if (min_wisdom !== undefined) query = query.gte('wisdom_score', min_wisdom);
  if (max_wisdom !== undefined) query = query.lt('wisdom_score', max_wisdom);
  if (genesis_only) query = query.eq('genesis_citizen', true);

  const { data, error } = await query;
  if (error) return { error: error.message };

  return {
    citizens: (data || []).map(c => ({ ...c, wisdom_tier: wisdomTier(c.wisdom_score ?? 0) })),
    count: data?.length ?? 0,
  };
}

async function getWisdomScore({ citizen_id }) {
  const { data, error } = await supabase.from('citizens').select('id, citizen_name, wisdom_score').eq('id', citizen_id).single();
  if (error) return { error: error.message };
  const score = data.wisdom_score ?? 0;
  return {
    citizen_id,
    citizen_name: data.citizen_name,
    wisdom_score: score,
    tier: wisdomTier(score),
    next_milestone: score < 50 ? 50 : score < 100 ? 100 : score < 150 ? 150 : score < 200 ? 200 : null,
    next_milestone_label: score < 50 ? 'Governor (governance voting)' : score < 100 ? 'Sovereign Yield' : score < 150 ? 'Fee Reducer' : score < 200 ? 'Sovereign Elder' : 'Maximum achieved',
    points_to_next: score < 200 ? (score < 50 ? 50 : score < 100 ? 100 : score < 150 ? 150 : 200) - score : 0,
  };
}

async function awardWisdom({ citizen_id, points, reason }) {
  // Read current score
  const { data: citizen, error: readErr } = await supabase.from('citizens').select('id, citizen_name, wisdom_score').eq('id', citizen_id).single();
  if (readErr) return { error: readErr.message };

  const current = citizen.wisdom_score ?? 0;
  const newScore = Math.min(200, current + points);

  const { error: updateErr } = await supabase.from('citizens').update({ wisdom_score: newScore }).eq('id', citizen_id);
  if (updateErr) return { error: updateErr.message };

  return {
    citizen_id,
    citizen_name: citizen.citizen_name,
    previous_score: current,
    points_awarded: points,
    new_score: newScore,
    new_tier: wisdomTier(newScore),
    reason,
    capped_at_200: current + points > 200,
  };
}

async function getListings({ limit = 20, offset = 0, category, seller_id, status = 'active' }) {
  let query = supabase.from('listings').select('*').eq('status', status).range(offset, offset + limit - 1).order('created_at', { ascending: false });
  if (category) query = query.eq('category', category);
  if (seller_id) query = query.eq('seller_id', seller_id);

  const { data, error } = await query;
  if (error) return { error: error.message };
  return { listings: data || [], count: data?.length ?? 0 };
}

async function getReferralStats({ citizen_id }) {
  const { data: referrals, error } = await supabase.from('referrals').select('*').eq('referrer_id', citizen_id);
  if (error) return { error: error.message };

  const completed = referrals.filter(r => r.status === 'completed');
  const pending = referrals.filter(r => r.status === 'pending');

  return {
    citizen_id,
    total_referrals: referrals.length,
    completed: completed.length,
    pending: pending.length,
    indx_earned: completed.length * 10, // 10 INDX per completed referral
    usd_value: (completed.length * 10 * INDX_PRICE).toFixed(2),
  };
}

async function getGovernance({ status = 'active' }) {
  const { data, error } = await supabase.from('governance_proposals').select('*').eq('status', status).order('created_at', { ascending: false });
  if (error) return { error: error.message };
  return { proposals: data || [], count: data?.length ?? 0 };
}

// ─── Tool Definitions ─────────────────────────────────────────────────────────
const TOOLS = [
  {
    name: 'get_platform_stats',
    description: 'Get IN$DEX platform metrics: citizen count, Wisdom Score tier breakdown, marketplace listings, referral completions, INDX token info, and days to L99 launch.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_citizen',
    description: 'Look up a specific IN$DEX citizen by their id, web3 domain, or email address.',
    inputSchema: {
      type: 'object',
      properties: {
        id:     { type: 'string', description: 'Citizen UUID' },
        domain: { type: 'string', description: 'Web3 domain (e.g. mamaNoe.index)' },
        email:  { type: 'string', description: 'Citizen email address' },
      },
    },
  },
  {
    name: 'get_citizens',
    description: 'List IN$DEX citizens with optional filters for Wisdom Score range and genesis status.',
    inputSchema: {
      type: 'object',
      properties: {
        limit:        { type: 'number', description: 'Max results (default 20)' },
        offset:       { type: 'number', description: 'Pagination offset (default 0)' },
        min_wisdom:   { type: 'number', description: 'Minimum Wisdom Score' },
        max_wisdom:   { type: 'number', description: 'Maximum Wisdom Score' },
        genesis_only: { type: 'boolean', description: 'Return only Genesis Citizens' },
      },
    },
  },
  {
    name: 'get_wisdom_score',
    description: 'Get a citizen\'s current Wisdom Score, tier, and how many points until their next milestone.',
    inputSchema: {
      type: 'object',
      properties: {
        citizen_id: { type: 'string', description: 'Citizen UUID' },
      },
      required: ['citizen_id'],
    },
  },
  {
    name: 'award_wisdom',
    description: 'Award Wisdom Score points to a citizen. Used by SIINDEX for completing actions (staking, referrals, governance votes). Capped at 200.',
    inputSchema: {
      type: 'object',
      properties: {
        citizen_id: { type: 'string', description: 'Citizen UUID' },
        points:     { type: 'number', description: 'Points to award' },
        reason:     { type: 'string', description: 'Reason for awarding (e.g. "Completed first stake")' },
      },
      required: ['citizen_id', 'points', 'reason'],
    },
  },
  {
    name: 'get_listings',
    description: 'Get marketplace listings with optional filters for category, seller, and status.',
    inputSchema: {
      type: 'object',
      properties: {
        limit:     { type: 'number', description: 'Max results (default 20)' },
        offset:    { type: 'number', description: 'Pagination offset' },
        category:  { type: 'string', description: 'Filter by category' },
        seller_id: { type: 'string', description: 'Filter by seller citizen UUID' },
        status:    { type: 'string', description: 'Listing status: active (default), sold, removed' },
      },
    },
  },
  {
    name: 'get_referral_stats',
    description: 'Get referral performance for a citizen — total referrals, completed, pending, and INDX earned.',
    inputSchema: {
      type: 'object',
      properties: {
        citizen_id: { type: 'string', description: 'Citizen UUID' },
      },
      required: ['citizen_id'],
    },
  },
  {
    name: 'get_governance',
    description: 'Get MemeDAO governance proposals. Defaults to active proposals.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', description: 'Proposal status: active (default), passed, rejected, all' },
      },
    },
  },
  {
    name: 'get_days_to_launch',
    description: 'Get the number of days remaining until IN$DEX L99 launch on 24 September 2026.',
    inputSchema: { type: 'object', properties: {}, required: [] },
  },
];

// ─── Server Setup ─────────────────────────────────────────────────────────────
const server = new Server(
  { name: 'indx-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  let result;

  try {
    switch (name) {
      case 'get_platform_stats':   result = await getPlatformStats();             break;
      case 'get_citizen':          result = await getCitizen(args);               break;
      case 'get_citizens':         result = await getCitizens(args);              break;
      case 'get_wisdom_score':     result = await getWisdomScore(args);           break;
      case 'award_wisdom':         result = await awardWisdom(args);              break;
      case 'get_listings':         result = await getListings(args);              break;
      case 'get_referral_stats':   result = await getReferralStats(args);         break;
      case 'get_governance':       result = await getGovernance(args);            break;
      case 'get_days_to_launch':   result = { days_remaining: daysToLaunch(), l99: '24 September 2026' }; break;
      default: result = { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    result = { error: err.message };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
  };
});

// ─── Start ────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
