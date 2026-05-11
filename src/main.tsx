import React from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  Archive,
  Bot,
  CheckCircle2,
  ChevronRight,
  Circle,
  ClipboardList,
  ExternalLink,
  Flag,
  GitPullRequest,
  Inbox,
  LayoutList,
  PanelRightOpen,
  PlayCircle,
  Plus,
  Rocket,
  Search,
  Settings,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import "./styles.css";

type Status = "Next" | "In progress" | "Needs Review" | "Blocked" | "Done";
type Source = "Manual" | "Codex" | "GitHub" | "Project Scan" | "Launch";

type Project = {
  id: string;
  name: string;
  path?: string;
  repo?: string;
  branch?: string;
  status?: string;
  github?: {
    repo?: string;
    issues?: Array<{ number: number; title: string; url: string; body?: string; labels?: string[] }>;
    pullRequests?: unknown[];
    checks?: unknown[];
  };
  currentFocus?: string;
  productGoal?: string;
  targetUser?: string;
  doneLooksLike?: string;
  avoidTouching?: string;
  hasPlaybook?: boolean;
  latestCommit?: string;
};

type Check = {
  id: string;
  label: string;
  done: boolean;
};

type ActivityItem = {
  id: string;
  projectId?: string;
  taskId?: string;
  linkedCardId?: string;
  actor?: string;
  action?: string;
  source?: string;
  status?: string;
  title: string;
  detail?: string;
  createdAt: string;
};

type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: Status;
  priority: "Low" | "Medium" | "High" | "Urgent";
  assignee: "Me" | "Codex" | "GitHub" | string;
  source: Source;
  labels: string[];
  sprintId?: string;
  milestoneId?: string;
  links: string[];
  checks: Check[];
  activity: ActivityItem[];
  createdAt: string;
  updatedAt: string;
  launchGate?: string;
};

type InboxItem = {
  id: string;
  projectId: string;
  source: Source;
  title: string;
  body: string;
  suggestedTask: Partial<Task>;
  state: "New" | "Accepted" | "Ignored";
  links: string[];
  labels: string[];
  createdAt: string;
};

type Sprint = {
  id: string;
  projectId: string;
  name: string;
  start: string;
  end: string;
  status: "Planned" | "Active" | "Closed";
  taskIds: string[];
};

type Milestone = {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  status: "Not started" | "Active" | "Done";
  taskIds: string[];
  order: number;
};

type CodexProgress = {
  entries?: Array<{
    id: string;
    projectId?: string;
    status: string;
    title: string;
    detail?: string;
    files?: string[];
    updatedAt?: string;
    linkedCardId?: string;
  }>;
};

type AppState = {
  version: number;
  backend?: { mode?: string; syncStatus?: string; lastScannedAt?: string };
  projects: Project[];
  tasks: Task[];
  inbox: InboxItem[];
  sprints: Sprint[];
  milestones: Milestone[];
  activity: ActivityItem[];
  codexProgress?: CodexProgress;
};

type ViewKey = "my" | "inbox" | "projects" | "sprints" | "milestones" | "views" | "codex" | "launch" | "settings";

const statusOrder: Status[] = ["Next", "In progress", "Needs Review", "Blocked", "Done"];
const views: Array<{ key: ViewKey; label: string; icon: React.ElementType }> = [
  { key: "my", label: "My Tasks", icon: LayoutList },
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "projects", label: "Projects", icon: Target },
  { key: "sprints", label: "Sprints", icon: Timer },
  { key: "milestones", label: "Milestones", icon: Flag },
  { key: "views", label: "Views", icon: PanelRightOpen },
  { key: "codex", label: "Codex", icon: Bot },
  { key: "launch", label: "Launch", icon: Rocket },
  { key: "settings", label: "Settings", icon: Settings },
];

const savedViews = [
  { id: "all", name: "All tasks", filter: "Everything across every project" },
  { id: "me", name: "Assigned to me", filter: "Tasks owned by you" },
  { id: "codex", name: "Assigned to Codex", filter: "Tasks Codex can work on" },
  { id: "blocked", name: "Blocked", filter: "Anything stopping progress" },
  { id: "launch", name: "Ready to launch", filter: "Done or launch-tagged work" },
];

