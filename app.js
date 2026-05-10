const columns = ["Idea Intake", "Shape", "Build Watch", "Launch Ready"];

let cards = [
  {
    id: "voice-opportunity",
    column: "Idea Intake",
    title: "Voice-note to opportunity",
    outcome: "Cluster raw founder notes and Discord asks into testable product problems.",
    owner: "Codex",
    status: "Signal",
    impact: 8,
    confidence: 6,
    risk: 4,
    context: ["Signal", "Prompt", "PRD"],
    gate: "Needs shape",
  },
  {
    id: "chrome-clipper",
    column: "Idea Intake",
    title: "Chrome clipper for vibe bugs",
    outcome: "Capture screenshots and prompts from app previews into triage-ready cards.",
    owner: "Cursor",
    status: "Signal",
    impact: 7,
    confidence: 7,
    risk: 5,
    context: ["Replay", "Signal"],
    gate: "Discovery",
  },
  {
    id: "competitor-import",
    column: "Idea Intake",
    title: "Competitor import",
    outcome: "Summarize Linear, Hermes, and GitHub Projects gaps for positioning.",
    owner: "Claude",
    status: "Draft",
    impact: 5,
    confidence: 6,
    risk: 3,
    context: ["Docs", "Signal"],
    gate: "Optional",
  },
  {
    id: "prd-copilot",
    column: "Shape",
    title: "AI PRD co-pilot",
    outcome: "Generate thin PRDs with assumptions, metrics, and launch gates.",
    owner: "Codex",
    status: "Spec",
    impact: 9,
    confidence: 8,
    risk: 4,
    context: ["PRD", "Prompt", "Agent Log"],
    gate: "Clear",
  },
  {
    id: "prompt-ticket",
    column: "Shape",
    title: "Prompt-to-ticket template",
    outcome: "Convert a user story into acceptance criteria and test prompts.",
    owner: "Founder",
    status: "Draft",
    impact: 6,
    confidence: 7,
    risk: 3,
    context: ["Prompt", "PRD"],
    gate: "Needs rubric",
  },
  {
    id: "roadmap-scoring",
    column: "Shape",
    title: "Roadmap scoring",
    outcome: "Rank work by user pull, time saved, launch dependency, and agent confidence.",
    owner: "Claude",
    status: "Spec",
    impact: 8,
    confidence: 5,
    risk: 6,
    context: ["Signal", "Docs"],
    gate: "Founder decision",
  },
  {
    id: "billing-onboarding",
    column: "Build Watch",
    title: "Billing onboarding card",
    outcome: "Agent implements plan picker and upgrade guardrails before beta billing.",
    owner: "Codex",
    status: "Active",
    impact: 8,
    confidence: 6,
    risk: 7,
    context: ["GitHub PR", "Agent Log"],
    gate: "Tests pending",
  },
  {
    id: "mobile-nav",
    column: "Build Watch",
    title: "Mobile nav pass",
    outcome: "Responsive board behavior needs review before internal dogfood.",
    owner: "Reviewer",
    status: "Review",
    impact: 6,
    confidence: 5,
    risk: 6,
    context: ["GitHub PR", "Replay"],
    gate: "Review needed",
  },
  {
    id: "release-checklist",
    column: "Build Watch",
    title: "Release checklist",
    outcome: "Block launch if evals, docs, auth tests, or telemetry checks fail.",
    owner: "Codex",
    status: "Guard",
    impact: 9,
    confidence: 7,
    risk: 8,
    context: ["PRD", "GitHub PR"],
    gate: "Blocking",
  },
  {
    id: "landing-narrative",
    column: "Launch Ready",
    title: "Landing page narrative",
    outcome: "Position VibePM as product OS for solo builders using AI agents.",
    owner: "Founder",
    status: "Ship",
    impact: 7,
    confidence: 8,
    risk: 2,
    context: ["Docs", "Signal"],
    gate: "Ready",
  },
  {
    id: "beta-cohort",
    column: "Launch Ready",
    title: "Beta cohort import",
    outcome: "Tag high-intent users by workflow, role, stack, and requested outcome.",
    owner: "Claude",
    status: "Ship",
    impact: 8,
    confidence: 7,
    risk: 3,
    context: ["Signal", "Docs"],
    gate: "Ready",
  },
  {
    id: "telemetry-brief",
    column: "Launch Ready",
    title: "Telemetry brief",
    outcome: "Daily product pulse for shipped work, stuck cards, and launch risk.",
    owner: "Codex",
    status: "Review",
    impact: 7,
    confidence: 6,
    risk: 5,
    context: ["Agent Log", "PRD"],
    gate: "Verify",
  },
];

