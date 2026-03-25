const GENERAL_TASKS_ENTRY_ID = "__general_tasks__";
const LAST_WORKSPACE_KEY = "fechamento-casamento-last-workspace";
const ONBOARDING_DISMISSED_PREFIX = "fechamento-casamento-onboarding-dismissed:";
const ADD_PERSON_OPTION_VALUE = "__add_person__";
const API_BASE = "/api";
const quickStartTemplates = {
  buffet: {
    title: "Buffet principal",
    category: "Buffet",
    notes: "Comece registrando o valor total, o que já foi pago e a próxima parcela.",
  },
  foto: {
    title: "Foto e vídeo",
    category: "Foto e vídeo",
    notes: "Use este cadastro para acompanhar sinal, saldo e entregas combinadas.",
  },
  decoracao: {
    title: "Decoração",
    category: "Decoração",
    notes: "Vale registrar montagem, flores, mobiliário e qualquer pendência de confirmação.",
  },
};

const sampleEntries = [
  {
    id: crypto.randomUUID(),
    category: "Buffet",
    title: "Buffet principal",
    person: "Mariana",
    contractAmount: 12800,
    paidAmount: 6400,
    paymentStatus: "pago-50",
    firstPaymentDate: "2026-03-10",
    nextPaymentAmount: 6400,
    nextPaymentDate: "2026-04-05",
    isReimbursable: "sim",
    reimbursementPerson: "Minha mãe",
    reimbursementAmount: 3000,
    reimbursementStatus: "pendente",
    reimbursementDate: "2026-04-10",
    notes: "Entrada paga. Falta confirmar número final de convidados e saldo.",
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    category: "Foto e vídeo",
    title: "Equipe de foto",
    person: "Carlos",
    contractAmount: 5400,
    paidAmount: 5400,
    paymentStatus: "pago-100",
    firstPaymentDate: "2026-02-18",
    nextPaymentAmount: 0,
    nextPaymentDate: "",
    isReimbursable: "nao",
    reimbursementPerson: "",
    reimbursementAmount: 0,
    reimbursementStatus: "nao-se-aplica",
    reimbursementDate: "",
    notes: "Contrato fechado e briefing enviado com lista de pessoas importantes.",
    createdAt: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    category: "Cerimônia",
    title: "Celebrante",
    person: "Padre André",
    contractAmount: 1800,
    paidAmount: 300,
    paymentStatus: "sinal-pago",
    firstPaymentDate: "2026-03-12",
    nextPaymentAmount: 1500,
    nextPaymentDate: "2026-03-28",
    isReimbursable: "sim",
    reimbursementPerson: "Mãe do Matheus",
    reimbursementAmount: 900,
    reimbursementStatus: "parcial",
    reimbursementDate: "2026-03-30",
    notes: "Cerimônia alinhada, mas ainda falta reconfirmar horário de chegada.",
    createdAt: new Date().toISOString(),
  },
];

const state = {
  workspaceSlug: "",
  workspaceName: "",
  shareUrl: "",
  entries: [],
  generalTasks: [],
  search: "",
  filter: "todos",
  lastSavedAt: null,
  isLoading: true,
  currentStep: 1,
  manualPeople: [],
  personModalTarget: "person",
  currentTasks: [],
  taskModalContext: null,
  saveTimer: null,
  saveRequestId: 0,
  lastQueuedMessage: "",
  onboardingDismissed: false,
};

const defaultPeople = ["Noivos"];

const stepContent = {
  1: { description: "Comece pelo essencial." },
  2: { description: "Organize os valores." },
  3: { description: "Preencha só se houver retorno." },
  4: { description: "Anote o que vale lembrar." },
};

const elements = {
  dashboardShell: document.querySelector("#dashboard-shell"),
  onboardingPanel: document.querySelector("#onboarding-panel"),
  startOnboarding: document.querySelector("#start-onboarding"),
  skipOnboarding: document.querySelector("#skip-onboarding"),
  quickstartButtons: [...document.querySelectorAll(".quickstart-button")],
  guidanceTitle: document.querySelector("#guidance-title"),
  guidanceBody: document.querySelector("#guidance-body"),
  guidancePrimary: document.querySelector("#guidance-primary"),
  guidanceSecondary: document.querySelector("#guidance-secondary"),
  itemFormPanel: document.querySelector("#item-form-panel"),
  globalTasksPanel: document.querySelector("#global-tasks-panel"),
  form: document.querySelector("#entry-form"),
  entryId: document.querySelector("#entry-id"),
  category: document.querySelector("#category"),
  title: document.querySelector("#title"),
  person: document.querySelector("#person"),
  personModal: document.querySelector("#person-modal"),
  closePersonModal: document.querySelector("#close-person-modal"),
  cancelPersonModal: document.querySelector("#cancel-person-modal"),
  customPerson: document.querySelector("#custom-person"),
  addPerson: document.querySelector("#add-person"),
  contractAmount: document.querySelector("#contract-amount"),
  paidAmount: document.querySelector("#paid-amount"),
  remainingAmount: document.querySelector("#remaining-amount"),
  paymentStatus: document.querySelector("#payment-status"),
  firstPaymentDate: document.querySelector("#first-payment-date"),
  nextPaymentAmount: document.querySelector("#next-payment-amount"),
  nextPaymentDate: document.querySelector("#next-payment-date"),
  isReimbursable: document.querySelector("#is-reimbursable"),
  reimbursementToggleLabel: document.querySelector("#reimbursement-toggle-label"),
  reimbursementPerson: document.querySelector("#reimbursement-person"),
  reimbursementAmount: document.querySelector("#reimbursement-amount"),
  reimbursementStatus: document.querySelector("#reimbursement-status"),
  reimbursementDate: document.querySelector("#reimbursement-date"),
  reimbursementSection: document.querySelector("#reimbursement-section"),
  stepSections: [...document.querySelectorAll("[data-step]")],
  stepNextButtons: [...document.querySelectorAll(".step-next")],
  stepPrevButtons: [...document.querySelectorAll(".step-prev")],
  stepTitle: document.querySelector("#step-title"),
  stepDescription: document.querySelector("#step-description"),
  stepProgressBar: document.querySelector("#step-progress-bar"),
  finalFormActions: document.querySelector("#final-form-actions"),
  taskInput: document.querySelector("#task-input"),
  taskDateInput: document.querySelector("#task-date-input"),
  addTask: document.querySelector("#add-task"),
  taskSummary: document.querySelector("#task-summary"),
  taskListEditor: document.querySelector("#task-list-editor"),
  globalTaskInput: document.querySelector("#global-task-input"),
  globalTaskDateInput: document.querySelector("#global-task-date-input"),
  addGlobalTask: document.querySelector("#add-global-task"),
  globalTaskSummary: document.querySelector("#global-task-summary"),
  globalTaskList: document.querySelector("#global-task-list"),
  taskModal: document.querySelector("#task-modal"),
  closeTaskModal: document.querySelector("#close-task-modal"),
  cancelTaskModal: document.querySelector("#cancel-task-modal"),
  saveTaskModal: document.querySelector("#save-task-modal"),
  taskModalTitleInput: document.querySelector("#task-modal-title-input"),
  taskModalDateInput: document.querySelector("#task-modal-date-input"),
  notes: document.querySelector("#notes"),
  clearForm: document.querySelector("#clear-form"),
  loadSample: document.querySelector("#load-sample"),
  search: document.querySelector("#search"),
  statusFilter: document.querySelector("#status-filter"),
  entryList: document.querySelector("#entry-list"),
  metricTotal: document.querySelector("#metric-total"),
  metricSettled: document.querySelector("#metric-settled"),
  metricNetOutflow: document.querySelector("#metric-net-outflow"),
  metricAttention: document.querySelector("#metric-attention"),
  syncStatus: document.querySelector("#sync-status"),
  saveStatusInline: document.querySelector("#save-status-inline"),
  attentionList: document.querySelector("#attention-list"),
  template: document.querySelector("#entry-template"),
  workspaceTitle: document.querySelector("#workspace-title"),
  workspaceNameInput: document.querySelector("#workspace-name-input"),
  saveWorkspaceName: document.querySelector("#save-workspace-name"),
  workspaceDescription: document.querySelector("#workspace-description"),
  shareLink: document.querySelector("#share-link"),
  copyShareLink: document.querySelector("#copy-share-link"),
  createNewWorkspace: document.querySelector("#create-new-workspace"),
};

