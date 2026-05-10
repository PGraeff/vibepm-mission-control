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

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
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
  return await readJson(statePath, fallback || { version: 3, cards: [], projects: [], activity: [] });
}

async function saveState(state) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(statePath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function serveStatic(rawPath, res) {
  const pathname = rawPath === "/" ? "/index.html" : decodeURIComponent(rawPath);
  const filePath = path.normalize(path.join(__dirname, pathname));
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

  return {
    ...state,
    backend: {
      mode: "local-json",
      syncStatus: `Scanned ${scanned.projects.length} projects`,
      lastScannedAt: new Date().toISOString(),
      lastExportedAt: state.backend?.lastExportedAt || "",
    },
    projects: scanned.projects,
    activity: [...scanned.activity, ...manualActivity].slice(0, 100),
    cards: [...manualCards, ...generatedCards],
  };
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
    return JSON.parse(await readFile(filePath, "utf8"));
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
