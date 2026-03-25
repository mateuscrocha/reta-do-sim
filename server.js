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
const LEGACY_IMPORT_FILE = path.join(ROOT_DIR, "data", "fechamento-casamento-recuperado.json");
const FIXED_WEDDING_WORKSPACE_SLUG = "casamento-principal";

const PUBLIC_FILES = {
  "/app.js": { file: path.join(ROOT_DIR, "app.js"), type: "application/javascript; charset=utf-8" },
  "/styles.css": { file: path.join(ROOT_DIR, "styles.css"), type: "text/css; charset=utf-8" },
  "/boris-noiva-header-v2.png": { file: path.join(ROOT_DIR, "boris-noiva-header-v2.png"), type: "image/png" },
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
    const workspace = await updateStore((nextStore) => {
      const now = new Date().toISOString();
      const slug = generateWorkspaceSlug(nextStore.workspaces);
      const newWorkspace = {
        slug,
        name: buildWorkspaceName(slug),
        entries: [],
        generalTasks: [],
        createdAt: now,
        updatedAt: now,
      };
      nextStore.workspaces[slug] = newWorkspace;
      return newWorkspace;
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

  if (request.method === "GET" && pathname === "/casamento") {
    sendRedirect(response, `/c/${FIXED_WEDDING_WORKSPACE_SLUG}`);
    return;
  }

  if (request.method === "GET" && pathname === "/") {
    await sendFile(response, path.join(ROOT_DIR, "index.html"), "text/html; charset=utf-8");
    return;
  }

  if (request.method === "GET" && /^\/c\/([a-z0-9-]+)$/i.test(pathname)) {
    await sendFile(response, path.join(ROOT_DIR, "index.html"), "text/html; charset=utf-8");
    return;
  }

  sendJson(response, 404, { error: "not_found" });
}

async function ensureStorage() {
  await fs.mkdir(STORAGE_DIR, { recursive: true });

  try {
    await fs.access(STORAGE_FILE);
  } catch {
    await writeStore({ workspaces: {} });
  }

  await importLegacyDataIfNeeded();
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

async function importLegacyDataIfNeeded() {
  const store = await readStore();
  const hasFixedWorkspace = Boolean(store.workspaces[FIXED_WEDDING_WORKSPACE_SLUG]);
  const legacyImportedWorkspace = store.workspaces["casamento-importado"];

  if (legacyImportedWorkspace && !hasFixedWorkspace) {
    store.workspaces[FIXED_WEDDING_WORKSPACE_SLUG] = {
      ...legacyImportedWorkspace,
      slug: FIXED_WEDDING_WORKSPACE_SLUG,
      name: legacyImportedWorkspace.name || "Meu casamento",
    };
    delete store.workspaces["casamento-importado"];
    await writeStore(store);
    return;
  }

  try {
    const rawLegacy = await fs.readFile(LEGACY_IMPORT_FILE, "utf8");
    const legacyPayload = JSON.parse(rawLegacy);
    const now = legacyPayload.updatedAt || new Date().toISOString();
    const workspace = {
      slug: FIXED_WEDDING_WORKSPACE_SLUG,
      name: "Meu casamento",
      entries: normalizeEntries(legacyPayload.entries),
      generalTasks: extractLegacyGeneralTasks(legacyPayload.entries),
      createdAt: now,
      updatedAt: now,
    };

    if (workspace.entries.length === 0 && workspace.generalTasks.length === 0) {
      return;
    }

    if (hasFixedWorkspace) {
      return;
    }

    store.workspaces[workspace.slug] = workspace;
    await writeStore(store);
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return;
    }

    throw error;
  }
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

function sendRedirect(response, location) {
  response.writeHead(302, {
    Location: location,
    "Cache-Control": "no-cache",
  });
  response.end();
}

function sanitizeWorkspaceName(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, 120);
}

function extractLegacyGeneralTasks(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  const metaEntry = entries.find((entry) => entry && entry.id === "__general_tasks__");
  return normalizeTasks(metaEntry?.tasks);
}

function normalizeEntries(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries
    .filter((entry) => entry && typeof entry === "object" && typeof entry.title === "string")
    .filter((entry) => entry.id !== "__general_tasks__")
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

function buildWorkspaceName(slug) {
  return `Painel do casal ${slug.slice(0, 6).toUpperCase()}`;
}

function generateWorkspaceSlug(workspaces) {
  do {
    const slug = crypto.randomBytes(4).toString("hex");
    if (!workspaces[slug] && slug !== FIXED_WEDDING_WORKSPACE_SLUG) {
      return slug;
    }
  } while (true);
}