function App() {
  const [state, setState] = React.useState<AppState | null>(null);
  const [view, setView] = React.useState<ViewKey>("my");
  const [selectedProjectId, setSelectedProjectId] = React.useState("all");
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<Status | "All">("All");
  const [sourceFilter, setSourceFilter] = React.useState<Source | "All">("All");
  const [syncing, setSyncing] = React.useState(false);

  React.useEffect(() => {
    loadState().then(setState);
  }, []);

  const selectedTask = React.useMemo(
    () => state?.tasks.find((task) => task.id === selectedTaskId) || null,
    [state?.tasks, selectedTaskId],
  );

  const visibleTasks = React.useMemo(() => {
    if (!state) return [];
    return state.tasks
      .filter((task) => selectedProjectId === "all" || task.projectId === selectedProjectId)
      .filter((task) => statusFilter === "All" || task.status === statusFilter)
      .filter((task) => sourceFilter === "All" || task.source === sourceFilter)
      .filter((task) => {
        const haystack = [task.title, task.description, task.assignee, task.source, ...task.labels].join(" ").toLowerCase();
        return haystack.includes(query.toLowerCase());
      });
  }, [query, selectedProjectId, sourceFilter, state, statusFilter]);

  async function refreshProjects() {
    setSyncing(true);
    try {
      const response = await fetch("/api/scan", { method: "POST" });
      if (!response.ok) throw new Error("Scan failed");
      const nextState = await response.json();
      setState(nextState);
    } finally {
      setSyncing(false);
    }
  }

  async function save(next: AppState) {
    setState(next);
    await fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
  }

  async function updateTask(taskId: string, patch: Partial<Task>) {
    if (!state) return;
    const next = {
      ...state,
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...patch, updatedAt: new Date().toISOString() } : task,
      ),
    };
    await save(next);
  }

  async function updateProject(projectId: string, patch: Partial<Project>) {
    if (!state) return;
    await save({
      ...state,
      projects: state.projects.map((project) => (project.id === projectId ? { ...project, ...patch } : project)),
    });
  }

  async function updateMilestone(milestoneId: string, patch: Partial<Milestone>) {
    if (!state) return;
    await save({
      ...state,
      milestones: state.milestones.map((milestone) => (milestone.id === milestoneId ? { ...milestone, ...patch } : milestone)),
    });
  }

  async function createMilestone(projectId: string) {
    if (!state) return;
    const milestone: Milestone = {
      id: `milestone-${Date.now()}`,
      projectId,
      name: "New milestone",
      goal: "Describe the next visible outcome.",
      status: "Not started",
      taskIds: [],
      order: state.milestones.filter((item) => item.projectId === projectId).length + 1,
    };
    await save({ ...state, milestones: [...state.milestones, milestone] });
  }

  async function assignTaskToCodex(task: Task) {
    if (!state) return;
    await updateTask(task.id, { assignee: "Codex", status: "In progress", source: task.source === "Manual" ? "Codex" : task.source });
    const response = await fetch("/api/codex/work-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        detail: task.description,
        outcome: task.description,
        status: "Active",
        checks: task.checks.map((check) => check.label),
        context: [...task.labels, ...task.links],
      }),
    });
    if (response.ok) {
      const next = await loadState();
      setState(next);
      setSelectedTaskId(task.id);
    }
  }

  async function createGithubIssueForTask(task: Task) {
    const response = await fetch("/api/github/create-issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id }),
    });
    if (response.ok) {
      const next = await loadState();
      setState(next);
      setSelectedTaskId(task.id);
    }
  }

  async function acceptInbox(item: InboxItem, assignee: Task["assignee"] = "Me") {
    if (!state) return;
    const task: Task = {
      id: item.suggestedTask.id || `task-${Date.now()}`,
      projectId: item.projectId,
      title: item.suggestedTask.title || item.title,
      description: item.suggestedTask.description || item.body,
      status: assignee === "Codex" ? "In progress" : "Next",
      priority: item.suggestedTask.priority || "Medium",
      assignee,
      source: item.source,
      labels: [...new Set([...(item.labels || []), ...(item.suggestedTask.labels || [])])],
      sprintId: item.suggestedTask.sprintId || activeSprintForProject(state, item.projectId)?.id || "",
      milestoneId: item.suggestedTask.milestoneId || activeMilestoneForProject(state, item.projectId)?.id || "",
      links: item.links || [],
      checks: item.suggestedTask.checks || [{ id: `check-${Date.now()}`, label: "Decide next step", done: false }],
      activity: [
        {
          id: `activity-${Date.now()}`,
          taskId: item.suggestedTask.id || item.id,
          projectId: item.projectId,
          actor: "VibePM",
          action: assignee === "Codex" ? "assigned to Codex" : "accepted from Inbox",
          title: item.title,
          detail: item.body,
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      launchGate: item.suggestedTask.launchGate || "Define done",
    };
    const next = {
      ...state,
      tasks: [task, ...state.tasks],
      inbox: state.inbox.map((entry) => (entry.id === item.id ? { ...entry, state: "Accepted" as const } : entry)),
      activity: [task.activity[0], ...state.activity],
    };
    await save(next);
    setView("my");
    setSelectedTaskId(task.id);
  }

  async function ignoreInbox(itemId: string) {
    if (!state) return;
    await save({
      ...state,
      inbox: state.inbox.map((item) => (item.id === itemId ? { ...item, state: "Ignored" as const } : item)),
    });
  }

  async function createTask() {
    if (!state) return;
    const projectId = selectedProjectId === "all" ? state.projects[0]?.id || "project-vibepm" : selectedProjectId;
    const task: Task = {
      id: `task-${Date.now()}`,
      projectId,
      title: "New task",
      description: "Describe the outcome you want.",
      status: "Next",
      priority: "Medium",
      assignee: "Me",
      source: "Manual",
      labels: [],
      sprintId: activeSprintForProject(state, projectId)?.id || "",
      milestoneId: activeMilestoneForProject(state, projectId)?.id || "",
      links: [],
      checks: [{ id: `check-${Date.now()}`, label: "Define done", done: false }],
      activity: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      launchGate: "Define done",
    };
    await save({ ...state, tasks: [task, ...state.tasks] });
    setSelectedTaskId(task.id);
  }

  async function importBackup(file: File) {
    const imported = JSON.parse(await file.text()) as AppState;
    await save(imported);
  }

  if (!state) return <LoadingScreen />;

  const appState = state;
  const selectedProject = selectedProjectId === "all" ? null : appState.projects.find((project) => project.id === selectedProjectId);
  const newInboxCount = appState.inbox.filter((item) => item.state === "New").length;
  const blockedCount = visibleTasks.filter((task) => task.status === "Blocked").length;
  const activeCodexCount = visibleTasks.filter((task) => task.assignee === "Codex" && task.status !== "Done").length;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">V</div>
          <div>
            <strong>VibePM</strong>
            <span>{appState.backend?.syncStatus || "Local workspace"}</span>
          </div>
        </div>

        <label className="project-picker">
          <span>Project</span>
          <select value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
            <option value="all">All projects</option>
            {appState.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <nav className="nav-list">
          {views.map((item) => {
            const Icon = item.icon;
            const count =
              item.key === "inbox"
                ? newInboxCount
                : item.key === "launch"
                  ? readyToLaunch(appState.tasks).length
                  : item.key === "codex"
                    ? activeCodexCount
                    : 0;
            return (
              <button
                key={item.key}
                className={view === item.key ? "active" : ""}
                type="button"
                onClick={() => setView(item.key)}
              >
                <Icon size={17} />
                <span>{item.label}</span>
                {count > 0 ? <small>{count}</small> : null}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <span className="live-dot" />
          <span>Local, GitHub, Codex</span>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p>{selectedProject?.name || "All projects"}</p>
            <h1>{titleForView(view)}</h1>
          </div>
          <div className="command-bar">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks, projects, Codex work" />
            <kbd>Ctrl K</kbd>
          </div>
          <button className="secondary" type="button" onClick={refreshProjects} disabled={syncing}>
            <GitPullRequest size={16} />
            {syncing ? "Syncing" : "Sync"}
          </button>
          <button className="primary" type="button" onClick={createTask}>
            <Plus size={16} />
            Task
          </button>
        </header>

        <div className="filters">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as Status | "All")}>
            <option value="All">Any status</option>
            {statusOrder.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as Source | "All")}>
            <option value="All">Any source</option>
            <option value="Manual">Manual</option>
            <option value="Codex">Codex</option>
            <option value="GitHub">GitHub</option>
            <option value="Project Scan">Project Scan</option>
            <option value="Launch">Launch</option>
          </select>
          <span>{taskCountLabel(visibleTasks.length)}</span>
          {blockedCount ? <span className="danger">{blockedCount} blocked</span> : <span className="ok">No blockers</span>}
        </div>

        <section className="content">{renderView()}</section>
      </main>

      {selectedTask ? (
        <TaskDrawer
          task={selectedTask}
          project={appState.projects.find((project) => project.id === selectedTask.projectId)}
          milestones={appState.milestones.filter((milestone) => milestone.projectId === selectedTask.projectId)}
          activity={appState.activity.filter(
            (activity) => activity.taskId === selectedTask.id || activity.linkedCardId === selectedTask.id,
          )}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={(patch) => updateTask(selectedTask.id, patch)}
          onAssignCodex={() => assignTaskToCodex(selectedTask)}
          onCreateGithubIssue={() => createGithubIssueForTask(selectedTask)}
          onResolve={async () => {
            const response = await fetch("/api/codex/resolve-issue", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ cardId: selectedTask.id }),
            });
            if (response.ok) {
              const next = await loadState();
              setState(next);
              setSelectedTaskId(selectedTask.id);
            } else {
              await updateTask(selectedTask.id, { status: "Done" });
            }
          }}
        />
      ) : null}
    </div>
  );

  function renderView() {
    if (view === "my") {
      const myTasks = visibleTasks.filter((task) => task.status !== "Done");
      return (
        <>
          <WorkspaceBrief tasks={visibleTasks} inboxCount={newInboxCount} />
          <TaskList tasks={myTasks} projects={appState.projects} onOpen={setSelectedTaskId} empty="No active tasks. Pull something from Inbox or create a task." />
        </>
      );
    }

    if (view === "inbox") {
      return (
        <InboxView
          items={appState.inbox.filter((item) => selectedProjectId === "all" || item.projectId === selectedProjectId)}
          projects={appState.projects}
          onAccept={acceptInbox}
          onIgnore={ignoreInbox}
        />
      );
    }

    if (view === "projects") {
      return (
        <ProjectsView
          projects={appState.projects}
          tasks={appState.tasks}
          selectedProjectId={selectedProjectId}
          onOpenTask={setSelectedTaskId}
          onSelectProject={setSelectedProjectId}
          onUpdateProject={updateProject}
        />
      );
    }

    if (view === "sprints") {
      return (
        <SprintsView
          sprints={appState.sprints}
          tasks={visibleTasks}
          projects={appState.projects}
          selectedProjectId={selectedProjectId}
          onOpenTask={setSelectedTaskId}
          onSelectProject={setSelectedProjectId}
        />
      );
    }

    if (view === "milestones") {
      return (
        <MilestonesView
          milestones={appState.milestones}
          tasks={visibleTasks}
          projects={appState.projects}
          selectedProjectId={selectedProjectId}
          onOpenTask={setSelectedTaskId}
          onSelectProject={setSelectedProjectId}
          onUpdateMilestone={updateMilestone}
          onCreateMilestone={createMilestone}
        />
      );
    }

    if (view === "views") {
      return <SavedViewsView tasks={appState.tasks} projects={appState.projects} onOpenTask={setSelectedTaskId} />;
    }

    if (view === "codex") {
      return <CodexView state={appState} tasks={visibleTasks} selectedProjectId={selectedProjectId} onOpenTask={setSelectedTaskId} />;
    }

    if (view === "launch") {
      return <LaunchView tasks={readyToLaunch(visibleTasks)} projects={appState.projects} onOpenTask={setSelectedTaskId} />;
    }

    return <SettingsView state={appState} onImport={importBackup} />;
  }
}

