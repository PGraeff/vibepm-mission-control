const STORAGE_KEY = "vibepm.mission-control.v2";
const columns = ["Idea Intake", "Shape", "Build Watch", "Launch Ready"];
const statuses = ["Signal", "Draft", "Spec", "Active", "Review", "Guard", "Ship", "Blocked"];

const seedState = {
  version: 2,
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

const board = document.querySelector("#board");
const searchInput = document.querySelector("#searchInput");
const statusFilter = document.querySelector("#statusFilter");
const sortMode = document.querySelector("#sortMode");
const dialog = document.querySelector("#cardDialog");
const cardForm = document.querySelector("#cardForm");
const detailDrawer = document.querySelector("#detailDrawer");
const detailForm = document.querySelector("#detailForm");

function createSeedCard(card) {
  return {
    prd: "",
    prompt: "",
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

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (stored?.version === 2 && Array.isArray(stored.cards)) {
      return stored;
    }
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return structuredClone(seedState);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function renderApp() {
  renderBoard();
  renderRail();
  if (activeCardId) {
    populateDetail(activeCardId);
  }
}

function renderBoard() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;

  board.innerHTML = columns
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
              <h2 id="${slug(column)}-title">${column}</h2>
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

function getCardsForColumn(column) {
  const cards = state.cards.filter((card) => card.column === column);
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
  return `
    <article class="work-card${blocked}" draggable="true" data-card-id="${escapeHtml(card.id)}" tabindex="0">
      <div class="card-top">
        <h3>${escapeHtml(card.title)}</h3>
        <span class="status-pill status-${escapeHtml(card.status)}">${escapeHtml(card.status)}</span>
      </div>
      <p class="outcome">${escapeHtml(card.outcome)}</p>
      <div class="metric-row" aria-label="Card scores">
        <div class="metric"><span>Impact</span><strong>${card.impact}</strong></div>
        <div class="metric"><span>Conf</span><strong>${card.confidence}</strong></div>
        <div class="metric risk-${riskLevel(card.risk)}"><span>Risk</span><strong>${card.risk}</strong></div>
      </div>
      <div class="card-meta">
        <span>${escapeHtml(card.owner)}</span>
        <span>-</span>
        <span>P${priorityScore(card)}</span>
      </div>
      <div class="context-row">
        ${card.context.map((item) => `<span class="context-chip">${escapeHtml(item)}</span>`).join("")}
      </div>
      <div class="gate">
        <span>Launch gate</span>
        <span class="gate-state">${escapeHtml(card.gate)}</span>
      </div>
      <div class="progress-bar" aria-label="Launch check progress">
        <span style="width: ${checkProgress(card)}%"></span>
      </div>
    </article>
  `;
}

function renderRail() {
  const cards = state.cards;
  const blockedCards = cards.filter(isBlocked);
  const activeCards = cards.filter((card) => ["Active", "Review", "Guard"].includes(card.status));
  const shipCards = cards.filter((card) => card.column === "Launch Ready");
  const signals = cards
    .flatMap((card) => card.signals.map((signal) => ({ card, signal })))
    .slice(0, 5);
  const agentRuns = cards
    .flatMap((card) => card.agentRuns.map((run) => ({ card, run })))
    .slice(0, 5);
  const decisions = cards
    .flatMap((card) => card.decisions.map((decision) => ({ card, decision })))
    .slice(0, 5);
  const highRisk = cards.filter((card) => card.risk >= 7).length;

  document.querySelector("#briefRisk").textContent = highRisk > 1 ? "High risk" : "Medium risk";
  document.querySelector("#briefList").innerHTML = [
    ["Moved", `${activeCards.length} cards are in build, review, or guard.`],
    ["Blocked", `${blockedCards.length || "No"} cards currently need attention.`],
    ["Decision", decisions[0]?.decision || "No founder decision is blocking the board."],
    ["Launch", `${shipCards.length} cards are launch ready.`],
  ]
    .map(([label, value]) => `<li><strong>${label}:</strong> ${escapeHtml(value)}</li>`)
    .join("");

  document.querySelector("#signalList").innerHTML = signals.length
    ? signals.map(({ card, signal }, index) => railItem(`${index + 1}. ${card.title}`, signal)).join("")
    : railItem("No signals", "Open a card and add one signal per line.");

  document.querySelector("#agentList").innerHTML = agentRuns.length
    ? agentRuns.map(({ card, run }) => agentItem(card.owner, run, card.status, card.title)).join("")
    : agentItem("No agent", "Create an agent mission from a card.", "Idle", "None");

  document.querySelector("#decisionCount").textContent = `${decisions.length} open`;
  document.querySelector("#decisionList").innerHTML = decisions.length
    ? decisions
        .map(
          ({ card, decision }) =>
            `<button type="button" data-open-card="${escapeHtml(card.id)}">${escapeHtml(decision)}</button>`,
        )
        .join("")
    : `<button type="button">No unresolved founder decisions.</button>`;

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
      <span>Linked: ${escapeHtml(linkedCard)}</span>
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
  document.querySelector("#detailContext").value = card.context.join(", ");
  document.querySelector("#detailPrd").value = card.prd;
  document.querySelector("#detailPrompt").value = card.prompt;
  document.querySelector("#detailSignals").value = card.signals.join("\n");
  document.querySelector("#detailAgentRuns").value = card.agentRuns.join("\n");
  document.querySelector("#detailDecisions").value = card.decisions.join("\n");

  fillSelect("#detailColumn", columns, card.column);
  fillSelect("#detailStatus", statuses, card.status);
  renderDetailChecks(card);
}

function renderDetailChecks(card) {
  document.querySelector("#detailChecks").innerHTML = card.checks
    .map(
      (check) => `
        <label class="check-item">
          <input type="checkbox" data-check-id="${escapeHtml(check.id)}" ${check.done ? "checked" : ""} />
          <span>${escapeHtml(check.label)}</span>
        </label>
      `,
    )
    .join("");
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
  card.context = parseLinesOrComma(document.querySelector("#detailContext").value);
  card.prd = document.querySelector("#detailPrd").value.trim();
  card.prompt = document.querySelector("#detailPrompt").value.trim();
  card.signals = parseLines(document.querySelector("#detailSignals").value);
  card.agentRuns = parseLines(document.querySelector("#detailAgentRuns").value);
  card.decisions = parseLines(document.querySelector("#detailDecisions").value);
  card.checks = card.checks.map((check) => ({
    ...check,
    done: Boolean(document.querySelector(`[data-check-id="${cssEscape(check.id)}"]`)?.checked),
  }));
  card.updatedAt = new Date().toISOString();
  saveState();
  renderApp();
}

function runWorkflow(type) {
  const card = findCard(activeCardId);
  if (!card) return;

  if (type === "capture") {
    addUnique(card.context, "Signal");
    card.signals.unshift(`Captured signal: ${card.outcome}`);
    card.status = "Signal";
    card.column = "Idea Intake";
  }

  if (type === "prd") {
    addUnique(card.context, "PRD");
    card.prd = `Problem\n${card.outcome}\n\nTarget user\nSolo builders and small teams using AI coding agents.\n\nAssumptions\n- The workflow is valuable if it reduces context loss.\n- The feature should be useful before integrations exist.\n\nAcceptance criteria\n- Card outcome is visible.\n- Launch gate is explicit.\n- Risk is scored before build.\n\nLaunch gate\n${card.gate}`;
    card.status = "Spec";
    card.column = "Shape";
  }

  if (type === "agent") {
    addUnique(card.context, "Agent Log");
    card.prompt = `Implement the card \"${card.title}\".\n\nOutcome: ${card.outcome}\n\nDone checks:\n- Preserve the core product intent.\n- Update UI/data model as needed.\n- Verify the launch gate: ${card.gate}`;
    card.agentRuns.unshift(`${card.owner} queued mission for ${card.title}.`);
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

function createCardFromForm() {
  const column = document.querySelector("#cardColumn").value;
  const id = `card-${Date.now()}`;
  const newCard = createSeedCard({
    id,
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

function resetBoard() {
  state = structuredClone(seedState);
  activeCardId = null;
  saveState();
  closeDetail();
  renderApp();
}

function deleteActiveCard() {
  if (!activeCardId) return;
  state.cards = state.cards.filter((card) => card.id !== activeCardId);
  saveState();
  closeDetail();
  renderApp();
}

function findCard(cardId) {
  return state.cards.find((card) => card.id === cardId);
}

function nextOrder(column) {
  const orders = state.cards.filter((card) => card.column === column).map((card) => card.order || 0);
  return orders.length ? Math.max(...orders) + 10 : 10;
}

function priorityScore(card) {
  return Math.max(1, card.impact + card.confidence - card.risk);
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

function columnSubtitle(column) {
  return {
    "Idea Intake": "Raw signals",
    Shape: "Clarify intent",
    "Build Watch": "Agent execution",
    "Launch Ready": "Ship queue",
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

document.querySelector("#closeDetailButton").addEventListener("click", closeDetail);
document.querySelector("#deleteCardButton").addEventListener("click", deleteActiveCard);
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

document.querySelectorAll(".detail-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".detail-tab").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".detail-section").forEach((item) => item.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector(`[data-section-panel="${tab.dataset.section}"]`).classList.add("active");
  });
});

searchInput.addEventListener("input", renderBoard);
statusFilter.addEventListener("change", renderBoard);
sortMode.addEventListener("change", renderBoard);

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.remove("active"));
    item.classList.add("active");
  });
});

saveState();
renderApp();
