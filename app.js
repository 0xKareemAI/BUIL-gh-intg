/**
 * Builvero GitHub & BTIS Integration - Single-Page UI Simulation
 * All DOM data is dynamically populated from API endpoints per guide.md
 */

// ============================================================================
// Central State & Mock Database (Matches C# DTOs in guide.md)
// ============================================================================

const state = {
  // Current Builvero Project GUID
  projectId: 'a4f81c90-48e2-4751-b0db-559d8c83a19b',

  // Project API Data (GET api/projects/{id})
  project: {
    id: 'a4f81c90-48e2-4751-b0db-559d8c83a19b',
    name: 'Dashboard',
    type: 'Game',
    stage: 'Early Stage',
    created: '7/20/2026',
    description: 'Next-generation physics-driven modular multiplayer gaming framework built on low-latency WebSockets and WebAssembly.',
    requiredSkills: 'No specific skills required.',
    builderTags: 'No builder tags.',
    pendingInvitations: 0,
    pendingJoinRequests: 0,
    userRole: 'Owner',
    userName: 'System Administrator',
    userAvatar: 'SA',
    githubConnectionStatus: 'Active', // 'Active' | 'Broken' | null
    githubRepo: {
      id: 'e1d2c3b4-5678-90ab-cdef-112233445566',
      repoName: 'builvero/game-engine-core',
      repoId: 829148,
      author: 'builvero',
      branch: 'main',
      openIssueCount: 4,
      lastSynced: 'Just now'
    }
  },

  // GitHub Installation Wire State (POST api/projects/{id}/github/sync)
  githubSync: {
    login: 'SA',
    status: 'connected', // SyncStatusEnum: 'no_repo_available'|'connected'|'choose_repo'|'already_connected'|'repo_disconnected'
    warnings: null // Array of SyncWarning
  },

  // Unclaimed repositories in Builvero DB (POST api/projects/{id}/github/connect/init)
  simulateEmptyAvailableRepos: false,
  unclaimedRepos: [
    { Id: 'e1d2c3b4-5678-90ab-cdef-112233445566', RepoFullName: 'builvero/game-engine-core' },
    { Id: 'f2e3d4c5-6789-01bc-def0-223344556677', RepoFullName: 'builvero/networking-wasm' },
    { Id: 'a3b4c5d6-7890-12cd-ef01-334455667788', RepoFullName: 'builvero/ui-primitives' }
  ],

  // BTIS Score API Data (GET api/users/me/btis-score §4.7)
  btis: {
    emptyState: false,
    UserId: 'usr_9981a-sysadmin',
    BTISScore: 84.5,
    BTISCapScore: 95.0,
    Pillars: [
      {
        PillarId: 'p-101',
        PillarName: 'Code Quality & Reliability',
        PillarScore: 88.0,
        PillarWeight: 0.35,
        PillarCap: 90.0
      },
      {
        PillarId: 'p-102',
        PillarName: 'Development Velocity & PR Cadence',
        PillarScore: 82.5,
        PillarWeight: 0.40,
        PillarCap: 95.0
      },
      {
        PillarId: 'p-103',
        PillarName: 'Community Engagement & Issue Triage',
        PillarScore: 78.0,
        PillarWeight: 0.25,
        PillarCap: 85.0
      }
    ],
    Axes: [
      { AxisId: 'a-1', AxisName: 'Automated Test Coverage', AxisScore: 86.0, AxisWeight: 0.5, AxisCap: 90.0, PillarId: 'p-101' },
      { AxisId: 'a-2', AxisName: 'Static Analysis / Clean Architecture', AxisScore: 90.0, AxisWeight: 0.5, AxisCap: 90.0, PillarId: 'p-101' },
      { AxisId: 'a-3', AxisName: 'PR Cycle Time (< 24h)', AxisScore: 80.0, AxisWeight: 0.6, AxisCap: 95.0, PillarId: 'p-102' },
      { AxisId: 'a-4', AxisName: 'Daily Commit Cadence', AxisScore: 85.0, AxisWeight: 0.4, AxisCap: 95.0, PillarId: 'p-102' },
      { AxisId: 'a-5', AxisName: 'Fast Issue Response Rate', AxisScore: 76.0, AxisWeight: 0.6, AxisCap: 85.0, PillarId: 'p-103' },
      { AxisId: 'a-6', AxisName: 'Community Forum Discussions', AxisScore: 81.0, AxisWeight: 0.4, AxisCap: 85.0, PillarId: 'p-103' }
    ]
  },

  // HTTP Wire Event Log
  httpLogs: [],
  activeScenario: 'active-connected'
};