initialize();

async function initialize() {
  bindEvents();
  render();
  renderPersonOptions();
  renderTaskEditor();
  renderGlobalTasks();
  updateFormState();
  setCurrentStep(1);
  await bootstrapWorkspace();
  document.addEventListener("visibilitychange", handleVisibilityChange);
}

function bindEvents() {
  elements.form.addEventListener("submit", handleSubmit);
  elements.clearForm.addEventListener("click", resetForm);
  elements.loadSample.addEventListener("click", loadSampleData);
  elements.addTask.addEventListener("click", addTaskToCurrentEntry);
  elements.addGlobalTask.addEventListener("click", addGlobalTask);
  elements.closeTaskModal.addEventListener("click", closeTaskModal);
  elements.cancelTaskModal.addEventListener("click", closeTaskModal);
  elements.saveTaskModal.addEventListener("click", saveTaskModalChanges);
  elements.copyShareLink.addEventListener("click", copyShareLink);
  elements.createNewWorkspace.addEventListener("click", handleCreateNewWorkspace);
  elements.startOnboarding.addEventListener("click", startOnboardingFlow);
  elements.skipOnboarding.addEventListener("click", skipOnboardingFlow);
  elements.quickstartButtons.forEach((button) => {
    button.addEventListener("click", () => {
      applyQuickStartTemplate(button.dataset.quickTemplate);
    });
  });
  elements.guidancePrimary.addEventListener("click", handleGuidancePrimaryAction);
  elements.guidanceSecondary.addEventListener("click", handleGuidanceSecondaryAction);
  elements.saveWorkspaceName.addEventListener("click", handleWorkspaceNameSave);
  elements.workspaceNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleWorkspaceNameSave();
    }
  });
  elements.workspaceNameInput.addEventListener("blur", handleWorkspaceNameSave);
  elements.taskModal.addEventListener("click", (event) => {
    if (event.target === elements.taskModal) {
      closeTaskModal();
    }
  });
  elements.taskInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addTaskToCurrentEntry();
    }
  });
  elements.globalTaskInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addGlobalTask();
    }
  });
  elements.closePersonModal.addEventListener("click", closePersonModal);
  elements.cancelPersonModal.addEventListener("click", closePersonModal);
  elements.personModal.addEventListener("click", (event) => {
    if (event.target === elements.personModal) {
      closePersonModal();
    }
  });
  elements.addPerson.addEventListener("click", addCustomPerson);
  elements.person.addEventListener("change", () => {
    handlePersonSelectChange(elements.person, "person");
  });
  elements.reimbursementPerson.addEventListener("change", () => {
    handlePersonSelectChange(elements.reimbursementPerson, "reimbursementPerson");
  });
  elements.customPerson.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addCustomPerson();
    }

    if (event.key === "Escape") {
      closePersonModal();
    }
  });
  elements.stepNextButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const requestedStep = Number(button.dataset.nextStep);
      const nextStep = getVisibleSteps().includes(requestedStep)
        ? requestedStep
        : getNextVisibleStep(state.currentStep);
      if (canAdvanceToStep(nextStep)) {
        setCurrentStep(nextStep);
      }
    });
  });
  elements.stepPrevButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const requestedStep = Number(button.dataset.prevStep);
      const prevStep = getVisibleSteps().includes(requestedStep)
        ? requestedStep
        : getPreviousVisibleStep(state.currentStep);
      setCurrentStep(prevStep);
    });
  });
  [
    elements.contractAmount,
    elements.paidAmount,
    elements.reimbursementAmount,
    elements.reimbursementStatus,
    elements.paymentStatus,
  ].forEach((element) => {
    element.addEventListener("input", updateFormPreview);
    element.addEventListener("change", updateFormPreview);
  });
  [
    elements.isReimbursable,
    elements.reimbursementPerson,
    elements.reimbursementDate,
    elements.nextPaymentAmount,
    elements.nextPaymentDate,
    elements.firstPaymentDate,
  ].forEach((element) => {
    element.addEventListener("input", updateFormState);
    element.addEventListener("change", updateFormState);
  });
  elements.search.addEventListener("input", (event) => {
    state.search = event.target.value.toLowerCase().trim();
    render();
  });
  elements.statusFilter.addEventListener("change", (event) => {
    state.filter = event.target.value;
    render();
  });
}

async function bootstrapWorkspace() {
  setSyncStatus("Preparando espaço compartilhado...");
  if (window.location.pathname === "/" || window.location.pathname === "/casamento") {
    window.location.replace("/c/casamento-principal");
    return;
  }

  const slugFromPath = getWorkspaceSlugFromPath();
  const rememberedSlug = readRememberedWorkspaceSlug();

  if (!slugFromPath) {
    await bootstrapDefaultWorkspace();
    return;
  }

  try {
    const response = await fetchJson(`${API_BASE}/workspaces/${slugFromPath}`);
    hydrateWorkspace(response.workspace);
    rememberWorkspaceSlug(state.workspaceSlug);
    state.isLoading = false;
    render();
    renderGlobalTasks();
    renderTaskEditor();
    updateWorkspaceUI();
    setSyncStatus("Painel compartilhado pronto.");
  } catch (error) {
    console.error(error);
    if (slugFromPath === "casamento-principal") {
      setSyncStatus("O painel fixo do casamento ainda não foi preparado no servidor.");
      return;
    }

    setSyncStatus("Não foi possível abrir este painel. Criando um novo...");
    await createWorkspaceAndRedirect();
  }
}

async function bootstrapDefaultWorkspace() {
  const response = await fetchJson(`${API_BASE}/bootstrap`);
  rememberWorkspaceSlug(response.workspace.slug);
  window.location.replace(`/c/${response.workspace.slug}`);
}

