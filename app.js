const STORAGE_KEY = "vibepm.mission-control.v3";
const columns = ["Idea Intake", "Shape", "Build Watch", "Launch Ready"];
const statuses = ["Signal", "Draft", "Spec", "Active", "Review", "Guard", "Ship", "Blocked"];
const columnLabels = {
  "Idea Intake": "Ideas",
  Shape: "Shape",
  "Build Watch": "Building",
  "Launch Ready": "Ready",
};

const seedState = {
  version: 3,
  backend: {
    mode: "localStorage",
    syncStatus: "Local only",
    lastExportedAt: "",
  },
  projects: [
    {
      id: "project-vibepm",
      name: "VibePM Mission Control",
      path: "C:\\Users\\pedro\\OneDrive\\Documentos\\New project 4",
      repo: "https://github.com/PGraeff/vibepm-mission-control",
      status: "Active",
      linkedCards: ["release-checklist", "prd-copilot"],
      updatedAt: new Date().toISOString(),
    },
  ],
  activity: [
    {
      id: "activity-bootstrap",
      projectId: "project-vibepm",
      source: "Codex",
      status: "Complete",
      title: "Created and pushed VibePM prototype",
      detail: "Static app, routed pages, persisted workflows, and GitHub repo are connected.",
      linkedCardId: "release-checklist",
      createdAt: new Date().toISOString(),
    },
  ],
  milestones: [
    createMilestone({
      id: "milestone-first-dogfood",
      projectId: "project-vibepm",
      title: "First useful dogfood loop",
      outcome: "Select a project, see useful work, create a Codex task, and track it to done.",
      target: "This week",
      done: false,
    }),
    createMilestone({
      id: "milestone-github-loop",
      projectId: "project-vibepm",
      title: "GitHub loop feels simple",
      outcome: "A new vibe coder can understand issues, project work, and launch blockers without knowing GitHub jargon.",
      target: "Next",
      done: false,
    }),
  ],
  cards: [
    createSeedCard({
      id: "voice-opportunity",
      column: "Idea Intake",
      order: 10,
      title: "Voice-note to opportunity",
      outcome: "Cluster raw founder notes and Discord asks into testable product problems.",
      owner: "Codex",
      status: "Signal",
      impact: 8,
      confidence: 6,
      risk: 4,
      context: ["Signal", "Prompt", "PRD"],
      gate: "Needs shape",
      signals: ["Founder notes are scattered across voice memos.", "Discord asks repeat the same capture pain."],
    }),
    createSeedCard({
      id: "chrome-clipper",
      column: "Idea Intake",
      order: 20,
      title: "Chrome clipper for vibe bugs",
      outcome: "Capture screenshots and prompts from app previews into triage-ready cards.",
      owner: "Cursor",
      status: "Signal",
      impact: 7,
      confidence: 7,
      risk: 5,
      context: ["Replay", "Signal"],
      gate: "Discovery",
      signals: ["5 Discord asks around screenshot-to-card capture.", "Session replay shows users copying context manually."],
    }),
    createSeedCard({
      id: "competitor-import",
      column: "Idea Intake",
      order: 30,
      title: "Competitor import",
      outcome: "Summarize Linear, Hermes, and GitHub Projects gaps for positioning.",
      owner: "Claude",
      status: "Draft",
      impact: 5,
      confidence: 6,
      risk: 3,
      context: ["Docs", "Signal"],
      gate: "Optional",
    }),
    createSeedCard({
      id: "prd-copilot",
      column: "Shape",
      order: 10,
      title: "AI PRD co-pilot",
      outcome: "Generate thin PRDs with assumptions, metrics, and launch gates.",
      owner: "Codex",
      status: "Spec",
      impact: 9,
      confidence: 8,
      risk: 4,
      context: ["PRD", "Prompt", "Agent Log"],
      gate: "Clear",
      prd: "Problem: Builders need thin PRDs that keep agent work aligned without enterprise overhead.\n\nSuccess metric: 80% of generated PRDs include outcome, assumptions, acceptance checks, and launch gate.\n\nLaunch gate: PRD output must be editable and linked to a card.",
    }),
    createSeedCard({
      id: "prompt-ticket",
      column: "Shape",
      order: 20,
      title: "Prompt-to-ticket template",
      outcome: "Convert a user story into acceptance criteria and test prompts.",
      owner: "Founder",
      status: "Draft",
      impact: 6,
      confidence: 7,
      risk: 3,
      context: ["Prompt", "PRD"],
      gate: "Needs rubric",
    }),
    createSeedCard({
      id: "roadmap-scoring",
      column: "Shape",
      order: 30,
      title: "Roadmap scoring",
      outcome: "Rank work by user pull, time saved, launch dependency, and agent confidence.",
      owner: "Claude",
      status: "Spec",
      impact: 8,
      confidence: 5,
      risk: 6,
      context: ["Signal", "Docs"],
      gate: "Founder decision",
      decisions: ["Should scoring be manual, AI-generated, or hybrid?"],
    }),
    createSeedCard({
      id: "billing-onboarding",
      column: "Build Watch",
      order: 10,
      title: "Billing onboarding card",
      outcome: "Agent implements plan picker and upgrade guardrails before beta billing.",
      owner: "Codex",
      status: "Active",
      impact: 8,
      confidence: 6,
      risk: 7,
      context: ["GitHub PR", "Agent Log"],
      gate: "Tests pending",
      agentRuns: ["Codex is implementing plan picker and upgrade guardrails."],
      checks: [
        { id: "billing-auth", label: "Auth state verified", done: false },
        { id: "billing-docs", label: "Pricing copy reviewed", done: true },
      ],
    }),
    createSeedCard({
      id: "mobile-nav",
      column: "Build Watch",
      order: 20,
      title: "Mobile nav pass",
      outcome: "Responsive board behavior needs review before internal dogfood.",
      owner: "Reviewer",
      status: "Review",
      impact: 6,
      confidence: 5,
      risk: 6,
      context: ["GitHub PR", "Replay"],
      gate: "Review needed",
      checks: [{ id: "mobile-dogfood", label: "Dogfood mobile board flow", done: false }],
    }),
    createSeedCard({
      id: "release-checklist",
      column: "Build Watch",
      order: 30,
      title: "Release checklist",
      outcome: "Block launch if evals, docs, auth tests, or telemetry checks fail.",
      owner: "Codex",
      status: "Guard",
      impact: 9,
      confidence: 7,
      risk: 8,
      context: ["PRD", "GitHub PR"],
      gate: "Blocking",
      checks: [
        { id: "release-evals", label: "Evals pass", done: false },
        { id: "release-auth", label: "Auth tests pass", done: false },
        { id: "release-docs", label: "Docs reviewed", done: true },
      ],
    }),
    createSeedCard({
      id: "landing-narrative",
      column: "Launch Ready",
      order: 10,
      title: "Landing page narrative",
      outcome: "Position VibePM as product OS for solo builders using AI agents.",
      owner: "Founder",
      status: "Ship",
      impact: 7,
      confidence: 8,
      risk: 2,
      context: ["Docs", "Signal"],
      gate: "Ready",
    }),
    createSeedCard({
      id: "beta-cohort",
      column: "Launch Ready",
      order: 20,
      title: "Beta cohort import",
      outcome: "Tag high-intent users by workflow, role, stack, and requested outcome.",
      owner: "Claude",
      status: "Ship",
      impact: 8,
      confidence: 7,
      risk: 3,
      context: ["Signal", "Docs"],
      gate: "Ready",
    }),
    createSeedCard({
      id: "telemetry-brief",
      column: "Launch Ready",
      order: 30,
      title: "Telemetry brief",
      outcome: "Daily product pulse for shipped work, stuck cards, and launch risk.",
      owner: "Codex",
      status: "Review",
      impact: 7,
      confidence: 6,
      risk: 5,
      context: ["Agent Log", "PRD"],
      gate: "Verify",
      checks: [{ id: "telemetry-events", label: "Critical events mapped", done: false }],
    }),
  ],
};

let state = loadState();
let activeCardId = null;
let currentView = "Project Overview";
let selectedProjectId = localStorage.getItem("vibepm.selectedProjectId") || "all";