// ============================================================================
// API Mock Engine with Rich Variable Syntax Highlighting
// ============================================================================

async function mockApiCall({ method, path, requestBody = null, responseStatus = 200, responseData = null }) {
  // Realistic brief network delay
  await new Promise(resolve => setTimeout(resolve, 250));

  const timestamp = new Date().toLocaleTimeString();
  const url = `https://staging.builvero.com${path}`;
  
  let curl = `curl -X ${method} "${url}" \\\n  -H "Authorization: Bearer <JWT_TOKEN>"`;
  if (requestBody) {
    curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(requestBody)}'`;
  }

  const logEntry = {
    id: Date.now() + Math.random(),
    timestamp,
    method,
    path,
    url,
    status: responseStatus,
    requestBody,
    responseData,
    curl
  };

  state.httpLogs.unshift(logEntry);
  renderApiLogs();
  return responseData;
}

// Regex to highlight GUIDs and variable parameters
function formatSyntaxHighlight(jsonObj) {
  if (!jsonObj) return '';
  const jsonStr = JSON.stringify(jsonObj, null, 2);

  // HTML escape first
  let html = jsonStr.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Highlight GUIDs (distinct magenta)
  const guidRegex = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/gi;
  html = html.replace(guidRegex, '<span class="var-guid">$1</span>');

  // Highlight JSON keys
  html = html.replace(/"([^"]+)":/g, '<span class="var-json-key">"$1"</span>:');

  // Highlight boolean / null / numbers
  html = html.replace(/:\s*(true|false)/g, ': <span class="var-json-bool">$1</span>');
  html = html.replace(/:\s*(null)/g, ': <span class="var-json-null">$1</span>');
  html = html.replace(/:\s*(-?\d+\.?\d*)/g, ': <span class="var-json-number">$1</span>');

  // Highlight strings
  html = html.replace(/:\s*"(.*?)"/g, ': <span class="var-json-string">"$1"</span>');

  return html;
}

function formatPathHighlight(path) {
  const guidRegex = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/gi;
  return path.replace(guidRegex, '<span class="var-guid">$1</span>');
}

// ============================================================================
// Endpoint Simulations (strictly adhering to guide.md)
// ============================================================================

/** §4.5 Get project by id (extended) */
async function apiGetProject(projectId) {
  const path = `/api/projects/${projectId}`;
  const responseData = {
    id: state.project.id,
    name: state.project.name,
    type: state.project.type,
    stage: state.project.stage,
    created: state.project.created,
    description: state.project.description,
    requiredSkills: state.project.requiredSkills,
    builderTags: state.project.builderTags,
    pendingInvitations: state.project.pendingInvitations,
    pendingJoinRequests: state.project.pendingJoinRequests,
    userRole: state.project.userRole,
    userName: state.project.userName,
    userAvatar: state.project.userAvatar,
    githubConnectionStatus: state.project.githubConnectionStatus,
    githubRepo: state.project.githubRepo ? {
      repoName: state.project.githubRepo.repoName,
      author: state.project.githubRepo.author,
      openIssueCount: state.project.githubRepo.openIssueCount
    } : null
  };

  const res = await mockApiCall({
    method: 'GET',
    path,
    responseStatus: 200,
    responseData
  });

  // Apply API data directly to state & UI
  applyProjectDataToUI(res);
  return res;
}

/** §4.1 Initialize GitHub connection */
async function apiInitConnect(projectId) {
  const path = `/api/projects/${projectId}/github/connect/init`;
  const repos = state.simulateEmptyAvailableRepos ? [] : state.unclaimedRepos.map(r => ({ Id: r.Id, RepoFullName: r.RepoFullName }));
  const responseData = {
    InstallUrl: `https://github.com/apps/builvero-app/installations/new?state=${projectId}`,
    AvailableRepos: repos
  };

  return await mockApiCall({
    method: 'POST',
    path,
    responseStatus: 200,
    responseData
  });
}

