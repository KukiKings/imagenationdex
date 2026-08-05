(function () {
  'use strict';

  const SUPABASE_URL = 'https://zljgthfzbalsunuoohcd.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsamd0aGZ6YmFsc3VudW9vaGNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1ODc1NTIsImV4cCI6MjA5NzE2MzU1Mn0.5xNG-E4R9OOHEm7Gq6qHVn5Hkq2mqoGRrL5aHHYwvVA';
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true }
  });

  const state = { user: null, running: false };
  const el = {};

  function cache() {
    ['statusDot', 'statusText', 'agents', 'runs', 'feedback', 'paymentAmount', 'paymentButton', 'refreshButton']
      .forEach(function (id) { el[id] = document.getElementById(id); });
    el.eventButtons = Array.from(document.querySelectorAll('[data-event]'));
  }

  function text(node, value, className) {
    node.textContent = value;
    node.className = className || '';
  }

  function setBusy(busy) {
    state.running = busy;
    el.eventButtons.forEach(function (button) { button.disabled = busy || !state.user; });
    el.paymentButton.disabled = busy || !state.user;
    el.refreshButton.disabled = busy || !state.user;
  }

  function setSession(user) {
    state.user = user;
    el.statusDot.classList.toggle('online', Boolean(user));
    el.statusText.textContent = user ? 'Authenticated private test' : 'Sign in required';
    setBusy(false);
    if (!user) {
      text(el.feedback, 'Open Tier 0 onboarding and verify your phone before using this control plane. ', 'error');
      const link = document.createElement('a');
      link.href = '/tier0';
      link.className = 'login-link';
      link.textContent = 'Open Tier 0';
      el.feedback.appendChild(link);
    }
  }

  async function invoke(body) {
    const result = await sb.functions.invoke('siindex-swarm-runtime', { body: body });
    if (result.error) {
      let message = result.error.message || 'Private runtime request failed.';
      try {
        const context = await result.error.context.json();
        message = context.detail || context.error || message;
      } catch (_) {}
      throw new Error(message);
    }
    return result.data;
  }

  async function route(eventType, data) {
    if (!state.user || state.running) return;
    setBusy(true);
    text(el.feedback, 'Routing bounded private-test work…');
    try {
      const response = await invoke({ operation: 'route', event_type: eventType, data: data || {} });
      const result = response.result || {};
      text(el.feedback, 'Run recorded. ' + String(result.task_count || 0) + ' tasks prepared or held for approval. No real-world action occurred.', 'success');
      await loadRuns();
    } catch (error) {
      text(el.feedback, error.message || 'The private runtime is unavailable.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function approve(runId, kind) {
    if (!state.user || state.running) return;
    if (kind !== 'subject-consent') {
      text(el.feedback, 'This approval type is not available from the citizen preview.', 'error');
      return;
    }
    const confirmed = window.confirm('Record a one-hour private-test subject-consent receipt? This is not HeyGen provider verification and does not permit public release.');
    if (!confirmed) return;
    setBusy(true);
    try {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const source = state.user.id + '|' + runId + '|' + kind + '|' + expiresAt;
      const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source));
      const evidenceHash = Array.from(new Uint8Array(bytes)).map(function (value) { return value.toString(16).padStart(2, '0'); }).join('');
      await invoke({
        operation: 'approve',
        run_id: runId,
        approval_kind: kind,
        evidence_hash: evidenceHash,
        expires_at: expiresAt
      });
      text(el.feedback, 'Private-test consent receipt recorded. Provider verification and publication remain locked.', 'success');
      await loadRuns();
    } catch (error) {
      text(el.feedback, error.message || 'Approval receipt could not be recorded.', 'error');
    } finally {
      setBusy(false);
    }
  }

  function renderAgents(manifests) {
    el.agents.replaceChildren();
    manifests.forEach(function (manifest) {
      const card = document.createElement('div');
      card.className = 'agent';
      const name = document.createElement('strong');
      name.textContent = manifest.agent_id;
      const role = document.createElement('span');
      role.textContent = manifest.role;
      card.append(name, role);
      el.agents.appendChild(card);
    });
  }

  async function loadAgents() {
    if (!state.user) return;
    const result = await sb.from('siindex_agent_manifests').select('agent_id,role,status,owns_keys').order('agent_id');
    if (result.error) throw result.error;
    renderAgents(result.data || []);
  }

  function renderRuns(runs) {
    el.runs.replaceChildren();
    if (!runs.length) {
      const empty = document.createElement('div');
      empty.className = 'runs-empty';
      empty.textContent = 'No private-test runs yet.';
      el.runs.appendChild(empty);
      return;
    }
    runs.forEach(function (run) {
      const article = document.createElement('article');
      article.className = 'run';
      const top = document.createElement('div');
      top.className = 'run-top';
      const headingWrap = document.createElement('div');
      const heading = document.createElement('h3');
      heading.textContent = run.event_type;
      const chip = document.createElement('span');
      chip.className = 'chip ' + (run.status === 'prepared' ? 'prepared' : '');
      chip.textContent = run.status.replaceAll('_', ' ');
      headingWrap.append(heading, chip);
      const time = document.createElement('time');
      time.textContent = new Date(run.created_at).toLocaleString();
      top.append(headingWrap, time);
      article.appendChild(top);

      const tasks = document.createElement('div');
      tasks.className = 'tasks';
      (run.siindex_swarm_tasks || []).forEach(function (task) {
        const row = document.createElement('div');
        row.className = 'task';
        const agent = document.createElement('div');
        agent.className = 'task-agent';
        agent.textContent = task.agent_id;
        const capability = document.createElement('div');
        capability.className = 'task-cap';
        capability.textContent = task.capability + ' · ' + task.network + ' · ' + task.status.replaceAll('_', ' ');
        row.append(agent, capability);
        if (task.status === 'awaiting_approval' && task.required_approval) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'approve';
          button.textContent = 'Record ' + task.required_approval;
          button.addEventListener('click', function () { approve(run.id, task.required_approval); });
          row.appendChild(button);
        }
        tasks.appendChild(row);
      });
      article.appendChild(tasks);
      el.runs.appendChild(article);
    });
  }

  async function loadRuns() {
    if (!state.user) return;
    const response = await invoke({ operation: 'status' });
    renderRuns(response.runs || []);
  }

  function bind() {
    el.eventButtons.forEach(function (button) {
      button.addEventListener('click', function () { route(button.dataset.event, {}); });
    });
    el.paymentButton.addEventListener('click', function () {
      const amount = Number(el.paymentAmount.value);
      if (!Number.isFinite(amount) || amount <= 0 || amount > 1000000) {
        text(el.feedback, 'Enter a valid private-test amount between 0 and 1,000,000 TEST_USDC.', 'error');
        return;
      }
      route('commerce.payment_requested', { displayAmount: amount.toFixed(2), asset: 'TEST_USDC' });
    });
    el.refreshButton.addEventListener('click', async function () {
      setBusy(true);
      try { await loadRuns(); } catch (error) { text(el.feedback, error.message || 'Runs could not be loaded.', 'error'); }
      finally { setBusy(false); }
    });
  }

  async function init() {
    cache();
    bind();
    setBusy(true);
    const result = await sb.auth.getSession();
    setSession(result.data.session && result.data.session.user);
    if (!state.user) return;
    try {
      await Promise.all([loadAgents(), loadRuns()]);
      text(el.feedback, 'Control plane ready. External execution remains disabled.');
    } catch (error) {
      text(el.feedback, error.message || 'Private preview is not activated yet.', 'error');
    } finally {
      setBusy(false);
    }
  }

  document.addEventListener('DOMContentLoaded', init);
}());
