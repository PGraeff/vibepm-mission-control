import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const config = await readJson(path.join(__dirname, "vibepm.config.json"), {
  port: 5174,
  projectRoots: [__dirname],
  maxDepth: 2,
  maxProjects: 24,
});
const dataDir = path.join(__dirname, ".data");
const statePath = path.join(dataDir, "vibepm-state.json");
const codexProgressPath = path.join(__dirname, "codex-progress.json");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".map": "application/json; charset=utf-8",
  ".sql": "text/plain; charset=utf-8",
  ".ps1": "text/plain; charset=utf-8",
};

if (process.argv.includes("--scan")) {
  const state = await loadState();
  const scanned = await scanWorkspace();
  const merged = mergeScannedState(state, scanned);
  await saveState(merged);
  console.log(`Scanned ${scanned.projects.length} projects into ${statePath}`);
  process.exit(0);
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === "/api/state" && req.method === "GET") {
      return sendJson(res, await loadState());
    }

    if (url.pathname === "/api/state" && req.method === "PUT") {
      const body = await readBody(req);
      const parsed = JSON.parse(body);
      await saveState(parsed);
      return sendJson(res, { ok: true });
    }

    if (url.pathname === "/api/scan" && req.method === "POST") {
      const state = await loadState();
      const scanned = await scanWorkspace();
      const merged = mergeScannedState(state, scanned);
      await saveState(merged);
      return sendJson(res, merged);
    }

    if (url.pathname === "/api/codex/work-items" && req.method === "POST") {
      const body = JSON.parse(await readBody(req));
      const state = await loadState();
      const result = await createCodexWorkItem(state, body);
      await saveState(result.state);
      return sendJson(res, { ok: true, card: result.card, githubIssueUrl: result.githubIssueUrl });
    }

    if (url.pathname === "/api/codex/activity" && req.method === "POST") {
      const body = JSON.parse(await readBody(req));
      const state = await loadState();
      const result = await recordCodexActivity(state, body);
      await saveState(result.state);
      return sendJson(res, { ok: true, activity: result.activity });
    }

    if (url.pathname === "/api/codex/resolve-issue" && req.method === "POST") {
      const body = JSON.parse(await readBody(req));
      const state = await loadState();
      const result = await resolveLinkedIssue(state, body);
      await saveState(result.state);
      return sendJson(res, { ok: true, card: result.card, closedIssueUrl: result.closedIssueUrl });
    }

    if (url.pathname === "/api/github/create-issue" && req.method === "POST") {
      const body = JSON.parse(await readBody(req));
      const state = await loadState();
      const result = await createGithubIssueForTask(state, body);
      await saveState(result.state);
      return sendJson(res, { ok: true, task: result.task, githubIssueUrl: result.githubIssueUrl });
    }

    return serveStatic(url.pathname, res);
  } catch (error) {
    console.error(error);
    sendJson(res, { error: error.message || "Server error" }, 500);
  }
}).listen(config.port, "127.0.0.1", () => {
  console.log(`VibePM running at http://127.0.0.1:${config.port}`);
});

async function loadState() {
  await mkdir(dataDir, { recursive: true });
  const fallback = await readJson(path.join(__dirname, "seed-state.json"), null);
  const state = await readJson(statePath, fallback || { version: 3, cards: [], projects: [], activity: [] });
  return normalizeWorkspaceState(await applyCodexProgress(state));
}

async function saveState(state) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function applyCodexProgress(state) {
  const progress = await readJson(codexProgressPath, { version: 1, entries: [], issues: [] });
  const progressActivity = (progress.entries || []).map((entry) => ({
    id: `codex-ledger-${entry.id}`,
    projectId: entry.projectId || progress.projectId || "",
    source: "Codex",
    status: entry.status || "Observed",
    title: entry.title,
    detail: entry.detail || "",
    linkedCardId: entry.linkedCardId || "",
    createdAt: entry.updatedAt || entry.createdAt || new Date().toISOString(),
  }));

  const existingIds = new Set((state.activity || []).map((item) => item.id));
  return {
    ...state,
    codexProgress: progress,
    activity: [...progressActivity.filter((item) => !existingIds.has(item.id)), ...(state.activity || [])].slice(0, 120),
  };
}

function normalizeWorkspaceState(state) {
  const projects = state.projects || [];
  const activity = state.activity || [];
  const cards = state.cards || [];
  const existingTasks = (state.tasks || []).map((task) => normalizeTask(task, projects, activity));
  const existingTaskIds = new Set(existingTasks.map((task) => task.id));
  const migratedTasks = cards
    .filter((card) => !isGithubIssueCard(card))
    .map((card) => taskFromCard(card, projects, activity))
    .filter((task) => {
      if (existingTaskIds.has(task.id)) return false;
      existingTaskIds.add(task.id);
      return true;
    });
  const inbox = mergeInboxItems([...(state.inbox || []), ...cards.filter(isGithubIssueCard).map(inboxFromCard), ...inboxFromCodexProgress(state)]);
  const sprints = (state.sprints?.length ? state.sprints : createDefaultSprints(projects, [...existingTasks, ...migratedTasks])).map(
    normalizeSprint,
  );
  const milestones = mergeMilestones(state.milestones || [], projects);

  return {
    ...state,
    version: 3,
    projects,
    activity,
    cards,
    tasks: [...existingTasks, ...migratedTasks],
    inbox,
    sprints,
    milestones,
  };
}