/** §4.2 Sync GitHub installation with project */
async function apiSync(projectId, overrideStatus = null) {
  const path = `/api/projects/${projectId}/github/sync`;
  const syncStatus = overrideStatus || (state.project.githubConnectionStatus === 'Broken' ? 'repo_disconnected' : 'connected');

  const responseData = {
    GitHubLogin: state.githubSync.login,
    Status: syncStatus,
    Repositories: state.project.githubRepo ? [
      {
        Id: state.project.githubRepo.id,
        RepoFullName: state.project.githubRepo.repoName,
        RepoId: state.project.githubRepo.repoId
      }
    ] : [],
    Warnings: state.githubSync.warnings
  };

  const res = await mockApiCall({
    method: 'POST',
    path,
    responseStatus: 200,
    responseData
  });

  applySyncDataToUI(res);
  return res;
}

/** §4.3 Link repo to project */
async function apiLinkRepo(projectId, installationRepoId) {
  const path = `/api/projects/${projectId}/github/repo-link`;
  const requestBody = { InstallationRepoId: installationRepoId };

  return await mockApiCall({
    method: 'POST',
    path,
    requestBody,
    responseStatus: 200,
    responseData: { Message: 'Connected' }
  });
}

/** §4.4 Disconnect repo from project */
async function apiDisconnectRepo(projectId) {
  const path = `/api/projects/${projectId}/github/repo-link`;

  return await mockApiCall({
    method: 'DELETE',
    path,
    responseStatus: 200,
    responseData: { Message: 'Disconnected' }
  });
}

/** §4.7 Get user's BTIS score */
async function apiGetBtisScore() {
  const path = `/api/users/me/btis-score`;

  let responseData;
  if (state.btis.emptyState) {
    responseData = {
      Pillars: [],
      Axes: []
    };
  } else {
    responseData = {
      UserId: state.btis.UserId,
      BTISScore: state.btis.BTISScore,
      BTISCapScore: state.btis.BTISCapScore,
      Pillars: state.btis.Pillars,
      Axes: state.btis.Axes
    };
  }

  const res = await mockApiCall({
    method: 'GET',
    path,
    responseStatus: 200,
    responseData
  });

  applyBtisDataToUI(res);
  return res;
}

// ============================================================================
// UI RENDERING - STRICTLY FROM API DATA
// ============================================================================

/** Review: All Project Information values rendered directly from GET api/projects/{id} */
function applyProjectDataToUI(data) {
  document.getElementById('page-project-title').textContent = data.name;
  document.getElementById('badge-project-type').textContent = data.type;
  document.getElementById('badge-project-stage').textContent = data.stage;
  document.getElementById('project-created-date').textContent = `Created ${data.created}`;
  document.getElementById('project-description-text').textContent = data.description;
  document.getElementById('project-required-skills').textContent = data.requiredSkills;
  document.getElementById('project-builder-tags').textContent = data.builderTags;

  // Stats & Members
  document.getElementById('stats-pending-invitations').textContent = data.pendingInvitations;
  document.getElementById('stats-pending-requests').textContent = data.pendingJoinRequests;
  document.getElementById('stats-user-role').textContent = data.userRole;
  document.getElementById('member-avatar').textContent = data.userAvatar;
  document.getElementById('header-user-avatar').textContent = data.userAvatar;
  document.getElementById('member-name').textContent = data.userName;
  document.getElementById('header-user-name').textContent = data.userName;

  renderGithubCardUI();
}

