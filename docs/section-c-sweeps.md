# Section C sweeps - search_path, ownership, default grants

Project zljgthfzbalsunuoohcd. Run 21 Oct 2026. All three sweeps are read-only; nothing was changed by them.
Companion to docs/section-c-auth-review.md. The four Section C fixes were applied separately (migration s9_section_c_hardening; SQL in supabase/section-c-hardening/).

## Sweep 1 - search_path on SECURITY DEFINER functions

Scope: 158 SECURITY DEFINER functions/procedures in schema public.

| Measure | Count |
|---|---|
| Total | 158 |
| Have a pinned search_path | **158** |
| Lack a pinned search_path | **0** |
| search_path = public | 157 |
| search_path = public, extensions | 1 |
| Pinned to empty (search_path = '') | 0 |
| Name pg_temp explicitly | 0 |

Finding: the claim that functions lack "set search_path" does not hold here. Every function is pinned, including the 10 Section B guards and the 7 Section C functions rewritten today.

Residual risk (real but narrower than described): a pinned `search_path = public` still searches the session's temporary schema first for tables and views, because pg_temp is implicit and comes first unless it is listed last. A function that reads an unqualified table such as founder_authority (is_founder() does) could resolve to a same-named temp table created by the caller. Exploiting that needs the caller to run their own SQL.
- anon and authenticated both hold TEMP on the database (true/true).
- The Data API does not let a caller run arbitrary SQL. 0 functions executable by authenticated matched a dynamic `EXECUTE <expression>` pattern (approximate regex check), so no exposed function lets a caller create temp tables for the definer to see.
- So this is a hardening gap, not a live bypass through the API. It becomes live if a direct database connection or a dynamic-SQL function is ever exposed to callers.