function hydrateWorkspace(workspace) {
  state.workspaceSlug = workspace.slug;
  state.workspaceName = workspace.name || buildWorkspaceName(workspace.slug);
  state.shareUrl = `${window.location.origin}/c/${workspace.slug}`;
  state.lastSavedAt = workspace.updatedAt || new Date().toISOString();
  state.onboardingDismissed = readOnboardingDismissed(state.workspaceSlug);
  hydrateFromPayload(workspace);
}

function updateWorkspaceUI() {
  elements.workspaceTitle.textContent = state.workspaceName;
  elements.workspaceNameInput.value = state.workspaceName;
  elements.workspaceDescription.textContent =
    "Sem senha: qualquer pessoa com este link pode abrir e editar o mesmo painel do casal.";
  elements.shareLink.value = state.shareUrl;
  elements.shareLink.setAttribute("aria-label", `Link compartilhável de ${state.workspaceName}`);
}

function handleWorkspaceNameSave() {
  const nextName = elements.workspaceNameInput.value.trim();

  if (!nextName || nextName === state.workspaceName) {
    elements.workspaceNameInput.value = state.workspaceName;
    return;
  }

  state.workspaceName = nextName;
  updateWorkspaceUI();
  markMemoryChanges("Nome do casal salvo.");
}

function startOnboardingFlow() {
  dismissOnboarding();
  setCurrentStep(1);
  focusForm();
}