/** Review: GitHub Card rendered from persistent status & sync responses */
function renderGithubCardUI() {
  const headerPill = document.getElementById('github-header-pill');
  const headerPillText = document.getElementById('github-header-pill-text');

  const viewUnconnected = document.getElementById('github-state-unconnected');
  const viewConnected = document.getElementById('github-state-connected');
  const viewBroken = document.getElementById('github-state-broken');
  const viewSyncing = document.getElementById('github-state-syncing');

  viewUnconnected.style.display = 'none';
  viewConnected.style.display = 'none';
  viewBroken.style.display = 'none';
  viewSyncing.style.display = 'none';

  headerPill.className = 'status-pill';

  if (state.project.githubConnectionStatus === 'Active' && state.project.githubRepo) {
    headerPill.classList.add('active');
    headerPillText.textContent = 'Active';
    viewConnected.style.display = 'flex';

    // Map fields from API
    const avatarEl = document.getElementById('github-author-avatar');
    if (avatarEl) avatarEl.textContent = state.githubSync.login;

    const wireStatusEl = document.getElementById('github-wire-status-text');
    if (wireStatusEl) wireStatusEl.textContent = state.githubSync.status;

    const repoNameEl = document.getElementById('repo-display-name');
    if (repoNameEl) repoNameEl.textContent = state.project.githubRepo.repoName;

    const repoLinkEl = document.getElementById('repo-full-name-link');
    if (repoLinkEl) repoLinkEl.href = `https://github.com/${state.project.githubRepo.repoName}`;

    const openIssuesEl = document.getElementById('repo-open-issues');
    if (openIssuesEl) openIssuesEl.textContent = `${state.project.githubRepo.openIssueCount} open issues`;

    const branchEl = document.getElementById('repo-branch');
    if (branchEl) branchEl.textContent = state.project.githubRepo.branch || 'main';

    const authorEl = document.getElementById('repo-author');
    if (authorEl) authorEl.textContent = state.project.githubRepo.author;

    const lastSyncedEl = document.getElementById('github-last-synced');
    if (lastSyncedEl) lastSyncedEl.textContent = state.project.githubRepo.lastSynced || 'Just now';

  } else if (state.project.githubConnectionStatus === 'Broken') {
    headerPill.classList.add('broken');
    headerPillText.textContent = 'Broken';
    viewBroken.style.display = 'flex';

  } else if (state.project.githubConnectionStatus === 'Syncing') {
    headerPill.classList.add('syncing');
    headerPillText.textContent = 'Syncing...';
    viewSyncing.style.display = 'flex';

  } else {
    // Unconnected / null
    headerPill.classList.add('unconnected');
    headerPillText.textContent = 'Not Connected';
    viewUnconnected.style.display = 'flex';
  }
}

/** Review: Sync Response processor */
function applySyncDataToUI(syncData) {
  state.githubSync.login = syncData.GitHubLogin;
  state.githubSync.status = syncData.Status;
  state.githubSync.warnings = syncData.Warnings;

  if (syncData.Status === 'connected') {
    state.project.githubConnectionStatus = 'Active';
    if (syncData.Repositories && syncData.Repositories.length > 0) {
      const r = syncData.Repositories[0];
      state.project.githubRepo = {
        id: r.Id,
        repoName: r.RepoFullName,
        repoId: r.RepoId,
        author: r.RepoFullName.split('/')[0] || 'builvero',
        branch: 'main',
        openIssueCount: 4,
        lastSynced: 'Just now'
      };
    }
  } else if (syncData.Status === 'repo_disconnected') {
    state.project.githubConnectionStatus = 'Broken';
  } else if (syncData.Status === 'no_repo_available') {
    state.project.githubConnectionStatus = null;
    state.project.githubRepo = null;
  }

  renderGithubCardUI();
  renderAlertBanners();
}

/** Review: BTIS Score Card rendered directly from GET api/users/me/btis-score */
function applyBtisDataToUI(data) {
  const populatedView = document.getElementById('btis-populated-view');
  const emptyView = document.getElementById('btis-empty-view');
  const pillarsContainer = document.getElementById('btis-pillars-container');

  // Check empty state (§4.7: empty Pillars: [] and Axes: [])
  if (!data.Pillars || data.Pillars.length === 0) {
    populatedView.style.display = 'none';
    emptyView.style.display = 'block';
    return;
  }

  populatedView.style.display = 'block';
  emptyView.style.display = 'none';

  document.getElementById('btis-score-val').textContent = data.BTISScore.toFixed(1);
  document.getElementById('btis-cap-val').textContent = `/ ${data.BTISCapScore.toFixed(1)} Cap`;

  pillarsContainer.innerHTML = '';
  data.Pillars.forEach(pillar => {
    const percent = Math.round((pillar.PillarScore / pillar.PillarCap) * 100);
    const row = document.createElement('div');
    row.className = 'btis-pillar-row';
    row.innerHTML = `
      <div class="btis-pillar-header">
        <span>${pillar.PillarName}</span>
        <span class="btis-pillar-val">${pillar.PillarScore.toFixed(1)} <span style="font-weight:400; font-size:11px; color:var(--slate-400);">/ ${pillar.PillarCap.toFixed(1)}</span></span>
      </div>
      <div class="btis-meter">
        <div class="btis-meter-fill" style="width: ${percent}%;"></div>
      </div>
    `;
    pillarsContainer.appendChild(row);
  });
}