const viewRoot = document.querySelector("#viewRoot");
const pageEyebrow = document.querySelector("#pageEyebrow");
const pageTitle = document.querySelector("#pageTitle");
const pageSubtitle = document.querySelector("#pageSubtitle");
const topbarActions = document.querySelector("#topbarActions");
const searchInput = document.querySelector("#searchInput");
const statusFilter = document.querySelector("#statusFilter");
const sortMode = document.querySelector("#sortMode");
const exportButton = document.querySelector("#exportButton");
const importButton = document.querySelector("#importButton");
const importInput = document.querySelector("#importInput");
const syncProjectsButton = document.querySelector("#syncProjectsButton");
const projectSelector = document.querySelector("#projectSelector");
const dialog = document.querySelector("#cardDialog");
const cardForm = document.querySelector("#cardForm");
const detailDrawer = document.querySelector("#detailDrawer");
const detailForm = document.querySelector("#detailForm");

function createSeedCard(card) {
  const prdFields = {
    problem: card.outcome || "",
    targetUser: "Solo builders and small teams using AI coding agents.",
    successMetric: "",
    assumptions: [],
    acceptance: [],
    risks: [],
    launchGate: card.gate || "Needs review",
    ...(card.prdFields || {}),
  };

  return {
    projectId: card.projectId || "project-vibepm",
    prd: "",
    prdFields,
    prompt: "",
    agentSpec: {
      role: card.owner ? `${card.owner} implementation agent` : "Codex implementation agent",
      context: "",
      doneChecks: [],
      verification: [],
    },
    signals: [],
    agentRuns: [],
    decisions: [],
    checks: [
      { id: `${card.id}-scope`, label: "Scope is clear", done: false },
      { id: `${card.id}-qa`, label: "QA path exists", done: false },
      { id: `${card.id}-launch`, label: "Launch message ready", done: false },
    ],
    updatedAt: new Date().toISOString(),
    ...card,
  };
}

function createMilestone(milestone) {
  return {
    id: milestone.id || `milestone-${Date.now()}`,
    projectId: milestone.projectId || "project-vibepm",
    title: milestone.title || "New milestone",
    outcome: milestone.outcome || "Describe what should be true when this is done.",
    target: milestone.target || "Soon",
    done: Boolean(milestone.done),
    updatedAt: milestone.updatedAt || new Date().toISOString(),
  };
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.version === 3 && Array.isArray(stored.cards)) {
      return normalizeState(stored);
    }

    const legacy = JSON.parse(localStorage.getItem("vibepm.mission-control.v2"));
    if (legacy?.version === 2 && Array.isArray(legacy.cards)) {
      return normalizeState({
        ...structuredClone(seedState),
        cards: legacy.cards,
      });
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return normalizeState(structuredClone(seedState));
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (state.backend?.mode === "local-json") {
    saveStateToServer();
  }
}

async function hydrateFromServer() {
  try {
    const response = await fetch("/api/state");
    if (!response.ok) return;
    const serverState = await response.json();
    if (serverState?.version === 3) {
      if (!serverState.cards?.length && !serverState.projects?.length) {
        state.backend = { ...state.backend, mode: "local-json", syncStatus: "Connected to local server" };
        await saveStateToServer();
        renderApp();
        return;
      }
      state = normalizeState(serverState);
      state.backend = {
        ...state.backend,
        mode: "local-json",
        syncStatus: state.backend?.syncStatus || "Connected to local server",
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderApp();
    }
  } catch {
    state.backend = { ...state.backend, mode: "localStorage", syncStatus: "Browser only" };
  }
}

async function saveStateToServer() {
  try {
    await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
  } catch {
    state.backend = { ...state.backend, mode: "localStorage", syncStatus: "Browser only" };
  }
}

async function syncProjects() {
  syncProjectsButton.disabled = true;
  syncProjectsButton.textContent = "Syncing";
  try {
    const response = await fetch("/api/scan", { method: "POST" });
    if (!response.ok) throw new Error("Scan failed");
    state = normalizeState(await response.json());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    renderApp();
  } catch {
    state.backend = { ...state.backend, syncStatus: "Local server unavailable" };
    renderApp();
  } finally {
    syncProjectsButton.disabled = false;
    syncProjectsButton.textContent = "Sync Projects";
  }
}

function normalizeState(rawState) {
  const next = {
    ...structuredClone(seedState),
    ...rawState,
    version: 3,
  };
  next.cards = (rawState.cards || []).map(normalizeCard);
  next.projects = rawState.projects || seedState.projects;
  next.activity = rawState.activity || seedState.activity;
  next.codexProgress = rawState.codexProgress || { version: 1, entries: [], issues: [] };
  next.milestones = (rawState.milestones || seedState.milestones).map((milestone) => createMilestone(milestone));
  next.backend = rawState.backend || seedState.backend;
  return next;
}

function normalizeCard(card) {
  const normalized = createSeedCard(card);
  normalized.projectId = card.projectId || normalized.projectId || "project-vibepm";
  normalized.generated = Boolean(card.generated);
  normalized.prd = card.prd || normalized.prd;
  normalized.prdFields = {
    ...normalized.prdFields,
    ...(card.prdFields || {}),
    launchGate: card.prdFields?.launchGate || card.gate || normalized.prdFields.launchGate,
  };
  normalized.agentSpec = {
    ...normalized.agentSpec,
    ...(card.agentSpec || {}),
  };
  normalized.context = card.context || [];
  normalized.signals = card.signals || [];
  normalized.agentRuns = card.agentRuns || [];
  normalized.decisions = card.decisions || [];
  normalized.checks = card.checks || normalized.checks;
  return normalized;
}

function renderApp() {
  ensureSelectedProject();
  renderProjectSelector();
  renderCurrentView();
  renderRail();
  if (activeCardId) {
    populateDetail(activeCardId);
  }
}

function ensureSelectedProject() {
  if (selectedProjectId === "all") return;
  if (!state.projects.some((project) => project.id === selectedProjectId)) {
    selectedProjectId = state.projects[0]?.id || "all";
    localStorage.setItem("vibepm.selectedProjectId", selectedProjectId);
  }
}

function renderProjectSelector() {
  const options = [
    `<option value="all"${selectedProjectId === "all" ? " selected" : ""}>All projects</option>`,
    ...state.projects.map(
      (project) =>
        `<option value="${escapeHtml(project.id)}"${project.id === selectedProjectId ? " selected" : ""}>${escapeHtml(project.name)}</option>`,
    ),
  ];
  projectSelector.innerHTML = options.join("");
}

function renderCurrentView() {
  const meta = viewMeta(currentView);
  document.querySelector(".app-shell").dataset.view = slug(currentView);
  pageEyebrow.textContent = meta.eyebrow;
  pageTitle.textContent = meta.title;
  pageSubtitle.textContent = meta.subtitle;
  topbarActions.classList.toggle("compact-actions", currentView !== "Mission Control");

  if (currentView === "Project Overview") renderProjectOverview();
  if (currentView === "Mission Control") renderBoard();
  if (currentView === "Roadmap") renderRoadmap();
  if (currentView === "Milestones") renderMilestones();
  if (currentView === "Idea Inbox") renderIdeaInbox();
  if (currentView === "Agent Runs") renderAgentRuns();
  if (currentView === "User Signals") renderUserSignals();
  if (currentView === "Docs + PRDs") renderDocs();
  if (currentView === "Launches") renderLaunches();
}

function renderProjectOverview() {
  const cards = scopedProjectCards();
  const project = selectedProjectId === "all" ? null : state.projects.find((item) => item.id === selectedProjectId);
  const milestones = scopedMilestones();
  const openWork = cards.filter((card) => !["Ship"].includes(card.status)).length;
  const ready = cards.filter((card) => card.column === "Launch Ready" || card.status === "Ship").length;
  const blocked = cards.filter(isBlocked).length;
  const active = cards.filter((card) => ["Active", "Review", "Guard"].includes(card.status)).slice(0, 5);
  const nextMilestone = milestones.find((milestone) => !milestone.done);
  const doneMilestones = milestones.filter((milestone) => milestone.done).length;
  const progress = milestones.length ? Math.round((doneMilestones / milestones.length) * 100) : 0;
  const pulseItems = [
    ["Ideas", cards.filter((card) => card.column === "Idea Intake").length, "idea"],
    ["Build", cards.filter((card) => ["Spec", "Active", "Review"].includes(card.status)).length, "build"],
    ["Launch", ready, "launch"],
  ];

  viewRoot.className = "view-root page-scroll";
  viewRoot.innerHTML = `
    <section class="hero-panel compact-hero">
      <div>
        <p class="eyebrow">Project pulse</p>
        <h2>${escapeHtml(project?.name || "All Projects")}</h2>
        <div class="pulse-track">
          ${pulseItems
            .map(
              ([label, value, tone]) => `
                <span class="pulse-step pulse-${tone}">
                  <i>${escapeHtml(value)}</i>
                  <b>${escapeHtml(label)}</b>
                </span>
              `,
            )
            .join("")}
        </div>
      </div>
      ${help("This page avoids development jargon. It shows what matters next for the selected project.")}
    </section>
    <div class="metric-strip">
      ${summaryMetric("To do", openWork, "Still needs attention.")}
      ${summaryMetric("Doing", active.length, "Being worked on.")}
      ${summaryMetric("Stuck", blocked, "May block progress.")}
      ${summaryMetric("Ready", ready, "Close to shareable.")}
    </div>
    <div class="page-grid">
      <section class="page-panel wide-panel">
        <div class="section-title">
          <h2>Next</h2>
          ${help("These are the clearest next actions for the selected project. Open one to see details.")}
        </div>
        <div class="simple-list">
          ${active.map(simpleCardRow).join("") || emptyState("Nothing urgent.")}
        </div>
      </section>
      <section class="page-panel">
        <div class="section-title">
          <h2>Focus</h2>
          ${help("This comes from VIBEPM.md when the project has one.")}
        </div>
        <p class="plain-text short-text">${escapeHtml(project?.currentFocus || project?.productGoal || "Add VIBEPM.md to guide Codex.")}</p>
      </section>
      <section class="page-panel wide-panel">
        <div class="section-title">
          <h2>Milestone</h2>
          ${help("A milestone is a simple checkpoint. It says what should be true soon.")}
        </div>
        <div class="progress-head"><strong>${progress}%</strong><span>${doneMilestones}/${milestones.length || 0}</span></div>
        <div class="big-progress"><span style="width: ${progress}%"></span></div>
        ${
          nextMilestone
            ? `<button class="milestone-card compact-milestone" type="button" data-view-milestones="true"><strong>${escapeHtml(nextMilestone.title)}</strong><small>${escapeHtml(nextMilestone.target)}</small></button>`
            : emptyState("No open milestone.")
        }
      </section>
    </div>
  `;
  wireOpenRows();
  document.querySelectorAll("[data-view-milestones]").forEach((button) => {
    button.addEventListener("click", () => switchView("Milestones"));
  });
}

function renderBoard() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;

  viewRoot.className = "view-root board";
  viewRoot.innerHTML = columns
    .map((column) => {
      const filteredCards = getCardsForColumn(column).filter((card) => {
        const matchesStatus = status === "all" || card.status === status;
        const searchable = [
          card.title,
          card.outcome,
          card.owner,
          card.status,
          card.gate,
          card.prd,
          card.prompt,
          ...card.context,
          ...card.signals,
          ...card.agentRuns,
          ...card.decisions,
        ]
          .join(" ")
          .toLowerCase();
        return matchesStatus && searchable.includes(query);
      });

      return `
        <section class="column" aria-labelledby="${slug(column)}-title">
          <div class="column-header">
            <div>
              <h2 id="${slug(column)}-title">${columnLabels[column] || column}</h2>
              <span>${columnSubtitle(column)}</span>
            </div>
            <span class="column-count">${filteredCards.length}</span>
          </div>
          <div class="card-list" data-column="${column}">
            ${filteredCards.map(renderCard).join("")}
          </div>
        </section>
      `;
    })
    .join("");

  wireCards();
  wireDragAndDrop();
}