function skipOnboardingFlow() {
  dismissOnboarding();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function applyQuickStartTemplate(templateKey) {
  const template = quickStartTemplates[templateKey];

  if (!template) {
    return;
  }

  dismissOnboarding();
  resetForm();
  elements.title.value = template.title;
  elements.category.value = template.category;
  elements.notes.value = template.notes;
  updateFormState();
  setCurrentStep(1);
  focusForm();
}

function dismissOnboarding() {
  state.onboardingDismissed = true;
  rememberOnboardingDismissed(state.workspaceSlug);
  renderExperience();
}

function handleGuidancePrimaryAction() {
  setCurrentStep(1);
  focusForm();
}

function handleGuidanceSecondaryAction() {
  elements.globalTasksPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function focusForm() {
  elements.itemFormPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => {
    elements.title.focus();
  }, 200);
}

async function createWorkspaceAndRedirect() {
  const response = await fetchJson(`${API_BASE}/workspaces`, {
    method: "POST",
    body: JSON.stringify({}),
  });

  rememberWorkspaceSlug(response.workspace.slug);
  window.location.replace(`/c/${response.workspace.slug}`);
}

async function handleCreateNewWorkspace() {
  const shouldCreate = window.confirm(
    "Criar um novo painel vazio? O painel atual continua existindo no link atual."
  );

  if (!shouldCreate) {
    return;
  }

  setSyncStatus("Criando novo painel...");
  await createWorkspaceAndRedirect();
}

async function copyShareLink() {
  try {
    await navigator.clipboard.writeText(state.shareUrl);
    setSyncStatus("Link copiado. Quem receber poderá usar o mesmo painel.");
  } catch (error) {
    console.error(error);
    elements.shareLink.focus();
    elements.shareLink.select();
    setSyncStatus("Selecionei o link para você copiar manualmente.");
  }
}

function getWorkspaceSlugFromPath() {
  const match = window.location.pathname.match(/^\/c\/([a-z0-9-]+)$/i);
  return match ? match[1] : "";
}

function rememberWorkspaceSlug(slug) {
  try {
    window.localStorage.setItem(LAST_WORKSPACE_KEY, slug);
  } catch (error) {
    console.error(error);
  }
}

function readRememberedWorkspaceSlug() {
  try {
    return window.localStorage.getItem(LAST_WORKSPACE_KEY) || "";
  } catch (error) {
    console.error(error);
    return "";
  }
}

function rememberOnboardingDismissed(slug) {
  if (!slug) {
    return;
  }

  try {
    window.localStorage.setItem(`${ONBOARDING_DISMISSED_PREFIX}${slug}`, "1");
  } catch (error) {
    console.error(error);
  }
}

function readOnboardingDismissed(slug) {
  if (!slug) {
    return false;
  }

  try {
    return window.localStorage.getItem(`${ONBOARDING_DISMISSED_PREFIX}${slug}`) === "1";
  } catch (error) {
    console.error(error);
    return false;
  }
}

function handleSubmit(event) {
  event.preventDefault();

  const entry = {
    id: elements.entryId.value || crypto.randomUUID(),
    category: elements.category.value || "Outro",
    title: elements.title.value.trim(),
    person: getSelectedPerson(),
    contractAmount: Number(elements.contractAmount.value || 0),
    paidAmount: Number(elements.paidAmount.value || 0),
    paymentStatus: elements.paymentStatus.value,
    firstPaymentDate: elements.firstPaymentDate.value,
    nextPaymentAmount: Number(elements.nextPaymentAmount.value || 0),
    nextPaymentDate: elements.nextPaymentDate.value,
    isReimbursable: elements.isReimbursable.checked ? "sim" : "nao",
    reimbursementPerson: sanitizePersonValue(elements.reimbursementPerson.value),
    reimbursementAmount: Number(elements.reimbursementAmount.value || 0),
    reimbursementStatus: elements.reimbursementStatus.value,
    reimbursementDate: elements.reimbursementDate.value,
    notes: elements.notes.value.trim(),
    tasks: normalizeTasks(state.currentTasks),
    createdAt: elements.entryId.value
      ? findEntry(elements.entryId.value)?.createdAt || new Date().toISOString()
      : new Date().toISOString(),
  };

  if (!entry.title || !entry.paymentStatus || !entry.contractAmount) {
    return;
  }

  const index = state.entries.findIndex((item) => item.id === entry.id);

  if (index >= 0) {
    state.entries[index] = entry;
  } else {
    state.entries.unshift(entry);
  }

  render();
  renderPersonOptions();
  markMemoryChanges();
  resetForm();
}

function findEntry(id) {
  return state.entries.find((entry) => entry.id === id);
}

function resetForm() {
  elements.form.reset();
  elements.entryId.value = "";
  elements.customPerson.value = "";
  elements.isReimbursable.checked = false;
  elements.taskDateInput.value = "";
  elements.globalTaskDateInput.value = "";
  state.currentTasks = [];
  renderPersonOptions();
  renderTaskEditor();
  closePersonModal();
  updateFormState();
  setCurrentStep(1);
}

function loadSampleData() {
  if (state.entries.length > 0) {
    return;
  }

  dismissOnboarding();
  state.entries = structuredClone(sampleEntries);
  render();
  renderPersonOptions();
  renderTaskEditor();
  markMemoryChanges("Exemplo carregado no painel do casal.");
}

function hydrateFromPayload(payload) {
  const rawEntries = Array.isArray(payload.entries) ? payload.entries : [];
  const fallbackTasks = Array.isArray(payload.generalTasks) ? payload.generalTasks : [];

  state.entries = getVisibleEntries(rawEntries);
  state.generalTasks = extractGeneralTasks(rawEntries, fallbackTasks);
  state.manualPeople = getImportedPeople(state.entries);
  renderPersonOptions();
  renderTaskEditor();
  resetForm();
  render();
}

function render() {
  renderExperience();
  renderMetrics();
  renderGlobalTasks();
  renderAttention();
  renderEntries();
}

function renderExperience() {
  const showOnboarding = shouldShowOnboarding();
  elements.onboardingPanel.classList.toggle("is-hidden", !showOnboarding);
  elements.dashboardShell.classList.toggle("is-hidden", showOnboarding);
  renderGuidanceStrip();
}

function renderGuidanceStrip() {
  if (!hasOperationalData()) {
    elements.guidanceTitle.textContent = "Vamos montar a base do painel.";
    elements.guidanceBody.textContent =
      "Cadastre os primeiros fornecedores para o painel começar a mostrar prioridades, vencimentos e valores em aberto.";
    elements.guidancePrimary.textContent = "Adicionar primeiro item";
    elements.guidanceSecondary.textContent = "Ir para checklist geral";
    return;
  }

  const pendingPayments = state.entries.filter((entry) => entry.paymentStatus !== "pago-100").length;
  const openReimbursements = state.entries.filter(
    (entry) => entry.isReimbursable === "sim" && entry.reimbursementStatus !== "recebido"
  ).length;
  const pendingTasks = state.generalTasks.filter((task) => !task.done).length;

  elements.guidanceTitle.textContent = "Seu painel já está andando.";
  elements.guidanceBody.textContent =
    `${pendingPayments} item(ns) com pagamento em aberto, ${openReimbursements} ressarcimento(s) pendente(s) e ${pendingTasks} tarefa(s) geral(is) para acompanhar.`;
  elements.guidancePrimary.textContent = "Adicionar novo item";
  elements.guidanceSecondary.textContent = "Ver checklist geral";
}

function shouldShowOnboarding() {
  return !hasOperationalData() && !state.onboardingDismissed;
}

function hasOperationalData() {
  return state.entries.length > 0 || state.generalTasks.length > 0;
}

function getVisibleEntries(entries) {
  return entries.filter((entry) => !isGeneralTasksEntry(entry));
}

function extractGeneralTasks(entries, fallbackTasks = []) {
  const metaEntry = entries.find((entry) => isGeneralTasksEntry(entry));

  if (metaEntry) {
    return normalizeTasks(metaEntry.tasks || []);
  }

  return normalizeTasks(fallbackTasks);
}

function isGeneralTasksEntry(entry) {
  return entry?.id === GENERAL_TASKS_ENTRY_ID;
}

function renderPersonOptions(selectedValues = {}) {
  renderPeopleSelect(
    elements.person,
    selectedValues.person ?? elements.person.value ?? "",
    "Noivos"
  );
  renderPeopleSelect(
    elements.reimbursementPerson,
    selectedValues.reimbursementPerson ?? elements.reimbursementPerson.value ?? "",
    "Noivos"
  );
}

function renderPeopleSelect(selectElement, selectedValue = "", fallbackValue = "") {
  const currentValue = selectedValue || "";
  const people = getAllPeople();

  selectElement.innerHTML = "";

  people.forEach((person) => {
    const option = document.createElement("option");
    option.value = person;
    option.textContent = person;
    selectElement.appendChild(option);
  });

  const addOption = document.createElement("option");
  addOption.value = ADD_PERSON_OPTION_VALUE;
  addOption.textContent = "+ Adicionar pessoa";
  selectElement.appendChild(addOption);

  if (currentValue && people.includes(currentValue)) {
    selectElement.value = currentValue;
    return;
  }

  if (currentValue && !state.manualPeople.includes(currentValue) && !defaultPeople.includes(currentValue)) {
    state.manualPeople.push(currentValue);
    renderPeopleSelect(selectElement, currentValue, fallbackValue);
    return;
  }

  selectElement.value = people.includes(fallbackValue) ? fallbackValue : people[0] || "";
}

function handlePersonSelectChange(selectElement, target) {
  if (selectElement.value !== ADD_PERSON_OPTION_VALUE) {
    return;
  }

  openPersonModal(target);
}

function renderMetrics() {
  const settledValue = state.entries.reduce((sum, entry) => sum + Number(entry.paidAmount || 0), 0);
  const remainingToPay = state.entries.reduce((sum, entry) => {
    const contractAmount = Number(entry.contractAmount || 0);
    const paidAmount = Number(entry.paidAmount || 0);
    return sum + Math.max(contractAmount - paidAmount, 0);
  }, 0);
  const attentionItems = state.entries
    .filter((entry) => entry.isReimbursable === "sim" && entry.reimbursementStatus !== "recebido")
    .reduce((sum, entry) => sum + Number(entry.reimbursementAmount || 0), 0);
  const netOutflow = Math.max(remainingToPay - attentionItems, 0);

  elements.metricTotal.textContent = formatCurrency(remainingToPay);
  elements.metricSettled.textContent = formatCurrency(settledValue);
  elements.metricNetOutflow.textContent = formatCurrency(netOutflow);
  elements.metricAttention.textContent = formatCurrency(attentionItems);
}

function renderEntries() {
  const filteredEntries = state.entries.filter((entry) => {
    const matchesFilter = state.filter === "todos" || entry.paymentStatus === state.filter;
    const haystack = [
      entry.category,
      entry.title,
      entry.person,
      entry.notes,
      ...(entry.tasks || []).map((task) => task.title),
      entry.paymentStatus,
      entry.reimbursementPerson,
      entry.reimbursementStatus,
    ]
      .join(" ")
      .toLowerCase();
    const matchesSearch = !state.search || haystack.includes(state.search);

    return matchesFilter && matchesSearch;
  });

  elements.entryList.innerHTML = "";

  if (state.isLoading) {
    elements.entryList.innerHTML =
      '<div class="skeleton-stack"><div class="skeleton-card"></div><div class="skeleton-card"></div><div class="skeleton-card"></div></div>';
    return;
  }

  if (filteredEntries.length === 0) {
    elements.entryList.innerHTML =
      '<div class="empty-state"><strong>Nenhum item apareceu com esse filtro.</strong><span>Ajuste a busca ou cadastre um fornecedor para o painel começar a ganhar contexto.</span></div>';
    return;
  }

  filteredEntries.forEach((entry) => {
    const fragment = elements.template.content.cloneNode(true);
    const card = fragment.querySelector(".entry-card");
    const category = fragment.querySelector(".entry-category");
    const title = fragment.querySelector(".entry-title");
    const owner = fragment.querySelector(".entry-owner");
    const notes = fragment.querySelector(".entry-notes");
    const statusPill = fragment.querySelector(".status-pill");
    const summaryContract = fragment.querySelector(".summary-contract");
    const summaryPaid = fragment.querySelector(".summary-paid");
    const summaryRemaining = fragment.querySelector(".summary-remaining");
    const contract = fragment.querySelector(".meta-contract");
    const paid = fragment.querySelector(".meta-paid");
    const date = fragment.querySelector(".meta-date");
    const firstPayment = fragment.querySelector(".meta-first-payment");
    const nextPayment = fragment.querySelector(".meta-next-payment");
    const reimbursement = fragment.querySelector(".meta-reimbursement");
    const entryTasks = fragment.querySelector(".entry-tasks");
    const entryTaskCount = fragment.querySelector(".entry-task-count");
    const entryTaskList = fragment.querySelector(".entry-task-list");
    const editButton = fragment.querySelector(".edit-button");
    const deleteButton = fragment.querySelector(".delete-button");

    category.textContent = entry.category;
    title.textContent = entry.title;
    owner.textContent = entry.person ? `Responsável: ${entry.person}` : "Sem responsável definido";
    notes.textContent = entry.notes || "Sem observações registradas.";
    statusPill.textContent = getPaymentStatusLabel(entry.paymentStatus);
    statusPill.classList.add(getPaymentStatusClass(entry.paymentStatus));
    summaryContract.textContent = formatCurrency(entry.contractAmount);
    summaryPaid.textContent = formatCurrency(entry.paidAmount);
    summaryRemaining.textContent = formatCurrency(
      Math.max(Number(entry.contractAmount || 0) - Number(entry.paidAmount || 0), 0)
    );
    summaryRemaining.parentElement.classList.toggle(
      "is-primary",
      Math.max(Number(entry.contractAmount || 0) - Number(entry.paidAmount || 0), 0) > 0
    );
    contract.textContent = `Contrato ${formatCurrency(entry.contractAmount)}`;
    paid.textContent = `Pago ${formatCurrency(entry.paidAmount)}`;
    date.textContent = entry.nextPaymentDate
      ? `Próximo vencimento: ${formatDate(entry.nextPaymentDate)}`
      : "Sem próximo vencimento";
    firstPayment.textContent = entry.firstPaymentDate
      ? `Primeiro pagamento: ${formatDate(entry.firstPaymentDate)}`
      : "Primeiro pagamento não informado";
    nextPayment.textContent = entry.nextPaymentAmount
      ? `Próximo pagamento: ${formatCurrency(entry.nextPaymentAmount)}`
      : "Sem parcela futura registrada";
    reimbursement.textContent =
      entry.isReimbursable === "sim"
        ? `Ressarcimento: ${formatCurrency(entry.reimbursementAmount)} · ${getReimbursementStatusLabel(entry.reimbursementStatus)}${entry.reimbursementPerson ? ` · ${entry.reimbursementPerson}` : ""}`
        : "Sem ressarcimento";
    renderEntryTasks(entry, entryTasks, entryTaskList, entryTaskCount);

    editButton.addEventListener("click", () => populateForm(entry));
    deleteButton.addEventListener("click", () => {
      state.entries = state.entries.filter((item) => item.id !== entry.id);

      if (elements.entryId.value === entry.id) {
        resetForm();
      }

      render();
      markMemoryChanges();
    });

    card.dataset.entryId = entry.id;
    card.classList.add(getPaymentStatusClass(entry.paymentStatus));
    elements.entryList.appendChild(fragment);
  });
}

function populateForm(entry) {
  elements.entryId.value = entry.id;
  elements.category.value = entry.category;
  elements.title.value = entry.title;
  renderPersonOptions({
    person: entry.person || "",
    reimbursementPerson: entry.reimbursementPerson || "",
  });
  elements.contractAmount.value = entry.contractAmount || "";
  elements.paidAmount.value = entry.paidAmount || "";
  elements.paymentStatus.value = entry.paymentStatus || "";
  elements.firstPaymentDate.value = entry.firstPaymentDate || "";
  elements.nextPaymentAmount.value = entry.nextPaymentAmount || "";
  elements.nextPaymentDate.value = entry.nextPaymentDate || "";
  elements.isReimbursable.checked = (entry.isReimbursable || "nao") === "sim";
  elements.reimbursementAmount.value = entry.reimbursementAmount || "";
  elements.reimbursementStatus.value = entry.reimbursementStatus || "nao-se-aplica";
  elements.reimbursementDate.value = entry.reimbursementDate || "";
  elements.notes.value = entry.notes;
  state.currentTasks = normalizeTasks(entry.tasks || []);
  renderTaskEditor();
  updateFormState();
  setCurrentStep(1);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setSyncStatus(message) {
  elements.syncStatus.textContent = message;
  elements.saveStatusInline.textContent = message;
}

function markMemoryChanges(message = "") {
  scheduleWorkspaceSave(message);
}

function scheduleWorkspaceSave(message = "") {
  if (!state.workspaceSlug) {
    return;
  }

  if (message) {
    state.lastQueuedMessage = message;
  }

  if (state.saveTimer) {
    clearTimeout(state.saveTimer);
  }

  setSyncStatus("Salvando no painel compartilhado...");
  state.saveTimer = window.setTimeout(() => {
    state.saveTimer = null;
    persistWorkspace(state.lastQueuedMessage);
    state.lastQueuedMessage = "";
  }, 350);
}

async function persistWorkspace(successMessage = "") {
  const requestId = ++state.saveRequestId;

  try {
    const response = await fetchJson(`${API_BASE}/workspaces/${state.workspaceSlug}`, {
      method: "PUT",
      body: JSON.stringify(buildStoragePayload()),
    });

    if (requestId !== state.saveRequestId) {
      return;
    }

    state.lastSavedAt = response.workspace.updatedAt || new Date().toISOString();
    setSyncStatus(
      successMessage || `Salvo online em ${formatDateTime(state.lastSavedAt)}.`
    );
  } catch (error) {
    console.error(error);
    setSyncStatus("Não foi possível salvar online agora. Tentaremos de novo ao editar.");
  }
}

function renderTaskEditor() {
  elements.taskListEditor.innerHTML = "";

  if (state.currentTasks.length === 0) {
    elements.taskSummary.textContent = "Nenhuma tarefa criada por enquanto.";
    return;
  }

  const pendingCount = state.currentTasks.filter((task) => !task.done).length;
  elements.taskSummary.textContent =
    pendingCount === 0
      ? `${state.currentTasks.length} tarefa(s), todas concluídas.`
      : `${pendingCount} pendente(s) de ${state.currentTasks.length} tarefa(s).`;

  state.currentTasks.forEach((task) => {
    const row = document.createElement("div");
    const checkbox = document.createElement("input");
    const content = document.createElement("div");
    const title = document.createElement("span");
    const meta = document.createElement("span");
    const actions = document.createElement("div");
    const editButton = document.createElement("button");
    const removeButton = document.createElement("button");

    row.className = "task-row";
    if (task.done) {
      row.classList.add("is-done");
    }

    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => {
      toggleCurrentTask(task.id);
    });

    content.className = "task-row-content";
    title.className = "task-row-title";
    title.textContent = task.title;
    meta.className = "task-row-meta";
    meta.textContent = task.dueDate ? `Para ${formatShortDate(task.dueDate)}` : "Sem data";

    editButton.type = "button";
    editButton.className = "task-edit-button";
    editButton.textContent = "Editar";
    editButton.addEventListener("click", () => {
      openTaskModal("current", task);
    });

    removeButton.type = "button";
    removeButton.className = "task-remove-button";
    removeButton.textContent = "Remover";
    removeButton.addEventListener("click", () => {
      removeCurrentTask(task.id);
    });

    actions.className = "task-actions";
    actions.append(editButton, removeButton);
    content.append(title, meta);
    row.append(checkbox, content, actions);
    elements.taskListEditor.appendChild(row);
  });
}

function renderGlobalTasks() {
  elements.globalTaskList.innerHTML = "";

  if (state.isLoading) {
    elements.globalTaskSummary.textContent = "Carregando checklist geral...";
    elements.globalTaskList.innerHTML =
      '<div class="skeleton-stack"><div class="skeleton-card"></div><div class="skeleton-card"></div></div>';
    return;
  }

  if (state.generalTasks.length === 0) {
    elements.globalTaskSummary.textContent =
      "Ainda não existe checklist geral. Use este bloco para pendências que não pertencem a um fornecedor específico.";
    return;
  }

  const pendingCount = state.generalTasks.filter((task) => !task.done).length;
  elements.globalTaskSummary.textContent =
    pendingCount === 0 ? "Tudo concluído" : `${pendingCount} pendente(s) de ${state.generalTasks.length}`;

  state.generalTasks.forEach((task) => {
    const row = document.createElement("div");
    const checkbox = document.createElement("input");
    const content = document.createElement("div");
    const title = document.createElement("span");
    const meta = document.createElement("span");
    const actions = document.createElement("div");
    const editButton = document.createElement("button");
    const removeButton = document.createElement("button");

    row.className = "task-row";
    if (task.done) {
      row.classList.add("is-done");
    }

    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => {
      toggleGlobalTask(task.id);
    });

    content.className = "task-row-content";
    title.className = "task-row-title";
    title.textContent = task.title;
    meta.className = "task-row-meta";
    meta.textContent = task.dueDate ? `Para ${formatShortDate(task.dueDate)}` : "Sem data";

    editButton.type = "button";
    editButton.className = "task-edit-button";
    editButton.textContent = "Editar";
    editButton.addEventListener("click", () => {
      openTaskModal("global", task);
    });

    removeButton.type = "button";
    removeButton.className = "task-remove-button";
    removeButton.textContent = "Excluir";
    removeButton.addEventListener("click", () => {
      removeGlobalTask(task.id);
    });

    actions.className = "task-actions";
    actions.append(editButton, removeButton);
    content.append(title, meta);
    row.append(checkbox, content, actions);
    elements.globalTaskList.appendChild(row);
  });
}