const signals = [
  ["Discord requests", "5 asks around screenshot-to-card capture"],
  ["Support snippets", "3 users want launch blockers in one view"],
  ["Session replays", "Mobile board navigation causes hesitation"],
  ["GitHub issues", "Auth and billing checks are release-critical"],
];

const agents = [
  ["Codex", "Release checklist guardrails", "Active", "Release checklist"],
  ["Cursor", "Clipper prototype", "Queued", "Chrome clipper"],
  ["Claude", "Roadmap scoring rubric", "Blocked", "Roadmap scoring"],
  ["Reviewer", "Mobile nav QA", "Waiting", "Mobile nav pass"],
];

const board = document.querySelector("#board");
const searchInput = document.querySelector("#searchInput");
const statusFilter = document.querySelector("#statusFilter");
const dialog = document.querySelector("#cardDialog");
const cardForm = document.querySelector("#cardForm");

function renderBoard() {
  const query = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;

  board.innerHTML = columns
    .map((column) => {
      const filteredCards = cards.filter((card) => {
        const matchesColumn = card.column === column;
        const matchesStatus = status === "all" || card.status === status;
        const searchable = [
          card.title,
          card.outcome,
          card.owner,
          card.status,
          card.gate,
          ...card.context,
        ]
          .join(" ")
          .toLowerCase();
        return matchesColumn && matchesStatus && searchable.includes(query);
      });

      return `
        <section class="column" aria-labelledby="${slug(column)}-title">
          <div class="column-header">
            <h2 id="${slug(column)}-title">${column}</h2>
            <span class="column-count">${filteredCards.length}</span>
          </div>
          <div class="card-list" data-column="${column}">
            ${filteredCards.map(renderCard).join("")}
          </div>
        </section>
      `;
    })
    .join("");

  wireDragAndDrop();
}

function renderCard(card) {
  return `
    <article class="work-card" draggable="true" data-card-id="${card.id}">
      <div class="card-top">
        <h3>${card.title}</h3>
        <span class="status-pill status-${card.status}">${card.status}</span>
      </div>
      <p class="outcome">${card.outcome}</p>
      <div class="metric-row" aria-label="Card scores">
        <div class="metric"><span>Impact</span><strong>${card.impact}</strong></div>
        <div class="metric"><span>Conf</span><strong>${card.confidence}</strong></div>
        <div class="metric"><span>Risk</span><strong>${card.risk}</strong></div>
      </div>
      <div class="card-meta">
        <span>${card.owner}</span>
        <span>-</span>
        <span>${card.column}</span>
      </div>
      <div class="context-row">
        ${card.context.map((item) => `<span class="context-chip">${item}</span>`).join("")}
      </div>
      <div class="gate">
        <span>Launch gate</span>
        <span class="gate-state">${card.gate}</span>
      </div>
    </article>
  `;
}

function renderRailLists() {
  document.querySelector("#signalList").innerHTML = signals
    .map(
      ([title, detail], index) => `
        <div class="signal-item">
          <strong>${index + 1}. ${title}</strong>
          <span>${detail}</span>
        </div>
      `,
    )
    .join("");

  document.querySelector("#agentList").innerHTML = agents
    .map(
      ([name, task, state, linkedCard]) => `
        <div class="agent-item">
          <div class="agent-head">
            <strong>${name}</strong>
            <span class="agent-state">${state}</span>
          </div>
          <span>${task}</span>
          <span>Linked: ${linkedCard}</span>
        </div>
      `,
    )
    .join("");
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
      const card = cards.find((item) => item.id === cardId);
      if (card) {
        card.column = list.dataset.column;
        renderBoard();
      }
    });
  });
}

function slug(value) {
  return value.toLowerCase().replaceAll(" ", "-");
}

document.querySelector("#newCardButton").addEventListener("click", () => {
  dialog.showModal();
});

cardForm.addEventListener("submit", (event) => {
  if (event.submitter?.value === "cancel") return;
  event.preventDefault();

  cards = [
    {
      id: `card-${Date.now()}`,
      column: document.querySelector("#cardColumn").value,
      title: document.querySelector("#cardTitle").value,
      outcome: document.querySelector("#cardOutcome").value,
      owner: "Founder",
      status: document.querySelector("#cardStatus").value,
      impact: 5,
      confidence: 5,
      risk: 5,
      context: ["Prompt"],
      gate: "Needs review",
    },
    ...cards,
  ];

  cardForm.reset();
  dialog.close();
  renderBoard();
});

searchInput.addEventListener("input", renderBoard);
statusFilter.addEventListener("change", renderBoard);

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.remove("active"));
    item.classList.add("active");
  });
});

renderRailLists();
renderBoard();
