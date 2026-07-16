/**
 * SIINDEX Connectivity Disclosure Component
 * ------------------------------------------
 * Reusable rendering component for the "Telecom Neutral SIINDEX" rule
 * (sovereign-access-network-v1.md, section 34): every connectivity
 * recommendation SIINDEX makes must disclose available providers, the
 * reason for the recommendation, coverage evidence, total cost,
 * restrictions, whether IN$DEX is compensated, alternatives, and the
 * switching process. The citizen chooses.
 *
 * This is infrastructure, not a citizen-facing screen. No telecom
 * partner is signed yet, so nothing calls this with real provider data
 * today — wiring it into an actual "Compare Providers" screen is future
 * work, gated on AJ signing a real telecom/eSIM partner (see
 * sovereign-connectivity-pilot-spec.md, item 1). Do NOT populate this
 * with invented provider names, prices, or coverage claims.
 *
 * Usage:
 *   <script src="siindex-connectivity-disclosure.js"></script>
 *   <div id="disclosureContainer"></div>
 *   <script>
 *     SIINDEX.renderProviderDisclosure(document.getElementById('disclosureContainer'), {
 *       providers: [{ id: 'op1', name: 'Operator One' }, { id: 'op2', name: 'Operator Two' }],
 *       recommendedProviderId: 'op1',
 *       reason: 'Best coverage for your island and lowest total cost for your usage pattern.',
 *       coverageEvidence: 'Network Quality Proof data for your region, last 30 days.',
 *       totalCost: '$12.00 USD/month, all fees included',
 *       restrictions: ['12-month minimum term', 'Data throttled after 5GB'],
 *       compensated: { isCompensated: true, detail: 'IN$DEX receives a referral fee from Operator One if you sign up.' },
 *       alternatives: ['Operator Two — better roaming, higher monthly cost', 'Community Wi-Fi station — no cost, limited hours'],
 *       switchingProcess: 'You can switch providers at any time from your Connectivity Wallet. Your Grid Account, credentials, and history are never affected by a provider switch.'
 *     });
 *   </script>
 *
 * Gotcha: this file intentionally has zero Supabase/network calls. It is
 * a pure render function so it can be unit-tested and reused the moment
 * a real provider-comparison data source exists, without rewiring.
 */
(function (global) {
  'use strict';

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderProviderDisclosure(container, opts) {
    if (!container) throw new Error('SIINDEX.renderProviderDisclosure: container element is required');
    opts = opts || {};
    const providers = Array.isArray(opts.providers) ? opts.providers : [];
    const recommended = providers.find(function (p) { return p.id === opts.recommendedProviderId; });
    const compensated = opts.compensated || { isCompensated: false };
    const restrictions = Array.isArray(opts.restrictions) ? opts.restrictions : [];
    const alternatives = Array.isArray(opts.alternatives) ? opts.alternatives : [];

    if (providers.length === 0) {
      container.innerHTML =
        '<div class="siindex-disclosure siindex-disclosure--empty">' +
        '<div class="sd-title">No connectivity providers available yet</div>' +
        '<div class="sd-sub">IN$DEX has not signed a telecom or eSIM partner. SIINDEX will not recommend a provider until a real one exists.</div>' +
        '</div>';
      return;
    }

    const providerListHtml = providers.map(function (p) {
      const isRec = p.id === opts.recommendedProviderId;
      return '<li class="sd-provider' + (isRec ? ' sd-provider--recommended' : '') + '">' +
        esc(p.name) + (isRec ? ' <span class="sd-rec-badge">Recommended</span>' : '') +
        '</li>';
    }).join('');

    const restrictionsHtml = restrictions.length
      ? '<ul class="sd-list">' + restrictions.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>'
      : '<div class="sd-none">No restrictions disclosed.</div>';

    const alternativesHtml = alternatives.length
      ? '<ul class="sd-list">' + alternatives.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul>'
      : '<div class="sd-none">No alternatives listed.</div>';

    const compensationHtml = compensated.isCompensated
      ? '<div class="sd-compensation sd-compensation--yes">⚠️ IN$DEX is compensated for this recommendation. ' + esc(compensated.detail || '') + '</div>'
      : '<div class="sd-compensation sd-compensation--no">✓ IN$DEX receives no compensation for this recommendation.</div>';

    container.innerHTML =
      '<div class="siindex-disclosure">' +
        '<div class="sd-title">Connectivity options SIINDEX considered</div>' +
        '<ul class="sd-list sd-provider-list">' + providerListHtml + '</ul>' +
        (recommended ? '<div class="sd-reason"><strong>Why ' + esc(recommended.name) + ':</strong> ' + esc(opts.reason || 'No reason provided.') + '</div>' : '') +
        '<div class="sd-row"><span class="sd-k">Coverage evidence</span><span class="sd-v">' + esc(opts.coverageEvidence || 'Not provided') + '</span></div>' +
        '<div class="sd-row"><span class="sd-k">Total cost</span><span class="sd-v">' + esc(opts.totalCost || 'Not provided') + '</span></div>' +
        '<div class="sd-section-label">Restrictions</div>' + restrictionsHtml +
        compensationHtml +
        '<div class="sd-section-label">Alternatives</div>' + alternativesHtml +
        '<div class="sd-switching"><strong>Switching later:</strong> ' + esc(opts.switchingProcess || 'Not provided') + '</div>' +
        '<div class="sd-choice">The citizen chooses the provider. SIINDEX never auto-selects one.</div>' +
      '</div>';
  }

  global.SIINDEX = global.SIINDEX || {};
  global.SIINDEX.renderProviderDisclosure = renderProviderDisclosure;
})(typeof window !== 'undefined' ? window : this);