/** Alert banners for warnings and disconnections */
function renderAlertBanners() {
  const container = document.getElementById('alert-banner-container');
  container.innerHTML = '';

  if (state.githubSync.warnings && state.githubSync.warnings.length > 0) {
    state.githubSync.warnings.forEach((warn, index) => {
      const banner = document.createElement('div');
      banner.className = 'alert-banner warning';
      banner.innerHTML = `
        <svg class="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        <div class="alert-content">
          <div class="alert-title">GitHub Sync Warning: ${warn.Type}</div>
          <div>Repository <strong>${warn.RepoFullName}</strong> was disconnected from Project <code>${warn.ProjectId}</code> on GitHub.</div>
        </div>
        <button class="alert-dismiss" onclick="dismissWarning(${index})">&times;</button>
      `;
      container.appendChild(banner);
    });
  }
}

window.dismissWarning = function(index) {
  if (state.githubSync.warnings) {
    state.githubSync.warnings.splice(index, 1);
    if (state.githubSync.warnings.length === 0) state.githubSync.warnings = null;
    renderAlertBanners();
  }
};

/** Live API Inspector Renderer with Variable Highlighting */
function renderApiLogs() {
  const container = document.getElementById('inspector-log-container');
  const badge = document.getElementById('log-count-badge');
  if (!container) return;

  badge.textContent = state.httpLogs.length;

  if (state.httpLogs.length === 0) {
    container.innerHTML = `
      <div style="color: #64748b; font-size: 12px; text-align: center; padding: 28px;">
        No HTTP requests logged yet. Click any button or scenario to inspect real-time wire DTOs.
      </div>
    `;
    return;
  }

  container.innerHTML = state.httpLogs.map(log => {
    let methodClass = 'method-post';
    if (log.method === 'GET') methodClass = 'method-get';
    if (log.method === 'DELETE') methodClass = 'method-delete';

    return `
      <div class="log-entry status-${log.status}">
        <div class="log-meta-line">
          <span style="display:flex; align-items:center; gap:6px;">
            <span class="method-tag ${methodClass}">${log.method}</span>
            <span class="var-url-path">${formatPathHighlight(log.path)}</span>
          </span>
          <span style="color:${log.status === 200 ? '#34d399' : '#f87171'}; font-weight:700;">${log.status}</span>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:#94a3b8; margin-top:4px;">
          <span>${log.timestamp}</span>
          <button class="btn-copy-code" style="padding:2px 8px; font-size:10.5px; background:#1e293b; color:#cbd5e1; border:1px solid #334155; border-radius:4px; cursor:pointer;" onclick="copyCurl('${log.id}')">Copy cURL</button>
        </div>
        ${log.requestBody ? `<div style="font-size:11px; color:#94a3b8; margin-top:6px;">Request Body:</div><div class="log-json-block">${formatSyntaxHighlight(log.requestBody)}</div>` : ''}
        <div style="font-size:11px; color:#94a3b8; margin-top:6px;">Response Body (Wire DTO):</div>
        <div class="log-json-block">${formatSyntaxHighlight(log.responseData)}</div>
      </div>
    `;
  }).join('');
}

window.copyCurl = function(logId) {
  const log = state.httpLogs.find(l => l.id == logId);
  if (log) {
    navigator.clipboard.writeText(log.curl).then(() => {
      alert('cURL command copied to clipboard!');
    });
  }
};

// ============================================================================
// Interactive User Flows & Modals
// ============================================================================

/** Flow 1: Click "Connect GitHub repo" (§4.1 & §8.4) */
async function handleConnectClick() {
  const initData = await apiInitConnect(state.projectId);

  if (initData.AvailableRepos && initData.AvailableRepos.length > 0) {
    openRepoPickerModal(initData.AvailableRepos);
  } else {
    // When AvailableRepos is empty (§4.1): directly show redirect notice to InstallUrl
    openRedirectNoticeModal(initData.InstallUrl);
  }
}

function openRepoPickerModal(repos) {
  const modal = document.getElementById('modal-repo-picker');
  const radioGroup = document.getElementById('repo-picker-radio-group');
  const confirmBtn = document.getElementById('btn-confirm-link-repo');

  radioGroup.innerHTML = '';
  confirmBtn.disabled = true;

  repos.forEach((repo, idx) => {
    const item = document.createElement('label');
    item.className = 'repo-radio-item';
    item.innerHTML = `
      <input type="radio" name="selected_unclaimed_repo" value="${repo.Id}" ${idx === 0 ? 'checked' : ''}>
      <div class="repo-label-info">
        <svg class="repo-item-octo" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
        <span class="repo-name-text">${repo.RepoFullName}</span>
      </div>
    `;
    item.addEventListener('click', () => {
      document.querySelectorAll('.repo-radio-item').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      confirmBtn.disabled = false;
    });
    radioGroup.appendChild(item);
  });

  const firstItem = radioGroup.querySelector('.repo-radio-item');
  if (firstItem) {
    firstItem.classList.add('selected');
    confirmBtn.disabled = false;
  }

  modal.classList.add('open');
}