function addTaskToCurrentEntry() {
  const title = elements.taskInput.value.trim();

  if (!title) {
    return;
  }

  state.currentTasks.push({
    id: crypto.randomUUID(),
    title,
    done: false,
    dueDate: elements.taskDateInput.value || "",
    createdAt: new Date().toISOString(),
  });

  elements.taskInput.value = "";
  elements.taskDateInput.value = "";
  renderTaskEditor();
}

function addGlobalTask() {
  const title = elements.globalTaskInput.value.trim();

  if (!title) {
    return;
  }

  state.generalTasks.push({
    id: crypto.randomUUID(),
    title,
    done: false,
    dueDate: elements.globalTaskDateInput.value || "",
    createdAt: new Date().toISOString(),
  });

  elements.globalTaskInput.value = "";
  elements.globalTaskDateInput.value = "";
  render();
  markMemoryChanges();
}

function toggleCurrentTask(taskId) {
  state.currentTasks = state.currentTasks.map((task) =>
    task.id === taskId ? { ...task, done: !task.done } : task
  );
  renderTaskEditor();
}

function removeCurrentTask(taskId) {
  state.currentTasks = state.currentTasks.filter((task) => task.id !== taskId);
  renderTaskEditor();
}

function normalizeTasks(tasks = []) {
  return tasks
    .filter((task) => task && task.title)
    .map((task) => ({
      id: task.id || crypto.randomUUID(),
      title: task.title.trim(),
      done: Boolean(task.done),
      dueDate: task.dueDate || "",
      createdAt: task.createdAt || new Date().toISOString(),
    }));
}

