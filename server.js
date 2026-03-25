const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = __dirname;
const STORAGE_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(ROOT_DIR, "storage");
const STORAGE_FILE = process.env.DATA_FILE
  ? path.resolve(process.env.DATA_FILE)
  : path.join(STORAGE_DIR, "workspaces.json");

const PUBLIC_FILES = {
  "/app.js": { file: path.join(ROOT_DIR, "app.js"), type: "application/javascript; charset=utf-8" },
  "/styles.css": { file: path.join(ROOT_DIR, "styles.css"), type: "text/css; charset=utf-8" },
};

let storeWriteQueue = Promise.resolve();

start().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function start() {
  await ensureStorage();

  const server = http.createServer(async (request, response) => {
    try {
      await handleRequest(request, response);
    } catch (error) {
      console.error(error);
      sendJson(response, 500, { error: "internal_error" });
    }
  });

  server.listen(PORT, () => {
    console.log(`Wedding app listening on port ${PORT}`);
  });
}

async function handleRequest(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  const pathname = url.pathname;

  if (pathname === "/api/health" && request.method === "GET") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (pathname === "/api/workspaces" && request.method === "POST") {
    const workspace = await updateStore((store) => {
      const nextWorkspace = buildWorkspace();
      store.workspaces[nextWorkspace.slug] = nextWorkspace;
      return nextWorkspace;
    });
    sendJson(response, 201, { workspace });
    return;
  }

  const workspaceMatch = pathname.match(/^\/api\/workspaces\/([a-z0-9-]+)$/i);
  if (workspaceMatch) {
    const slug = workspaceMatch[1];
    const store = await readStore();
    const workspace = store.workspaces[slug];

    if (!workspace) {
      sendJson(response, 404, { error: "workspace_not_found" });
      return;
    }

    if (request.method === "GET") {
      sendJson(response, 200, { workspace });
      return;
    }

    if (request.method === "PUT") {
      const body = await readJsonBody(request);
      const updatedWorkspace = await updateStore((nextStore) => {
        const currentWorkspace = nextStore.workspaces[slug];
        if (!currentWorkspace) {
          return null;
        }

        const now = new Date().toISOString();
        const nextWorkspace = {
          ...currentWorkspace,
          name: sanitizeWorkspaceName(body.name) || currentWorkspace.name,
          entries: normalizeEntries(body.entries),
          generalTasks: normalizeTasks(body.generalTasks),
          updatedAt: now,
        };
        nextStore.workspaces[slug] = nextWorkspace;
        return nextWorkspace;
      });

      if (!updatedWorkspace) {
        sendJson(response, 404, { error: "workspace_not_found" });
        return;
      }

      sendJson(response, 200, { workspace: updatedWorkspace });
      return;
    }
  }

  if (request.method === "GET" && PUBLIC_FILES[pathname]) {
    await sendFile(response, PUBLIC_FILES[pathname].file, PUBLIC_FILES[pathname].type);
    return;
  }

  if (request.method === "GET" && (pathname === "/" || /^\/c\/[a-z0-9-]+$/i.test(pathname))) {
    await sendFile(response, path.join(ROOT_DIR, "index.html"), "text/html; charset=utf-8");
    return;
  }

  sendJson(response, 404, { error: "not_found" });
}

function buildWorkspace() {
  const slug = crypto.randomBytes(6).toString("base64url").toLowerCase();
  const now = new Date().toISOString();

  return {
    slug,
    name: `Painel do casal ${slug.slice(0, 6).toUpperCase()}`,
    entries: [],
    generalTasks: [],
    createdAt: now,
    updatedAt: now,
  };
}

async function ensureStorage() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });

  try {
    await fs.access(STORAGE_FILE);
  } catch {
    await writeStore({ workspaces: {} });
  }
}

async function readStore() {
  const raw = await fs.readFile(STORAGE_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return parsed && typeof parsed === "object" && parsed.workspaces ? parsed : { workspaces: {} };
}

async function writeStore(store) {
  await fs.writeFile(STORAGE_FILE, JSON.stringify(store, null, 2));
}

function updateStore(mutator) {
  const nextOperation = storeWriteQueue.then(async () => {
    const store = await readStore();
    const result = await mutator(store);
    await writeStore(store);
    return result;
  });

  storeWriteQueue = nextOperation.catch(() => {});
  return nextOperation;
}

async function readJsonBody(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8").trim();
  return raw ? JSON.parse(raw) : {};
}

async function sendFile(response, filePath, contentType) {
  const content = await fs.readFile(filePath);
  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-cache",
  });
  response.end(content);
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-cache",
  });
  response.end(JSON.stringify(payload));
}

function sanitizeWorkspaceName(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, 120);
}

function normalizeEntries(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .filter((entry) => entry && typeof entry === "object" && typeof entry.title === "string")
    .map((entry) => ({
      id: String(entry.id || crypto.randomUUID()),
      category: String(entry.category || "Outro"),
      title: String(entry.title || "").trim(),
      person: String(entry.person || ""),
      contractAmount: numberOrZero(entry.contractAmount),
      paidAmount: numberOrZero(entry.paidAmount),
      paymentStatus: String(entry.paymentStatus || "nao-pago"),
      firstPaymentDate: String(entry.firstPaymentDate || ""),
      nextPaymentAmount: numberOrZero(entry.nextPaymentAmount),
      nextPaymentDate: String(entry.nextPaymentDate || ""),
      isReimbursable: entry.isReimbursable === "sim" ? "sim" : "nao",
      reimbursementPerson: String(entry.reimbursementPerson || ""),
      reimbursementAmount: numberOrZero(entry.reimbursementAmount),
      reimbursementStatus: String(entry.reimbursementStatus || "nao-se-aplica"),
      reimbursementDate: String(entry.reimbursementDate || ""),
      notes: String(entry.notes || ""),
      tasks: normalizeTasks(entry.tasks),
      createdAt: String(entry.createdAt || new Date().toISOString()),
    }))
    .filter((entry) => entry.title);
}

function normalizeTasks(tasks) {
  if (!Array.isArray(tasks)) {
    return [];
  }

  return tasks
    .filter((task) => task && typeof task === "object" && typeof task.title === "string")
    .map((task) => ({
      id: String(task.id || crypto.randomUUID()),
      title: String(task.title || "").trim(),
      done: Boolean(task.done),
      dueDate: String(task.dueDate || ""),
      createdAt: String(task.createdAt || new Date().toISOString()),
    }))
    .filter((task) => task.title);
}

function numberOrZero(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