function openRedirectNoticeModal(installUrl) {
  const modal = document.getElementById('modal-redirect-notice');
  const display = document.getElementById('redirect-target-url-display');
  const targetUrl = installUrl || `https://github.com/apps/builvero-app/installations/new?state=${state.projectId}`;

  display.innerHTML = `https://github.com/apps/builvero-app/installations/new?state=<span class="var-guid">${state.projectId}</span>`;
  modal.classList.add('open');
}

/** Flow 2: Selected a repo and clicked Link Repo (§4.3) */
async function handleConfirmLinkRepo() {
  const selectedRadio = document.querySelector('input[name="selected_unclaimed_repo"]:checked');
  if (!selectedRadio) return;

  const repoId = selectedRadio.value;
  const chosen = state.unclaimedRepos.find(r => r.Id === repoId) || {
    Id: repoId,
    RepoFullName: 'builvero/game-engine-core'
  };

  document.getElementById('modal-repo-picker').classList.remove('open');

  // Call §4.3
  await apiLinkRepo(state.projectId, repoId);

  // Update project data
  state.project.githubConnectionStatus = 'Active';
  state.githubSync.status = 'connected';
  state.project.githubRepo = {
    id: chosen.Id,
    repoName: chosen.RepoFullName,
    repoId: 829148,
    author: chosen.RepoFullName.split('/')[0] || 'builvero',
    branch: 'main',
    openIssueCount: 4,
    lastSynced: 'Just now'
  };

  renderGithubCardUI();
  updateActiveScenarioChip('active-connected');
}

/** Flow 3: Simulated GitHub redirect return back to Builvero (§4.2) */
async function handleSimulatedReturnRedirect() {
  document.getElementById('modal-redirect-notice').classList.remove('open');

  // Transition to syncing skeleton
  state.project.githubConnectionStatus = 'Syncing';
  renderGithubCardUI();

  // Call §4.2 sync endpoint
  const syncResponse = await apiSync(state.projectId, 'connected');

  state.project.githubConnectionStatus = 'Active';
  state.githubSync.status = 'connected';
  state.project.githubRepo = {
    id: 'e1d2c3b4-5678-90ab-cdef-112233445566',
    repoName: 'builvero/game-engine-core',
    repoId: 829148,
    author: 'builvero',
    branch: 'main',
    openIssueCount: 4,
    lastSynced: 'Just now'
  };

  renderGithubCardUI();
  updateActiveScenarioChip('active-connected');
}

/** Flow 4: Click "Sync with GitHub" (§4.2) */
async function handleTriggerSync() {
  const syncBtn = document.getElementById('btn-trigger-sync');
  syncBtn.classList.add('spinning');

  await apiSync(state.projectId);

  syncBtn.classList.remove('spinning');
  const lastSyncedEl = document.getElementById('github-last-synced');
  if (lastSyncedEl) lastSyncedEl.textContent = 'Just now';
}

/** Flow 5: Disconnect repo confirmation (§4.4) */
function handleTriggerDisconnect() {
  if (state.project.githubRepo) {
    document.getElementById('disconnect-target-name').textContent = state.project.githubRepo.repoName;
  }
  document.getElementById('modal-disconnect-confirm').classList.add('open');
}

async function handleConfirmDisconnect() {
  document.getElementById('modal-disconnect-confirm').classList.remove('open');
  await apiDisconnectRepo(state.projectId);

  state.project.githubConnectionStatus = null;
  state.project.githubRepo = null;
  state.githubSync.status = 'no_repo_available';
  renderGithubCardUI();
  updateActiveScenarioChip('unconnected-initial');
}

/** Flow 6: Reconnect button when Broken */
async function handleTriggerReconnect() {
  await handleConnectClick();
}

// ============================================================================
// Scenario Command Bar Presets
// ============================================================================