function renderRoadmap() {
  const cards = filteredCards().sort((a, b) => priorityScore(b) - priorityScore(a));
  const scopedCards = scopedProjectCards();
  viewRoot.className = "view-root page-scroll";
  viewRoot.innerHTML = `
    <div class="metric-strip">
      ${summaryMetric("Total cards", scopedCards.length)}
      ${summaryMetric("High impact", scopedCards.filter((card) => priorityScore(card) >= 10).length)}
      ${summaryMetric("Blocked", scopedCards.filter(isBlocked).length)}
      ${summaryMetric("Launch ready", scopedCards.filter((card) => card.column === "Launch Ready").length)}
    </div>
    <div class="table-panel">
      <div class="table-row table-head">
        <span>Opportunity</span>
        <span>Stage</span>
        <span>Owner</span>
        <span>Impact</span>
        <span>Risk</span>
      </div>
      ${cards.map((card) => roadmapRow(card)).join("")}
    </div>
  `;
  wireOpenRows();
}

function renderMilestones() {
  const milestones = scopedMilestones();
  viewRoot.className = "view-root page-scroll";
  viewRoot.innerHTML = `
    <div class="page-grid">
      <section class="page-panel wide-panel">
        <div class="section-title">
          <h2>Milestones</h2>
          ${help("Milestones are plain-language checkpoints, not technical tickets. Edit them anytime.")}
        </div>
        <div class="milestone-list">
          ${milestones.map(milestoneRow).join("") || emptyState("No milestones yet. Add one on the right.")}
        </div>
      </section>
      <section class="page-panel">
        <div class="section-title">
          <h2>Add Milestone</h2>
          ${help("Write the result you want, not the technical implementation.")}
        </div>
        <form class="quick-form" id="milestoneForm">
          <label>Name<input id="milestoneTitle" required placeholder="First users can test it" /></label>
          <label>What should be true?<textarea id="milestoneOutcome" rows="4" required></textarea></label>
          <label>Target<input id="milestoneTarget" placeholder="This week, next launch, later" /></label>
          <button class="primary-button" type="submit">Add Milestone</button>
        </form>
      </section>
    </div>
  `;
  document.querySelector("#milestoneForm").addEventListener("submit", addMilestone);
  document.querySelectorAll("[data-toggle-milestone]").forEach((button) => {
    button.addEventListener("click", () => toggleMilestone(button.dataset.toggleMilestone));
  });
  document.querySelectorAll("[data-delete-milestone]").forEach((button) => {
    button.addEventListener("click", () => deleteMilestone(button.dataset.deleteMilestone));
  });
  document.querySelectorAll("[data-edit-milestone]").forEach((input) => {
    input.addEventListener("change", () => updateMilestone(input.dataset.editMilestone, input.dataset.field, input.value));
  });
}

function renderIdeaInbox() {
  const cards = filteredCards()
    .filter((card) => card.column === "Idea Intake" || card.status === "Signal" || card.status === "Draft")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  viewRoot.className = "view-root page-scroll";
  viewRoot.innerHTML = `
    <div class="page-grid">
      <section class="page-panel wide-panel">
        <div class="section-title">
          <h2>Raw Capture Queue</h2>
          <span>${cards.length} inputs</span>
        </div>
        <div class="inbox-list">
          ${cards.map((card) => inboxItem(card)).join("")}
        </div>
      </section>
      <section class="page-panel">
        <div class="section-title">
          <h2>Quick Capture</h2>
          <span>Local</span>
        </div>
        <form class="quick-form" id="quickIdeaForm">
          <label>Title<input id="quickIdeaTitle" required placeholder="Raw user ask or founder thought" /></label>
          <label>Signal<textarea id="quickIdeaSignal" rows="4" required></textarea></label>
          <button class="primary-button" type="submit">Capture Idea</button>
        </form>
      </section>
      <section class="page-panel wide-panel">
        <div class="section-title">
          <h2>Triage Rules</h2>
          <span>Local</span>
        </div>
        <div class="rule-list">
          <span>High signal plus high confidence moves to Shape.</span>
          <span>Low confidence creates a founder decision.</span>
          <span>Blocked launch gate creates a Build Watch guard.</span>
        </div>
      </section>
    </div>
  `;
  wireOpenRows();
  document.querySelector("#quickIdeaForm").addEventListener("submit", captureQuickIdea);
}

function renderAgentRuns() {
  const runs = filteredCards().flatMap((card) =>
    card.agentRuns.length
      ? card.agentRuns.map((run) => ({ card, run }))
      : card.context.includes("Agent Log")
        ? [{ card, run: "Agent log linked but no run summary recorded." }]
        : [],
  );
  viewRoot.className = "view-root page-scroll";
  viewRoot.innerHTML = `
    <div class="page-grid">
      <section class="page-panel wide-panel">
        <div class="section-title">
          <h2>Agent Run Queue</h2>
          <span>${runs.length} runs</span>
        </div>
        <div class="run-list">
          ${runs.map(({ card, run }) => runItem(card, run)).join("") || emptyState("No agent runs yet. Open a card and use Agent Mission.")}
        </div>
      </section>
      <section class="page-panel">
        <div class="section-title">
          <h2>Codex Project Monitor</h2>
          <span>${state.backend.syncStatus}</span>
        </div>
        <div class="project-list">
          ${scopedProjects().map(projectItem).join("")}
        </div>
        <form class="quick-form" id="activityForm">
          <label>Activity title<input id="activityTitle" placeholder="Codex is editing launch page" required /></label>
          <label>Status
            <select id="activityStatus">
              <option>Queued</option>
              <option>Active</option>
              <option>Blocked</option>
              <option>Review</option>
              <option>Complete</option>
            </select>
          </label>
          <label>Detail<textarea id="activityDetail" rows="3"></textarea></label>
          <button class="primary-button" type="submit">Add Activity</button>
        </form>
      </section>
      <section class="page-panel wide-panel">
        <div class="section-title">
          <h2>Codex Live Log</h2>
          <span>${state.codexProgress?.entries?.length || 0} updates</span>
        </div>
        <div class="run-list">
          ${(state.codexProgress?.entries || []).map(codexProgressItem).join("") || emptyState("No Codex ledger updates yet.")}
        </div>
      </section>
      <section class="page-panel wide-panel">
        <div class="section-title">
          <h2>Local Activity Timeline</h2>
          <span>${scopedActivity().length} events</span>
        </div>
        <div class="run-list">
          ${scopedActivity().map(activityItem).join("")}
        </div>
      </section>
    </div>
  `;
  wireOpenRows();
  document.querySelector("#activityForm").addEventListener("submit", addManualActivity);
}