function renderEntryTasks(entry, container, listElement, countElement) {
  const tasks = normalizeTasks(entry.tasks || []);
  const pendingCount = tasks.filter((task) => !task.done).length;

  listElement.innerHTML = "";
  container.classList.toggle("is-hidden", tasks.length === 0);

  if (tasks.length === 0) {
    return;
  }

  countElement.textContent = pendingCount === 0 ? "Tudo feito" : `${pendingCount} pendente(s)`;

  tasks.forEach((task) => {
    const row = document.createElement("label");
    const checkbox = document.createElement("input");
    const content = document.createElement("div");
    const title = document.createElement("span");
    const meta = document.createElement("span");

    row.className = "task-row";
    if (task.done) {
      row.classList.add("is-done");
    }

    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.addEventListener("change", () => {
      toggleTaskOnEntry(entry.id, task.id);
    });

    content.className = "task-row-content";
    title.className = "task-row-title";
    title.textContent = task.title;
    meta.className = "task-row-meta";
    meta.textContent = task.dueDate ? `Para ${formatShortDate(task.dueDate)}` : "Sem data";

    content.append(title, meta);
    row.append(checkbox, content);
    listElement.appendChild(row);
  });
}

function openTaskModal(scope, task) {
  state.taskModalContext = {
    scope,
    taskId: task.id,
  };
  elements.taskModalTitleInput.value = task.title;
  elements.taskModalDateInput.value = task.dueDate || "";
  elements.taskModal.classList.remove("is-hidden");
  elements.taskModal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => {
    elements.taskModalTitleInput.focus();
  }, 0);
}

function closeTaskModal() {
  state.taskModalContext = null;
  elements.taskModal.classList.add("is-hidden");
  elements.taskModal.setAttribute("aria-hidden", "true");
  elements.taskModalTitleInput.value = "";
  elements.taskModalDateInput.value = "";
}

function saveTaskModalChanges() {
  if (!state.taskModalContext) {
    return;
  }

  const title = elements.taskModalTitleInput.value.trim();
  const dueDate = elements.taskModalDateInput.value || "";

  if (!title) {
    return;
  }

  if (state.taskModalContext.scope === "current") {
    state.currentTasks = state.currentTasks.map((task) =>
      task.id === state.taskModalContext.taskId ? { ...task, title, dueDate } : task
    );
    renderTaskEditor();
    closeTaskModal();
    return;
  }

  state.generalTasks = state.generalTasks.map((task) =>
    task.id === state.taskModalContext.taskId ? { ...task, title, dueDate } : task
  );

  render();
  closeTaskModal();
  markMemoryChanges();
}