function applyScenarioPreset(scenarioKey) {
  state.activeScenario = scenarioKey;
  state.githubSync.warnings = null;
  updateActiveScenarioChip(scenarioKey);

  switch (scenarioKey) {
    case 'active-connected':
      state.project.githubConnectionStatus = 'Active';
      state.githubSync.status = 'connected';
      state.project.githubRepo = {
        id: 'e1d2c3b4-5678-90ab-cdef-112233445566',
        repoName: 'builvero/game-engine-core',
        repoId: 829148,
        author: 'builvero',
        branch: 'main',
        openIssueCount: 4,
        lastSynced: 'Just now'
      };
      apiGetProject(state.projectId);
      break;

    case 'unconnected-initial':
      state.project.githubConnectionStatus = null;
      state.project.githubRepo = null;
      state.githubSync.status = 'no_repo_available';
      apiGetProject(state.projectId);
      break;

    case 'init-unclaimed-picker':
      state.simulateEmptyAvailableRepos = false;
      state.project.githubConnectionStatus = null;
      renderGithubCardUI();
      apiInitConnect(state.projectId).then(res => {
        openRepoPickerModal(res.AvailableRepos);
      });
      break;

    case 'init-empty-redirect':
      // The explicit case where AvailableRepos is empty (§4.1 in guide.md)
      state.simulateEmptyAvailableRepos = true;
      state.project.githubConnectionStatus = null;
      state.project.githubRepo = null;
      renderGithubCardUI();
      apiInitConnect(state.projectId).then(res => {
        // Since AvailableRepos is empty, frontend directly sends user to InstallUrl
        openRedirectNoticeModal(res.InstallUrl);
      });
      break;

    case 'sync-choose-repo':
      state.project.githubConnectionStatus = 'Syncing';
      renderGithubCardUI();
      apiSync(state.projectId, 'choose_repo').then(() => {
        state.project.githubConnectionStatus = null;
        renderGithubCardUI();
        openRepoPickerModal(state.unclaimedRepos);
      });
      break;

    case 'sync-warning-banner':
      state.project.githubConnectionStatus = 'Active';
      state.githubSync.warnings = [
        {
          Type: 'repo_disconnected',
          ProjectId: 'b8c9d0e1-2345-6789-0123-456789abcdef',
          RepoFullName: 'builvero/old-physics'
        }
      ];
      apiSync(state.projectId, 'connected');
      break;

    case 'broken-state':
      state.project.githubConnectionStatus = 'Broken';
      state.githubSync.status = 'repo_disconnected';
      apiGetProject(state.projectId);
      break;

    case 'err-401':
      mockApiCall({
        method: 'POST',
        path: `/api/projects/${state.projectId}/github/sync`,
        responseStatus: 401,
        responseData: { error: 'Unauthorized: Invalid or expired JWT token' }
      });
      alert('Simulated HTTP 401 Unauthorized: Session token expired. View payload in API Inspector.');
      break;

    case 'err-403':
      mockApiCall({
        method: 'POST',
        path: `/api/projects/${state.projectId}/github/sync`,
        responseStatus: 403,
        responseData: { error: 'Forbidden: Authenticated user does not own project ' + state.projectId }
      });
      alert('Simulated HTTP 403 Forbidden: Caller is not project owner. View payload in API Inspector.');
      break;

    case 'err-500':
      mockApiCall({
        method: 'POST',
        path: `/api/projects/${state.projectId}/github/sync`,
        responseStatus: 500,
        responseData: { error: 'An unexpected error occurred.' }
      });
      alert('Simulated HTTP 500 Server Bug: Generic global exception (§6). View payload in API Inspector.');
      break;

    case 'view-profile-tab':
      switchTab('profile');
      break;
  }

  if (scenarioKey !== 'view-profile-tab') {
    switchTab('dashboard');
  }
}