function codexProgressItem(entry) {
  return `
    <div class="run-item">
      <div class="agent-head">
        <strong>${escapeHtml(entry.status || "Observed")}</strong>
        <span class="agent-state">${entry.updatedAt ? new Date(entry.updatedAt).toLocaleDateString() : "Today"}</span>
      </div>
      <p>${escapeHtml(entry.title)}</p>
      <small>${escapeHtml(entry.detail || "No detail recorded.")}</small>
    </div>
  `;
}

function renderUserSignals() {
  const signals = filteredCards().flatMap((card) => card.signals.map((signal) => ({ card, signal })));
  viewRoot.className = "view-root page-scroll";
  viewRoot.innerHTML = `
    <div class="page-grid">
      <section class="page-panel wide-panel">
        <div class="section-title">
          <h2>Signal Stack</h2>
          <span>${signals.length} signals</span>
        </div>
        <div class="signal-table">
          ${signals.map(({ card, signal }) => signalRow(card, signal)).join("") || emptyState("No user signals yet. Add signals from card details.")}
        </div>
      </section>
      <section class="page-panel">
        <div class="section-title">
          <h2>Sources</h2>
          <span>Mock</span>
        </div>
        <div class="source-list">
          ${["Discord", "Support", "Session replay", "GitHub", "Founder notes"].map((source) => `<span>${source}</span>`).join("")}
        </div>
      </section>
    </div>
  `;
  wireOpenRows();
}

function renderDocs() {
  const docs = filteredCards().filter((card) => card.prd || card.prompt || card.context.includes("PRD"));
  viewRoot.className = "view-root page-scroll docs-grid";
  viewRoot.innerHTML =
    docs.map((card) => docCard(card)).join("") ||
    emptyState("No docs yet. Open a card and use Draft PRD to create one.");
  wireOpenRows();
}

function renderLaunches() {
  const launchCards = filteredCards()
    .filter((card) => card.column === "Launch Ready" || card.status === "Guard" || card.gate)
    .sort((a, b) => b.risk - a.risk);
  const blockers = launchCards.filter(isBlocked);
  const incompleteChecks = launchCards.flatMap((card) =>
    card.checks.filter((check) => !check.done).map((check) => ({ card, check })),
  );
  viewRoot.className = "view-root page-scroll";
  viewRoot.innerHTML = `
    <div class="metric-strip">
      ${summaryMetric("Ready", launchCards.filter((card) => card.status === "Ship").length)}
      ${summaryMetric("Guarded", launchCards.filter((card) => card.status === "Guard").length)}
      ${summaryMetric("Blocked", launchCards.filter(isBlocked).length)}
      ${summaryMetric("Checks", launchCards.reduce((sum, card) => sum + card.checks.length, 0))}
    </div>
    <div class="page-grid">
      <section class="page-panel wide-panel">
        <div class="section-title">
          <h2>Launch Checklist Dashboard</h2>
          <span>${incompleteChecks.length} open checks</span>
        </div>
        <div class="launch-list">
          ${launchCards.map((card) => launchItem(card)).join("")}
        </div>
      </section>
      <section class="page-panel">
        <div class="section-title">
          <h2>Blocking Gates</h2>
          <span>${blockers.length}</span>
        </div>
        <div class="stack-list">
          ${blockers.map((card) => `<button class="rule-button" type="button" data-open-card="${escapeHtml(card.id)}">${escapeHtml(card.title)} - ${escapeHtml(card.gate)}</button>`).join("") || emptyState("No blocking gates.")}
        </div>
      </section>
      <section class="page-panel wide-panel">
        <div class="section-title">
          <h2>Incomplete Launch Checks</h2>
          <span>${incompleteChecks.length}</span>
        </div>
        <div class="signal-table">
          ${incompleteChecks.map(({ card, check }) => `<button class="signal-row" type="button" data-open-card="${escapeHtml(card.id)}"><span>${escapeHtml(check.label)}</span><small>${escapeHtml(card.title)}</small><strong>Risk ${card.risk}</strong></button>`).join("") || emptyState("All launch checks are complete.")}
        </div>
      </section>
    </div>
  `;
  wireOpenRows();
}

function getCardsForColumn(column) {
  const cards = scopedProjectCards().filter((card) => card.column === column);
  if (sortMode.value === "priority") {
    return cards.sort((a, b) => priorityScore(b) - priorityScore(a));
  }
  if (sortMode.value === "risk") {
    return cards.sort((a, b) => b.risk - a.risk || priorityScore(b) - priorityScore(a));
  }
  return cards.sort((a, b) => a.order - b.order);
}

function renderCard(card) {
  const blocked = isBlocked(card) ? " blocked-card" : "";
  const progress = checkProgress(card);
  return `
    <article class="work-card${blocked}" draggable="true" data-card-id="${escapeHtml(card.id)}" tabindex="0">
      <div class="card-top">
        <h3>${escapeHtml(card.title)}</h3>
        <span class="status-pill status-${escapeHtml(card.status)}">${escapeHtml(card.status)}</span>
      </div>
      <div class="card-visual-meta" aria-label="Card scores">
        <span title="How valuable this looks">${importanceLabel(card)}</span>
        <span class="risk-dot risk-${riskLevel(card.risk)}" title="How likely this is to block progress">${riskLabel(card.risk)}</span>
        <span title="Checklist completion">Ready ${progress}%</span>
      </div>
      <div class="progress-bar" aria-label="Launch check progress">
        <span style="width: ${progress}%"></span>
      </div>
    </article>
  `;
}

function simpleCardRow(card) {
  return `
    <button class="simple-row" type="button" data-open-card="${escapeHtml(card.id)}">
      <i class="row-dot status-${escapeHtml(card.status)}"></i>
      <span>
        <strong>${escapeHtml(card.title)}</strong>
      </span>
      <em>${simpleStatus(card.status)}</em>
    </button>
  `;
}

function milestoneRow(milestone) {
  return `
    <article class="milestone-card ${milestone.done ? "done" : ""}">
      <div class="milestone-head">
        <label>
          <input type="checkbox" data-toggle-milestone="${escapeHtml(milestone.id)}" ${milestone.done ? "checked" : ""} />
          Done
        </label>
        <button type="button" data-delete-milestone="${escapeHtml(milestone.id)}">Delete</button>
      </div>
      <label>Name<input data-edit-milestone="${escapeHtml(milestone.id)}" data-field="title" value="${escapeHtml(milestone.title)}" /></label>
      <label>What should be true?<textarea data-edit-milestone="${escapeHtml(milestone.id)}" data-field="outcome" rows="3">${escapeHtml(milestone.outcome)}</textarea></label>
      <label>Target<input data-edit-milestone="${escapeHtml(milestone.id)}" data-field="target" value="${escapeHtml(milestone.target)}" /></label>
    </article>
  `;
}

function help(text) {
  return `<span class="help-bubble" tabindex="0" data-help="${escapeHtml(text)}">?</span>`;
}

function simpleStatus(status) {
  return {
    Signal: "Idea",
    Draft: "Draft",
    Spec: "Ready to build",
    Active: "Working",
    Review: "Check it",
    Guard: "Blocked",
    Ship: "Ready",
    Blocked: "Blocked",
  }[status] || status;
}