function toggleTaskOnEntry(entryId, taskId) {
  state.entries = state.entries.map((entry) => {
    if (entry.id !== entryId) {
      return entry;
    }

    return {
      ...entry,
      tasks: normalizeTasks(entry.tasks || []).map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task
      ),
    };
  });

  render();
  markMemoryChanges();
}

function toggleGlobalTask(taskId) {
  state.generalTasks = state.generalTasks.map((task) =>
    task.id === taskId ? { ...task, done: !task.done } : task
  );

  render();
  markMemoryChanges();
}

function removeGlobalTask(taskId) {
  state.generalTasks = state.generalTasks.filter((task) => task.id !== taskId);
  render();
  markMemoryChanges();
}

function updateFormState() {
  const reimbursable = hasReimbursementFlow();
  const reimbursementFields = [
    elements.reimbursementPerson,
    elements.reimbursementAmount,
    elements.reimbursementStatus,
    elements.reimbursementDate,
  ];

  elements.reimbursementToggleLabel.textContent = reimbursable ? "Sim" : "Não";
  elements.reimbursementSection.classList.toggle("is-disabled", !reimbursable);
  reimbursementFields.forEach((field) => {
    field.disabled = !reimbursable;
  });

  if (!reimbursable) {
    elements.reimbursementPerson.value = "";
    elements.reimbursementAmount.value = "";
    elements.reimbursementStatus.value = "nao-se-aplica";
    elements.reimbursementDate.value = "";

    if (state.currentStep === 3) {
      setCurrentStep(4);
      return;
    }
  }

  updateFormPreview();
}

function hasReimbursementFlow() {
  return elements.isReimbursable.checked;
}

function getVisibleSteps() {
  return hasReimbursementFlow() ? [1, 2, 3, 4] : [1, 2, 4];
}

function getStepDisplayIndex(step) {
  return getVisibleSteps().indexOf(step) + 1;
}

function getNextVisibleStep(step) {
  const visibleSteps = getVisibleSteps();
  const currentIndex = visibleSteps.indexOf(step);
  return visibleSteps[Math.min(currentIndex + 1, visibleSteps.length - 1)];
}

function getPreviousVisibleStep(step) {
  const visibleSteps = getVisibleSteps();
  const currentIndex = visibleSteps.indexOf(step);
  return visibleSteps[Math.max(currentIndex - 1, 0)];
}

function getAllPeople() {
  const usedPeople = state.entries
    .flatMap((entry) => [entry.person, entry.reimbursementPerson])
    .filter(Boolean);

  return [...new Set([...defaultPeople, ...state.manualPeople, ...usedPeople])].sort((left, right) =>
    left.localeCompare(right, "pt-BR")
  );
}

function getImportedPeople(entries) {
  return [
    ...new Set(
      entries.flatMap((entry) => [entry.person, entry.reimbursementPerson]).filter(Boolean)
    ),
  ];
}

function buildStoragePayload() {
  return {
    name: state.workspaceName,
    entries: state.entries,
    generalTasks: state.generalTasks,
  };
}

function openPersonModal(target = "person") {
  state.personModalTarget = target;
  elements.personModal.classList.remove("is-hidden");
  elements.personModal.setAttribute("aria-hidden", "false");
  window.setTimeout(() => {
    elements.customPerson.focus();
  }, 0);
}

function closePersonModal() {
  elements.personModal.classList.add("is-hidden");
  elements.personModal.setAttribute("aria-hidden", "true");
  elements.customPerson.value = "";
}

function addCustomPerson() {
  const value = elements.customPerson.value.trim();

  if (!value) {
    return;
  }

  if (!state.manualPeople.includes(value)) {
    state.manualPeople.push(value);
  }

  renderPersonOptions({
    person: state.personModalTarget === "person" ? value : sanitizePersonValue(elements.person.value) || "Noivos",
    reimbursementPerson:
      state.personModalTarget === "reimbursementPerson"
        ? value
        : sanitizePersonValue(elements.reimbursementPerson.value) || "Noivos",
  });
  closePersonModal();
}

function getSelectedPerson() {
  return sanitizePersonValue(elements.person.value);
}

function sanitizePersonValue(value) {
  return value === ADD_PERSON_OPTION_VALUE ? "" : value.trim();
}

function updateFormPreview() {
  const contractAmount = Number(elements.contractAmount.value || 0);
  const paidAmount = Number(elements.paidAmount.value || 0);
  const remainingToPay = Math.max(contractAmount - paidAmount, 0);

  syncPaymentStatus(contractAmount, paidAmount);
  elements.remainingAmount.value = formatCurrency(remainingToPay);
}

function syncPaymentStatus(contractAmount, paidAmount) {
  if (!contractAmount) {
    elements.paymentStatus.value = paidAmount > 0 ? "pago-parcial" : "";
    return;
  }

  if (paidAmount <= 0) {
    elements.paymentStatus.value = "nao-pago";
    return;
  }

  if (paidAmount >= contractAmount) {
    elements.paymentStatus.value = "pago-100";
    return;
  }

  const ratio = paidAmount / contractAmount;

  if (ratio === 0.5) {
    elements.paymentStatus.value = "pago-50";
    return;
  }

  if (ratio < 0.5) {
    elements.paymentStatus.value = "sinal-pago";
    return;
  }

  elements.paymentStatus.value = "pago-parcial";
}

function setCurrentStep(step) {
  const visibleSteps = getVisibleSteps();
  const nextStep = visibleSteps.includes(step) ? step : visibleSteps[visibleSteps.length - 1];

  state.currentStep = nextStep;
  elements.stepSections.forEach((section) => {
    const sectionStep = Number(section.dataset.step);
    section.classList.toggle("is-hidden", sectionStep !== nextStep || !visibleSteps.includes(sectionStep));
  });

  const content = stepContent[nextStep];
  const displayIndex = getStepDisplayIndex(nextStep);
  elements.stepTitle.textContent = `Etapa ${displayIndex} de ${visibleSteps.length}`;
  elements.stepDescription.textContent = content.description;
  elements.stepProgressBar.style.width = `${(displayIndex / visibleSteps.length) * 100}%`;
  elements.finalFormActions.classList.toggle("is-hidden", nextStep !== 4);
}

function canAdvanceToStep(nextStep) {
  const visibleSteps = getVisibleSteps();
  const currentIndex = visibleSteps.indexOf(state.currentStep);
  const nextIndex = visibleSteps.indexOf(nextStep);

  if (nextIndex !== -1 && nextIndex <= currentIndex) {
    return true;
  }

  if (state.currentStep === 1) {
    return Boolean(elements.title.value.trim());
  }

  if (state.currentStep === 2) {
    return Boolean(elements.contractAmount.value && elements.paymentStatus.value);
  }

  return true;
}