function updateActiveScenarioChip(scenarioKey) {
  document.querySelectorAll('.scenario-chip-btn').forEach(btn => {
    if (btn.getAttribute('data-scenario') === scenarioKey) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// ============================================================================
// Initialization & Event Wiring
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initial API fetch calls to populate all DOM elements
  apiGetProject(state.projectId);
  apiGetBtisScore();

  // 2. GitHub Card Action Buttons
  document.getElementById('btn-trigger-connect').addEventListener('click', handleConnectClick);
  document.getElementById('btn-trigger-sync').addEventListener('click', handleTriggerSync);
  document.getElementById('btn-trigger-disconnect').addEventListener('click', handleTriggerDisconnect);
  document.getElementById('btn-trigger-reconnect').addEventListener('click', handleTriggerReconnect);

  // 3. Modal 1 (Picker) Events
  document.getElementById('btn-close-picker').addEventListener('click', () => {
    document.getElementById('modal-repo-picker').classList.remove('open');
  });
  document.getElementById('btn-cancel-picker').addEventListener('click', () => {
    document.getElementById('modal-repo-picker').classList.remove('open');
  });
  document.getElementById('btn-confirm-link-repo').addEventListener('click', handleConfirmLinkRepo);
  document.getElementById('btn-open-install-url').addEventListener('click', () => {
    document.getElementById('modal-repo-picker').classList.remove('open');
    openRedirectNoticeModal();
  });

  // 4. Modal 2 (Redirect Notice) Events
  document.getElementById('btn-close-redirect-notice').addEventListener('click', () => {
    document.getElementById('modal-redirect-notice').classList.remove('open');
  });
  document.getElementById('btn-cancel-redirect-notice').addEventListener('click', () => {
    document.getElementById('modal-redirect-notice').classList.remove('open');
  });
  document.getElementById('btn-simulate-return-redirect').addEventListener('click', handleSimulatedReturnRedirect);

  // 5. Modal 3 (Disconnect Confirm) Events
  document.getElementById('btn-close-disconnect').addEventListener('click', () => {
    document.getElementById('modal-disconnect-confirm').classList.remove('open');
  });
  document.getElementById('btn-cancel-disconnect').addEventListener('click', () => {
    document.getElementById('modal-disconnect-confirm').classList.remove('open');
  });
  document.getElementById('btn-confirm-disconnect').addEventListener('click', handleConfirmDisconnect);

  // 6. BTIS Card Actions (inside Profile right card)
  document.getElementById('btn-toggle-btis-empty').addEventListener('click', () => {
    state.btis.emptyState = true;
    apiGetBtisScore();
  });
  document.getElementById('btn-restore-btis').addEventListener('click', () => {
    state.btis.emptyState = false;
    apiGetBtisScore();
  });

  // 7. Navigation Tabs: Dashboard vs Profile (image copy.png)
  document.getElementById('tab-btn-dashboard').addEventListener('click', () => switchTab('dashboard'));
  document.getElementById('tab-btn-profile').addEventListener('click', () => switchTab('profile'));
  document.getElementById('user-profile-header-pill').addEventListener('click', () => switchTab('profile'));
  document.getElementById('brand-logo-btn').addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('dashboard');
  });
  document.getElementById('nav-back-browse').addEventListener('click', (e) => {
    e.preventDefault();
    switchTab('dashboard');
  });

  // 8. Scenario Command Bar Buttons
  document.querySelectorAll('.scenario-chip-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const scenario = btn.getAttribute('data-scenario');
      if (scenario) applyScenarioPreset(scenario);
    });
  });

  // 9. API Inspector Drawer Toggle & Actions
  const inspectorDrawer = document.getElementById('api-inspector-drawer');
  const toggleInspectorBtn = document.getElementById('btn-toggle-inspector');
  const closeInspectorBtn = document.getElementById('btn-close-inspector');
  const clearLogsBtn = document.getElementById('btn-clear-logs');

  toggleInspectorBtn.addEventListener('click', () => {
    inspectorDrawer.classList.toggle('open');
  });

  closeInspectorBtn.addEventListener('click', () => {
    inspectorDrawer.classList.remove('open');
  });

  clearLogsBtn.addEventListener('click', () => {
    state.httpLogs = [];
    renderApiLogs();
  });
});

/** Tab switching handler: Dashboard vs Profile */
function switchTab(tabName) {
  const dashboardView = document.getElementById('view-dashboard');
  const profileView = document.getElementById('view-profile');
  const dashboardBtn = document.getElementById('tab-btn-dashboard');
  const profileBtn = document.getElementById('tab-btn-profile');

  if (tabName === 'profile') {
    dashboardView.classList.remove('active');
    dashboardView.style.display = 'none';
    profileView.classList.add('active');
    profileView.style.display = 'block';

    dashboardBtn.classList.remove('active');
    profileBtn.classList.add('active');

    // Fetch and populate BTIS score in the profile right card
    apiGetBtisScore();
  } else {
    profileView.classList.remove('active');
    profileView.style.display = 'none';
    dashboardView.classList.add('active');
    dashboardView.style.display = 'block';

    profileBtn.classList.remove('active');
    dashboardBtn.classList.add('active');
  }
}