function viewMeta(view) {
  const metas = {
    "Project Overview": {
      eyebrow: "Start here",
      title: "Overview",
      subtitle: "A simple view of what matters for this project",
    },
    "Mission Control": {
      eyebrow: "Work",
      title: "Work Board",
      subtitle: "Move ideas from rough thought to ready-to-share",
    },
    Roadmap: {
      eyebrow: "Planning",
      title: "Plan",
      subtitle: "A simple list of what looks most important",
    },
    Milestones: {
      eyebrow: "Checkpoints",
      title: "Milestones",
      subtitle: "Editable goals for what should be true next",
    },
    "Idea Inbox": {
      eyebrow: "Capture",
      title: "Ideas",
      subtitle: "Save rough thoughts before they disappear",
    },
    "Agent Runs": {
      eyebrow: "Codex",
      title: "Codex Work",
      subtitle: "See what the AI helper is doing for this project",
    },
    "User Signals": {
      eyebrow: "Learning",
      title: "Feedback",
      subtitle: "User clues, bug notes, and requests",
    },
    "Docs + PRDs": {
      eyebrow: "Notes",
      title: "Notes",
      subtitle: "Prompts, product notes, and useful context",
    },
    Launches: {
      eyebrow: "Share",
      title: "Launch",
      subtitle: "What needs to be true before you show people",
    },
  };
  return metas[view] || metas["Mission Control"];
}

function filteredCards() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  return scopedProjectCards().filter((card) => {
    const matchesStatus = status === "all" || card.status === status;
    const searchable = [
      card.title,
      card.outcome,
      card.owner,
      card.status,
      card.gate,
      card.prd,
      card.prompt,
      ...card.context,
      ...card.signals,
      ...card.agentRuns,
      ...card.decisions,
    ]
      .join(" ")
      .toLowerCase();
    return matchesStatus && searchable.includes(query);
  });
}

function scopedProjectCards() {
  if (selectedProjectId === "all") return state.cards;
  return state.cards.filter((card) => (card.projectId || "project-vibepm") === selectedProjectId);
}

function scopedProjects() {
  if (selectedProjectId === "all") return state.projects;
  return state.projects.filter((project) => project.id === selectedProjectId);
}

function scopedActivity() {
  if (selectedProjectId === "all") return state.activity;
  return state.activity.filter((item) => item.projectId === selectedProjectId);
}

function scopedMilestones() {
  if (selectedProjectId === "all") return state.milestones || [];
  return (state.milestones || []).filter((milestone) => milestone.projectId === selectedProjectId);
}

function summaryMetric(label, value, hint = "") {
  return `
    <div class="summary-metric">
      <span>${escapeHtml(label)}${hint ? help(hint) : ""}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function roadmapRow(card) {
  return `
    <button class="table-row data-row" type="button" data-open-card="${escapeHtml(card.id)}">
      <span>
        <strong>${escapeHtml(card.title)}</strong>
        <small>${escapeHtml(card.outcome)}</small>
      </span>
      <span>${escapeHtml(card.column)} / ${escapeHtml(card.status)}</span>
      <span>${escapeHtml(card.owner)}</span>
      <span>${escapeHtml(importanceLabel(card))}</span>
      <span>${escapeHtml(riskLabel(card.risk))}</span>
    </button>
  `;
}

function inboxItem(card) {
  const firstSignal = card.signals[0] || card.outcome;
  return `
    <button class="inbox-item" type="button" data-open-card="${escapeHtml(card.id)}">
      <span class="status-pill status-${escapeHtml(card.status)}">${escapeHtml(card.status)}</span>
      <div>
        <strong>${escapeHtml(card.title)}</strong>
        <p>${escapeHtml(firstSignal)}</p>
      </div>
      <small>${escapeHtml(card.owner)}</small>
    </button>
  `;
}

function runItem(card, run) {
  return `
    <button class="run-item" type="button" data-open-card="${escapeHtml(card.id)}">
      <div class="agent-head">
        <strong>${escapeHtml(card.owner)}</strong>
        <span class="agent-state">${escapeHtml(card.status)}</span>
      </div>
      <p>${escapeHtml(run)}</p>
      <small>${escapeHtml(card.title)}</small>
    </button>
  `;
}

function projectItem(project) {
  const githubSummary = project.github?.repo
    ? `${project.github.repo}: ${project.github.issues?.length || 0} issues, ${project.github.pullRequests?.length || 0} PRs, ${project.github.checks?.length || 0} checks`
    : "No GitHub repo metadata";
  return `
    <div class="project-item">
      <strong>${escapeHtml(project.name)}</strong>
      <span>${escapeHtml(project.status)} - ${escapeHtml(project.path)}</span>
      <span>${project.hasPlaybook ? "VIBEPM.md connected" : "No VIBEPM.md playbook yet"}</span>
      ${project.currentFocus ? `<small>Focus: ${escapeHtml(project.currentFocus)}</small>` : ""}
      <small>${escapeHtml(githubSummary)}</small>
      <small>${escapeHtml(project.repo || "No repo connected")}</small>
    </div>
  `;
}

function activityItem(activity) {
  const linked = activity.linkedCardId ? findCard(activity.linkedCardId) : null;
  return `
    <button class="run-item" type="button" ${linked ? `data-open-card="${escapeHtml(linked.id)}"` : ""}>
      <div class="agent-head">
        <strong>${escapeHtml(activity.source)} - ${escapeHtml(activity.status)}</strong>
        <span class="agent-state">${new Date(activity.createdAt).toLocaleDateString()}</span>
      </div>
      <p>${escapeHtml(activity.title)}</p>
      <small>${escapeHtml(activity.detail || "No detail recorded.")}</small>
    </button>
  `;
}

function statusSummary(status) {
  const count = scopedProjectCards().filter((card) => card.status === status).length;
  return `
    <div class="stack-row">
      <span>${escapeHtml(status)}</span>
      <strong>${count}</strong>
    </div>
  `;
}

function signalRow(card, signal) {
  return `
    <button class="signal-row" type="button" data-open-card="${escapeHtml(card.id)}">
      <span>${escapeHtml(signal)}</span>
      <small>${escapeHtml(card.title)}</small>
      <strong>${escapeHtml(importanceLabel(card))}</strong>
    </button>
  `;
}

function docCard(card) {
  return `
    <button class="doc-card" type="button" data-open-card="${escapeHtml(card.id)}">
      <div class="card-top">
        <h3>${escapeHtml(card.title)}</h3>
        <span class="status-pill status-${escapeHtml(card.status)}">${escapeHtml(card.status)}</span>
      </div>
      <p>${escapeHtml(card.prd || card.prompt || card.outcome).slice(0, 260)}</p>
      <div class="context-row">
        ${card.context.map((item) => `<span class="context-chip">${escapeHtml(item)}</span>`).join("")}
      </div>
    </button>
  `;
}

function launchItem(card) {
  const done = card.checks.filter((check) => check.done).length;
  return `
    <button class="launch-item" type="button" data-open-card="${escapeHtml(card.id)}">
      <div>
        <strong>${escapeHtml(card.title)}</strong>
        <p>${escapeHtml(card.gate)}</p>
      </div>
      <span class="status-pill status-${escapeHtml(card.status)}">${escapeHtml(card.status)}</span>
      <span>${done}/${card.checks.length} checks</span>
      <span>Risk ${card.risk}</span>
    </button>
  `;
}

function emptyState(message) {
  return `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function wireOpenRows() {
  document.querySelectorAll("[data-open-card]").forEach((button) => {
    button.addEventListener("click", () => openDetail(button.dataset.openCard));
  });
}

function renderRail() {
  const cards = scopedProjectCards();
  const blockedCards = cards.filter(isBlocked);
  const activeCards = cards.filter((card) => ["Active", "Review", "Guard"].includes(card.status));
  const shipCards = cards.filter((card) => card.column === "Launch Ready");
  const signals = cards
    .flatMap((card) => card.signals.map((signal) => ({ card, signal })))
    .slice(0, 3);
  const agentRuns = cards
    .flatMap((card) => card.agentRuns.map((run) => ({ card, run })))
    .slice(0, 3);
  const activityRuns = scopedActivity().slice(0, 2);
  const decisions = cards
    .flatMap((card) => card.decisions.map((decision) => ({ card, decision })))
    .slice(0, 3);
  const highRisk = cards.filter((card) => card.risk >= 7).length;

  document.querySelector("#briefRisk").textContent = highRisk ? `${highRisk} risk` : "Clear";
  document.querySelector("#briefList").innerHTML = [
    ["Doing", activeCards.length, "cyan"],
    ["Stuck", blockedCards.length, blockedCards.length ? "red" : "green"],
    ["Ready", shipCards.length, "green"],
    ["Decide", decisions.length, decisions.length ? "amber" : "green"],
  ]
    .map(
      ([label, value, tone]) => `
        <li class="mini-stat stat-${tone}">
          <strong>${escapeHtml(value)}</strong>
          <span>${escapeHtml(label)}</span>
        </li>
      `,
    )
    .join("");

  document.querySelector("#signalList").innerHTML = signals.length
    ? signals.map(({ card }) => railItem(card.title, simpleStatus(card.status))).join("")
    : railItem("No clues", "Add signals");

  document.querySelector("#agentList").innerHTML = activityRuns.length
    ? activityRuns
        .map((activity) => agentItem(activity.source, activity.title, activity.status, findCard(activity.linkedCardId)?.title || "Project"))
        .join("")
    : agentRuns.length
      ? agentRuns.map(({ card, run }) => agentItem(card.owner, run, card.status, card.title)).join("")
    : agentItem("Codex", "No active run", "Idle", "None");

  document.querySelector("#decisionCount").textContent = `${decisions.length} open`;
  document.querySelector("#decisionList").innerHTML = decisions.length
    ? decisions
        .map(
          ({ card, decision }) =>
            `<button type="button" data-open-card="${escapeHtml(card.id)}">${escapeHtml(decision)}</button>`,
        )
        .join("")
    : `<button type="button">Nothing blocking.</button>`;

  document.querySelectorAll("[data-open-card]").forEach((button) => {
    button.addEventListener("click", () => openDetail(button.dataset.openCard));
  });
}

function railItem(title, detail) {
  return `
    <div class="signal-item">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(detail)}</span>
    </div>
  `;
}

function agentItem(name, task, stateName, linkedCard) {
  return `
    <div class="agent-item">
      <div class="agent-head">
        <strong>${escapeHtml(name)}</strong>
        <span class="agent-state">${escapeHtml(stateName)}</span>
      </div>
      <span>${escapeHtml(task)}</span>
      <small>${escapeHtml(linkedCard)}</small>
    </div>
  `;
}

function wireCards() {
  document.querySelectorAll(".work-card").forEach((cardElement) => {
    cardElement.addEventListener("click", () => openDetail(cardElement.dataset.cardId));
    cardElement.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        openDetail(cardElement.dataset.cardId);
      }
    });
  });
}