function renderAttention() {
  const attentionEntries = [...state.entries]
    .filter(
      (entry) =>
        entry.paymentStatus !== "pago-100" ||
        (entry.isReimbursable === "sim" && entry.reimbursementStatus !== "recebido")
    )
    .map((entry) => ({
      entry,
      urgency: getAttentionUrgency(entry),
    }))
    .sort((left, right) => {
      if (left.urgency.score !== right.urgency.score) {
        return right.urgency.score - left.urgency.score;
      }

      if (left.urgency.dateKey && right.urgency.dateKey) {
        return left.urgency.dateKey.localeCompare(right.urgency.dateKey);
      }

      if (left.urgency.dateKey) return -1;
      if (right.urgency.dateKey) return 1;
      return left.entry.title.localeCompare(right.entry.title, "pt-BR");
    })
    .slice(0, 4);

  elements.attentionList.innerHTML = "";

  if (attentionEntries.length === 0) {
    elements.attentionList.innerHTML =
      '<div class="empty-state"><strong>Nada urgente por aqui.</strong><span>Quando existir pagamento próximo, atraso ou ressarcimento pendente, o sistema vai destacar aqui automaticamente.</span></div>';
    return;
  }

  attentionEntries.forEach(({ entry, urgency }) => {
    const item = document.createElement("article");
    const topLine = document.createElement("div");
    const titleWrap = document.createElement("div");
    const badge = document.createElement("span");
    const title = document.createElement("strong");
    const meta = document.createElement("p");
    const finance = document.createElement("div");
    const pendingBlock = document.createElement("div");
    const reimbursementBlock = document.createElement("div");
    const pendingLabel = document.createElement("span");
    const pendingValue = document.createElement("strong");
    const reimbursementLabel = document.createElement("span");
    const reimbursementValue = document.createElement("strong");
    const notes = document.createElement("p");
    const actions = document.createElement("div");
    const editButton = document.createElement("button");
    const focusButton = document.createElement("button");

    item.className = "attention-item";
    if (urgency.tone) {
      item.classList.add(`is-${urgency.tone}`);
    }
    topLine.className = "attention-topline";
    titleWrap.className = "attention-title-wrap";
    badge.className = "attention-badge";
    badge.textContent = urgency.label;
    title.textContent = entry.title;
    titleWrap.append(badge, title);
    meta.textContent = [
      getPaymentStatusLabel(entry.paymentStatus),
      entry.nextPaymentDate ? `vence ${formatDate(entry.nextPaymentDate)}` : "sem vencimento definido",
      entry.nextPaymentAmount ? formatCurrency(entry.nextPaymentAmount) : "sem valor futuro",
    ].join(" · ");
    meta.className = "attention-meta";
    finance.className = "attention-finance";
    pendingBlock.className = "attention-finance-item";
    reimbursementBlock.className = "attention-finance-item";
    pendingLabel.className = "attention-finance-label";
    pendingValue.className = "attention-finance-value";
    reimbursementLabel.className = "attention-finance-label";
    reimbursementValue.className = "attention-finance-value";
    pendingLabel.textContent = "Saldo em aberto";
    pendingValue.textContent = formatCurrency(
      Math.max(Number(entry.contractAmount || 0) - Number(entry.paidAmount || 0), 0)
    );
    reimbursementLabel.textContent = "Ressarcimento";
    reimbursementValue.textContent =
      entry.isReimbursable === "sim"
        ? formatCurrency(entry.reimbursementAmount || 0)
        : "Sem retorno";
    pendingBlock.append(pendingLabel, pendingValue);
    reimbursementBlock.append(reimbursementLabel, reimbursementValue);
    finance.append(pendingBlock, reimbursementBlock);
    notes.className = "attention-notes";
    notes.textContent =
      entry.isReimbursable === "sim"
        ? `Ressarcimento de ${formatCurrency(entry.reimbursementAmount)}: ${getReimbursementStatusLabel(entry.reimbursementStatus)}${entry.reimbursementPerson ? ` com ${entry.reimbursementPerson}` : ""}.`
        : entry.notes || "Sem observações extras por enquanto.";
    actions.className = "attention-actions";
    editButton.type = "button";
    editButton.className = "attention-action";
    editButton.textContent = "Editar item";
    editButton.addEventListener("click", () => populateForm(entry));
    focusButton.type = "button";
    focusButton.className = "attention-action secondary";
    focusButton.textContent = entry.nextPaymentDate ? `Vence ${formatShortDate(entry.nextPaymentDate)}` : "Sem vencimento";
    topLine.append(titleWrap, meta);
    actions.append(editButton, focusButton);
    item.append(topLine, finance, notes, actions);
    elements.attentionList.appendChild(item);
  });
}

function getAttentionUrgency(entry) {
  const hasOpenPayment = entry.paymentStatus !== "pago-100";
  const hasOpenReimbursement =
    entry.isReimbursable === "sim" && entry.reimbursementStatus !== "recebido";
  const daysUntilPayment = entry.nextPaymentDate ? getDaysUntil(entry.nextPaymentDate) : null;

  if (typeof daysUntilPayment === "number" && daysUntilPayment < 0 && hasOpenPayment) {
    return {
      score: 4,
      label: "Atrasado",
      tone: "critical",
      dateKey: entry.nextPaymentDate,
    };
  }

  if (typeof daysUntilPayment === "number" && daysUntilPayment <= 7 && hasOpenPayment) {
    return {
      score: 3,
      label: "Essa semana",
      tone: "warning",
      dateKey: entry.nextPaymentDate,
    };
  }

  if (hasOpenReimbursement) {
    return {
      score: 2,
      label: "Ressarcimento",
      tone: "warning",
      dateKey: entry.reimbursementDate || "",
    };
  }

  return {
    score: 1,
    label: "Acompanhar",
    tone: "",
    dateKey: entry.nextPaymentDate || "",
  };
}

function handleVisibilityChange() {
  if (document.visibilityState !== "hidden" || !state.saveTimer) {
    return;
  }

  clearTimeout(state.saveTimer);
  state.saveTimer = null;
  persistWorkspace(state.lastQueuedMessage);
  state.lastQueuedMessage = "";
}

function getDaysUntil(value) {
  const today = new Date();
  const normalizedToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const target = new Date(`${value}T12:00:00`);
  const normalizedTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const difference = normalizedTarget.getTime() - normalizedToday.getTime();
  return Math.round(difference / 86400000);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value || 0);
}

function formatDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${value}T12:00:00`));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getPaymentStatusLabel(status) {
  const labels = {
    "nao-pago": "Não pago",
    "sinal-pago": "Sinal pago",
    "entrada-paga": "Entrada paga",
    "pago-50": "Pago 50%",
    "pago-parcial": "Pago parcial",
    "pago-100": "Pago completo (100%)",
  };

  return labels[status] || status;
}

function getReimbursementStatusLabel(status) {
  const labels = {
    "nao-se-aplica": "Não se aplica",
    pendente: "Pendente",
    parcial: "Parcial",
    recebido: "Recebido",
  };

  return labels[status] || status;
}

function getPaymentStatusClass(status) {
  if (status === "pago-100") return "status-pago";
  if (["pago-50", "pago-parcial", "entrada-paga", "sinal-pago"].includes(status)) {
    return "status-parcial";
  }
  return "status-pendente";
}

function buildWorkspaceName(slug) {
  return `Painel do casal ${slug.slice(0, 6).toUpperCase()}`;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json();
}
