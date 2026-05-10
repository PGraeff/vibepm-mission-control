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
  const [branch, remote, status, lastCommit] = await Promise.all([
    git(dir, ["branch", "--show-current"]),
    git(dir, ["remote", "get-url", "origin"]),
    git(dir, ["status", "--short"]),
    git(dir, ["log", "-1", "--pretty=%h %s"]),
  ]);

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
    detail: lastCommit || dir,
    linkedCardId: "",
    createdAt: new Date().toISOString(),
  });

  if (dirtyFiles.length) {
    cards.push(makeGeneratedCard({
      id: `generated-${id}-dirty`,
      column: "Build Watch",
      title: `${name}: uncommitted work`,
      outcome: `${dirtyFiles.length} changed files need review, commit, or cleanup.`,
      owner: "Codex",
      status: "Review",
      risk: Math.min(9, 4 + dirtyFiles.length),
      context: ["Git", "Local project"],
      gate: "Review dirty files",
      agentRuns: [`${dirtyFiles.length} changed files detected on ${branch || "current branch"}.`],
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
      title: `${name}: TODO/FIXME backlog`,
      outcome: `${todoFindings.length} TODO/FIXME comments may need product or engineering triage.`,
      owner: "Codex",
      status: "Signal",
      risk: 5,
      context: ["TODO", "Local project"],
      gate: "Needs triage",
      signals: todoFindings.slice(0, 8),
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

  return {
    id,
    name,
    path: dir,
    repo: remote,
    branch,
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
    decisions: [],
    checks:
      overrides.checks ||
      [
        { id: `${overrides.id}-review`, label: "Review generated signal", done: false },
        { id: `${overrides.id}-resolve`, label: "Resolve or accept risk", done: false },
      ],
    updatedAt: new Date().toISOString(),
  };
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