function wireDragAndDrop() {
  document.querySelectorAll(".work-card").forEach((card) => {
    card.addEventListener("dragstart", (event) => {
      event.dataTransfer.setData("text/plain", card.dataset.cardId);
    });
  });

  document.querySelectorAll(".card-list").forEach((list) => {
    list.addEventListener("dragover", (event) => {
      event.preventDefault();
      list.classList.add("drop-target");
    });

    list.addEventListener("dragleave", () => {
      list.classList.remove("drop-target");
    });

    list.addEventListener("drop", (event) => {
      event.preventDefault();
      const cardId = event.dataTransfer.getData("text/plain");
      const card = findCard(cardId);
      if (card) {
        card.column = list.dataset.column;
        card.order = nextOrder(card.column);
        card.updatedAt = new Date().toISOString();
        saveState();
        renderApp();
      }
    });
  });
}

function openDetail(cardId) {
  activeCardId = cardId;
  populateDetail(cardId);
  detailDrawer.classList.add("open");
  detailDrawer.setAttribute("aria-hidden", "false");
}

function closeDetail() {
  activeCardId = null;
  detailDrawer.classList.remove("open");
  detailDrawer.setAttribute("aria-hidden", "true");
}

function populateDetail(cardId) {
  const card = findCard(cardId);
  if (!card) {
    closeDetail();
    return;
  }

  document.querySelector("#detailEyebrow").textContent = `${card.column} / ${card.status}`;
  document.querySelector("#detailHeading").textContent = card.title;
  document.querySelector("#detailId").value = card.id;
  document.querySelector("#detailTitle").value = card.title;
  document.querySelector("#detailOutcome").value = card.outcome;
  document.querySelector("#detailOwner").value = card.owner;
  document.querySelector("#detailGate").value = card.gate;
  document.querySelector("#detailImpact").value = card.impact;
  document.querySelector("#detailConfidence").value = card.confidence;
  document.querySelector("#detailRisk").value = card.risk;
  document.querySelector("#prdProblem").value = card.prdFields.problem;
  document.querySelector("#prdTargetUser").value = card.prdFields.targetUser;
  document.querySelector("#prdSuccessMetric").value = card.prdFields.successMetric;
  document.querySelector("#prdLaunchGate").value = card.prdFields.launchGate;
  document.querySelector("#prdAssumptions").value = card.prdFields.assumptions.join("\n");
  document.querySelector("#prdAcceptance").value = card.prdFields.acceptance.join("\n");
  document.querySelector("#prdRisks").value = card.prdFields.risks.join("\n");
  document.querySelector("#agentRole").value = card.agentSpec.role;
  document.querySelector("#agentContext").value = card.agentSpec.context;
  document.querySelector("#agentDoneChecks").value = card.agentSpec.doneChecks.join("\n");
  document.querySelector("#agentVerification").value = card.agentSpec.verification.join("\n");
  document.querySelector("#detailPrd").value = card.prd;
  document.querySelector("#detailPrompt").value = card.prompt;
  const resolveIssueButton = document.querySelector("#resolveIssueButton");
  resolveIssueButton.hidden = !hasGithubIssue(card) || card.status === "Ship";

  fillSelect("#detailColumn", columns, card.column);
  fillSelect("#detailStatus", statuses, card.status);
  renderInlineList("context", card.context);
  renderInlineList("signals", card.signals);
  renderInlineList("agentRuns", card.agentRuns);
  renderInlineList("decisions", card.decisions);
  renderDetailChecks(card);
}

function renderDetailChecks(card) {
  document.querySelector("#detailChecks").innerHTML = card.checks
    .map(
      (check) => `
        <label class="check-item">
          <input type="checkbox" data-check-id="${escapeHtml(check.id)}" ${check.done ? "checked" : ""} />
          <input data-check-label="${escapeHtml(check.id)}" value="${escapeHtml(check.label)}" />
          <button type="button" data-remove-check="${escapeHtml(check.id)}">Remove</button>
        </label>
      `,
    )
    .join("") +
    `
      <div class="inline-add">
        <input id="newCheckInput" placeholder="Add launch check" />
        <button class="secondary-button" type="button" id="addCheckButton">Add</button>
      </div>
    `;
  document.querySelectorAll("[data-remove-check]").forEach((button) => {
    button.addEventListener("click", () => removeCheck(button.dataset.removeCheck));
  });
  document.querySelector("#addCheckButton").addEventListener("click", addCheck);
}

function renderInlineList(type, items) {
  const target = {
    context: "#detailContextList",
    signals: "#detailSignalsList",
    agentRuns: "#detailAgentRunsList",
    decisions: "#detailDecisionsList",
  }[type];
  document.querySelector(target).innerHTML =
    items
      .map(
        (item, index) => `
          <div class="inline-item">
            <input value="${escapeHtml(item)}" data-inline-type="${type}" data-inline-index="${index}" />
            <button type="button" data-remove-list-item="${type}" data-remove-index="${index}">Remove</button>
          </div>
        `,
      )
      .join("") || `<div class="empty-state">No ${escapeHtml(type)} yet.</div>`;
}

function updateCardFromDetail() {
  const card = findCard(document.querySelector("#detailId").value);
  if (!card) return;

  card.title = document.querySelector("#detailTitle").value.trim();
  card.outcome = document.querySelector("#detailOutcome").value.trim();
  card.column = document.querySelector("#detailColumn").value;
  card.status = document.querySelector("#detailStatus").value;
  card.owner = document.querySelector("#detailOwner").value.trim() || "Founder";
  card.gate = document.querySelector("#detailGate").value.trim() || "Needs review";
  card.impact = clampScore(document.querySelector("#detailImpact").value);
  card.confidence = clampScore(document.querySelector("#detailConfidence").value);
  card.risk = clampScore(document.querySelector("#detailRisk").value);
  card.context = collectInlineValues("context");
  card.prdFields = {
    problem: document.querySelector("#prdProblem").value.trim(),
    targetUser: document.querySelector("#prdTargetUser").value.trim(),
    successMetric: document.querySelector("#prdSuccessMetric").value.trim(),
    launchGate: document.querySelector("#prdLaunchGate").value.trim() || card.gate,
    assumptions: parseLines(document.querySelector("#prdAssumptions").value),
    acceptance: parseLines(document.querySelector("#prdAcceptance").value),
    risks: parseLines(document.querySelector("#prdRisks").value),
  };
  card.agentSpec = {
    role: document.querySelector("#agentRole").value.trim() || "Codex implementation agent",
    context: document.querySelector("#agentContext").value.trim(),
    doneChecks: parseLines(document.querySelector("#agentDoneChecks").value),
    verification: parseLines(document.querySelector("#agentVerification").value),
  };
  card.prd = document.querySelector("#detailPrd").value.trim();
  card.prompt = document.querySelector("#detailPrompt").value.trim();
  card.signals = collectInlineValues("signals");
  card.agentRuns = collectInlineValues("agentRuns");
  card.decisions = collectInlineValues("decisions");
  card.checks = card.checks.map((check) => ({
    ...check,
    done: Boolean(document.querySelector(`[data-check-id="${cssEscape(check.id)}"]`)?.checked),
    label: document.querySelector(`[data-check-label="${cssEscape(check.id)}"]`)?.value.trim() || check.label,
  }));
  card.updatedAt = new Date().toISOString();
  saveState();
  renderApp();
}