function TaskList({
  tasks,
  projects,
  onOpen,
  empty,
}: {
  tasks: Task[];
  projects: Project[];
  onOpen: (id: string) => void;
  empty: string;
}) {
  if (!tasks.length) return <EmptyState title={empty} icon={ClipboardList} />;
  return (
    <div className="task-list">
      {statusOrder.map((status) => {
        const group = tasks.filter((task) => task.status === status);
        if (!group.length) return null;
        return (
          <section className="task-group" key={status}>
            <div className="group-title">
              <StatusIcon status={status} />
              <strong>{status}</strong>
              <span>{group.length}</span>
            </div>
            {group.map((task) => (
              <TaskRow key={task.id} task={task} project={projects.find((project) => project.id === task.projectId)} onOpen={onOpen} />
            ))}
          </section>
        );
      })}
    </div>
  );
}

function WorkspaceBrief({ tasks, inboxCount }: { tasks: Task[]; inboxCount: number }) {
  const blocked = tasks.filter((task) => task.status === "Blocked").length;
  return (
    <section className="workspace-brief">
      <Metric label="Tasks" value={tasks.length} />
      <Metric label="Inbox" value={inboxCount} />
      <Metric label="Blocked" value={blocked} />
      <div className="start-guide">
        <Sparkles size={17} />
        <span>Start in Inbox, accept useful work, assign some to Codex, then track it here.</span>
      </div>
    </section>
  );
}