Proposed fix (not applied; changes all 158 definitions, needs AJ's PROCEED):
1. Smallest, safe change: `ALTER FUNCTION ... SET search_path = public, pg_temp;` for all 158. This puts pg_temp last, so temp objects cannot shadow public ones. No body changes.
2. The stronger form the research suggests, `search_path = ''`, requires every unqualified object reference in all 158 bodies to be schema-qualified first (for example `founder_authority` becomes `public.founder_authority`, and `auth.uid()` and extension calls stay qualified). Applying it without that rewrite breaks every function that uses an unqualified table or helper. Not safe as a bulk ALTER.
3. Revoke TEMP from the API roles: `REVOKE TEMP ON DATABASE postgres FROM anon, authenticated;` removes the prerequisite entirely. Check first that no function or client uses temp tables as those roles.

Binary: yes, all three are deterministic.

## Sweep 2 - function ownership

| Owner | SECURITY DEFINER functions |
|---|---|
| postgres | **158** |
| any other role | 0 |

All 84 tables in public are also owned by postgres. On Supabase, postgres is not a true superuser, but it owns everything and can bypass RLS (BYPASSRLS), so every SECURITY DEFINER function runs with that reach.

Finding: all 158 are candidates under the least-privilege pattern. Proposed pattern (not applied):
1. Create NOLOGIN role(s) per domain, for example `fn_exec_admin`, `fn_exec_kyc`, `fn_exec_staking`, with GRANTs only on the tables each function group touches.
2. `ALTER FUNCTION ... OWNER TO fn_exec_<domain>` per group.
3. Check each function's referenced tables first; any table the new owner cannot read breaks the function, and RLS applies to a non-BYPASSRLS owner unless a policy or FORCE setting allows it.

This is a large change with per-function regression risk. Not enforceable as a single deterministic rule until each function's table set is mapped. Suggest starting with the 21 Section C functions and the 10 Section B functions (31 total) as the first batch.

## Sweep 3 - default privileges and the 30 October 2026 change

Platform change (Supabase changelog 45329): from 30 October 2026 new tables in public of existing projects are no longer auto-exposed to the Data API. Tables created without explicit GRANTs to anon, authenticated and service_role return 42501 until granted. Existing tables keep their grants. Source: https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically

Default privileges on schema public (pg_default_acl):
- Objects created by role **supabase_admin**: tables grant arwdDxtm to postgres, anon, authenticated, service_role; sequences rwU and functions X to the same four. These defaults still auto-grant.
- Objects created by role **postgres**: tables grant to postgres and **service_role only**; sequences rwU and functions X to postgres and service_role. anon and authenticated are NOT auto-granted for postgres-created objects.

Meaning: this project already behaves under the new rule for anything created as postgres, which is how migrations and the MCP create tables. All 84 public tables are owned by postgres.

Existing tables (84):

| Measure | Count |
|---|---|
| RLS enabled | 84 (0 without) |
| anon has SELECT | 48 |
| anon has INSERT, UPDATE or DELETE | 40 |
| authenticated has INSERT, UPDATE or DELETE | 40 |
| service_role has full DML | 84 |
| Sequences with anon USAGE/UPDATE | 1 of 2 |

The 40 tables with anon write privilege are gated by RLS today, but anon write privilege is broader than least privilege. They rely on RLS, not on missing grants. Proposed (not applied): review each of the 40 and `REVOKE INSERT, UPDATE, DELETE ... FROM anon` where no anonymous write path exists. Tables with anon write: agent_registry, approval_gates, bill_pay_schedules, capability_registry, citizen_account_links, citizen_connectivity, citizen_guardians, citizen_intents, citizens, complaint_events, complaints, connectivity_events, connectivity_providers, connectivity_risk_flags, consent_grants, consent_receipts, context_grants, council_reviews, credentials, delegations, devices, dispute_events, disputes, executive_investigation_access, governance_proposals, governance_votes, instant_invites, insurance_pool, insurance_stakes, listings, marketplace_offers, memory_items, proactive_routines, referrals, siindex_identity_passport, siindex_session_messages, siindex_sessions, tax_event_ledger, waitlist, wisdom_actions.

Do existing tables rely on defaults? No. The 30 October change does not touch tables that already exist; they keep their current grants.

Pending migrations (repo supabase/migrations, 14 files, 10 create tables):
- 4 files create tables without any GRANT: 20260730_pqsi_g6_deposit_credit (indx_deposit_accounts, deposit_credit_attempts), 20260809_siindex_runtime_config, 20260814_siindex_agent_bus_v1 (campaign_mandates, agent_tasks, agent_messages, agent_evidence, agent_audit), 20260816_siindex_visitor_feedback_v1 (visitor_feedback).
- Live check: the 7 tables that exist (siindex_runtime_config, campaign_mandates, agent_tasks, agent_messages, agent_evidence, agent_audit, visitor_feedback) have RLS on, no policies, and no anon or authenticated privileges. They are service_role-only today. Nothing breaks on 30 October because they already work that way.
- indx_deposit_accounts and deposit_credit_attempts were not found in the live database, so that migration may never have been applied. I did not diff the repo against the applied-migration list.
- No migration in the repo depends on default anon/authenticated grants for a table it creates. If any new table must be reachable from the browser, its migration needs explicit grants.

Proposed standing rule for every future table (not applied): the migration for any new table must in the same file (a) enable RLS, (b) add its policies, (c) `GRANT` only the exact privileges each role needs, for example:

```sql
ALTER TABLE public.<t> ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.<t> TO authenticated;          -- only what the UI needs
GRANT SELECT, INSERT, UPDATE, DELETE ON public.<t> TO service_role;
```

Optional early opt-in (changes future objects only): `ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;` and the same for sequences and functions. Not needed for postgres-created objects, which already behave this way.

Binary: yes (a migration either contains the GRANT lines or not); a CI check that fails any migration with CREATE TABLE but no GRANT is deterministic.

## Counts

- Sweep 1: 158 checked, 158 pinned, 0 unpinned, 0 empty-pinned, 0 with pg_temp last.
- Sweep 2: 158 checked, 158 owned by postgres, 0 by other roles.
- Sweep 3: 84 tables, 84 RLS on; 40 with anon write, 48 with anon select; 4 repo migrations create tables without GRANTs, 0 of which break on 30 October.