function collectInlineValues(type) {
  return [...document.querySelectorAll(`[data-inline-type="${type}"]`)]
    .map((input) => input.value.trim())
    .filter(Boolean);
}

function addListItem(type) {
  const card = findCard(activeCardId);
  if (!card) return;
  const input = {
    context: "#newContextInput",
    signals: "#newSignalInput",
    agentRuns: "#newAgentRunInput",
    decisions: "#newDecisionInput",
  }[type];
  const value = document.querySelector(input).value.trim();
  if (!value) return;
  card[type].push(value);
  document.querySelector(input).value = "";
  card.updatedAt = new Date().toISOString();
  saveState();
  renderApp();
}

function removeListItem(type, index) {
  const card = findCard(activeCardId);
  if (!card) return;
  card[type].splice(Number(index), 1);
  card.updatedAt = new Date().toISOString();
  saveState();
  renderApp();
}

function addCheck() {
  const card = findCard(activeCardId);
  if (!card) return;
  const input = document.querySelector("#newCheckInput");
  const label = input.value.trim();
  if (!label) return;
  card.checks.push({ id: `${card.id}-check-${Date.now()}`, label, done: false });
  input.value = "";
  card.updatedAt = new Date().toISOString();
  saveState();
  renderApp();
}

function removeCheck(checkId) {
  const card = findCard(activeCardId);
  if (!card) return;
  card.checks = card.checks.filter((check) => check.id !== checkId);
  card.updatedAt = new Date().toISOString();
  saveState();
  renderApp();
}

function generatePrd(card) {
  const fields = card.prdFields;
  return [
    `# ${card.title}`,
    "",
    "## Problem",
    fields.problem || card.outcome,
    "",
    "## Target User",
    fields.targetUser || "Solo builders and small teams using AI coding agents.",
    "",
    "## Success Metric",
    fields.successMetric || "A builder can understand what to do next within 30 seconds.",
    "",
    "## Assumptions",
    bulletList(fields.assumptions),
    "",
    "## Acceptance Criteria",
    bulletList(fields.acceptance),
    "",
    "## Risks",
    bulletList(fields.risks),
    "",
    "## Launch Gate",
    fields.launchGate || card.gate,
  ].join("\n");
}

function generateAgentPrompt(card) {
  const spec = card.agentSpec;
  return [
    `Role: ${spec.role || "Codex implementation agent"}`,
    "",
    `Card: ${card.title}`,
    `Outcome: ${card.outcome}`,
    "",
    "Context:",
    spec.context || card.prd || card.context.join(", "),
    "",
    "Done checks:",
    bulletList(spec.doneChecks),
    "",
    "Verification steps:",
    bulletList(spec.verification),
    "",
    `Launch gate: ${card.gate}`,
  ].join("\n");
}

function bulletList(items) {
  return (items.length ? items : ["TBD"]).map((item) => `- ${item}`).join("\n");
}

function addActivity(activity) {
  state.activity.unshift({
    id: `activity-${Date.now()}`,
    projectId: activity.projectId || state.projects[0]?.id || "",
    source: activity.source || "Codex",
    status: activity.status || "Queued",
    title: activity.title,
    detail: activity.detail || "",
    linkedCardId: activity.linkedCardId || "",
    createdAt: new Date().toISOString(),
  });
}

function addManualActivity(event) {
  event.preventDefault();
  addActivity({
    source: "Codex",
    status: document.querySelector("#activityStatus").value,
    title: document.querySelector("#activityTitle").value.trim(),
    detail: document.querySelector("#activityDetail").value.trim(),
  });
  saveState();
  renderApp();
}

function runWorkflow(type) {
  const card = findCard(activeCardId);
  if (!card) return;
  syncGuidedFields(card);

  if (type === "capture") {
    addUnique(card.context, "Signal");
    card.signals.unshift(`Captured signal: ${card.outcome}`);
    card.status = "Signal";
    card.column = "Idea Intake";
  }

  if (type === "prd") {
    addUnique(card.context, "PRD");
    card.prdFields = {
      problem: card.prdFields.problem || card.outcome,
      targetUser: card.prdFields.targetUser || "Solo builders and small teams using AI coding agents.",
      successMetric: card.prdFields.successMetric || "A builder can understand and verify the work within 30 seconds.",
      assumptions: card.prdFields.assumptions.length
        ? card.prdFields.assumptions
        : ["The workflow is valuable if it reduces context loss.", "The feature should be useful before integrations exist."],
      acceptance: card.prdFields.acceptance.length
        ? card.prdFields.acceptance
        : ["Card outcome is visible.", "Launch gate is explicit.", "Risk is scored before build."],
      risks: card.prdFields.risks.length ? card.prdFields.risks : [`Current risk score is ${card.risk}/10.`],
      launchGate: card.prdFields.launchGate || card.gate,
    };
    card.prd = generatePrd(card);
    card.status = "Spec";
    card.column = "Shape";
  }

  if (type === "agent") {
    addUnique(card.context, "Agent Log");
    card.agentSpec = {
      role: card.agentSpec.role || `${card.owner} implementation agent`,
      context:
        card.agentSpec.context ||
        `Card: ${card.title}\nOutcome: ${card.outcome}\nPRD: ${card.prd || "No PRD yet."}`,
      doneChecks: card.agentSpec.doneChecks.length
        ? card.agentSpec.doneChecks
        : card.checks.map((check) => check.label),
      verification: card.agentSpec.verification.length
        ? card.agentSpec.verification
        : ["Run the app locally.", "Check affected UI states.", `Verify launch gate: ${card.gate}`],
    };
    card.prompt = generateAgentPrompt(card);
    card.agentRuns.unshift(`${card.owner} queued structured mission for ${card.title}.`);
    addActivity({
      source: card.owner || "Codex",
      status: "Queued",
      title: `Agent mission: ${card.title}`,
      detail: card.prompt.split("\n").slice(0, 4).join(" "),
      linkedCardId: card.id,
    });
    card.status = "Active";
    card.column = "Build Watch";
  }

  if (type === "launch") {
    card.status = "Guard";
    card.gate = "Launch checks pending";
    card.checks.push({
      id: `${card.id}-check-${Date.now()}`,
      label: "New launch check",
      done: false,
    });
  }

  card.order = nextOrder(card.column);
  card.updatedAt = new Date().toISOString();
  saveState();
  renderApp();
}

function syncGuidedFields(card) {
  if (!document.querySelector("#detailId")?.value) return;
  card.prdFields = {
    problem: document.querySelector("#prdProblem").value.trim(),
    targetUser: document.querySelector("#prdTargetUser").value.trim(),
    successMetric: document.querySelector("#prdSuccessMetric").value.trim(),
    launchGate: document.querySelector("#prdLaunchGate").value.trim() || card.gate,
    assumptions: parseLines(document.querySelector("#prdAssumptions").value),
    acceptance: parseLines(document.querySelector("#prdAcceptance").value),
    risks: parseLines(document.querySelector("#prdRisks").value),
  };
  card.agentSpec = {
    role: document.querySelector("#agentRole").value.trim() || "Codex implementation agent",
    context: document.querySelector("#agentContext").value.trim(),
    doneChecks: parseLines(document.querySelector("#agentDoneChecks").value),
    verification: parseLines(document.querySelector("#agentVerification").value),
  };
}

function createCardFromForm() {
  const column = document.querySelector("#cardColumn").value;
  const id = `card-${Date.now()}`;
  const newCard = createSeedCard({
    id,
    projectId: selectedProjectId === "all" ? state.projects[0]?.id || "project-vibepm" : selectedProjectId,
    column,
    order: nextOrder(column),
    title: document.querySelector("#cardTitle").value.trim(),
    outcome: document.querySelector("#cardOutcome").value.trim(),
    owner: "Founder",
    status: document.querySelector("#cardStatus").value,
    impact: 5,
    confidence: 5,
    risk: 5,
    context: ["Prompt"],
    gate: "Needs review",
  });
  state.cards.push(newCard);
  saveState();
  return newCard.id;
}