function TaskRow({ task, project, onOpen }: { task: Task; project?: Project; onOpen: (id: string) => void }) {
  return (
    <button className="task-row" type="button" onClick={() => onOpen(task.id)}>
      <StatusIcon status={task.status} />
      <div className="task-main">
        <strong>{task.title}</strong>
        <span>{nextActionForTask(task)}</span>
      </div>
      <div className="task-chips">
        <Chip>{task.assignee === "Codex" ? "Codex" : "You"}</Chip>
        <Chip tone={task.status === "Blocked" ? "red" : task.status === "Done" ? "green" : "default"}>{task.status}</Chip>
      </div>
      <ChevronRight size={16} />
    </button>
  );
}

function InboxView({
  items,
  projects,
  onAccept,
  onIgnore,
}: {
  items: InboxItem[];
  projects: Project[];
  onAccept: (item: InboxItem, assignee?: Task["assignee"]) => void;
  onIgnore: (itemId: string) => void;
}) {
  const openItems = items.filter((item) => item.state === "New");
  if (!openItems.length) return <EmptyState title="Inbox is clear." icon={Inbox} />;
  return (
    <div className="inbox-grid">
      {openItems.map((item) => (
        <article className="inbox-card" key={item.id}>
          <div className="card-head">
            <Chip tone={sourceTone(item.source)}>{item.source}</Chip>
            <span>{projects.find((project) => project.id === item.projectId)?.name || "Project"}</span>
          </div>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
          <div className="label-row">{item.labels.map((label) => <Chip key={label}>{label}</Chip>)}</div>
          <div className="actions">
            <button className="primary" type="button" onClick={() => onAccept(item, "Me")}>
              Accept
            </button>
            <button className="secondary" type="button" onClick={() => onAccept(item, "Codex")}>
              Send to Codex
            </button>
            {item.links[0] ? (
              <a className="ghost" href={item.links[0]} target="_blank" rel="noreferrer">
                <ExternalLink size={14} />
                Source
              </a>
            ) : null}
            <button className="ghost" type="button" onClick={() => onIgnore(item.id)}>
              Ignore
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function ProjectsView({
  projects,
  tasks,
  selectedProjectId,
  onOpenTask,
  onSelectProject,
  onUpdateProject,
}: {
  projects: Project[];
  tasks: Task[];
  selectedProjectId: string;
  onOpenTask: (id: string) => void;
  onSelectProject: (id: string) => void;
  onUpdateProject: (projectId: string, patch: Partial<Project>) => void;
}) {
  const selectedProject = selectedProjectId === "all" ? null : projects.find((project) => project.id === selectedProjectId);
  if (selectedProject) {
    const projectTasks = tasks.filter((task) => task.projectId === selectedProject.id);
    return (
      <div className="project-focus">
        <ProjectBriefForm project={selectedProject} tasks={projectTasks} onUpdate={(patch) => onUpdateProject(selectedProject.id, patch)} />
        <ProjectIntelligence project={selectedProject} tasks={projectTasks} />
      </div>
    );
  }

  return (
    <div className="project-grid">
      {projects.map((project) => {
        const projectTasks = tasks.filter((task) => task.projectId === project.id);
        const done = projectTasks.filter((task) => task.status === "Done").length;
        const ready = projectTasks.filter((task) => task.status === "Done" || task.labels.includes("Launch")).length;
        return (
          <article className="project-card" key={project.id}>
            <div className="card-head">
              <h3>{project.name}</h3>
              <Chip tone={project.status === "Active" ? "blue" : "default"}>{project.status || "Tracked"}</Chip>
            </div>
            <p>{project.currentFocus || project.productGoal || "No project brief yet."}</p>
            <div className="project-metrics">
              <Metric label="Tasks" value={projectTasks.length} />
              <Metric label="Done" value={done} />
              <Metric label="Launch" value={ready} />
            </div>
            <div className="meta-stack">
              <span>{project.github?.repo || project.repo || "No GitHub repo connected"}</span>
              <span>{project.hasPlaybook ? "Brief connected" : "Needs VIBEPM.md"}</span>
            </div>
            <div className="project-actions">
              <button className="secondary" type="button" onClick={() => onSelectProject(project.id)}>
                Focus Project
              </button>
              <span>{projectTasks.length ? `${projectTasks.length} total tasks` : "No tasks yet"}</span>
            </div>
            <CompactTaskPreview tasks={projectTasks.slice(0, 2)} onOpen={onOpenTask} />
          </article>
        );
      })}
    </div>
  );
}

function CompactTaskPreview({ tasks, onOpen }: { tasks: Task[]; onOpen: (id: string) => void }) {
  if (!tasks.length) return null;
  return (
    <div className="compact-task-list">
      {tasks.map((task) => (
        <button key={task.id} type="button" onClick={() => onOpen(task.id)}>
          <StatusIcon status={task.status} />
          <span>{task.title}</span>
          <Chip tone={task.status === "Blocked" ? "red" : "default"}>{task.status}</Chip>
        </button>
      ))}
    </div>
  );
}

function ProjectBriefForm({ project, tasks, onUpdate }: { project: Project; tasks: Task[]; onUpdate: (patch: Partial<Project>) => void }) {
  const setupDone = [project.productGoal, project.targetUser, project.doneLooksLike, project.avoidTouching, project.github?.repo || project.repo].filter(Boolean).length;
  return (
    <section className="panel project-setup">
      <div className="section-title">
        <div>
          <h2>Project setup</h2>
          <p>Teach VibePM and Codex what this project is trying to become.</p>
        </div>
        <Chip tone={setupDone >= 4 ? "green" : "amber"}>{setupDone}/5</Chip>
      </div>
      <div className="setup-grid">
        <label className="field">
          <span>What is this project?</span>
          <input value={project.productGoal || ""} onChange={(event) => onUpdate({ productGoal: event.target.value })} placeholder="A simple sentence about the product" />
        </label>
        <label className="field">
          <span>Who is it for?</span>
          <input value={project.targetUser || ""} onChange={(event) => onUpdate({ targetUser: event.target.value })} placeholder="Vibe coders, founders, internal team..." />
        </label>
        <label className="field">
          <span>What should be done next?</span>
          <input value={project.currentFocus || ""} onChange={(event) => onUpdate({ currentFocus: event.target.value })} placeholder="The next useful product outcome" />
        </label>
        <label className="field">
          <span>GitHub repo</span>
          <input value={project.github?.repo || project.repo || ""} onChange={(event) => onUpdate({ repo: event.target.value })} placeholder="owner/repo" />
        </label>
        <label className="field wide-field">
          <span>Local folder</span>
          <input value={project.path || ""} onChange={(event) => onUpdate({ path: event.target.value })} placeholder="C:\\Users\\you\\project" />
        </label>
        <label className="field">
          <span>What does done look like?</span>
          <input value={project.doneLooksLike || ""} onChange={(event) => onUpdate({ doneLooksLike: event.target.value })} placeholder="A working flow users can test" />
        </label>
        <label className="field wide-field">
          <span>What should Codex avoid?</span>
          <textarea value={project.avoidTouching || ""} onChange={(event) => onUpdate({ avoidTouching: event.target.value })} placeholder="Generated files, secrets, billing, migrations..." />
        </label>
      </div>
      <div className="project-metrics">
        <Metric label="Tasks" value={tasks.length} />
        <Metric label="Done" value={tasks.filter((task) => task.status === "Done").length} />
        <Metric label="Blocked" value={tasks.filter((task) => task.status === "Blocked").length} />
      </div>
    </section>
  );
}

function ProjectIntelligence({ project, tasks }: { project: Project; tasks: Task[] }) {
  const signals = [
    project.hasPlaybook ? "Project brief is connected." : "Add a project brief so Codex understands the goal.",
    project.github?.repo || project.repo ? `GitHub: ${project.github?.repo || project.repo}` : "Connect a GitHub repo when this project is ready for issues.",
    tasks.some((task) => task.status === "Blocked") ? "There are blockers to clear before launch." : "No blockers found for this project.",
    tasks.some((task) => task.title.toLowerCase().includes("readme")) ? "Documentation needs attention." : "No README warning is active.",
    project.avoidTouching ? "Codex guardrails are written." : "Add Codex guardrails before assigning risky work.",
  ];
  return (
    <section className="panel">
      <div className="section-title">
        <div>
          <h2>Project intelligence</h2>
          <p>Plain-language signals from the repo and setup brief.</p>
        </div>
        <Sparkles size={18} />
      </div>
      <div className="signal-list">
        {signals.map((signal) => (
          <div className="signal-row" key={signal}>
            <CheckCircle2 size={16} />
            <span>{signal}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SprintsView({
  sprints,
  tasks,
  projects,
  selectedProjectId,
  onOpenTask,
  onSelectProject,
}: {
  sprints: Sprint[];
  tasks: Task[];
  projects: Project[];
  selectedProjectId: string;
  onOpenTask: (id: string) => void;
  onSelectProject: (id: string) => void;
}) {
  const active = sprints.filter(
    (sprint) => sprint.status === "Active" && (selectedProjectId === "all" || sprint.projectId === selectedProjectId),
  );

  if (selectedProjectId === "all") {
    return (
      <div className="sprint-page">
        <section className="panel sprint-focus">
          <div className="section-title">
            <div>
              <h2>Pick a project</h2>
              <p>Sprints stay useful when they focus on one project at a time.</p>
            </div>
            <Chip tone="blue">{projects.length} projects</Chip>
          </div>
          <div className="sprint-project-list">
            {projects.map((project) => {
              const sprint = sprints.find((entry) => entry.projectId === project.id && entry.status === "Active");
              const sprintTasks = sprint
                ? tasks.filter((task) => task.projectId === project.id && (task.sprintId === sprint.id || sprint.taskIds.includes(task.id)))
                : [];
              const blocked = sprintTasks.filter((task) => task.status === "Blocked").length;
              return (
                <button key={project.id} type="button" onClick={() => onSelectProject(project.id)}>
                  <span>
                    <strong>{project.name}</strong>
                    <small>{sprint ? `${taskCountLabel(sprintTasks.length)} this sprint` : "No sprint yet"}</small>
                  </span>
                  {blocked ? <Chip tone="red">{blocked} blocked</Chip> : <Chip>Open</Chip>}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  if (!active.length) return <EmptyState title="No active sprint for this project yet." icon={Timer} />;

  const sprint = active[0];
  const project = projects.find((entry) => entry.id === sprint.projectId);
  const sprintTasks = tasks.filter((task) => task.sprintId === sprint.id || sprint.taskIds.includes(task.id));
  const done = sprintTasks.filter((task) => task.status === "Done").length;
  const blocked = sprintTasks.filter((task) => task.status === "Blocked").length;
  const remaining = Math.max(sprintTasks.length - done, 0);

  return (
    <div className="sprint-page">
      <section className="panel sprint-focus">
        <div className="sprint-heading">
          <div>
            <p>{project?.name || "Project"}</p>
            <h2>{sprint.name}</h2>
            <span>
              {sprint.start} to {sprint.end}
            </span>
          </div>
          <Chip tone="blue">Active</Chip>
        </div>
        <div className="sprint-summary">
          <Metric label="To finish" value={remaining} />
          <Metric label="Done" value={done} />
          <Metric label="Blocked" value={blocked} />
        </div>
      </section>
      <section className="panel sprint-task-panel">
        <div className="section-title">
          <div>
            <h2>This sprint</h2>
            <p>Work selected for this project right now.</p>
          </div>
          <Chip>{taskCountLabel(sprintTasks.length)}</Chip>
        </div>
        <TaskList tasks={sprintTasks} projects={projects} onOpen={onOpenTask} empty="No sprint tasks yet." />
      </section>
    </div>
  );
}

function MilestonesView({
  milestones,
  tasks,
  projects,
  selectedProjectId,
  onOpenTask,
  onSelectProject,
  onUpdateMilestone,
  onCreateMilestone,
}: {
  milestones: Milestone[];
  tasks: Task[];
  projects: Project[];
  selectedProjectId: string;
  onOpenTask: (id: string) => void;
  onSelectProject: (id: string) => void;
  onUpdateMilestone: (milestoneId: string, patch: Partial<Milestone>) => void;
  onCreateMilestone: (projectId: string) => void;
}) {
  const project = selectedProjectId === "all" ? null : projects.find((item) => item.id === selectedProjectId);
  if (!project) {
    return (
      <div className="sprint-page">
        <section className="panel sprint-focus">
          <div className="section-title">
            <div>
              <h2>Pick a project</h2>
              <p>Milestones are editable project steps, so choose one project first.</p>
            </div>
            <Chip tone="blue">{projects.length} projects</Chip>
          </div>
          <div className="sprint-project-list">
            {projects.map((item) => (
              <button key={item.id} type="button" onClick={() => onSelectProject(item.id)}>
                <span>
                  <strong>{item.name}</strong>
                  <small>{milestones.filter((milestone) => milestone.projectId === item.id).length} milestones</small>
                </span>
                <Chip>Open</Chip>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  const projectMilestones = milestones
    .filter((milestone) => milestone.projectId === project.id)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="milestone-page">
      <section className="panel">
        <div className="section-title">
          <div>
            <h2>{project.name} milestones</h2>
            <p>Simple steps from first working version to launch.</p>
          </div>
          <button className="secondary" type="button" onClick={() => onCreateMilestone(project.id)}>
            <Plus size={15} />
            Milestone
          </button>
        </div>
        <div className="milestone-list">
          {projectMilestones.map((milestone) => {
            const milestoneTasks = tasks.filter((task) => task.milestoneId === milestone.id || milestone.taskIds.includes(task.id));
            return (
              <article className="milestone-card" key={milestone.id}>
                <div className="milestone-edit">
                  <input value={milestone.name} onChange={(event) => onUpdateMilestone(milestone.id, { name: event.target.value })} />
                  <select value={milestone.status} onChange={(event) => onUpdateMilestone(milestone.id, { status: event.target.value as Milestone["status"] })}>
                    <option>Not started</option>
                    <option>Active</option>
                    <option>Done</option>
                  </select>
                </div>
                <textarea value={milestone.goal} onChange={(event) => onUpdateMilestone(milestone.id, { goal: event.target.value })} />
                <CompactTaskPreview tasks={milestoneTasks.slice(0, 4)} onOpen={onOpenTask} />
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function SavedViewsView({ tasks, projects, onOpenTask }: { tasks: Task[]; projects: Project[]; onOpenTask: (id: string) => void }) {
  function tasksFor(viewId: string) {
    if (viewId === "me") return tasks.filter((task) => task.assignee === "Me");
    if (viewId === "codex") return tasks.filter((task) => task.assignee === "Codex");
    if (viewId === "blocked") return tasks.filter((task) => task.status === "Blocked");
    if (viewId === "launch") return readyToLaunch(tasks);
    return tasks;
  }

  return (
    <div className="views-grid">
      {savedViews.map((savedView) => {
        const scoped = tasksFor(savedView.id);
        return (
          <section className="panel" key={savedView.id}>
            <div className="section-title">
              <div>
                <h2>{savedView.name}</h2>
                <p>{savedView.filter}</p>
              </div>
              <Chip>{scoped.length}</Chip>
            </div>
            <TaskList tasks={scoped.slice(0, 6)} projects={projects} onOpen={onOpenTask} empty="Nothing here." />
          </section>
        );
      })}
    </div>
  );
}

function CodexView({
  state,
  tasks,
  selectedProjectId,
  onOpenTask,
}: {
  state: AppState;
  tasks: Task[];
  selectedProjectId: string;
  onOpenTask: (id: string) => void;
}) {
  const codexTasks = tasks.filter((task) => task.assignee === "Codex" || task.source === "Codex");
  const logEntries = (state.codexProgress?.entries || []).filter(
    (entry) => selectedProjectId === "all" || entry.projectId === selectedProjectId,
  );
  const lanes: Array<{ label: string; tasks: Task[] }> = [
    { label: "Queued", tasks: codexTasks.filter((task) => task.status === "Next") },
    { label: "Working", tasks: codexTasks.filter((task) => task.status === "In progress") },
    { label: "Needs Review", tasks: codexTasks.filter((task) => task.status === "Needs Review") },
    { label: "Done", tasks: codexTasks.filter((task) => task.status === "Done") },
  ];
  return (
    <div className="split-content">
      <section className="panel">
        <div className="section-title">
          <div>
            <h2>Codex board</h2>
            <p>Work assigned to the AI teammate.</p>
          </div>
          <Bot size={18} />
        </div>
        <div className="codex-board">
          {lanes.map((lane) => (
            <div className="codex-lane" key={lane.label}>
              <div className="card-head">
                <strong>{lane.label}</strong>
                <Chip>{lane.tasks.length}</Chip>
              </div>
              <CompactTaskPreview tasks={lane.tasks.slice(0, 6)} onOpen={onOpenTask} />
              {!lane.tasks.length ? <div className="mini-empty">Nothing here.</div> : null}
            </div>
          ))}
        </div>
      </section>
      <section className="panel">
        <div className="section-title">
          <div>
            <h2>Live Log</h2>
            <p>Updates from codex-progress.json.</p>
          </div>
          <Activity size={18} />
        </div>
        <div className="activity-list">
          {logEntries.map((entry) => (
            <CodexLogItem key={entry.id} entry={entry} />
          ))}
          {!logEntries.length ? <div className="mini-empty">No Codex updates for this project yet.</div> : null}
        </div>
      </section>
    </div>
  );
}

function CodexLogItem({ entry }: { entry: NonNullable<CodexProgress["entries"]>[number] }) {
  const files = entry.files || [];
  return (
    <article className="activity-card">
      <div className="card-head">
        <strong>{entry.title}</strong>
        <Chip tone={entry.status === "Complete" ? "green" : "blue"}>{entry.status}</Chip>
      </div>
      <p>{entry.detail}</p>
      {files.length ? (
        <details className="file-details">
          <summary>{files.length} files changed</summary>
          <small>{files.join(", ")}</small>
        </details>
      ) : (
        <small>No files recorded.</small>
      )}
    </article>
  );
}

function LaunchView({ tasks, projects, onOpenTask }: { tasks: Task[]; projects: Project[]; onOpenTask: (id: string) => void }) {
  return (
    <div className="panel">
      <div className="section-title">
        <div>
          <h2>Ready to Launch</h2>
          <p>Work that looks shareable or is blocked only by final checks.</p>
        </div>
        <Rocket size={18} />
      </div>
      <TaskList tasks={tasks} projects={projects} onOpen={onOpenTask} empty="Nothing is launch-ready yet." />
    </div>
  );
}

function SettingsView({ state, onImport }: { state: AppState; onImport: (file: File) => void }) {
  const importRef = React.useRef<HTMLInputElement | null>(null);
  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vibepm-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="settings-grid">
      <section className="panel">
        <h2>Local Workspace</h2>
        <p>VibePM is running locally and storing project state as JSON on this machine.</p>
        <div className="meta-stack">
          <span>Storage: {state.backend?.mode || "local"}</span>
          <span>Projects: {state.projects.length}</span>
          <span>Tasks: {state.tasks.length}</span>
          <span>Inbox: {state.inbox.filter((item) => item.state === "New").length}</span>
        </div>
      </section>
      <section className="panel">
        <h2>Backup</h2>
        <p>Keep a local copy of your workspace before big changes.</p>
        <div className="actions">
          <button className="primary" type="button" onClick={exportBackup}>
            Export JSON
          </button>
          <button className="secondary" type="button" onClick={() => importRef.current?.click()}>
            Import JSON
          </button>
          <input
            ref={importRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImport(file);
              event.currentTarget.value = "";
            }}
          />
        </div>
      </section>
    </div>
  );
}

function TaskDrawer({
  task,
  project,
  milestones,
  activity,
  onClose,
  onUpdate,
  onAssignCodex,
  onCreateGithubIssue,
  onResolve,
}: {
  task: Task;
  project?: Project;
  milestones: Milestone[];
  activity: ActivityItem[];
  onClose: () => void;
  onUpdate: (patch: Partial<Task>) => void;
  onAssignCodex: () => void;
  onCreateGithubIssue: () => void;
  onResolve: () => void;
}) {
  const githubIssue = task.links.find((link) => link.includes("github.com") && link.includes("/issues/"));
  const doneChecks = task.checks.filter((check) => check.done).length;
  const activityItems = [...task.activity, ...activity].slice(0, 8);
  return (
    <aside className="drawer">
      <div className="drawer-head">
        <div>
          <p>{project?.name || "Project"}</p>
          <h2>{task.title}</h2>
        </div>
        <button className="icon-button" type="button" onClick={onClose}>
          x
        </button>
      </div>

      <div className="drawer-actions">
        <select value={task.status} onChange={(event) => onUpdate({ status: event.target.value as Status })}>
          {statusOrder.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <select value={task.assignee} onChange={(event) => onUpdate({ assignee: event.target.value })}>
          <option>Me</option>
          <option>Codex</option>
          <option>GitHub</option>
        </select>
        {githubIssue ? (
          <button className="primary" type="button" onClick={onResolve}>
            Resolve Issue
          </button>
        ) : null}
        {task.assignee !== "Codex" ? (
          <button className="secondary" type="button" onClick={onAssignCodex}>
            Send to Codex
          </button>
        ) : null}
        {!githubIssue && project?.github?.repo ? (
          <button className="secondary" type="button" onClick={onCreateGithubIssue}>
            Create GitHub Issue
          </button>
        ) : null}
      </div>

      <div className="drawer-meta">
        <Chip tone={sourceTone(task.source)}>{task.source}</Chip>
        <Chip tone={priorityTone(task.priority)}>{task.priority}</Chip>
        <Chip>{project?.name || "Project"}</Chip>
      </div>

      {milestones.length ? (
        <label className="field">
          <span>Milestone</span>
          <select value={task.milestoneId || ""} onChange={(event) => onUpdate({ milestoneId: event.target.value })}>
            <option value="">No milestone</option>
            {milestones.map((milestone) => (
              <option key={milestone.id} value={milestone.id}>
                {milestone.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <section>
        <label className="field">
          <span>Outcome</span>
          <textarea value={task.description} onChange={(event) => onUpdate({ description: event.target.value })} />
        </label>
      </section>

      <section className="drawer-block">
        <div className="section-title">
          <h3>Checks</h3>
          <Chip>{doneChecks}/{task.checks.length}</Chip>
        </div>
        {task.checks.map((check) => (
          <label className="check-row" key={check.id}>
            <input
              type="checkbox"
              checked={check.done}
              onChange={(event) =>
                onUpdate({ checks: task.checks.map((item) => (item.id === check.id ? { ...item, done: event.target.checked } : item)) })
              }
            />
            <span>{check.label}</span>
          </label>
        ))}
      </section>

      <section className="drawer-block">
        <h3>Links</h3>
        <div className="link-list">
          {task.links.length ? (
            task.links.map((link) => (
              <a key={link} href={link} target="_blank" rel="noreferrer">
                <ExternalLink size={14} />
                {shortLink(link)}
              </a>
            ))
          ) : (
            <span>No links yet. Add a GitHub issue or useful project reference when this task has one.</span>
          )}
        </div>
      </section>

      <section className="drawer-block">
        <h3>Activity</h3>
        <div className="activity-list">
          {activityItems.length ? (
            activityItems.map((item) => (
              <article className="activity-card" key={item.id}>
                <strong>{item.action || item.status || item.source || item.actor}</strong>
                <p>{item.detail || item.title}</p>
              </article>
            ))
          ) : (
            <div className="mini-empty">No activity yet. Changes, Codex work, and GitHub actions will appear here.</div>
          )}
        </div>
      </section>
    </aside>
  );
}

function StatusIcon({ status }: { status: Status }) {
  if (status === "Done") return <CheckCircle2 className="status done" size={18} />;
  if (status === "In progress") return <PlayCircle className="status doing" size={18} />;
  if (status === "Needs Review") return <Circle className="status review" size={18} />;
  if (status === "Blocked") return <Archive className="status blocked" size={18} />;
  return <Circle className="status todo" size={18} />;
}

function Chip({ children, tone = "default" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function EmptyState({ title, icon: Icon }: { title: string; icon: React.ElementType }) {
  return (
    <div className="empty-state">
      <Icon size={22} />
      <strong>{title}</strong>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="loading">
      <Sparkles size={24} />
      <span>Loading workspace</span>
    </div>
  );
}

async function loadState() {
  const response = await fetch("/api/state");
  if (!response.ok) throw new Error("Could not load state");
  return (await response.json()) as AppState;
}

function activeSprintForProject(state: AppState, projectId: string) {
  return state.sprints.find((sprint) => sprint.projectId === projectId && sprint.status === "Active");
}

function activeMilestoneForProject(state: AppState, projectId: string) {
  return state.milestones.find((milestone) => milestone.projectId === projectId && milestone.status === "Active");
}

function readyToLaunch(tasks: Task[]) {
  return tasks.filter((task) => task.status === "Done" || task.labels.includes("Launch") || task.source === "Launch");
}

function titleForView(view: ViewKey) {
  return views.find((item) => item.key === view)?.label || "VibePM";
}

function taskCountLabel(count: number) {
  return `${count} ${count === 1 ? "task" : "tasks"}`;
}

function nextActionForTask(task: Task) {
  const openCheck = task.checks.find((check) => !check.done);
  const action = cleanActionLabel(openCheck?.label || "");
  if (task.status === "Blocked") return task.launchGate || action || "Blocked";
  if (task.status === "Done") return "Done";
  if (task.assignee === "Codex") return action ? `Codex: ${action}` : "Codex is assigned";
  return action || task.launchGate || "Pick the next step";
}

function cleanActionLabel(label: string) {
  return label.replace(/^[A-Z?]{1,2}\s+/, "").trim();
}

function priorityTone(priority: Task["priority"]) {
  if (priority === "Urgent") return "red";
  if (priority === "High") return "amber";
  if (priority === "Medium") return "blue";
  return "default";
}

function sourceTone(source: Source) {
  if (source === "Codex") return "cyan";
  if (source === "GitHub") return "purple";
  if (source === "Launch") return "green";
  if (source === "Project Scan") return "amber";
  return "default";
}

function shortLink(link: string) {
  return link.replace(/^https?:\/\//, "").replace(/^github\.com\//, "");
}

createRoot(document.getElementById("root")!).render(<App />);