function normalizeTask(task, projects, activity) {
  return {
    id: task.id,
    projectId: task.projectId || projects[0]?.id || "",
    title: cleanTaskTitle(task.title || "Untitled task"),
    description: task.description || task.outcome || "",
    status: normalizeTaskStatus(task.status),
    priority: normalizePriority(task.priority || task.impact, task.risk),
    assignee: normalizeAssignee(task.assignee || task.owner),
    source: normalizeSource(task.source),
    labels: task.labels || [],
    sprintId: task.sprintId || "",
    milestoneId: task.milestoneId || "",
    links: task.links || [],
    checks: task.checks || [],
    activity: task.activity || activity.filter((item) => item.linkedCardId === task.id || item.taskId === task.id),
    createdAt: task.createdAt || task.updatedAt || new Date().toISOString(),
    updatedAt: task.updatedAt || new Date().toISOString(),
    launchGate: task.launchGate || task.gate || "",
  };
}

function taskFromCard(card, projects, activity) {
  const links = (card.context || []).filter((item) => /^https?:\/\//i.test(item));
  return normalizeTask(
    {
      id: card.id,
      projectId: card.projectId || projects[0]?.id || "",
      title: cleanTaskTitle(card.title),
      description: card.outcome || card.prd || "",
      status: card.status,
      priority: normalizePriority(card.impact, card.risk),
      assignee: card.owner || (card.source === "Codex" ? "Codex" : "Me"),
      source: card.source || inferSourceFromContext(card.context),
      labels: [...new Set([card.column, ...(card.context || []).filter((item) => !/^https?:\/\//i.test(item))])].filter(Boolean),
      sprintId: "",
      links,
      checks: card.checks || [],
      activity: [
        ...(card.agentRuns || []).map((run, index) => ({
          id: `run-${card.id}-${index}`,
          projectId: card.projectId || "",
          taskId: card.id,
          actor: "Codex",
          action: "logged work",
          title: run,
          detail: run,
          createdAt: card.updatedAt || new Date().toISOString(),
        })),
        ...activity.filter((item) => item.linkedCardId === card.id),
      ],
      createdAt: card.createdAt || card.updatedAt || new Date().toISOString(),
      updatedAt: card.updatedAt || new Date().toISOString(),
      launchGate: card.gate || "",
    },
    projects,
    activity,
  );
}

function inboxFromCard(card) {
  const link = findGithubIssueUrl(card);
  const issueTitle = card.outcome || card.title;
  const issueBody = card.signals?.[0] || card.outcome || "";
  return {
    id: `inbox-${card.id}`,
    projectId: card.projectId || "",
    source: "GitHub",
    title: issueTitle,
    body: issueBody,
    suggestedTask: {
      id: card.id,
      title: issueTitle,
      description: issueBody,
      priority: normalizePriority(card.impact, card.risk),
      source: "GitHub",
      assignee: "Me",
      links: link ? [link] : [],
      checks: card.checks || [{ id: `triage-${card.id}`, label: "Decide next step", done: false }],
      labels: card.context || ["GitHub"],
      launchGate: card.gate || "Triage GitHub issue",
    },
    state: "New",
    links: link ? [link] : [],
    labels: (card.context || []).filter((item) => !/^https?:\/\//i.test(item)),
    createdAt: card.updatedAt || new Date().toISOString(),
  };
}

function inboxFromCodexProgress(state) {
  return (state.codexProgress?.entries || [])
    .filter((entry) => entry.status !== "Complete")
    .map((entry) => ({
      id: `inbox-codex-${entry.id}`,
      projectId: entry.projectId || state.codexProgress?.projectId || "",
      source: "Codex",
      title: entry.title,
      body: entry.detail || "",
      suggestedTask: {
        id: `task-codex-${entry.id}`,
        title: entry.title,
        description: entry.detail || "",
        priority: "Medium",
        source: "Codex",
        assignee: "Codex",
        labels: ["Codex"],
      },
      state: "New",
      links: [],
      labels: ["Codex"],
      createdAt: entry.updatedAt || entry.createdAt || new Date().toISOString(),
    }));
}

function mergeInboxItems(items) {
  const seen = new Set();
  return items
    .map((item) => ({ ...item, state: item.state || "New", links: item.links || [], labels: item.labels || [] }))
    .filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
}

function createDefaultSprints(projects, tasks) {
  const now = new Date();
  const start = now.toISOString().slice(0, 10);
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + 14);
  return projects.map((project) => ({
    id: `sprint-${slug(project.name)}-current`,
    projectId: project.id,
    name: "Current Sprint",
    start,
    end: endDate.toISOString().slice(0, 10),
    status: "Active",
    taskIds: tasks.filter((task) => task.projectId === project.id && task.status !== "Done").slice(0, 8).map((task) => task.id),
  }));
}

function normalizeSprint(sprint) {
  return {
    id: sprint.id,
    projectId: sprint.projectId || "",
    name: sprint.name || "Current Sprint",
    start: sprint.start || "",
    end: sprint.end || "",
    status: sprint.status || "Active",
    taskIds: sprint.taskIds || [],
  };
}

function createDefaultMilestones(projects) {
  const templates = [
    ["make-it-run", "Make it run", "The project opens locally with clear setup instructions."],
    ["make-it-usable", "Make it usable", "The main user flow works without confusing steps."],
    ["make-it-reliable", "Make it reliable", "Basic tests, error states, and data backup are covered."],
    ["prepare-to-launch", "Prepare to launch", "Docs, GitHub issues, and launch checks are ready."],
    ["share-with-users", "Share with users", "A small group can try the app and give feedback."],
  ];
  return projects.flatMap((project) =>
    templates.map(([key, name, goal], index) => ({
      id: `milestone-${slug(project.name)}-${key}`,
      projectId: project.id,
      name,
      goal,
      status: index === 0 ? "Active" : "Not started",
      taskIds: [],
      order: index + 1,
    })),
  );
}

function mergeMilestones(existing, projects) {
  const projectIds = new Set(projects.map((project) => project.id));
  const vibepmProject = projects.find((project) => /vibepm/i.test(project.name));
  const existingMilestones = existing
    .map((milestone) => normalizeMilestone(migrateLegacyMilestone(milestone, vibepmProject)))
    .filter((milestone) => projectIds.has(milestone.projectId));
  const existingIds = new Set(existingMilestones.map((milestone) => milestone.id));
  const defaults = createDefaultMilestones(projects).filter((milestone) => !existingIds.has(milestone.id));
  return [...existingMilestones, ...defaults].sort((a, b) => {
    if (a.projectId !== b.projectId) return a.projectId.localeCompare(b.projectId);
    return a.order - b.order;
  });
}

function migrateLegacyMilestone(milestone, vibepmProject) {
  if (milestone.projectId !== "project-vibepm" || !vibepmProject) return milestone;
  const names = {
    "milestone-first-dogfood": ["First dogfood", "Use VibePM to manage its own development without manual side notes."],
    "milestone-github-loop": ["GitHub loop", "Create, update, and close GitHub issues from VibePM tasks."],
  };
  const [name, goal] = names[milestone.id] || [milestone.name, milestone.goal];
  return {
    ...milestone,
    projectId: vibepmProject.id,
    name,
    goal,
    order: milestone.order || 6,
  };
}

function normalizeMilestone(milestone) {
  return {
    id: milestone.id,
    projectId: milestone.projectId || "",
    name: milestone.name || "Milestone",
    goal: milestone.goal || "",
    status: ["Not started", "Active", "Done"].includes(milestone.status) ? milestone.status : "Not started",
    taskIds: milestone.taskIds || [],
    order: Number(milestone.order || 0),
  };
}

function isGithubIssueCard(card) {
  return /-gh-issue-\d+$/i.test(card.id) || (card.context || []).some((item) => /github\.com\/[^/]+\/[^/]+\/issues\/\d+/i.test(item));
}

function normalizeTaskStatus(status) {
  const map = {
    Signal: "Next",
    Draft: "Next",
    Spec: "Next",
    Active: "In progress",
    Review: "Needs Review",
    Guard: "Blocked",
    Ship: "Done",
    Blocked: "Blocked",
    Todo: "Next",
    Doing: "In progress",
    Next: "Next",
    "In progress": "In progress",
    "Needs Review": "Needs Review",
    Done: "Done",
  };
  return map[status] || "Next";
}

function cleanTaskTitle(title = "") {
  const withoutProject = title.replace(/^.+?:\s+/, "");
  return withoutProject
    .replace(/^add project operating brief$/i, "Add project brief")
    .replace(/^review current local work$/i, "Review local changes")
    .replace(/^README missing$/i, "Add README")
    .replace(/^triage code notes$/i, "Review code notes")
    .trim();
}

function normalizePriority(priority, risk = 5) {
  if (["Low", "Medium", "High", "Urgent"].includes(priority)) return priority;
  const score = Number(priority || 5);
  const riskScore = Number(risk || 5);
  if (riskScore >= 8) return "Urgent";
  if (score >= 8) return "High";
  if (score >= 5) return "Medium";
  return "Low";
}

function normalizeAssignee(owner) {
  if (!owner || /founder|reviewer/i.test(owner)) return "Me";
  if (/codex/i.test(owner)) return "Codex";
  if (/github/i.test(owner)) return "GitHub";
  return owner;
}

function normalizeSource(source) {
  if (["Manual", "Codex", "GitHub", "Project Scan", "Launch"].includes(source)) return source;
  if (/codex/i.test(source || "")) return "Codex";
  if (/github/i.test(source || "")) return "GitHub";
  return "Manual";
}

function inferSourceFromContext(context = []) {
  if (context.some((item) => /github/i.test(item))) return "GitHub";
  if (context.some((item) => /codex|agent/i.test(item))) return "Codex";
  if (context.some((item) => /launch|readme|todo|git/i.test(item))) return "Project Scan";
  return "Manual";
}

async function serveStatic(rawPath, res) {
  const pathname = rawPath === "/" ? "/index.html" : decodeURIComponent(rawPath);
  const distPath = path.normalize(path.join(__dirname, "dist", pathname));
  const rootPath = path.normalize(path.join(__dirname, pathname));
  const filePath = (await exists(distPath)) ? distPath : rootPath;
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    await stat(filePath);
    res.writeHead(200, { "Content-Type": mimeTypes[path.extname(filePath)] || "application/octet-stream" });
    createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

async function scanWorkspace() {
  const projectDirs = [];
  for (const root of config.projectRoots || []) {
    await findGitProjects(path.resolve(root), 0, projectDirs);
  }

  const uniqueDirs = [...new Set(projectDirs)].slice(0, config.maxProjects || 24);
  const projects = [];
  const activity = [];
  const cards = [];

  for (const dir of uniqueDirs) {
    const project = await inspectProject(dir);
    projects.push(project);
    activity.push(...project.activity);
    cards.push(...project.cards);
    delete project.activity;
    delete project.cards;
  }

  return { projects, activity, cards };
}

async function findGitProjects(dir, depth, results) {
  if (results.length >= (config.maxProjects || 24) || depth > (config.maxDepth || 2)) return;
  if (await exists(path.join(dir, ".git"))) {
    results.push(dir);
    return;
  }

  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith(".") || entry.name === "node_modules") continue;
    await findGitProjects(path.join(dir, entry.name), depth + 1, results);
  }
}

async function inspectProject(dir) {
  const name = path.basename(dir);
  const id = `project-${slug(name)}`;
  const playbook = await readProjectPlaybook(dir);
  const [branch, remote, status, lastCommit] = await Promise.all([
    git(dir, ["branch", "--show-current"]),
    git(dir, ["remote", "get-url", "origin"]),
    git(dir, ["status", "--short"]),
    git(dir, ["log", "-1", "--pretty=%h %s"]),
  ]);
  const github = await inspectGithub(remote, branch);

  const dirtyFiles = status.split("\n").filter(Boolean);
  const todoFindings = await findTodos(dir);
  const cards = [];
  const activity = [];

  activity.push({
    id: `activity-${id}-commit`,
    projectId: id,
    source: "Git",
    status: dirtyFiles.length ? "Active" : "Observed",
    title: lastCommit ? `Latest commit in ${name}` : `Project discovered: ${name}`,
    detail: playbook.currentFocus ? `${playbook.currentFocus} Latest: ${lastCommit || dir}` : lastCommit || dir,
    linkedCardId: "",
    createdAt: new Date().toISOString(),
  });

  for (const item of github.activity) {
    activity.push({ ...item, projectId: id });
  }

  if (dirtyFiles.length) {
    cards.push(makeGeneratedCard({
      id: `generated-${id}-dirty`,
      projectId: id,
      column: "Build Watch",
      title: `${name}: review current local work`,
      outcome: playbook.currentFocus
        ? `${dirtyFiles.length} changed files while working on: ${playbook.currentFocus}`
        : `${dirtyFiles.length} changed files need review, commit, or cleanup.`,
      owner: "Codex",
      status: "Review",
      risk: Math.min(9, 4 + dirtyFiles.length),
      context: ["Git", "Local project", playbook.hasPlaybook ? "VIBEPM.md" : "No playbook"],
      gate: "Review dirty files",
      agentRuns: [`${dirtyFiles.length} changed files detected on ${branch || "current branch"}.`],
      decisions: playbook.hasPlaybook ? [] : ["Add VIBEPM.md so generated cards reflect product intent."],
      checks: dirtyFiles.slice(0, 6).map((file, index) => ({
        id: `dirty-${slug(name)}-${index}`,
        label: file,
        done: false,
      })),
    }));
  }

  if (todoFindings.length) {
    cards.push(makeGeneratedCard({
      id: `generated-${id}-todos`,
      projectId: id,
      column: "Idea Intake",
      title: `${name}: triage code notes`,
      outcome: playbook.currentFocus
        ? `${todoFindings.length} TODO/FIXME comments found. Triage them against: ${playbook.currentFocus}`
        : `${todoFindings.length} TODO/FIXME comments may need product or engineering triage.`,
      owner: "Codex",
      status: "Signal",
      risk: 5,
      context: ["TODO", "Local project", playbook.hasPlaybook ? "VIBEPM.md" : "No playbook"],
      gate: "Needs triage",
      signals: todoFindings.slice(0, 8),
    }));
  }

  if (!playbook.hasPlaybook) {
    cards.push(makeGeneratedCard({
      id: `generated-${id}-playbook`,
      projectId: id,
      column: "Idea Intake",
      title: `${name}: add project operating brief`,
      outcome: "Add VIBEPM.md so Codex knows the product goal, current focus, useful commands, launch checks, and what to ignore.",
      owner: "Founder",
      status: "Draft",
      risk: 4,
      context: ["VIBEPM.md", "Project setup"],
      gate: "Add project playbook",
      checks: [{ id: `playbook-${slug(name)}`, label: "Create VIBEPM.md from docs/VIBEPM_TEMPLATE.md", done: false }],
    }));
  }

  if (!(await exists(path.join(dir, "README.md")))) {
    cards.push(makeGeneratedCard({
      id: `generated-${id}-readme`,
      projectId: id,
      column: "Launch Ready",
      title: `${name}: README missing`,
      outcome: "Project may be hard to hand off or launch without setup documentation.",
      owner: "Founder",
      status: "Guard",
      risk: 6,
      context: ["Docs", "Launch"],
      gate: "Add README before launch",
      checks: [{ id: `readme-${slug(name)}`, label: "Add README.md with run/test instructions", done: false }],
    }));
  }

  for (const issue of github.issues.slice(0, 5)) {
    cards.push(makeGeneratedCard({
      id: `generated-${id}-gh-issue-${issue.number}`,
      projectId: id,
      column: "Idea Intake",
      title: `${name}: GitHub issue #${issue.number}`,
      outcome: issue.title,
      owner: "Founder",
      status: "Signal",
      risk: issue.labels?.some((label) => /bug|block|urgent/i.test(label)) ? 7 : 4,
      context: ["GitHub Issue", issue.url],
      gate: "Triage GitHub issue",
      signals: [issue.body || issue.title],
    }));
  }

  for (const pr of github.pullRequests.slice(0, 5)) {
    cards.push(makeGeneratedCard({
      id: `generated-${id}-gh-pr-${pr.number}`,
      projectId: id,
      column: "Build Watch",
      title: `${name}: PR #${pr.number}`,
      outcome: pr.title,
      owner: pr.author || "GitHub",
      status: pr.isDraft ? "Draft" : "Review",
      risk: pr.reviewDecision === "CHANGES_REQUESTED" ? 8 : 5,
      context: ["GitHub PR", pr.url],
      gate: pr.reviewDecision === "APPROVED" ? "Approved PR" : "Review GitHub PR",
      agentRuns: [`GitHub PR state: ${pr.state}. Review: ${pr.reviewDecision || "Pending"}.`],
      checks: [{ id: `pr-${slug(name)}-${pr.number}`, label: `Review PR #${pr.number}`, done: pr.reviewDecision === "APPROVED" }],
    }));
  }

  if (github.checks.length) {
    const failing = github.checks.filter((check) => check.conclusion && !["success", "skipped", "neutral"].includes(check.conclusion));
    if (failing.length) {
      cards.push(makeGeneratedCard({
        id: `generated-${id}-gh-checks`,
        projectId: id,
        column: "Build Watch",
        title: `${name}: failing GitHub checks`,
        outcome: `${failing.length} GitHub check runs need attention on ${branch || "current branch"}.`,
        owner: "Codex",
        status: "Blocked",
        risk: 9,
        context: ["GitHub Actions", remote],
        gate: "Fix failing checks",
        checks: failing.slice(0, 6).map((check, index) => ({
          id: `check-${slug(name)}-${index}`,
          label: `${check.name}: ${check.conclusion}`,
          done: false,
        })),
      }));
    }
  }

  return {
    id,
    name,
    path: dir,
    repo: remote,
    branch,
    github,
    productGoal: playbook.productGoal,
    currentFocus: playbook.currentFocus,
    hasPlaybook: playbook.hasPlaybook,
    status: dirtyFiles.length ? "Active" : "Clean",
    dirtyFiles,
    latestCommit: lastCommit,
    linkedCards: cards.map((card) => card.id),
    updatedAt: new Date().toISOString(),
    activity,
    cards,
  };
}

function makeGeneratedCard(overrides) {
  return {
    id: overrides.id,
    projectId: overrides.projectId || "",
    generated: true,
    column: overrides.column,
    order: 900,
    title: overrides.title,
    outcome: overrides.outcome,
    owner: overrides.owner || "Codex",
    status: overrides.status || "Signal",
    impact: overrides.impact || 6,
    confidence: overrides.confidence || 7,
    risk: overrides.risk || 5,
    context: overrides.context || ["Local project"],
    gate: overrides.gate || "Needs review",
    prd: "",
    prdFields: {
      problem: overrides.outcome,
      targetUser: "Project owner",
      successMetric: "The local project signal is resolved or intentionally accepted.",
      assumptions: [],
      acceptance: [],
      risks: [`Risk score ${overrides.risk || 5}/10 from local scan.`],
      launchGate: overrides.gate || "Needs review",
    },
    prompt: "",
    agentSpec: {
      role: "Codex local project agent",
      context: overrides.outcome,
      doneChecks: [],
      verification: [],
    },
    signals: overrides.signals || [],
    agentRuns: overrides.agentRuns || [],
    decisions: overrides.decisions || [],
    checks:
      overrides.checks ||
      [
        { id: `${overrides.id}-review`, label: "Review generated signal", done: false },
        { id: `${overrides.id}-resolve`, label: "Resolve or accept risk", done: false },
      ],
    updatedAt: new Date().toISOString(),
  };
}

async function readProjectPlaybook(dir) {
  const filePath = path.join(dir, "VIBEPM.md");
  if (!(await exists(filePath))) {
    return { hasPlaybook: false, productGoal: "", currentFocus: "" };
  }

  const text = await readFile(filePath, "utf8");
  return {
    hasPlaybook: true,
    productGoal: extractSection(text, "Product Goal"),
    currentFocus: extractSection(text, "Current Focus"),
    raw: text.slice(0, 4000),
  };
}

async function inspectGithub(remote, branch) {
  const repo = parseGithubRepo(remote);
  if (!repo) {
    return { repo: "", issues: [], pullRequests: [], checks: [], activity: [] };
  }

  const [issues, pullRequests, checks] = await Promise.all([
    gh(["issue", "list", "--repo", repo, "--state", "open", "--limit", "10", "--json", "number,title,url,body,labels"]),
    gh(["pr", "list", "--repo", repo, "--state", "open", "--limit", "10", "--json", "number,title,url,state,isDraft,reviewDecision,author"]),
    branch
      ? gh(["run", "list", "--repo", repo, "--branch", branch, "--limit", "10", "--json", "name,conclusion,status,url,headBranch"])
      : Promise.resolve([]),
  ]);

  const normalizedIssues = issues.map((issue) => ({
    number: issue.number,
    title: issue.title,
    url: issue.url,
    body: issue.body,
    labels: (issue.labels || []).map((label) => label.name),
  }));

  const normalizedPrs = pullRequests.map((pr) => ({
    number: pr.number,
    title: pr.title,
    url: pr.url,
    state: pr.state,
    isDraft: pr.isDraft,
    reviewDecision: pr.reviewDecision,
    author: pr.author?.login || "",
  }));

  const normalizedChecks = checks.map((check) => ({
    name: check.name,
    conclusion: check.conclusion,
    status: check.status,
    url: check.url,
    headBranch: check.headBranch,
  }));

  const activity = [
    {
      id: `activity-github-${slug(repo)}-summary`,
      source: "GitHub",
      status: "Observed",
      title: `${repo}: GitHub context synced`,
      detail: `${normalizedIssues.length} open issues, ${normalizedPrs.length} open PRs, ${normalizedChecks.length} recent checks.`,
      linkedCardId: "",
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    repo,
    issues: normalizedIssues,
    pullRequests: normalizedPrs,
    checks: normalizedChecks,
    activity,
  };
}

function parseGithubRepo(remote) {
  if (!remote) return "";
  const httpsMatch = remote.match(/github\.com[:/](.+?\/.+?)(?:\.git)?$/i);
  return httpsMatch?.[1] || "";
}

async function gh(args) {
  return new Promise((resolve) => {
    execFile("gh", args, { timeout: 10000 }, (error, stdout) => {
      if (error) {
        resolve([]);
        return;
      }
      try {
        resolve(JSON.parse(stdout || "[]"));
      } catch {
        resolve([]);
      }
    });
  });
}

function extractSection(text, heading) {
  const pattern = new RegExp(`## ${heading}\\s+([\\s\\S]*?)(?=\\n## |$)`, "i");
  return (text.match(pattern)?.[1] || "").trim().replace(/\s+/g, " ").slice(0, 260);
}

function mergeScannedState(state, scanned) {
  const manualCards = (state.cards || []).filter((card) => !card.generated);
  const generatedCards = scanned.cards;
  const manualActivity = (state.activity || []).filter((item) => !item.id.includes("-project-") && item.source !== "Git");
  const previousProjects = new Map((state.projects || []).map((project) => [project.id, project]));
  const projects = scanned.projects.map((project) => {
    const previous = previousProjects.get(project.id) || {};
    return {
      ...project,
      productGoal: previous.productGoal || project.productGoal || "",
      currentFocus: previous.currentFocus || project.currentFocus || "",
      targetUser: previous.targetUser || project.targetUser || "",
      doneLooksLike: previous.doneLooksLike || project.doneLooksLike || "",
      avoidTouching: previous.avoidTouching || project.avoidTouching || "",
    };
  });

  return {
    ...state,
    backend: {
      mode: "local-json",
      syncStatus: `Scanned ${projects.length} projects`,
      lastScannedAt: new Date().toISOString(),
      lastExportedAt: state.backend?.lastExportedAt || "",
    },
    projects,
    activity: [...scanned.activity, ...manualActivity].slice(0, 100),
    cards: [...manualCards, ...generatedCards],
  };
}

async function createCodexWorkItem(state, body) {
  const project = state.projects.find((item) => item.id === body.projectId) || state.projects[0];
  if (!project) throw new Error("No project available for Codex work item");

  const card = makeGeneratedCard({
    id: body.id || `codex-${slug(project.name)}-${Date.now()}`,
    projectId: project.id,
    column: body.column || "Build Watch",
    title: body.title || "Codex work item",
    outcome: body.outcome || body.detail || "Codex created a work item.",
    owner: body.owner || "Codex",
    status: body.status || "Active",
    impact: body.impact || 6,
    confidence: body.confidence || 7,
    risk: body.risk || 5,
    context: ["Codex", "Local agent", ...(body.context || [])],
    gate: body.gate || "Track Codex work",
    agentRuns: [body.detail || body.outcome || "Codex work item created."],
    checks: (body.checks || ["Review implementation", "Verify behavior"]).map((label, index) => ({
      id: `codex-check-${Date.now()}-${index}`,
      label,
      done: false,
    })),
  });
  card.generated = false;
  card.source = "Codex";

  let githubIssueUrl = "";
  if (body.createGithubIssue && project.github?.repo) {
    githubIssueUrl = await createGithubIssue(project.github.repo, card);
    if (githubIssueUrl) {
      card.context.push(githubIssueUrl);
    }
  }

  state.cards = [...(state.cards || []).filter((item) => item.id !== card.id), card];
  state.activity = [
    {
      id: `activity-${card.id}`,
      projectId: project.id,
      source: "Codex",
      status: card.status,
      title: card.title,
      detail: card.outcome,
      linkedCardId: card.id,
      createdAt: new Date().toISOString(),
    },
    ...(state.activity || []),
  ].slice(0, 100);

  return { state, card, githubIssueUrl };
}

async function recordCodexActivity(state, body) {
  const project = state.projects.find((item) => item.id === body.projectId) || state.projects[0];
  const activity = {
    id: body.id || `activity-codex-${Date.now()}`,
    projectId: project?.id || body.projectId || "",
    source: "Codex",
    status: body.status || "Active",
    title: body.title || "Codex activity",
    detail: body.detail || "",
    linkedCardId: body.linkedCardId || "",
    createdAt: new Date().toISOString(),
  };
  state.activity = [activity, ...(state.activity || [])].slice(0, 120);
  return { state, activity };
}

async function resolveLinkedIssue(state, body) {
  const card = (state.cards || []).find((item) => item.id === body.cardId);
  const task = (state.tasks || []).find((item) => item.id === body.cardId);
  if (!card && !task) throw new Error("Work item not found");

  const issueUrl = card ? findGithubIssueUrl(card) : findGithubIssueUrlFromTask(task);
  let closedIssueUrl = "";
  if (issueUrl) {
    const issue = parseGithubIssueUrl(issueUrl);
    if (issue) {
      closedIssueUrl = await closeGithubIssue(issue.repo, issue.number, body.comment || `Resolved from VibePM card: ${card.title}`);
    }
  }

  if (card) {
    card.status = "Ship";
    card.column = "Launch Ready";
    card.checks = (card.checks || []).map((check) => ({ ...check, done: true }));
    card.decisions = [];
    card.updatedAt = new Date().toISOString();
    card.agentRuns = [...(card.agentRuns || []), closedIssueUrl ? `Closed GitHub issue ${closedIssueUrl}` : "Marked resolved in VibePM."];
  }

  if (task) {
    task.status = "Done";
    task.checks = (task.checks || []).map((check) => ({ ...check, done: true }));
    task.updatedAt = new Date().toISOString();
  }

  const title = task?.title || card.title;
  const projectId = task?.projectId || card.projectId || "";

  state.activity = [
    {
      id: `activity-resolved-${body.cardId}-${Date.now()}`,
      projectId,
      source: "Codex",
      status: "Complete",
      title: `Resolved: ${title}`,
      detail: closedIssueUrl ? `Closed linked GitHub issue: ${closedIssueUrl}` : "Marked resolved locally.",
      linkedCardId: body.cardId,
      createdAt: new Date().toISOString(),
    },
    ...(state.activity || []),
  ].slice(0, 120);

  return { state, card: task || card, closedIssueUrl };
}

function findGithubIssueUrl(card) {
  return (card.context || []).find((item) => /github\.com\/[^/]+\/[^/]+\/issues\/\d+/i.test(item)) || "";
}

function findGithubIssueUrlFromTask(task) {
  return (task.links || []).find((item) => /github\.com\/[^/]+\/[^/]+\/issues\/\d+/i.test(item)) || "";
}

async function createGithubIssueForTask(state, body) {
  const task = (state.tasks || []).find((item) => item.id === body.taskId);
  if (!task) throw new Error("Task not found");
  const project = (state.projects || []).find((item) => item.id === task.projectId);
  const repo = body.repo || project?.github?.repo || project?.repo;
  if (!repo) throw new Error("Project has no GitHub repo");

  const cardShape = {
    title: task.title,
    outcome: task.description,
    checks: task.checks || [],
  };
  const githubIssueUrl = await createGithubIssue(repo, cardShape);
  if (githubIssueUrl) {
    task.links = [...new Set([...(task.links || []), githubIssueUrl])];
    task.source = task.source === "Manual" ? "GitHub" : task.source;
    task.updatedAt = new Date().toISOString();
  }
  state.activity = [
    {
      id: `activity-github-create-${task.id}-${Date.now()}`,
      projectId: task.projectId,
      source: "GitHub",
      status: githubIssueUrl ? "Complete" : "Blocked",
      title: githubIssueUrl ? `Created GitHub issue for ${task.title}` : `Could not create GitHub issue for ${task.title}`,
      detail: githubIssueUrl || "GitHub CLI did not return an issue URL. Check gh auth and repo access.",
      linkedCardId: task.id,
      createdAt: new Date().toISOString(),
    },
    ...(state.activity || []),
  ].slice(0, 120);

  return { state, task, githubIssueUrl };
}

function parseGithubIssueUrl(url) {
  const match = url.match(/github\.com\/([^/]+\/[^/]+)\/issues\/(\d+)/i);
  if (!match) return null;
  return { repo: match[1], number: match[2] };
}

async function closeGithubIssue(repo, number, comment) {
  return new Promise((resolve) => {
    execFile(
      "gh",
      ["issue", "close", number, "--repo", repo, "--comment", comment],
      { timeout: 10000 },
      (error, stdout) => {
        if (error) {
          resolve("");
          return;
        }
        resolve(stdout.trim() || `https://github.com/${repo}/issues/${number}`);
      },
    );
  });
}

async function createGithubIssue(repo, card) {
  const body = [
    card.outcome,
    "",
    "Created by VibePM local Codex work item API.",
    "",
    "Checks:",
    ...card.checks.map((check) => `- [ ] ${check.label}`),
  ].join("\n");
  return new Promise((resolve) => {
    execFile(
      "gh",
      ["issue", "create", "--repo", repo, "--title", card.title, "--body", body],
      { timeout: 10000 },
      (error, stdout) => {
        resolve(error ? "" : stdout.trim());
      },
    );
  });
}

async function findTodos(dir) {
  const findings = [];
  const ignored = new Set([".git", "node_modules", "dist", "build", ".data"]);
  const extensions = new Set([".js", ".ts", ".tsx", ".jsx", ".css", ".html", ".md", ".json", ".py", ".ps1"]);

  async function walk(current, depth) {
    if (depth > 3 || findings.length >= 30) return;
    let entries = [];
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!ignored.has(entry.name)) await walk(fullPath, depth + 1);
        continue;
      }
      if (!extensions.has(path.extname(entry.name))) continue;
      let text = "";
      try {
        text = await readFile(fullPath, "utf8");
      } catch {
        continue;
      }
      text.split(/\r?\n/).forEach((line, index) => {
        if (/TODO|FIXME/i.test(line) && findings.length < 30) {
          findings.push(`${path.relative(dir, fullPath)}:${index + 1} ${line.trim()}`);
        }
      });
    }
  }

  await walk(dir, 0);
  return findings;
}

async function git(cwd, args) {
  return new Promise((resolve) => {
    execFile("git", args, { cwd, timeout: 5000 }, (error, stdout) => {
      resolve(error ? "" : stdout.trim());
    });
  });
}

async function exists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath, fallback) {
  try {
    const text = await readFile(filePath, "utf8");
    return JSON.parse(text.replace(/^\uFEFF/, ""));
  } catch {
    return fallback;
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 10_000_000) reject(new Error("Request body too large"));
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function sendJson(res, body, status = 200) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function slug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