function captureQuickIdea(event) {
  event.preventDefault();
  const title = document.querySelector("#quickIdeaTitle").value.trim();
  const signal = document.querySelector("#quickIdeaSignal").value.trim();
  if (!title || !signal) return;
  const id = `idea-${Date.now()}`;
  state.cards.push(
    createSeedCard({
      id,
      projectId: selectedProjectId === "all" ? state.projects[0]?.id || "project-vibepm" : selectedProjectId,
      column: "Idea Intake",
      order: nextOrder("Idea Intake"),
      title,
      outcome: signal,
      owner: "Founder",
      status: "Signal",
      impact: 5,
      confidence: 4,
      risk: 4,
      context: ["Signal"],
      gate: "Needs triage",
      signals: [signal],
    }),
  );
  saveState();
  renderApp();
  openDetail(id);
}

function addMilestone(event) {
  event.preventDefault();
  state.milestones = [
    createMilestone({
      projectId: selectedProjectId === "all" ? state.projects[0]?.id || "project-vibepm" : selectedProjectId,
      title: document.querySelector("#milestoneTitle").value.trim(),
      outcome: document.querySelector("#milestoneOutcome").value.trim(),
      target: document.querySelector("#milestoneTarget").value.trim() || "Soon",
    }),
    ...(state.milestones || []),
  ];
  saveState();
  renderApp();
}

function toggleMilestone(id) {
  const milestone = state.milestones.find((item) => item.id === id);
  if (!milestone) return;
  milestone.done = !milestone.done;
  milestone.updatedAt = new Date().toISOString();
  saveState();
  renderApp();
}

function updateMilestone(id, field, value) {
  const milestone = state.milestones.find((item) => item.id === id);
  if (!milestone || !["title", "outcome", "target"].includes(field)) return;
  milestone[field] = value.trim();
  milestone.updatedAt = new Date().toISOString();
  saveState();
}

function deleteMilestone(id) {
  state.milestones = state.milestones.filter((item) => item.id !== id);
  saveState();
  renderApp();
}

function resetBoard() {
  state = structuredClone(seedState);
  activeCardId = null;
  saveState();
  closeDetail();
  renderApp();
}

function exportState() {
  state.backend.lastExportedAt = new Date().toISOString();
  saveState();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `vibepm-export-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  renderApp();
}

function importState(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const imported = JSON.parse(reader.result);
      state = normalizeImportedState(imported);
      saveState();
      activeCardId = null;
      closeDetail();
      renderApp();
    } catch {
      alert("Import failed. The selected file is not valid VibePM JSON.");
    } finally {
      importInput.value = "";
    }
  });
  reader.readAsText(file);
}

function normalizeImportedState(imported) {
  if (Array.isArray(imported.cards)) {
    return normalizeState(imported);
  }
  if (Array.isArray(imported.projects) || Array.isArray(imported.activity)) {
    return normalizeState({
      ...state,
      projects: imported.projects || state.projects,
      activity: imported.activity || state.activity,
    });
  }
  throw new Error("Unsupported import");
}

function deleteActiveCard() {
  if (!activeCardId) return;
  state.cards = state.cards.filter((card) => card.id !== activeCardId);
  saveState();
  closeDetail();
  renderApp();
}

async function resolveActiveIssue() {
  if (!activeCardId) return;
  const card = findCard(activeCardId);
  if (!card) return;
  const button = document.querySelector("#resolveIssueButton");
  button.disabled = true;
  button.textContent = "Resolving";
  try {
    const response = await fetch("/api/codex/resolve-issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cardId: activeCardId }),
    });
    if (!response.ok) throw new Error("Resolve failed");
    const result = await response.json();
    const index = state.cards.findIndex((item) => item.id === activeCardId);
    if (index >= 0) state.cards[index] = normalizeCard(result.card);
    await hydrateFromServer();
    renderApp();
    openDetail(activeCardId);
  } catch {
    card.agentRuns = [...(card.agentRuns || []), "Could not close the linked GitHub issue. Marked for manual review."];
    saveState();
    renderApp();
  } finally {
    button.disabled = false;
    button.textContent = "Resolve Issue";
  }
}

function findCard(cardId) {
  return state.cards.find((card) => card.id === cardId);
}

function nextOrder(column) {
  const orders = scopedProjectCards().filter((card) => card.column === column).map((card) => card.order || 0);
  return orders.length ? Math.max(...orders) + 10 : 10;
}

function priorityScore(card) {
  return Math.max(1, card.impact + card.confidence - card.risk);
}

function importanceLabel(card) {
  const score = priorityScore(card);
  if (score >= 12) return "Huge";
  if (score >= 9) return "Big";
  if (score >= 6) return "Useful";
  return "Small";
}

function riskLabel(risk) {
  if (risk >= 8) return "Blocked";
  if (risk >= 5) return "Risky";
  return "Safe";
}

function checkProgress(card) {
  if (!card.checks.length) return 0;
  const done = card.checks.filter((check) => check.done).length;
  return Math.round((done / card.checks.length) * 100);
}

function isBlocked(card) {
  return card.status === "Blocked" || card.risk >= 8 || card.gate.toLowerCase().includes("blocking");
}

function riskLevel(risk) {
  if (risk >= 8) return "high";
  if (risk >= 5) return "medium";
  return "low";
}

function hasGithubIssue(card) {
  return (card.context || []).some((item) => /github\.com\/[^/]+\/[^/]+\/issues\/\d+/i.test(item));
}

function columnSubtitle(column) {
  return {
    "Idea Intake": "rough ideas",
    Shape: "make it clear",
    "Build Watch": "being built",
    "Launch Ready": "almost ready",
  }[column];
}

function parseLines(value) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLinesOrComma(value) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function clampScore(value) {
  return Math.min(10, Math.max(1, Number(value) || 5));
}

function addUnique(list, value) {
  if (!list.includes(value)) list.push(value);
}

function fillSelect(selector, options, selected) {
  document.querySelector(selector).innerHTML = options
    .map((option) => `<option ${option === selected ? "selected" : ""}>${escapeHtml(option)}</option>`)
    .join("");
}

function slug(value) {
  return value.toLowerCase().replaceAll(" ", "-");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cssEscape(value) {
  if (window.CSS?.escape) return CSS.escape(value);
  return value.replaceAll('"', '\\"');
}

document.querySelector("#newCardButton").addEventListener("click", () => {
  dialog.showModal();
});

exportButton.addEventListener("click", exportState);
importButton.addEventListener("click", () => importInput.click());
importInput.addEventListener("change", importState);
syncProjectsButton.addEventListener("click", syncProjects);

document.querySelector("#closeDetailButton").addEventListener("click", closeDetail);
document.querySelector("#deleteCardButton").addEventListener("click", deleteActiveCard);
document.querySelector("#resolveIssueButton").addEventListener("click", resolveActiveIssue);
document.querySelector("#resetBoardButton").addEventListener("click", resetBoard);

cardForm.addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();
  const cardId = createCardFromForm();
  cardForm.reset();
  dialog.close();
  renderApp();
  openDetail(cardId);
});

detailForm.addEventListener("submit", (event) => {
  event.preventDefault();
  updateCardFromDetail();
});

document.querySelectorAll("[data-workflow]").forEach((button) => {
  button.addEventListener("click", () => runWorkflow(button.dataset.workflow));
});

document.addEventListener("click", (event) => {
  const addButton = event.target.closest("[data-add-list-item]");
  if (addButton) {
    addListItem(addButton.dataset.addListItem);
  }

  const removeButton = event.target.closest("[data-remove-list-item]");
  if (removeButton) {
    removeListItem(removeButton.dataset.removeListItem, removeButton.dataset.removeIndex);
  }
});

document.querySelectorAll(".detail-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".detail-tab").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".detail-section").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector(`[data-section-panel="${tab.dataset.section}"]`).classList.add("active");
  });
});

searchInput.addEventListener("input", renderCurrentView);
statusFilter.addEventListener("change", renderCurrentView);
sortMode.addEventListener("change", renderCurrentView);
projectSelector.addEventListener("change", () => {
  selectedProjectId = projectSelector.value;
  localStorage.setItem("vibepm.selectedProjectId", selectedProjectId);
  closeDetail();
  renderApp();
});

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    currentView = item.dataset.view;
    document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.remove("active"));
    item.classList.add("active");
    closeDetail();
    renderCurrentView();
  });
});

renderApp();
hydrateFromServer();
