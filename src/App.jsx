import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
const APP_V = "11";
import { supabase } from "./supabase.js";
import QRCodeLib from "qrcode";
import jsQR from "jsqr";

// ─────────────────────────────────────────────
// APP CONFIG
// ─────────────────────────────────────────────
const APP_NAME    = "Penas' SurfTrack";
const APP_TAGLINE = "Surf School Management";
const CURRENCY    = "€";

const DEFAULT_MEMBERSHIP_TIERS = [
  { id: "basic",    label: "Basic",    entriesPerWeek: 2, monthlyPrice: 49  },
  { id: "standard", label: "Standard", entriesPerWeek: 4, monthlyPrice: 79  },
  { id: "elite",    label: "Elite",    entriesPerWeek: 7, monthlyPrice: 119 },
];

const DEFAULT_PUNCH_CARD_OPTIONS = [
  { id: "card10", label: "10 Punches", punches: 10, price: 90  },
  { id: "card20", label: "20 Punches", punches: 20, price: 160 },
  { id: "card50", label: "50 Punches", punches: 50, price: 350 },
];

const DEFAULT_LESSON_TYPES = [
  { id: "group",   label: "Group Lesson",   punchCost: 1 },
  { id: "private", label: "Private Lesson", punchCost: 2 },
];

const DEFAULT_GROUP_CLASSES = ["Beginner Surf", "Intermediate Surf", "Advanced Surf", "Bodyboard", "Ocean Safety", "Yoga"];

// Live config context — persisted to localStorage, editable from Settings page
const ConfigContext = createContext(null);

function useConfig() { return useContext(ConfigContext); }

function ConfigProvider({ children }) {
  const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
  const [tiers,        setTiersRaw]   = useState(() => lsGet("st_tiers",   DEFAULT_MEMBERSHIP_TIERS));
  const [cardOptions,  setCardsRaw]   = useState(() => lsGet("st_cards",   DEFAULT_PUNCH_CARD_OPTIONS));
  const [lessonTypes,  setLessonsRaw] = useState(() => lsGet("st_lessons", DEFAULT_LESSON_TYPES));
  const [groupClasses, setClassesRaw] = useState(() => lsGet("st_classes", DEFAULT_GROUP_CLASSES));

  // On mount: pull latest config from Supabase so all devices stay in sync
  useEffect(() => {
    supabase.from("app_config").select("key, value").then(({ data }) => {
      if (!data?.length) return;
      const map = Object.fromEntries(data.map(r => [r.key, r.value]));
      if (map.st_tiers)   { localStorage.setItem("st_tiers",   JSON.stringify(map.st_tiers));   setTiersRaw(map.st_tiers);   }
      if (map.st_cards)   { localStorage.setItem("st_cards",   JSON.stringify(map.st_cards));   setCardsRaw(map.st_cards);   }
      if (map.st_lessons) { localStorage.setItem("st_lessons", JSON.stringify(map.st_lessons)); setLessonsRaw(map.st_lessons); }
      if (map.st_classes) { localStorage.setItem("st_classes", JSON.stringify(map.st_classes)); setClassesRaw(map.st_classes); }
    });
  }, []);

  const save = async (key, val, setter) => {
    localStorage.setItem(key, JSON.stringify(val));
    setter(val);
    await supabase.from("app_config").upsert({ key, value: val }, { onConflict: "key" });
  };
  const setTiers        = v => save("st_tiers",   v, setTiersRaw);
  const setCardOptions  = v => save("st_cards",   v, setCardsRaw);
  const setLessonTypes  = v => save("st_lessons", v, setLessonsRaw);
  const setGroupClasses = v => save("st_classes", v, setClassesRaw);

  return (
    <ConfigContext.Provider value={{ tiers, setTiers, cardOptions, setCardOptions, lessonTypes, setLessonTypes, groupClasses, setGroupClasses }}>
      {children}
    </ConfigContext.Provider>
  );
}

// ─────────────────────────────────────────────
// TRANSLATIONS
// ─────────────────────────────────────────────
const T = {
  en: {
    // Nav
    menu: "Menu",
    dashboard: "Dashboard",
    students: "Students",
    entryScanner: "Entry Scanner",
    logLesson: "Log Lesson",
    billing: "Billing",
    reservations: "Reservations",
    camps: "Camps",
    instructors: "Instructors",
    exportData: "Export Data",
    settings: "Settings",
    signOut: "Sign Out",
    // Login
    signIn: "Sign In →",
    signingIn: "Signing in…",
    email: "Email",
    password: "Password",
    loginHint: "Create your staff accounts in Supabase → Authentication → Users",
    // Loading
    loadingSchool: "Loading school data…",
    loading: "Loading…",
    // Dashboard
    todayDate: (d) => d.toLocaleDateString("en-GB", { weekday: "long", month: "long", day: "numeric" }),
    totalStudents: "Total Students",
    monthlyMembers: "Monthly Members",
    dualPlans: "Dual Plans",
    atWeeklyLimit: "At Weekly Limit",
    recentEntries: "Recent Entries",
    noEntries: "No entries recorded yet.",
    studentOverview: "Student Overview",
    sessionsThisWeek: (u, l) => `${u}/${l} sessions this week`,
    addStudent: "+ Add Student",
    // Students page
    enrolled: (n) => `${n} enrolled`,
    searchPlaceholder: "Search name or email…",
    membership: "Membership",
    weeklyUsage: "Weekly Usage",
    punchCard: "Punch Card",
    status: "Status",
    none: "None",
    sessions: (u, l) => `${u}/${l} sessions`,
    punches: (n) => `${n} punches`,
    restricted: "Restricted",
    cardFallback: "Card Fallback",
    active: "Active",
    view: "View",
    // Entry page
    entryScannerTitle: "Entry Scanner",
    entryScannerSub: "Scan student QR or search by name",
    cameraScan: "📷 Camera Scan",
    searchStudent: "🔍 Search Student",
    pointCamera: "Point camera at student's QR card",
    cameraUnavailable: "Camera not available. Use Search instead.",
    afterScanning: "After scanning, tap the student's name:",
    noMembership: "No membership",
    typeNameOrEmail: "Type name or email…",
    selected: "Selected ✓",
    guestEntry: "Guest Entry",
    guestCheck: "This is a guest (uses punch card)",
    guestName: "Guest Name",
    guestNamePlaceholder: "Guest full name",
    processEntry: (name) => name ? `⬡ Process Entry — ${name}` : "⬡ Process Entry",
    processing: "Processing…",
    welcomeIn: "Welcome in! 🏄",
    guestAdmitted: "Guest Admitted! 🏄",
    entryDenied: "Entry Denied",
    noPlan: "No weekly entries and no punches available.",
    membershipEntry: (u, l, label) => `${label} weekly entry (${u}/${l})`,
    punchcardEntry: (bal, guest, name) => guest ? `Guest entry for ${name}` : "Punch card entry",
    punchUsed: (bal) => `Punch card used. ${bal} punches remaining.`,
    // Lessons page
    logLessonTitle: "Log Lesson",
    logLessonSub: "Record surf lessons — saved permanently",
    recordLesson: "Record Lesson",
    lessonNotice: "Group = 1 punch · Private = 2 punches",
    selectStudent: "Select student…",
    lessonType: "Lesson Type",
    class: "Class",
    punchesAvailable: (n, name) => `✓ ${name} has ${n} punches.`,
    notEnoughPunches: (need, have) => `✗ Need ${need}, only ${have} available.`,
    logLessonBtn: "Log Lesson",
    saving: "Saving…",
    lessonRecorded: "Lesson Recorded ✓",
    recentLessons: "Recent Lessons",
    noLessons: "No lessons recorded yet.",
    punch: "punch",
    punches2: "punches",
    // Billing page
    billingTitle: "Billing",
    billingSub: "Manage memberships & punch cards — all changes saved",
    accountActions: "Account Actions",
    loadPunchCard: "Load Punch Card",
    setMembership: "Set Membership",
    selectAmount: "Select Amount",
    loadCard: "Load Card",
    selectTier: "Select Tier",
    sessionsPerWeek: (n) => `${n} sessions/week`,
    perWeek: "/week",
    updateMembership: "Update Membership",
    removeMembership: "Remove",
    cardLoaded: "✓ Punch card loaded.",
    membershipUpdated: "✓ Membership updated.",
    membershipRemoved: "Membership removed.",
    revenueSummary: (month) => `Revenue Summary — ${month}`,
    revenueNotice: "Membership fees shown per active plan. Punch card revenue shows only cards sold this month — cards from previous months are not included.",
    membershipFee: "Membership Fee",
    cardsThisMonth: "Cards This Month",
    membershipFees: "Membership fees",
    punchCardSalesMonth: "Punch card sales this month",
    totalRevenue: (month) => `Total Revenue — ${month}`,
    monthLabel: () => new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
    // Export page
    exportTitle: "Export Data",
    exportSub: "Download records as CSV — open in Excel or Google Sheets",
    entryLog: "Entry Log",
    entryLogDesc: "Every entry attempt — student name, date, time, method (membership / punch card / denied), guest info.",
    downloadEntryLog: "↓ Download Entry Log CSV",
    revenueSummaryTitle: "Revenue Summary",
    revenueSummaryDesc: "Per-student summary: membership tier, punch balance, total entries, total lessons.",
    downloadRevenue: "↓ Download Revenue CSV",
    downloading: "Downloading…",
    entryLogDownloaded: "✓ Entry log downloaded.",
    revenueDownloaded: "✓ Revenue summary downloaded.",
    exportTip: "For full historical data, you can also query directly in Supabase → Table Editor or use the built-in SQL editor to write custom reports.",
    // Settings page
    settingsTitle: "Settings",
    settingsSub: "Manage pricing, plans, and class types",
    membershipTiers: "Membership Tiers",
    tiersEditHint: "Edit MEMBERSHIP_TIERS at the top of App.jsx to add or change tiers.",
    punchCardOptions: "Punch Card Options",
    cardsEditHint: "Edit PUNCH_CARD_OPTIONS at the top of App.jsx to add or change amounts.",
    perPunch: (p) => `${CURRENCY}${p} per punch`,
    lessonRules: "Lesson Rules",
    groupClassesLabel: "Group Class Types",
    addTier: "+ Add Tier",
    addCard: "+ Add Card",
    addClass: "+ Add Class",
    saveTiers: "Save Tiers",
    saveCards: "Save Cards",
    saveLessons: "Save Lessons",
    saveClasses: "Save Classes",
    saved: "Saved ✓",
    labelCol: "Label",
    sessionsWk: "Sessions/wk",
    priceCol: "Price (€)",
    punchesCol: "Punches",
    punchCostCol: "Punch cost",
    resetDefaults: "Reset to defaults",
    mo: "/mo",
    month: "/month",
    // Delete student
    deleteStudent: "Delete Student",
    deleteConfirmTitle: "Delete this student?",
    deleteConfirmText: (name) => `This will permanently delete ${name} and all their entry logs, lessons, and billing history. This cannot be undone.`,
    deleteConfirm: "Yes, Delete Permanently",
    deleting: "Deleting…",
    // Student detail modal
    joinedDate: (d) => `Joined ${d}`,
    overview: "overview",
    qrCode: "qr code",
    entry: "entry",
    lessons: "lessons",
    history: "history",
    membershipLabel: "Membership",
    sessionsThisWeekShort: (u, l) => `${u}/${l} sessions this week`,
    noPunchCard: "No punch card",
    noMembershipBadge: "No membership",
    bothPlansActive: (u, l) => `Both plans active — membership used first (${u}/${l}), punch card fallback.`,
    membershipOnly: (r) => `Membership only — ${r} sessions remaining this week.`,
    punchCardOnly: (b) => `Punch card only — ${b} punches available.`,
    noPlanDenied: "No active plan. Entry will be denied.",
    entryLogic: "Entry Logic",
    qrNotice: "Each student has a unique QR code. Staff scans this at entry. Right-click → Save Image to print or share.",
    qrPrintHint: "Print and give to the student, or they screenshot it. Staff scans from Entry Scanner.",
    membershipFirst: "Membership is used first, punch card as fallback.",
    guestEntryCheck: "Guest entry (always uses punch card)",
    processEntryBtn: "⬡ Process Entry",
    studentNeedsPunchCard: "Student needs a punch card to book lessons.",
    loadPunches: "Load Punches",
    punchesLoaded: "✓ Punches loaded.",
    membershipTier: "Membership Tier",
    entryLogTab: "Entry Log",
    noEntriesYet: "No entries yet.",
    guestLabel: (name) => ` · Guest: ${name}`,
    punchCardHistory: "Punch Card History",
    noPunchActivity: "No punch card activity.",
    // Add student modal
    addNewStudent: "Add New Student",
    fullName: "Full Name",
    phone: "Phone",
    notes: "Notes",
    notesPlaceholder: "Any notes…",
    addMonthlyMembership: "Add Monthly Membership",
    addPunchCard: "Add Punch Card",
    nameEmailRequired: "Name and email required.",
    creating: "Creating…",
    createStudent: "Create Student",
    cancel: "Cancel",
    // Errors
    dbError: (msg) => `Database error: ${msg} —`,
    retry: "retry",
  },

  pt: {
    // Nav
    menu: "Menu",
    dashboard: "Painel",
    students: "Alunos",
    entryScanner: "Leitor de Entrada",
    logLesson: "Registar Aula",
    billing: "Faturação",
    reservations: "Reservas",
    camps: "Campos",
    instructors: "Instrutores",
    exportData: "Exportar Dados",
    settings: "Definições",
    signOut: "Terminar Sessão",
    // Login
    signIn: "Entrar →",
    signingIn: "A entrar…",
    email: "Email",
    password: "Palavra-passe",
    loginHint: "Crie as contas do pessoal no Supabase → Authentication → Users",
    // Loading
    loadingSchool: "A carregar dados da escola…",
    loading: "A carregar…",
    // Dashboard
    todayDate: (d) => d.toLocaleDateString("pt-PT", { weekday: "long", month: "long", day: "numeric" }),
    totalStudents: "Total de Alunos",
    monthlyMembers: "Membros Mensais",
    dualPlans: "Planos Duplos",
    atWeeklyLimit: "No Limite Semanal",
    recentEntries: "Entradas Recentes",
    noEntries: "Nenhuma entrada registada ainda.",
    studentOverview: "Resumo dos Alunos",
    sessionsThisWeek: (u, l) => `${u}/${l} sessões esta semana`,
    addStudent: "+ Adicionar Aluno",
    // Students page
    enrolled: (n) => `${n} inscritos`,
    searchPlaceholder: "Pesquisar nome ou email…",
    membership: "Subscrição",
    weeklyUsage: "Uso Semanal",
    punchCard: "Cartão",
    status: "Estado",
    none: "Nenhum",
    sessions: (u, l) => `${u}/${l} sessões`,
    punches: (n) => `${n} cartões`,
    restricted: "Bloqueado",
    cardFallback: "Fallback Cartão",
    active: "Ativo",
    view: "Ver",
    // Entry page
    entryScannerTitle: "Leitor de Entrada",
    entryScannerSub: "Ler QR do aluno ou pesquisar por nome",
    cameraScan: "📷 Câmara",
    searchStudent: "🔍 Pesquisar Aluno",
    pointCamera: "Aponte a câmara para o cartão QR do aluno",
    cameraUnavailable: "Câmara indisponível. Use a Pesquisa.",
    afterScanning: "Após leitura, toque no nome do aluno:",
    noMembership: "Sem subscrição",
    typeNameOrEmail: "Digite nome ou email…",
    selected: "Selecionado ✓",
    guestEntry: "Entrada de Convidado",
    guestCheck: "É um convidado (usa cartão de punções)",
    guestName: "Nome do Convidado",
    guestNamePlaceholder: "Nome completo do convidado",
    processEntry: (name) => name ? `⬡ Processar Entrada — ${name}` : "⬡ Processar Entrada",
    processing: "A processar…",
    welcomeIn: "Bem-vindo! 🏄",
    guestAdmitted: "Convidado Admitido! 🏄",
    entryDenied: "Entrada Negada",
    noPlan: "Sem entradas semanais e sem punções disponíveis.",
    membershipEntry: (u, l, label) => `Entrada de subscrição ${label} (${u}/${l})`,
    punchcardEntry: (bal, guest, name) => guest ? `Entrada de convidado para ${name}` : "Entrada por cartão",
    punchUsed: (bal) => `Cartão usado. ${bal} punções restantes.`,
    // Lessons page
    logLessonTitle: "Registar Aula",
    logLessonSub: "Registar aulas de surf — guardado permanentemente",
    recordLesson: "Registar Aula",
    lessonNotice: "Grupo = 1 punção · Privada = 2 punções",
    selectStudent: "Selecionar aluno…",
    lessonType: "Tipo de Aula",
    class: "Turma",
    punchesAvailable: (n, name) => `✓ ${name} tem ${n} punções.`,
    notEnoughPunches: (need, have) => `✗ Precisa de ${need}, tem apenas ${have}.`,
    logLessonBtn: "Registar Aula",
    saving: "A guardar…",
    lessonRecorded: "Aula Registada ✓",
    recentLessons: "Aulas Recentes",
    noLessons: "Nenhuma aula registada ainda.",
    punch: "punção",
    punches2: "punções",
    // Billing page
    billingTitle: "Faturação",
    billingSub: "Gerir subscrições e cartões — todas as alterações guardadas",
    accountActions: "Ações de Conta",
    loadPunchCard: "Carregar Cartão",
    setMembership: "Definir Subscrição",
    selectAmount: "Selecionar Valor",
    loadCard: "Carregar Cartão",
    selectTier: "Selecionar Plano",
    sessionsPerWeek: (n) => `${n} sessões/semana`,
    perWeek: "/semana",
    updateMembership: "Atualizar Subscrição",
    removeMembership: "Remover",
    cardLoaded: "✓ Cartão carregado.",
    membershipUpdated: "✓ Subscrição atualizada.",
    membershipRemoved: "Subscrição removida.",
    revenueSummary: (month) => `Resumo de Receitas — ${month}`,
    revenueNotice: "Mensalidades por plano ativo. Receita de cartões apenas com vendas deste mês — meses anteriores não incluídos.",
    membershipFee: "Mensalidade",
    cardsThisMonth: "Cartões Este Mês",
    membershipFees: "Mensalidades",
    punchCardSalesMonth: "Vendas de cartões este mês",
    totalRevenue: (month) => `Receita Total — ${month}`,
    monthLabel: () => new Date().toLocaleDateString("pt-PT", { month: "long", year: "numeric" }),
    // Export page
    exportTitle: "Exportar Dados",
    exportSub: "Descarregar registos em CSV — abrir no Excel ou Google Sheets",
    entryLog: "Registo de Entradas",
    entryLogDesc: "Todas as tentativas de entrada — nome, data, hora, método (subscrição / cartão / negada), info de convidado.",
    downloadEntryLog: "↓ Descarregar Registo CSV",
    revenueSummaryTitle: "Resumo de Receitas",
    revenueSummaryDesc: "Resumo por aluno: plano, saldo de punções, total de entradas, total de aulas.",
    downloadRevenue: "↓ Descarregar Receitas CSV",
    downloading: "A descarregar…",
    entryLogDownloaded: "✓ Registo de entradas descarregado.",
    revenueDownloaded: "✓ Resumo de receitas descarregado.",
    exportTip: "Para dados históricos completos, consulte diretamente o Supabase → Table Editor ou use o editor SQL para relatórios personalizados.",
    // Settings page
    settingsTitle: "Definições",
    settingsSub: "Gerir preços, planos e tipos de aulas",
    membershipTiers: "Planos de Subscrição",
    tiersEditHint: "Edite MEMBERSHIP_TIERS no topo do App.jsx para adicionar ou alterar planos.",
    punchCardOptions: "Opções de Cartão",
    cardsEditHint: "Edite PUNCH_CARD_OPTIONS no topo do App.jsx para adicionar ou alterar valores.",
    perPunch: (p) => `${CURRENCY}${p} por punção`,
    lessonRules: "Regras de Aulas",
    groupClassesLabel: "Tipos de Aula de Grupo",
    addTier: "+ Adicionar Plano",
    addCard: "+ Adicionar Cartão",
    addClass: "+ Adicionar Turma",
    saveTiers: "Guardar Planos",
    saveCards: "Guardar Cartões",
    saveLessons: "Guardar Aulas",
    saveClasses: "Guardar Turmas",
    saved: "Guardado ✓",
    labelCol: "Nome",
    sessionsWk: "Sessões/sem",
    priceCol: "Preço (€)",
    punchesCol: "Punções",
    punchCostCol: "Custo em punções",
    resetDefaults: "Repor predefinições",
    mo: "/mês",
    month: "/mês",
    // Delete student
    deleteStudent: "Eliminar Aluno",
    deleteConfirmTitle: "Eliminar este aluno?",
    deleteConfirmText: (name) => `Isto irá eliminar permanentemente ${name} e todos os seus registos de entradas, aulas e faturação. Esta ação não pode ser desfeita.`,
    deleteConfirm: "Sim, Eliminar Permanentemente",
    deleting: "A eliminar…",
    // Student detail modal
    joinedDate: (d) => `Inscrito em ${d}`,
    overview: "resumo",
    qrCode: "código qr",
    entry: "entrada",
    lessons: "aulas",
    history: "histórico",
    membershipLabel: "Subscrição",
    sessionsThisWeekShort: (u, l) => `${u}/${l} sessões esta semana`,
    noPunchCard: "Sem cartão de punções",
    noMembershipBadge: "Sem subscrição",
    bothPlansActive: (u, l) => `Ambos os planos ativos — subscrição usada primeiro (${u}/${l}), cartão como alternativa.`,
    membershipOnly: (r) => `Só subscrição — ${r} sessões restantes esta semana.`,
    punchCardOnly: (b) => `Só cartão — ${b} punções disponíveis.`,
    noPlanDenied: "Sem plano ativo. A entrada será negada.",
    entryLogic: "Lógica de Entrada",
    qrNotice: "Cada aluno tem um código QR único. O pessoal lê na entrada. Clique direito → Guardar Imagem para imprimir ou partilhar.",
    qrPrintHint: "Imprima e entregue ao aluno, ou ele tira uma captura de ecrã. O pessoal lê no Leitor de Entrada.",
    membershipFirst: "A subscrição é usada primeiro, o cartão como alternativa.",
    guestEntryCheck: "Entrada de convidado (usa sempre o cartão)",
    processEntryBtn: "⬡ Processar Entrada",
    studentNeedsPunchCard: "O aluno precisa de um cartão para agendar aulas.",
    loadPunches: "Carregar Punções",
    punchesLoaded: "✓ Punções carregadas.",
    membershipTier: "Plano de Subscrição",
    entryLogTab: "Registo de Entradas",
    noEntriesYet: "Nenhuma entrada ainda.",
    guestLabel: (name) => ` · Convidado: ${name}`,
    punchCardHistory: "Histórico do Cartão",
    noPunchActivity: "Nenhuma atividade no cartão.",
    // Add student modal
    addNewStudent: "Adicionar Novo Aluno",
    fullName: "Nome Completo",
    phone: "Telefone",
    notes: "Notas",
    notesPlaceholder: "Alguma nota…",
    addMonthlyMembership: "Adicionar Subscrição Mensal",
    addPunchCard: "Adicionar Cartão de Punções",
    nameEmailRequired: "Nome e email obrigatórios.",
    creating: "A criar…",
    createStudent: "Criar Aluno",
    cancel: "Cancelar",
    // Errors
    dbError: (msg) => `Erro de base de dados: ${msg} —`,
    retry: "tentar novamente",
  },
};

// React context so any component can read the current language
const LangContext = createContext("en");
const useLang = () => {
  const lang = useContext(LangContext);
  return T[lang];
};

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function getWeekStart() {
  // Week starts Sunday 00:00 local time.
  // getDay(): 0=Sun, 1=Mon … 6=Sat — so just subtract getDay() days.
  const now = new Date();
  const sun = new Date(now);
  sun.setDate(now.getDate() - now.getDay());
  sun.setHours(0, 0, 0, 0);
  return sun.toISOString();
}
function isNewWeek(ws) { return ws ? new Date(ws) < new Date(getWeekStart()) : true; }
function getTier(id, tiers) { return (tiers || DEFAULT_MEMBERSHIP_TIERS).find(t => t.id === id); }
function fmt(d)         { return new Date(d).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" }); }
function fmtTime(d)     { return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); }
function initials(name) { return name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2); }

// ─────────────────────────────────────────────
// DATABASE LAYER — all Supabase calls live here
// ─────────────────────────────────────────────
const db = {

  // ── STUDENTS ──────────────────────────────
  async fetchStudents() {
    const { data, error } = await supabase
      .from("students")
      .select(`
        *,
        memberships(*),
        punch_cards(*),
        entry_log(id, method, note, is_guest, guest_name, created_at),
        lesson_log(id, lesson_type, label, class_name, punch_cost, created_at),
        punch_card_history(id, delta, note, created_at)
      `)
      .order("name");
    if (error) throw error;
    return data.map(normalizeStudent);
  },

  async createStudent(fields) {
    const { data, error } = await supabase
      .from("students")
      .insert({ name: fields.name, email: fields.email, phone: fields.phone || "", avatar: initials(fields.name), notes: fields.notes || "" })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStudentNotes(id, notes) {
    await supabase.from("students").update({ notes }).eq("id", id);
  },

  // ── MEMBERSHIPS ───────────────────────────
  async upsertMembership(studentId, tierId) {
    console.log("[db] upsertMembership", { studentId, tierId });
    const { data, error } = await supabase
      .from("memberships")
      .upsert({ student_id: studentId, tier_id: tierId, active_week_entries: 0, week_start: getWeekStart() }, { onConflict: "student_id" })
      .select();
    console.log("[db] upsertMembership result", { data, error });
    if (error) throw error;
  },

  async removeMembership(studentId) {
    const { error } = await supabase.from("memberships").delete().eq("student_id", studentId);
    if (error) throw error;
  },

  async incrementWeekEntry(studentId, newCount) {
    const { error } = await supabase.from("memberships").update({ active_week_entries: newCount }).eq("student_id", studentId);
    if (error) throw error;
  },

  async resetWeekIfNeeded(student) {
    if (student.membership && isNewWeek(student.membership.weekStart)) {
      const { error } = await supabase.from("memberships").update({ active_week_entries: 0, week_start: getWeekStart() }).eq("student_id", student.id);
      if (error) throw error;
    }
  },

  // ── PUNCH CARDS ───────────────────────────
  async upsertPunchCard(studentId, balance) {
    console.log("[db] upsertPunchCard", { studentId, balance });
    const { data, error } = await supabase
      .from("punch_cards")
      .upsert({ student_id: studentId, balance }, { onConflict: "student_id" })
      .select();
    console.log("[db] upsertPunchCard result", { data, error });
    if (error) throw error;
  },

  async updatePunchBalance(studentId, newBalance) {
    const { data, error } = await supabase.from("punch_cards").update({ balance: newBalance }).eq("student_id", studentId).select();
    console.log("[db] updatePunchBalance result", { data, error });
    if (error) throw error;
  },

  async logPunchHistory(studentId, delta, note) {
    await supabase.from("punch_card_history").insert({ student_id: studentId, delta, note });
  },

  // ── ENTRY LOG ─────────────────────────────
  async logEntry(studentId, method, note, isGuest = false, guestName = "", ts = null) {
    const created_at = ts || new Date().toISOString();
    await supabase.from("entry_log").insert({ student_id: studentId, method, note, is_guest: isGuest, guest_name: guestName, created_at });
  },

  // ── RESERVATIONS ──────────────────────────
  async listReservations(weekStart, weekEnd) {
    const { data, error } = await supabase
      .from("reservations").select("*")
      .gte("session_date", weekStart).lte("session_date", weekEnd)
      .order("session_date").order("session_slot");
    if (error) throw error;
    return data || [];
  },
  async addReservation(studentId, sessionDate, sessionSlot, lessonType, punchCost) {
    const { error } = await supabase.from("reservations").insert({
      student_id: studentId, session_date: sessionDate,
      session_slot: sessionSlot, lesson_type: lessonType,
      punch_cost: punchCost, status: "reserved"
    });
    if (error) throw error;
  },
  async updateReservationStatus(id, status) {
    const { error } = await supabase.from("reservations").update({ status }).eq("id", id);
    if (error) throw error;
  },
  async getTodayReservation(studentId, today) {
    const { data } = await supabase.from("reservations")
      .select("*").eq("student_id", studentId).eq("session_date", today)
      .eq("status", "reserved").order("session_slot").limit(1);
    return data?.[0] || null;
  },
  async deleteReservation(id) {
    const { error } = await supabase.from("reservations").delete().eq("id", id);
    if (error) throw error;
  },

  // ── CAMPS ─────────────────────────────────
  async listCamps() {
    const { data, error } = await supabase.from("camp_programs").select("*").order("start_date");
    if (error) throw error;
    return data || [];
  },
  async createCamp(name, type, startDate, endDate) {
    const { error } = await supabase.from("camp_programs").insert({ name, type, start_date: startDate, end_date: endDate });
    if (error) throw error;
  },
  async deleteCamp(id) {
    const { error } = await supabase.from("camp_programs").delete().eq("id", id);
    if (error) throw error;
  },
  async listEnrollments(campId) {
    const { data, error } = await supabase.from("camp_enrollments").select("*").eq("camp_id", campId);
    if (error) throw error;
    return data || [];
  },
  async enrollStudent(studentId, campId, schedule) {
    const { error } = await supabase.from("camp_enrollments").insert({ student_id: studentId, camp_id: campId, schedule });
    if (error) throw error;
  },
  async unenrollStudent(studentId, campId) {
    const { error } = await supabase.from("camp_enrollments").delete().eq("student_id", studentId).eq("camp_id", campId);
    if (error) throw error;
  },
  async listCampAttendance(campId) {
    const { data, error } = await supabase.from("camp_attendance").select("*").eq("camp_id", campId);
    if (error) throw error;
    return data || [];
  },
  async logCampAttendance(studentId, campId, date) {
    // Upsert — only one check-in per student per day per camp
    const { error } = await supabase.from("camp_attendance").upsert(
      { student_id: studentId, camp_id: campId, attendance_date: date, checked_in_at: new Date().toISOString() },
      { onConflict: "student_id,camp_id,attendance_date" }
    );
    if (error) throw error;
  },
  async getCampEnrollmentForStudent(studentId, date) {
    // Returns all active camp enrollments for a student on a given date
    const { data, error } = await supabase
      .from("camp_enrollments")
      .select("*, camp_programs(*)")
      .eq("student_id", studentId);
    if (error) throw error;
    // Filter to camps whose date range covers the given date
    return (data || []).filter(e => e.camp_programs && e.camp_programs.start_date <= date && e.camp_programs.end_date >= date);
  },

  // ── INSTRUCTORS ────────────────────────────
  async listInstructors() {
    const { data, error } = await supabase
      .from("instructors")
      .select("*, instructor_sessions(*)")
      .order("name");
    if (error) throw error;
    return data || [];
  },
  async createInstructor(name, email, phone, notes) {
    const { error } = await supabase.from("instructors")
      .insert({ name, email, phone: phone || "", notes: notes || "", avatar: (name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)) });
    if (error) throw error;
  },
  async updateInstructor(id, fields) {
    const { error } = await supabase.from("instructors").update(fields).eq("id", id);
    if (error) throw error;
  },
  async deleteInstructor(id) {
    const { error } = await supabase.from("instructors").delete().eq("id", id);
    if (error) throw error;
  },
  async logInstructorSession(instructorId, sessionDate, sessionSlot, notes) {
    const { error } = await supabase.from("instructor_sessions")
      .insert({ instructor_id: instructorId, session_date: sessionDate, session_slot: sessionSlot, notes: notes || "" });
    if (error) throw error;
  },
  async updateReservationInstructor(reservationId, instructorId) {
    const { error } = await supabase.from("reservations").update({ instructor_id: instructorId }).eq("id", reservationId);
    if (error) throw error;
  },

  // ── CORRECTIONS ───────────────────────────
  async deleteEntryLog(entryId) {
    const { error } = await supabase.from("entry_log").delete().eq("id", entryId);
    if (error) throw error;
  },

  async setWeekEntries(studentId, count) {
    const { error } = await supabase.from("memberships").update({ active_week_entries: count }).eq("student_id", studentId);
    if (error) throw error;
  },

  async setPunchBalance(studentId, balance) {
    const { error } = await supabase.from("punch_cards").update({ balance }).eq("student_id", studentId);
    if (error) throw error;
  },

  // ── LESSONS ───────────────────────────────
  async logLesson(studentId, lessonType, label, className, punchCost) {
    const created_at = new Date().toISOString();
    await supabase.from("lesson_log").insert({ student_id: studentId, lesson_type: lessonType, label, class_name: className, punch_cost: punchCost, created_at });
  },

  // ── EXPORT ────────────────────────────────
  async exportEntryLog() {
    const { data } = await supabase.from("entry_log_detailed").select("*");
    return data || [];
  },

  async exportRevenue() {
    const { data } = await supabase.from("revenue_summary").select("*");
    return data || [];
  },
};

// Normalise DB row → app shape
// Supabase returns one-to-one joins as objects, one-to-many as arrays
function normalizeStudent(row) {
  const m = Array.isArray(row.memberships) ? (row.memberships[0] || null) : (row.memberships || null);
  const pc = Array.isArray(row.punch_cards) ? (row.punch_cards[0] || null) : (row.punch_cards || null);
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    avatar: row.avatar || initials(row.name),
    notes: row.notes || "",
    joinDate: row.join_date || row.created_at,
    membership: m ? { tierId: m.tier_id, activeWeekEntries: m.active_week_entries, weekStart: m.week_start } : null,
    punchCard: pc ? { balance: pc.balance } : null,
    entryLog: (row.entry_log || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(e => ({ id: e.id, ts: e.created_at, method: e.method, note: e.note, guest: e.is_guest, guestName: e.guest_name })),
    lessonHistory: (row.lesson_log || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(l => ({ ts: l.created_at, type: l.lesson_type, label: l.label, class: l.class_name, cost: l.punch_cost })),
    punchHistory: (row.punch_card_history || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(h => ({ ts: h.created_at, delta: h.delta, note: h.note })),
  };
}

// CSV export utility
function downloadCSV(rows, filename) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv  = [keys.join(","), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a    = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// ─────────────────────────────────────────────
// QR CODE — real scannable QR using bundled qrcode library
// ─────────────────────────────────────────────
function QRCode({ clientId, size = 180 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    if (!canvasRef.current) return;
    QRCodeLib.toCanvas(canvasRef.current, clientId, {
      width: size, margin: 2,
      color: { dark: "#1a1a2e", light: "#ffffff" }
    });
  }, [clientId, size]);
  return <canvas ref={canvasRef} width={size} height={size} style={{ borderRadius: 4, display: "block" }} />;
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Outfit:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:       #eef6fb;
    --surface:  #ffffff;
    --surface2: #daeef8;
    --border:   #b8ddef;
    --accent:   #2a8fbd;
    --accent2:  #3cb89e;
    --gold:     #e08c3a;
    --red:      #d94f5c;
    --green:    #2eaa7a;
    --text:     #1a3a4a;
    --muted:    #6b92a8;
    --radius:   12px;
    --font-head: 'Playfair Display', serif;
    --font-body: 'Outfit', sans-serif;
    --shadow:   0 2px 12px rgba(42,143,189,.10);
    --shadow-md: 0 4px 24px rgba(42,143,189,.14);
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font-body); font-size: 14px; line-height: 1.5; }
  .app { display: flex; height: 100vh; overflow: hidden; }

  /* ── LOGIN ─────────────────────────────── */
  .login-wrap { display: flex; align-items: center; justify-content: center; height: 100vh;
    background: linear-gradient(135deg, #c8e8f5 0%, #d6f0ea 50%, #b8ddef 100%);
    background-image: radial-gradient(ellipse at 20% 60%, rgba(42,143,189,.15) 0%, transparent 55%),
                      radial-gradient(ellipse at 80% 30%, rgba(60,184,158,.12) 0%, transparent 55%),
                      linear-gradient(135deg, #c8e8f5 0%, #d4f0ea 100%); }
  .login-card { background: rgba(255,255,255,.88); backdrop-filter: blur(12px); border: 1px solid rgba(42,143,189,.2); border-radius: 24px; padding: 48px 44px; width: 400px; box-shadow: var(--shadow-md); }
  .login-logo { font-family: var(--font-head); font-size: 24px; color: var(--accent); margin-bottom: 4px; }
  .login-sub  { color: var(--muted); margin-bottom: 36px; font-size: 13px; }

  /* ── FORMS ─────────────────────────────── */
  .field { margin-bottom: 16px; }
  .field label { display: block; font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 6px; }
  .field input { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 11px 14px; color: var(--text); font-family: var(--font-body); font-size: 14px; outline: none; transition: border .2s; }
  .field input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(42,143,189,.1); }
  .input { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 9px 14px; color: var(--text); font-family: var(--font-body); font-size: 13px; outline: none; width: 100%; transition: border .2s; }
  .input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(42,143,189,.1); }
  select { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 9px 14px; color: var(--text); font-family: var(--font-body); font-size: 13px; outline: none; width: 100%; cursor: pointer; transition: border .2s; }
  select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(42,143,189,.1); }
  textarea { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; color: var(--text); font-family: var(--font-body); font-size: 13px; outline: none; width: 100%; resize: vertical; transition: border .2s; }
  textarea:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(42,143,189,.1); }

  /* ── BUTTONS ───────────────────────────── */
  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; font-family: var(--font-body); font-size: 13px; font-weight: 600; transition: all .15s; }
  .btn-primary { background: var(--accent); color: #fff; box-shadow: 0 2px 8px rgba(42,143,189,.3); }
  .btn-primary:hover { background: #1f7aaa; box-shadow: 0 4px 12px rgba(42,143,189,.4); }
  .btn-primary:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }
  .btn-ghost { background: transparent; color: var(--muted); border: 1px solid var(--border); }
  .btn-ghost:hover { border-color: var(--accent); color: var(--accent); background: rgba(42,143,189,.06); }
  .btn-danger { background: var(--red); color: #fff; }
  .btn-sm   { padding: 6px 12px; font-size: 12px; }
  .btn-full { width: 100%; justify-content: center; }
  .err { color: var(--red); font-size: 12px; margin-top: 8px; }

  /* ── SIDEBAR ───────────────────────────── */
  .sidebar { background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column;
    box-shadow: 2px 0 12px rgba(42,143,189,.07); position: relative; transition: width .2s ease; overflow: hidden; flex-shrink: 0; }
  .sidebar-logo { font-family: var(--font-head); font-size: 17px; color: var(--accent); padding: 0 20px 24px; border-bottom: 1px solid var(--border); line-height: 1.3; white-space: nowrap; overflow: hidden; }
  .sidebar-logo span { font-size: 11px; font-family: var(--font-body); color: var(--muted); display: block; margin-top: 4px; }
  .sidebar-logo.collapsed { padding: 0 0 24px; display: flex; justify-content: center; }
  .nav { flex: 1; padding: 16px 0; overflow-y: auto; overflow-x: hidden; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 20px; color: var(--muted); cursor: pointer; transition: all .15s; font-size: 13px; font-weight: 500; border-left: 3px solid transparent; white-space: nowrap; }
  .nav-item:hover { color: var(--text); background: var(--surface2); }
  .nav-item.active { color: var(--accent); border-left-color: var(--accent); background: rgba(42,143,189,.08); font-weight: 600; }
  .nav-item.collapsed { padding: 10px 0; justify-content: center; border-left: 3px solid transparent; }
  .nav-item.collapsed.active { border-left-color: var(--accent); }
  .nav-section { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); padding: 16px 20px 6px; white-space: nowrap; overflow: hidden; }
  .sidebar-user { padding: 16px 20px; border-top: 1px solid var(--border); font-size: 12px; color: var(--muted); overflow: hidden; }
  .sidebar-user strong { color: var(--text); display: block; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .sidebar-toggle { position: absolute; top: 18px; right: -12px; width: 24px; height: 24px; border-radius: 50%; background: var(--surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 10px; color: var(--muted); z-index: 10; box-shadow: var(--shadow); transition: all .15s; }
  .sidebar-toggle:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
  .sidebar-resize { position: absolute; top: 0; right: 0; width: 4px; height: 100%; cursor: col-resize; z-index: 5; }
  .sidebar-resize:hover, .sidebar-resize.dragging { background: var(--accent); opacity: .4; }

  /* ── MAIN ──────────────────────────────── */
  .main { flex: 1; overflow-y: auto; padding: 32px; background: var(--bg); }
  .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
  .page-title { font-family: var(--font-head); font-size: 28px; color: var(--text); }
  .page-sub   { color: var(--muted); font-size: 13px; margin-top: 2px; }

  /* ── CARDS ─────────────────────────────── */
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); }
  .card-title { font-weight: 600; font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 14px; }

  /* ── STATS ─────────────────────────────── */
  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
  .stat { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow); }
  .stat-val   { font-family: var(--font-head); font-size: 30px; color: var(--text); }
  .stat-label { font-size: 12px; color: var(--muted); margin-top: 4px; }
  .stat-t1 { border-top: 3px solid var(--accent); }
  .stat-t2 { border-top: 3px solid var(--gold); }
  .stat-t3 { border-top: 3px solid var(--green); }
  .stat-t4 { border-top: 3px solid var(--red); }

  /* ── TABLE ─────────────────────────────── */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); padding: 10px 12px; border-bottom: 2px solid var(--border); background: var(--surface2); }
  td { padding: 12px; border-bottom: 1px solid var(--border); font-size: 13px; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(42,143,189,.04); }
  .avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), var(--accent2)); color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
  .name-cell { display: flex; align-items: center; gap: 10px; }

  /* ── BADGES ────────────────────────────── */
  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-green { background: rgba(46,170,122,.14); color: var(--green); }
  .badge-blue  { background: rgba(42,143,189,.14); color: var(--accent); }
  .badge-red   { background: rgba(217,79,92,.14);  color: var(--red); }
  .badge-gold  { background: rgba(224,140,58,.14); color: var(--gold); }
  .badge-gray  { background: var(--surface2); color: var(--muted); }

  /* ── PROGRESS ──────────────────────────── */
  .progress-bar { height: 5px; background: var(--surface2); border-radius: 3px; overflow: hidden; margin-top: 4px; }
  .progress-fill { height: 100%; border-radius: 3px; transition: width .3s; }
  .fill-green { background: var(--green); } .fill-red { background: var(--red); } .fill-gold { background: var(--gold); }

  /* ── MODALS ────────────────────────────── */
  .overlay { position: fixed; inset: 0; background: rgba(26,58,74,.45); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(6px); }
  .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 18px; padding: 32px; width: 560px; max-height: 88vh; overflow-y: auto; box-shadow: var(--shadow-md); }
  .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .modal-title { font-family: var(--font-head); font-size: 22px; color: var(--text); }
  .close-btn { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 22px; line-height: 1; }
  .close-btn:hover { color: var(--text); }
  .modal-overlay { position: fixed; inset: 0; background: rgba(26,58,74,.4); display: flex; align-items: center; justify-content: center; z-index: 200; backdrop-filter: blur(6px); }
  .modal-close { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 20px; line-height: 1; padding: 4px; }
  .modal-close:hover { color: var(--red); }

  /* ── LAYOUT HELPERS ────────────────────── */
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .separator   { height: 1px; background: var(--border); margin: 20px 0; }
  .row         { display: flex; gap: 12px; align-items: center; }
  .chip        { background: var(--surface2); border-radius: 20px; padding: 3px 9px; font-size: 11px; color: var(--muted); }
  .section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); margin-bottom: 10px; }
  .text-accent { color: var(--accent); } .text-red { color: var(--red); } .text-muted { color: var(--muted); } .text-gold { color: var(--gold); } .text-green { color: var(--green); }
  .mt8 { margin-top: 8px; } .mt16 { margin-top: 16px; } .mb16 { margin-bottom: 16px; }
  .flex { display: flex; } .items-center { align-items: center; } .justify-between { justify-content: space-between; }
  .gap8 { gap: 8px; } .gap16 { gap: 16px; } .bold { font-weight: 600; } .small { font-size: 12px; }

  /* ── OPT CARDS ─────────────────────────── */
  .opt-card { background: var(--surface2); border: 2px solid var(--border); border-radius: 10px; padding: 14px; cursor: pointer; transition: all .15s; }
  .opt-card:hover { border-color: var(--accent); background: rgba(42,143,189,.06); }
  .opt-card.selected { border-color: var(--accent); background: rgba(42,143,189,.10); box-shadow: 0 0 0 1px var(--accent); }
  .opt-card-label { font-weight: 600; font-size: 13px; color: var(--text); }
  .opt-card-sub   { font-size: 11px; color: var(--muted); margin-top: 3px; }

  /* ── TABS ──────────────────────────────── */
  .tabs { display: flex; gap: 4px; background: var(--surface2); padding: 4px; border-radius: 10px; margin-bottom: 24px; }
  .tab { flex: 1; text-align: center; padding: 8px; border-radius: 7px; cursor: pointer; font-size: 11px; font-weight: 600; color: var(--muted); transition: all .15s; }
  .tab.active { background: var(--surface); color: var(--accent); box-shadow: var(--shadow); }

  /* ── TIMELINE ──────────────────────────── */
  .timeline { display: flex; flex-direction: column; gap: 8px; }
  .timeline-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: var(--surface2); border-radius: 8px; border: 1px solid var(--border); }
  .timeline-dot  { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .timeline-info { flex: 1; }
  .timeline-title { font-size: 13px; font-weight: 500; color: var(--text); }
  .timeline-time  { font-size: 11px; color: var(--muted); }

  /* ── ENTRY ─────────────────────────────── */
  .entry-result   { padding: 24px 20px; border-radius: 12px; text-align: center; margin-top: 16px; }
  .entry-allowed  { background: rgba(46,170,122,.1); border: 1px solid rgba(46,170,122,.3); }
  .entry-denied   { background: rgba(217,79,92,.1);  border: 1px solid rgba(217,79,92,.3); }
  .entry-icon     { font-size: 40px; margin-bottom: 8px; }
  .entry-msg      { font-family: var(--font-head); font-size: 22px; color: var(--text); }
  .entry-detail   { font-size: 12px; color: var(--muted); margin-top: 6px; }

  /* ── SEARCH / QR ───────────────────────── */
  .search-bar { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 9px 14px; color: var(--text); font-family: var(--font-body); font-size: 13px; outline: none; width: 240px; box-shadow: var(--shadow); }
  .search-bar:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(42,143,189,.1); }
  .qr-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 14px; padding: 24px; text-align: center; max-width: 260px; margin: 0 auto; }
  .qr-name { font-weight: 700; margin-top: 14px; font-size: 15px; color: var(--text); }
  .qr-id   { font-size: 10px; color: var(--muted); font-family: monospace; margin-top: 3px; }

  /* ── SCANNER ───────────────────────────── */
  .scanner-wrap    { position: relative; width: 100%; border-radius: 12px; overflow: hidden; background: #0a1520; aspect-ratio: 1; max-height: 320px; }
  .scanner-wrap video { width: 100%; height: 100%; object-fit: cover; display: block; }
  .scanner-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
  .scanner-frame   { width: 58%; aspect-ratio: 1; border: 2px solid var(--accent); border-radius: 10px; box-shadow: 0 0 0 9999px rgba(0,0,0,.55); position: relative; }
  .scanner-line    { width: 54%; height: 2px; background: linear-gradient(90deg, transparent, var(--accent), transparent); position: absolute; animation: scanline 2s ease-in-out infinite; }
  @keyframes scanline { 0%,100% { top: 22%; } 50% { top: 76%; } }

  /* ── MISC ──────────────────────────────── */
  .loading { display: flex; align-items: center; justify-content: center; height: 100vh; font-family: var(--font-head); font-size: 22px; color: var(--muted); gap: 12px; background: var(--bg); }
  .spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  .lang-toggle { display: flex; align-items: center; gap: 4px; background: var(--surface2); border: 1px solid var(--border); border-radius: 20px; padding: 3px; margin: 0 20px 12px; }
  .lang-btn { flex: 1; text-align: center; padding: 5px 8px; border-radius: 16px; cursor: pointer; font-size: 11px; font-weight: 700; color: var(--muted); transition: all .15s; letter-spacing: .04em; border: none; background: transparent; font-family: var(--font-body); }
  .lang-btn.active { background: var(--accent); color: #fff; }
  .lang-btn:hover:not(.active) { color: var(--text); }
  ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  .notice      { background: rgba(42,143,189,.08);  border: 1px solid rgba(42,143,189,.25);  border-radius: 8px; padding: 12px 14px; font-size: 12px; color: var(--accent); margin-bottom: 16px; }
  .notice-warn { background: rgba(224,140,58,.08);  border: 1px solid rgba(224,140,58,.25);  border-radius: 8px; padding: 12px 14px; font-size: 12px; color: var(--gold);   margin-bottom: 16px; }
  .notice-err  { background: rgba(217,79,92,.08);   border: 1px solid rgba(217,79,92,.25);   border-radius: 8px; padding: 12px 14px; font-size: 12px; color: var(--red);    margin-bottom: 16px; }
`;

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function SurfTrackApp() {
  return <ConfigProvider><SurfTrackInner /></ConfigProvider>;
}

function SurfTrackInner() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setUser(data.session?.user ?? null); setLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <><style>{css}</style><div className="loading"><div className="spinner" />Loading…</div></>;
  if (!user)   return <><style>{css}</style><Login /></>;
  return <AdminDashboard user={user} />;
}

// ─────────────────────────────────────────────
// LOGIN — uses Supabase Auth (email + password)
// ─────────────────────────────────────────────
function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState("");
  const [busy, setBusy]   = useState(false);
  const [lang, setLang]   = useState(() => localStorage.getItem("st_lang") || "en");
  const t = T[lang];
  const toggleLang = (l) => { setLang(l); localStorage.setItem("st_lang", l); };

  async function submit() {
    setBusy(true); setErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) { setErr(error.message); setBusy(false); }
  }

  return (
    <div className="login-wrap"><div className="login-card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div className="login-logo">🏄 {APP_NAME}</div>
        <div className="lang-toggle" style={{ margin: 0, marginTop: 4 }}>
          <button className={`lang-btn ${lang === "en" ? "active" : ""}`} onClick={() => toggleLang("en")}>EN</button>
          <button className={`lang-btn ${lang === "pt" ? "active" : ""}`} onClick={() => toggleLang("pt")}>PT</button>
        </div>
      </div>
      <div className="login-sub">{APP_TAGLINE}</div>
      <div className="field"><label>{t.email}</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="owner@surfschool.com" /></div>
      <div className="field"><label>{t.password}</label><input type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} placeholder="••••••••" /></div>
      {err && <div className="err">{err}</div>}
      <button className="btn btn-primary btn-full mt16" onClick={submit} disabled={busy}>{busy ? t.signingIn : t.signIn}</button>
      <div className="notice mt16" style={{ marginBottom: 0 }}>{t.loginHint}</div>
    </div></div>
  );
}

// ─────────────────────────────────────────────
// QR EXPORT HELPERS
// ─────────────────────────────────────────────
async function buildQRCanvas(clientId, size) {
  const canvas = document.createElement("canvas");
  await QRCodeLib.toCanvas(canvas, clientId, { width: size, margin: 2, color: { dark: "#1a1a2e", light: "#ffffff" } });
  return canvas;
}

async function downloadQRPng(student) {
  const size   = 600;
  const pad    = 40;
  const total  = size + pad * 2 + 100;
  const qrCanvas = await buildQRCanvas(student.id, size);
  const canvas = document.createElement("canvas");
  canvas.width = total; canvas.height = total;
  const ctx = canvas.getContext("2d");
  // Background
  ctx.fillStyle = "#0a0e12";
  ctx.fillRect(0, 0, total, total);
  // White QR area
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(pad - 8, pad - 8, size + 16, size + 16, 16);
  ctx.fill();
  // QR image
  ctx.drawImage(qrCanvas, pad, pad, size, size);
  // Name
  ctx.fillStyle = "#e4eaf4";
  ctx.font = "bold 32px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(student.name, total / 2, size + pad * 2 + 10);
  // ID
  ctx.fillStyle = "#6a7890";
  ctx.font = "16px monospace";
  ctx.fillText(`Penas' SurfTrack · ${student.id.substring(0, 8)}...`, total / 2, size + pad * 2 + 40);
  // Download
  const link = document.createElement("a");
  link.download = `${student.name.replace(/\s+/g, "_")}_SurfTrack_QR.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function downloadWalletCard(student) {
  // Creates a wallet-style card image (1012×638 pixels — standard pass size)
  // Student opens on phone → long-press → "Add to Photos" → "Add to Wallet" via Shortcut
  const W = 1012, H = 638;
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0d1b2a");
  grad.addColorStop(1, "#1a2a4a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Accent stripe
  ctx.fillStyle = "#38c8e8";
  ctx.fillRect(0, 0, 6, H);

  // School name
  ctx.fillStyle = "#38c8e8";
  ctx.font = "bold 36px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("🏄 Penas' SurfTrack", 48, 72);

  // "SURF SCHOOL PASS"
  ctx.fillStyle = "#6a7890";
  ctx.font = "500 18px sans-serif";
  ctx.fillText("SURF SCHOOL MEMBERSHIP PASS", 48, 104);

  // Divider
  ctx.strokeStyle = "#252d40";
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(48, 122); ctx.lineTo(W - 48, 122); ctx.stroke();

  // Student name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 52px sans-serif";
  ctx.fillText(student.name, 48, 200);

  // Member label
  ctx.fillStyle = "#6a7890";
  ctx.font = "500 16px sans-serif";
  ctx.fillText("MEMBER NAME", 48, 228);

  // Member ID
  ctx.fillStyle = "#e4eaf4";
  ctx.font = "500 20px monospace";
  ctx.fillText(student.id, 48, 290);
  ctx.fillStyle = "#6a7890";
  ctx.font = "500 14px sans-serif";
  ctx.fillText("MEMBER ID", 48, 310);

  // QR code (right side)
  const qrSize  = 240;
  const qrCanvas = await buildQRCanvas(student.id, qrSize);
  // White background for QR
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.roundRect(W - qrSize - 60, H / 2 - qrSize / 2 - 10, qrSize + 20, qrSize + 20, 12);
  ctx.fill();
  ctx.drawImage(qrCanvas, W - qrSize - 50, H / 2 - qrSize / 2, qrSize, qrSize);

  // Footer
  ctx.fillStyle = "#38c8e8";
  ctx.font      = "500 15px sans-serif";
  ctx.fillText("Show this QR code at reception to check in", 48, H - 44);
  ctx.fillStyle = "#6a7890";
  ctx.font      = "500 13px sans-serif";
  ctx.fillText("surftrack.vercel.app", 48, H - 22);

  // Download
  const link = document.createElement("a");
  link.download = `${student.name.replace(/\s+/g, "_")}_WalletPass.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// ─────────────────────────────────────────────
// ADMIN SHELL — loads data, handles all actions
// ─────────────────────────────────────────────
function AdminDashboard({ user }) {
  const { tiers, cardOptions, lessonTypes } = useConfig();
  const [students, setStudents]       = useState([]);
  const [page, setPage]               = useState("dashboard");
  const [selectedId, setSelectedId]   = useState(null);
  const [modal, setModal]             = useState(null);
  const [search, setSearch]           = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [dataErr, setDataErr]         = useState("");
  const [writeErr, setWriteErr]       = useState("");
  const [lang, setLang]               = useState(() => localStorage.getItem("st_lang") || "en");
  const [reservations, setReservations] = useState([]);
  const [camps, setCamps] = useState([]);
  const [campEnrollments, setCampEnrollments] = useState([]);
  const [campAttendance, setCampAttendance] = useState([]);
  const [instructors, setInstructors] = useState([]);

  const toggleLang = (l) => { setLang(l); localStorage.setItem("st_lang", l); };

  // Returns Monday of the current week as "YYYY-MM-DD"
  function getThisWeekSunday() {
    // Start of week = this Sunday 00:00
    const d = new Date(); d.setDate(d.getDate() - d.getDay()); d.setHours(0,0,0,0);
    return d.toISOString().slice(0,10);
  }
  function getThisWeekSaturday() {
    const d = new Date(getThisWeekSunday());
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0,10);
  }
  function todayStr() { return new Date().toISOString().slice(0,10); }

  const loadReservations = useCallback(async () => {
    try { setReservations(await db.listReservations(getThisWeekSunday(), getThisWeekSaturday())); }
    catch (e) { console.warn("[reservations load]", e); }
  }, []);

  const loadCamps = useCallback(async () => {
    try {
      const campList = await db.listCamps();
      setCamps(campList);
      const allEnrollments = [], allAttendance = [];
      for (const c of campList) {
        const enr = await db.listEnrollments(c.id);
        const att = await db.listCampAttendance(c.id);
        allEnrollments.push(...enr);
        allAttendance.push(...att);
      }
      setCampEnrollments(allEnrollments);
      setCampAttendance(allAttendance);
    } catch (e) { console.warn("[camps load]", e); }
  }, []);

  const loadInstructors = useCallback(async () => {
    try { setInstructors(await db.listInstructors()); }
    catch (e) { console.warn("[instructors load]", e); }
  }, []);

  const load = useCallback(async (silent = false) => {
    try { if (!silent) setInitialLoading(true); setStudents(await db.fetchStudents()); }
    catch (e) { setDataErr(e.message); }
    finally { if (!silent) setInitialLoading(false); }
  }, []);

  // Wrap any async fn — catches errors and shows them visibly
  const safe = (fn) => async (...args) => {
    try { setWriteErr(""); return await fn(...args); }
    catch (e) { console.error("[safe]", e); setWriteErr(e?.message || String(e)); }
  };

  useEffect(() => { load(); loadReservations(); loadCamps(); loadInstructors(); }, [load, loadReservations, loadCamps, loadInstructors]);

  // ── ENTRY ──
  async function processEntry(studentId, isGuest = false, guestName = "") {
    const student = students.find(s => s.id === studentId);
    if (!student) return { allowed: false, message: "Student not found.", detail: "" };

    await db.resetWeekIfNeeded(student);

    if (student.membership) {
      const tier  = getTier(student.membership.tierId, tiers);
      const used  = isNewWeek(student.membership.weekStart) ? 0 : student.membership.activeWeekEntries;
      const limit = tier?.entriesPerWeek || 0;
      if (used < limit) {
        await db.incrementWeekEntry(studentId, used + 1);
        await db.logEntry(studentId, "membership", `${tier.label} weekly entry (${used + 1}/${limit})`, isGuest, guestName);
        await load(true);
        return { allowed: true, message: "Welcome in! 🏄", detail: `Membership entry ${used + 1}/${limit} this week.` };
      }
    }

    if (student.punchCard?.balance > 0) {
      const newBal = student.punchCard.balance - 1;
      await db.updatePunchBalance(studentId, newBal);
      await db.logPunchHistory(studentId, -1, isGuest ? `Guest: ${guestName}` : "Entry");
      await db.logEntry(studentId, "punchcard", isGuest ? `Guest entry for ${guestName}` : "Punch card entry", isGuest, guestName);
      await load(true);
      return { allowed: true, message: isGuest ? "Guest Admitted! 🏄" : "Welcome in! 🏄", detail: `Punch card used. ${newBal} punches remaining.` };
    }

    await db.logEntry(studentId, "denied", "No available entries", isGuest, guestName);
    await load(true);
    return { allowed: false, message: "Entry Denied", detail: "No weekly entries and no punches available." };
  }

  // ── LESSON ──
  async function logLesson(studentId, lessonType, className = "") {
    const student = students.find(s => s.id === studentId);
    const lt      = lessonTypes.find(l => l.id === lessonType);
    const tier    = student?.membership ? getTier(student.membership.tierId, tiers) : null;
    const weeklyRemaining = tier ? Math.max(0, (tier.entriesPerWeek || 0) - (student.membership.activeWeekEntries || 0)) : 0;

    // Membership first: if they have weekly slots remaining, use one
    if (weeklyRemaining > 0) {
      await db.resetWeekIfNeeded(student);
      const newCount = (student.membership.activeWeekEntries || 0) + 1;
      await db.incrementWeekEntry(studentId, newCount);
      await db.logEntry(studentId, "membership", `${lt.label}${className ? `: ${className}` : ""}`, false, "");
      await db.logLesson(studentId, lessonType, lt.label, className, 0);
      await load(true);
      return { ok: true, method: "membership" };
    }

    // Punch card fallback
    if (!student?.punchCard) return { ok: false, msg: "No punch card and no weekly sessions remaining." };
    if (student.punchCard.balance < lt.punchCost) return { ok: false, msg: `Need ${lt.punchCost} punches, have ${student.punchCard.balance}.` };
    const newBal = student.punchCard.balance - lt.punchCost;
    await db.updatePunchBalance(studentId, newBal);
    await db.logPunchHistory(studentId, -lt.punchCost, `${lt.label}${className ? `: ${className}` : ""}`);
    await db.logLesson(studentId, lessonType, lt.label, className, lt.punchCost);
    await load(true);
    return { ok: true, method: "punch_card" };
  }

  // ── RESERVATIONS ──
  async function createReservation(studentId, sessionDate, sessionSlot, lessonType) {
    const lt = lessonTypes.find(l => l.id === lessonType);
    if (!lt) throw new Error("Unknown lesson type");
    await db.addReservation(studentId, sessionDate, sessionSlot, lessonType, lt.punchCost);
    await loadReservations();
  }

  async function cancelReservation(reservationId) {
    await db.updateReservationStatus(reservationId, "cancelled");
    await loadReservations();
  }

  async function chargeNoShow(reservationId) {
    const res = reservations.find(r => r.id === reservationId);
    if (!res) return { ok: false, msg: "Reservation not found" };
    const student = students.find(s => s.id === res.student_id);
    if (!student) return { ok: false, msg: "Student not found" };
    const punchCost = res.punch_cost || 1;
    if (student.punchCard) {
      if (student.punchCard.balance < punchCost) return { ok: false, msg: `Need ${punchCost} punches, only ${student.punchCard.balance} available.` };
      const newBal = student.punchCard.balance - punchCost;
      await db.updatePunchBalance(res.student_id, newBal);
      await db.logPunchHistory(res.student_id, -punchCost, `No-show: ${res.session_date} ${res.session_slot}`);
    } else if (student.membership) {
      const tier = getTier(student.membership.tierId, tiers);
      const used = student.membership.activeWeekEntries || 0;
      const limit = tier?.entriesPerWeek || 0;
      if (used >= limit) return { ok: false, msg: "No weekly entries remaining." };
      await db.incrementWeekEntry(res.student_id, used + 1);
    } else {
      return { ok: false, msg: "Student has no punch card or membership." };
    }
    await db.logEntry(res.student_id, "no-show", `No-show charge: ${res.session_date} ${res.session_slot}`, false, "");
    await db.updateReservationStatus(reservationId, "charged");
    await load(true);
    await loadReservations();
    return { ok: true };
  }

  // Called by scanner: camp check-in takes priority on weekdays, then reservation, then normal
  async function processEntryWithReservation(studentId, isGuest = false, guestName = "") {
    const today = todayStr();
    const dayOfWeek = new Date().getDay(); // 0=Sun, 6=Sat
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    // 1. Camp check-in — weekdays only, takes priority
    if (isWeekday) {
      const campEnrs = await db.getCampEnrollmentForStudent(studentId, today);
      if (campEnrs.length > 0) {
        const enr = campEnrs[0];
        const camp = enr.camp_programs;
        const scheduleLabel = enr.schedule === "full_day" ? "Full Day" : "Half Day";
        await db.logCampAttendance(studentId, enr.camp_id, today);
        await db.logEntry(studentId, "camp", `${camp.name} — ${scheduleLabel}`, false, "");
        await load(true); await loadCamps();
        return {
          allowed: true,
          message: "Camp Check-in! 🏕",
          detail: `${camp.name} · ${scheduleLabel}`
        };
      }
    }

    // 2. Reservation check
    const res = await db.getTodayReservation(studentId, today);
    if (res) {
      const savedLt = lessonTypes.find(l => l.id === res.lesson_type) || lessonTypes[0];
      const student = students.find(s => s.id === studentId);
      if (!student) return { allowed: false, message: "Student not found.", detail: "" };
      await db.resetWeekIfNeeded(student);
      if (student.membership) {
        const tier = getTier(student.membership.tierId, tiers);
        const used = isNewWeek(student.membership.weekStart) ? 0 : student.membership.activeWeekEntries;
        const limit = tier?.entriesPerWeek || 0;
        if (used < limit) {
          await db.incrementWeekEntry(studentId, used + 1);
          await db.logEntry(studentId, "membership", `${savedLt.label} — reserved ${res.session_slot}`, false, "");
          await db.updateReservationStatus(res.id, "checked_in");
          await load(true); await loadReservations();
          return { allowed: true, message: "Welcome in! 🏄", detail: `Reservation confirmed (${res.session_slot}). Membership entry ${used + 1}/${limit}.` };
        }
      }
      if (student.punchCard) {
        if (student.punchCard.balance < savedLt.punchCost)
          return { allowed: false, message: "Entry Denied", detail: `Reservation found but need ${savedLt.punchCost} punches, only ${student.punchCard.balance} available.` };
        const newBal = student.punchCard.balance - savedLt.punchCost;
        await db.updatePunchBalance(studentId, newBal);
        await db.logPunchHistory(studentId, -savedLt.punchCost, `${savedLt.label} — reserved ${res.session_slot}`);
        await db.logEntry(studentId, "punchcard", `${savedLt.label} — reserved ${res.session_slot}`, false, "");
        await db.updateReservationStatus(res.id, "checked_in");
        await load(true); await loadReservations();
        return { allowed: true, message: "Welcome in! 🏄", detail: `Reservation confirmed (${res.session_slot}). ${newBal} punches remaining.` };
      }
      return { allowed: false, message: "Entry Denied", detail: "Reservation found but no valid payment method." };
    }

    // 3. Normal entry (punch card / membership)
    return processEntry(studentId, isGuest, guestName);
  }

  // ── INSTRUCTORS ──
  async function createInstructor(name, email, phone, notes) {
    await db.createInstructor(name, email, phone, notes);
    await loadInstructors();
  }
  async function updateInstructor(id, fields) {
    await db.updateInstructor(id, fields);
    await loadInstructors();
  }
  async function deleteInstructor(id) {
    await db.deleteInstructor(id);
    await loadInstructors();
  }
  async function logInstructorSession(instructorId, sessionDate, sessionSlot, notes) {
    await db.logInstructorSession(instructorId, sessionDate, sessionSlot, notes);
    await loadInstructors();
  }
  async function updateReservationInstructor(reservationId, instructorId) {
    await db.updateReservationInstructor(reservationId, instructorId);
    await loadReservations();
  }

  // ── CAMPS ──
  async function createCamp(name, type, startDate, endDate) {
    await db.createCamp(name, type, startDate, endDate);
    await loadCamps();
  }
  async function deleteCamp(id) {
    await db.deleteCamp(id);
    await loadCamps();
  }
  async function enrollStudentInCamp(studentId, campId, schedule) {
    await db.enrollStudent(studentId, campId, schedule);
    await loadCamps();
  }
  async function unenrollStudentFromCamp(studentId, campId) {
    await db.unenrollStudent(studentId, campId);
    await loadCamps();
  }
  async function checkInCamper(studentId, campId) {
    const today = todayStr();
    await db.logCampAttendance(studentId, campId, today);
    await db.logEntry(studentId, "camp", `Camp check-in`, false, "");
    await load(true);
    await loadCamps();
  }

  // ── ADD PUNCHES ──
  async function addPunches(studentId, cardId) {
    console.log("[addPunches]", { studentId, cardId, cardOptions });
    const opt     = cardOptions.find(o => o.id === cardId);
    console.log("[addPunches] opt found:", opt);
    if (!opt) throw new Error(`No card option found for id "${cardId}". Available: ${cardOptions.map(o => o.id).join(", ")}`);
    const student = students.find(s => s.id === studentId);
    // Read current balance directly from DB to avoid stale state
    const { data: pcRow } = await supabase.from("punch_cards").select("balance").eq("student_id", studentId).maybeSingle();
    const currentBal = pcRow?.balance || 0;
    const newBal = currentBal + opt.punches;
    await db.upsertPunchCard(studentId, newBal);
    await db.logPunchHistory(studentId, opt.punches, `Loaded ${opt.label}`);
    await load(true);
  }

  // ── SET MEMBERSHIP ──
  async function setMembership(studentId, tierId) {
    console.log("[setMembership]", { studentId, tierId });
    await db.upsertMembership(studentId, tierId);
    await load(true);
  }

  async function removeMembership(studentId) {
    await db.removeMembership(studentId);
    await load(true);
  }

  async function correctEntry(studentId, entryId, method) {
    // Delete the log row
    await db.deleteEntryLog(entryId);
    // Reverse the effect
    const student = students.find(s => s.id === studentId);
    if (method === "membership" && student?.membership) {
      const newCount = Math.max(0, (student.membership.activeWeekEntries || 1) - 1);
      await db.setWeekEntries(studentId, newCount);
    } else if (method === "punchcard" && student?.punchCard) {
      await db.setPunchBalance(studentId, student.punchCard.balance + 1);
      await db.logPunchHistory(studentId, +1, "Correction: entry reversed");
    }
    await load(true);
  }

  async function adjustPunchBalance(studentId, newBalance, note) {
    const student = students.find(s => s.id === studentId);
    const delta = newBalance - (student?.punchCard?.balance || 0);
    await db.setPunchBalance(studentId, newBalance);
    await db.logPunchHistory(studentId, delta, note || "Manual balance correction");
    await load(true);
  }

  // ── DELETE STUDENT ──
  async function deleteStudent(studentId) {
    await supabase.from("punch_card_history").delete().eq("student_id", studentId);
    await supabase.from("lesson_log").delete().eq("student_id", studentId);
    await supabase.from("entry_log").delete().eq("student_id", studentId);
    await supabase.from("punch_cards").delete().eq("student_id", studentId);
    await supabase.from("memberships").delete().eq("student_id", studentId);
    await supabase.from("students").delete().eq("id", studentId);
    await load(true);
  }

  // ── ADD STUDENT ──
  async function addStudent(fields, tierId, cardId) {
    console.log("[addStudent]", { fields, tierId, cardId, cardOptions, tiers });
    const row = await db.createStudent(fields);
    console.log("[addStudent] created row:", row);
    if (tierId) await db.upsertMembership(row.id, tierId);
    if (cardId) {
      const opt = cardOptions.find(o => o.id === cardId);
      console.log("[addStudent] card opt:", opt);
      if (!opt) throw new Error(`No card option found for id "${cardId}". Available: ${cardOptions.map(o => o.id).join(", ")}`);
      await db.upsertPunchCard(row.id, opt.punches);
      await db.logPunchHistory(row.id, opt.punches, `Initial load: ${opt.label}`);
    }
    await load(true);
    // Auto-send welcome email if student has an email address
    if (fields.email) {
      sendWelcomeEmail(row, tierId, cardId).catch(e => console.warn("[welcome email]", e));
    }
  }

  async function sendWelcomeEmail(student, tierId, cardId) {
    // Generate QR as data URL using the already-bundled QRCodeLib
    const canvas = document.createElement("canvas");
    await QRCodeLib.toCanvas(canvas, student.id, { width: 200, margin: 2, color: { dark: "#1a1a2e", light: "#ffffff" } });
    const qrDataUrl = canvas.toDataURL("image/png");

    // Build account summary
    const tierLabel = tierId ? (tiers.find(t => t.id === tierId)?.label || tierId) : null;
    const cardLabel = cardId ? (cardOptions.find(c => c.id === cardId)?.label || cardId) : null;
    const lines = [];
    if (tierLabel) lines.push(`Membership: <strong style="color:#fff">${tierLabel}</strong>`);
    if (cardLabel)  lines.push(`Punch card: <strong style="color:#fff">${cardLabel}</strong>`);
    const accountSummary = lines.join("<br>");

    const { data: { session } } = await supabase.auth.getSession();
    const adminEmail = session?.user?.email;

    const { data, error } = await supabase.functions.invoke("send-welcome", {
      body: { studentName: student.name, studentEmail: student.email, qrDataUrl, adminEmail, accountSummary },
    });
    if (error) throw error;
    return data;
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  if (initialLoading) return <><style>{css}</style><div className="loading"><div className="spinner" />{T[lang].loadingSchool}</div></>;

  return (
    <LangContext.Provider value={lang}>
      <style>{css}</style>
      <div className="app">
        <Sidebar page={page} setPage={setPage} userEmail={user.email} onLogout={() => supabase.auth.signOut()} lang={lang} toggleLang={toggleLang} />
        <div className="main">
          {dataErr  && <div className="notice-err mb16">{T[lang].dbError(dataErr)} <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={load}>{T[lang].retry}</span></div>}
          {writeErr && <div className="notice-err mb16" style={{ cursor: "pointer" }} onClick={() => setWriteErr("")}>⚠ Write error (tap to dismiss): {writeErr}</div>}
          {page === "dashboard"     && <Dashboard students={students} reservations={reservations} setPage={setPage} setModal={setModal} setSelectedId={setSelectedId} />}
          {page === "students"      && <StudentsPage students={filtered} search={search} setSearch={setSearch} setSelectedId={setSelectedId} setModal={setModal} />}
          {page === "entry"         && <EntryPage students={students} processEntry={safe(processEntryWithReservation)} />}
          {page === "reservations"  && <ReservationsPage students={students} reservations={reservations} lessonTypes={lessonTypes} instructors={instructors} createReservation={safe(createReservation)} cancelReservation={safe(cancelReservation)} chargeNoShow={safe(chargeNoShow)} updateReservationInstructor={safe(updateReservationInstructor)} todayStr={todayStr} getThisWeekSunday={getThisWeekSunday} />}
          {page === "camps"         && <CampsPage students={students} camps={camps} campEnrollments={campEnrollments} campAttendance={campAttendance} createCamp={safe(createCamp)} deleteCamp={safe(deleteCamp)} enrollStudent={safe(enrollStudentInCamp)} unenrollStudent={safe(unenrollStudentFromCamp)} checkInCamper={safe(checkInCamper)} todayStr={todayStr} />}
          {page === "instructors"   && <InstructorsPage instructors={instructors} createInstructor={safe(createInstructor)} updateInstructor={safe(updateInstructor)} deleteInstructor={safe(deleteInstructor)} logInstructorSession={safe(logInstructorSession)} todayStr={todayStr} />}
          {page === "lessons"       && <LessonsPage students={students} logLesson={safe(logLesson)} />}
          {page === "billing"       && <BillingPage students={students} addPunches={safe(addPunches)} setMembership={safe(setMembership)} removeMembership={safe(removeMembership)} />}
          {page === "export"        && <ExportPage />}
          {page === "settings"      && <SettingsPage />}
        </div>
      </div>

      {modal === "addStudent" && (
        <AddStudentModal onClose={() => setModal(null)} onAdd={async (fields, tierId, cardId) => {
          try { await addStudent(fields, tierId, cardId); setModal(null); }
          catch (e) { console.error("[addStudent]", e); setWriteErr(e?.message || String(e)); }
        }} />
      )}
      {modal === "studentDetail" && selectedId && (
        <StudentDetailModal
          student={students.find(s => s.id === selectedId)}
          onClose={() => { setModal(null); setSelectedId(null); }}
          processEntry={safe(processEntry)} logLesson={safe(logLesson)}
          addPunches={safe(addPunches)} setMembership={safe(setMembership)} removeMembership={safe(removeMembership)}
          correctEntry={safe(correctEntry)} adjustPunchBalance={safe(adjustPunchBalance)}
          sendWelcomeEmail={sendWelcomeEmail}
          deleteStudent={async (id) => { try { await deleteStudent(id); setModal(null); setSelectedId(null); } catch(e) { setWriteErr(e?.message || String(e)); } }}
        />
      )}
    </LangContext.Provider>
  );
}

// ─────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────
function Sidebar({ page, setPage, userEmail, onLogout, lang, toggleLang }) {
  const t = useLang();
  const COLLAPSED_W = 52;
  const DEFAULT_W   = 236;
  const MIN_W = 160;
  const MAX_W = 340;

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("st_sidebar_collapsed") === "1");
  const [width, setWidth]         = useState(() => parseInt(localStorage.getItem("st_sidebar_width") || DEFAULT_W));
  const [dragging, setDragging]   = useState(false);
  const sidebarRef = useRef(null);

  function toggleCollapse() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("st_sidebar_collapsed", next ? "1" : "0");
  }

  function onResizeStart(e) {
    if (collapsed) return;
    e.preventDefault();
    setDragging(true);
    const startX = e.clientX;
    const startW = width;
    function onMove(ev) {
      const newW = Math.min(MAX_W, Math.max(MIN_W, startW + (ev.clientX - startX)));
      setWidth(newW);
    }
    function onUp() {
      setDragging(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      // persist after drag ends
      setWidth(w => { localStorage.setItem("st_sidebar_width", String(w)); return w; });
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  const nav = [
    { id: "dashboard",    icon: "◈", label: t.dashboard     },
    { id: "students",     icon: "◉", label: t.students      },
    { id: "entry",        icon: "⬡", label: t.entryScanner  },
    { id: "reservations", icon: "◎", label: t.reservations  },
    { id: "camps",        icon: "🏕", label: t.camps         },
    { id: "instructors",  icon: "🏄", label: t.instructors   },
    { id: "lessons",      icon: "◆", label: t.logLesson     },
    { id: "billing",      icon: "◇", label: t.billing       },
    { id: "export",       icon: "↓", label: t.exportData    },
    { id: "settings",     icon: "⊙", label: t.settings      },
  ];

  const sidebarStyle = {
    width: collapsed ? COLLAPSED_W : width,
    minWidth: collapsed ? COLLAPSED_W : MIN_W,
    padding: "24px 0",
  };

  return (
    <div className="sidebar" style={sidebarStyle} ref={sidebarRef}>
      {/* Collapse toggle button */}
      <div className="sidebar-toggle" onClick={toggleCollapse} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
        {collapsed ? "›" : "‹"}
      </div>

      {/* Resize handle — only when expanded */}
      {!collapsed && (
        <div
          className={`sidebar-resize${dragging ? " dragging" : ""}`}
          onMouseDown={onResizeStart}
          title="Drag to resize"
        />
      )}

      {/* Logo */}
      <div className={`sidebar-logo${collapsed ? " collapsed" : ""}`}>
        {collapsed ? "🏄" : <>🏄 {APP_NAME}<span>{APP_TAGLINE}</span></>}
      </div>

      {/* Nav */}
      <div className="nav">
        {!collapsed && <div className="nav-section">{t.menu}</div>}
        {nav.map(n => (
          <div
            key={n.id}
            className={`nav-item${collapsed ? " collapsed" : ""} ${page === n.id ? "active" : ""}`}
            onClick={() => setPage(n.id)}
            title={collapsed ? n.label : undefined}
          >
            <span style={{ fontSize: collapsed ? 18 : 14, lineHeight: 1 }}>{n.icon}</span>
            {!collapsed && n.label}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="sidebar-user">
        {!collapsed && <strong>{userEmail}</strong>}
        {!collapsed && (
          <div className="lang-toggle" style={{ margin: "8px 0" }}>
            <button className={`lang-btn ${lang === "en" ? "active" : ""}`} onClick={() => toggleLang("en")}>EN</button>
            <button className={`lang-btn ${lang === "pt" ? "active" : ""}`} onClick={() => toggleLang("pt")}>PT</button>
          </div>
        )}
        {collapsed
          ? <div style={{ textAlign: "center", cursor: "pointer", fontSize: 16, paddingTop: 4 }} title={t.signOut} onClick={onLogout}>⏻</div>
          : <button className="btn btn-ghost btn-sm" onClick={onLogout}>{t.signOut}</button>
        }
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STUDENT OVERVIEW PANEL (dashboard widget)
// ─────────────────────────────────────────────
const FILTER_OPTIONS = [
  { id: "all",        label: "All" },
  { id: "membership", label: "Membership" },
  { id: "punchcard",  label: "Punch Card" },
  { id: "both",       label: "Both" },
  { id: "none",       label: "No Plan" },
];
const SORT_OPTIONS = [
  { id: "name",       label: "Name" },
  { id: "sessions",   label: "Sessions ↓" },
  { id: "punches",    label: "Punches ↓" },
  { id: "lastEntry",  label: "Last Entry" },
];

function StudentOverviewPanel({ students, tiers, setSelectedId, setModal, t }) {
  const [filter, setFilter] = useState("all");
  const [sort,   setSort]   = useState("name");

  function applyFilter(list) {
    switch (filter) {
      case "membership": return list.filter(s => s.membership && !s.punchCard);
      case "punchcard":  return list.filter(s => !s.membership && s.punchCard);
      case "both":       return list.filter(s => s.membership && s.punchCard);
      case "none":       return list.filter(s => !s.membership && !s.punchCard);
      default:           return list;
    }
  }

  function applySort(list) {
    switch (sort) {
      case "sessions":  return [...list].sort((a, b) => (b.membership?.activeWeekEntries || 0) - (a.membership?.activeWeekEntries || 0));
      case "punches":   return [...list].sort((a, b) => (b.punchCard?.balance || 0) - (a.punchCard?.balance || 0));
      case "lastEntry": return [...list].sort((a, b) => {
        const la = a.entryLog?.[a.entryLog.length - 1]?.ts || "";
        const lb = b.entryLog?.[b.entryLog.length - 1]?.ts || "";
        return lb.localeCompare(la);
      });
      default:          return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  const visible = applySort(applyFilter(students));

  return (
    <>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>{t.studentOverview}</div>
        <span style={{ fontSize: 11, color: "var(--muted)" }}>{visible.length} / {students.length}</span>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
        {FILTER_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setFilter(opt.id)}
            style={{
              padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none",
              background: filter === opt.id ? "var(--accent)" : "var(--surface2)",
              color: filter === opt.id ? "#fff" : "var(--muted)",
              transition: "all .15s",
            }}
          >{opt.label}</button>
        ))}
      </div>

      {/* Sort row */}
      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".05em" }}>Sort:</span>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.id}
            onClick={() => setSort(opt.id)}
            style={{
              padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
              border: sort === opt.id ? "1px solid var(--accent)" : "1px solid var(--border)",
              background: sort === opt.id ? "rgba(42,143,189,.1)" : "transparent",
              color: sort === opt.id ? "var(--accent)" : "var(--muted)",
              transition: "all .15s",
            }}
          >{opt.label}</button>
        ))}
      </div>

      {/* Student list */}
      <div style={{ overflowY: "auto", flex: 1 }}>
        {visible.length === 0 && (
          <div style={{ color: "var(--muted)", fontSize: 12, padding: "12px 0" }}>No students match this filter.</div>
        )}
        {visible.map(s => {
          const tier  = s.membership ? getTier(s.membership.tierId, tiers) : null;
          const used  = s.membership?.activeWeekEntries || 0;
          const limit = tier?.entriesPerWeek || 0;
          const pct   = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
          const lastEntry = s.entryLog?.slice().sort((a, b) => b.ts?.localeCompare(a.ts))[0];
          return (
            <div key={s.id} style={{ marginBottom: 12, cursor: "pointer", paddingBottom: 12, borderBottom: "1px solid var(--border)" }}
              onClick={() => { setSelectedId(s.id); setModal("studentDetail"); }}>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap8">
                  <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{s.avatar}</div>
                  <div>
                    <div className="small bold">{s.name}</div>
                    {lastEntry && <div style={{ fontSize: 10, color: "var(--muted)" }}>Last in: {fmtTime(lastEntry.ts)} {fmt(lastEntry.ts)}</div>}
                  </div>
                </div>
                <div className="flex gap8">
                  {tier && <span className="badge badge-green">{tier.label}</span>}
                  {s.punchCard && <span className="badge badge-blue">{s.punchCard.balance}p</span>}
                  {!tier && !s.punchCard && <span className="badge badge-gray">No plan</span>}
                </div>
              </div>
              {tier && (
                <div style={{ marginTop: 5 }}>
                  <div className="progress-bar">
                    <div className={`progress-fill ${pct >= 100 ? "fill-red" : pct > 60 ? "fill-gold" : "fill-green"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="small text-muted" style={{ marginTop: 2 }}>{t.sessionsThisWeek(used, limit)}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
function Dashboard({ students, reservations = [], setPage, setModal, setSelectedId }) {
  const t       = useLang();
  const { tiers } = useConfig();
  const monthly = students.filter(s => s.membership).length;
  const both    = students.filter(s => s.membership && s.punchCard).length;
  const atLimit = students.filter(s => s.membership && s.membership.activeWeekEntries >= (getTier(s.membership.tierId, tiers)?.entriesPerWeek || 0)).length;
  const allEntries = students.flatMap(s => s.entryLog.map(e => ({ ...e, studentName: s.name, studentId: s.id }))).sort((a, b) => new Date(b.ts) - new Date(a.ts));

  // Classify each entry into a slot bucket
  function classifySlot(entry) {
    const note = (entry.note || "").toLowerCase();
    if (entry.method === "camp") return "Camp";
    if (note.includes("private")) return "Private";
    if (note.includes("9:30") || note.includes("9:30am")) return "9:30am";
    if (note.includes("7am") || note.includes("7a")) return "7am";
    if (note.includes("10am") || note.includes("10a")) return "10am";
    if (note.includes("2pm") || note.includes("2p")) return "2pm";
    if (note.includes("group")) return "Group";
    return "Open";
  }

  // Group by date then by slot
  const entryDays = {};
  allEntries.slice(0, 60).forEach(e => {
    const day = e.ts.slice(0, 10);
    const slot = classifySlot(e);
    if (!entryDays[day]) entryDays[day] = {};
    if (!entryDays[day][slot]) entryDays[day][slot] = [];
    entryDays[day][slot].push(e);
  });
  const SLOT_ORDER = ["7am", "9:30am", "10am", "2pm", "Group", "Private", "Camp", "Open"];
  const sortedDays = Object.keys(entryDays).sort((a, b) => b.localeCompare(a)).slice(0, 7);
  const today   = new Date().toISOString().slice(0, 10);
  const DAY_NAMES_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const [showWeek, setShowWeek] = useState(false);

  // Build Sun–Sat for current week
  function getWeekDays() {
    const d = new Date();
    const sun = new Date(d); sun.setDate(d.getDate() - d.getDay()); sun.setHours(0,0,0,0);
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(sun); dd.setDate(sun.getDate() + i);
      return dd.toISOString().slice(0,10);
    });
  }
  const weekDays = getWeekDays();

  // Days to show: always today + any day with reservations this week
  const activeDays = showWeek
    ? weekDays
    : weekDays.filter(d => d >= today && reservations.some(r => r.session_date === d && r.status !== "cancelled"));
  const displayDays = activeDays.length === 0 ? [today] : activeDays;
  const weekTotal = reservations.filter(r => r.status !== "cancelled").length;

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">{t.dashboard}</div><div className="page-sub">{t.todayDate(new Date())}</div></div>
        <div className="row gap8">
          <button className="btn btn-ghost btn-sm" onClick={() => setPage("entry")}>⬡ {t.entryScanner}</button>
          <button className="btn btn-primary btn-sm" onClick={() => setModal("addStudent")}>{t.addStudent}</button>
        </div>
      </div>
      <div className="stats">
        <div className="stat stat-t1"><div className="stat-val">{students.length}</div><div className="stat-label">{t.totalStudents}</div></div>
        <div className="stat stat-t2"><div className="stat-val">{monthly}</div><div className="stat-label">{t.monthlyMembers}</div></div>
        <div className="stat stat-t3"><div className="stat-val">{both}</div><div className="stat-label">{t.dualPlans}</div></div>
        <div className="stat stat-t4"><div className="stat-val">{atLimit}</div><div className="stat-label">{t.atWeeklyLimit}</div></div>
      </div>

      {/* Reservations Widget */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="row gap8" style={{ alignItems: "center" }}>
            <div className="card-title" style={{ marginBottom: 0 }}>📅 Sessions This Week</div>
            {weekTotal > 0 && <span className="badge badge-blue">{weekTotal}</span>}
          </div>
          <div className="row gap8">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowWeek(v => !v)}>
              {showWeek ? "▲ Collapse" : "▼ Full week"}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage("reservations")}>Manage →</button>
          </div>
        </div>

        {displayDays.map(date => {
          const dayRes = reservations.filter(r => r.session_date === date && r.status !== "cancelled");
          if (!showWeek && dayRes.length === 0) return null;
          const dayIdx = weekDays.indexOf(date);
          const dayLabel = dayIdx >= 0 ? DAY_NAMES_SHORT[dayIdx] : date.slice(5);
          const isToday = date === today;
          return (
            <div key={date} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: isToday ? "var(--accent)" : "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>
                {dayLabel} {date.slice(5)}{isToday ? " · Today" : ""}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                {getSlotsForDate(date).map(slot => {
                  const slotRes = dayRes.filter(r => r.session_slot === slot);
                  return (
                    <div key={slot} style={{ background: "var(--surface2)", borderRadius: 8, padding: 10, minHeight: 48 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", marginBottom: 6 }}>{slot}</div>
                      {slotRes.length === 0
                        ? <div style={{ fontSize: 10, color: "var(--muted)" }}>—</div>
                        : slotRes.map(r => {
                          const s = students.find(st => st.id === r.student_id);
                          const statusColor = r.status === "checked_in" ? "var(--green)" : r.status === "charged" ? "var(--red)" : "var(--accent)";
                          return (
                            <div key={r.id} style={{ fontSize: 11, padding: "3px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span>{s?.name || "?"}</span>
                              <span style={{ fontSize: 10, color: statusColor }}>{r.status === "checked_in" ? "✓" : r.status === "charged" ? "charged" : "·"}</span>
                            </div>
                          );
                        })
                      }
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {!showWeek && weekTotal === 0 && (
          <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", padding: "8px 0" }}>No reservations this week</div>
        )}
      </div>

      <div className="grid2" style={{ gap: 20 }}>
        <div className="card" style={{ overflowY: "auto", maxHeight: 520 }}>
          <div className="card-title">{t.recentEntries}</div>
          {sortedDays.length === 0 && <div className="text-muted small">{t.noEntries}</div>}
          {sortedDays.map(day => {
            const slots = entryDays[day];
            const isToday = day === today;
            const dayLabel = isToday ? "Today" : fmt(day + "T12:00:00");
            return (
              <div key={day} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".06em", color: isToday ? "var(--accent)" : "var(--muted)", marginBottom: 8, paddingBottom: 4, borderBottom: "2px solid var(--border)" }}>
                  {dayLabel}
                </div>
                {SLOT_ORDER.filter(s => slots[s]).map(slot => (
                  <div key={slot} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text)", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "1px 7px", fontSize: 10 }}>{slot}</span>
                      <span style={{ color: "var(--muted)", fontSize: 10 }}>{slots[slot].length} student{slots[slot].length !== 1 ? "s" : ""}</span>
                    </div>
                    {slots[slot].map((e, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 6px", borderRadius: 6, marginBottom: 2, background: e.method === "denied" ? "rgba(217,79,92,.06)" : "var(--surface2)" }}
                        onClick={() => { setSelectedId(e.studentId); setModal("studentDetail"); }} style2={{ cursor: "pointer" }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: e.method === "denied" ? "var(--red)" : e.method === "membership" ? "var(--green)" : e.method === "camp" ? "var(--gold)" : "var(--accent)" }} />
                        <span style={{ fontSize: 12, fontWeight: 600, flex: 1, cursor: "pointer" }} onClick={() => { setSelectedId(e.studentId); setModal("studentDetail"); }}>{e.studentName}{e.guest ? <span className="chip" style={{ marginLeft: 6 }}>Guest</span> : null}</span>
                        <span style={{ fontSize: 10, color: "var(--muted)" }}>{fmtTime(e.ts)}</span>
                        <span className={`badge ${e.method === "denied" ? "badge-red" : e.method === "membership" ? "badge-green" : e.method === "camp" ? "badge-gold" : "badge-blue"}`} style={{ fontSize: 9 }}>{e.method}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div className="card" style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <StudentOverviewPanel students={students} tiers={tiers} setSelectedId={setSelectedId} setModal={setModal} t={t} />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// RESERVATIONS PAGE
// ─────────────────────────────────────────────
const WEEKDAY_SLOTS  = ["7am", "10am", "2pm"];
const WEEKEND_SLOTS  = ["9:30am"];
const ALL_SLOTS      = ["7am", "9:30am", "10am", "2pm"];

function getSlotsForDate(dateStr) {
  const day = new Date(dateStr + "T12:00:00").getDay(); // 0=Sun, 6=Sat
  return (day === 0 || day === 6) ? WEEKEND_SLOTS : WEEKDAY_SLOTS;
}

function ReservationsPage({ students, reservations, lessonTypes, instructors = [], createReservation, cancelReservation, chargeNoShow, updateReservationInstructor, todayStr, getThisWeekSunday }) {
  const t = useLang();
  const [adding, setAdding] = useState(null);
  const [addStudentId, setAddStudentId] = useState("");
  const [addLessonType, setAddLessonType] = useState(lessonTypes[0]?.id || "group");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [noShowResult, setNoShowResult] = useState(null);

  // Build Sun–Sat for current week
  function getWeekDays() {
    const sunday = new Date(getThisWeekSunday());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d.toISOString().slice(0, 10);
    });
  }
  const days = getWeekDays();
  const today = todayStr();
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  function isCutoffPassed(date) {
    // Cutoff = 9pm night before
    const target = new Date(date + "T21:00:00");
    target.setDate(target.getDate() - 1);
    return new Date() > target;
  }

  function isPast(date) { return date < today; }

  function getSlotReservations(date, slot) {
    return reservations.filter(r => r.session_date === date && r.session_slot === slot && r.status !== "cancelled");
  }

  async function handleAdd() {
    if (!addStudentId || !adding) return;
    setBusy(true); setMsg(null);
    try {
      await createReservation(addStudentId, adding.date, adding.slot, addLessonType);
      setAdding(null); setAddStudentId("");
      setMsg({ text: "Reservation added!", type: "ok" });
    } catch(e) { setMsg({ text: e.message, type: "err" }); }
    finally { setBusy(false); }
  }

  async function handleCancel(id) {
    setBusy(true);
    try { await cancelReservation(id); }
    catch(e) { setMsg({ text: e.message, type: "err" }); }
    finally { setBusy(false); }
  }

  async function handleCharge(id) {
    setBusy(true); setNoShowResult(null);
    const result = await chargeNoShow(id);
    setNoShowResult(result);
    setBusy(false);
  }

  const statusColors = { reserved: "var(--accent)", checked_in: "var(--green)", charged: "var(--red)", cancelled: "var(--muted)" };
  const statusLabels = { reserved: "Reserved", checked_in: "✓ In", charged: "Charged", cancelled: "Cancelled" };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">◎ Reservations</div>
          <div className="page-sub">Week of {days[0]} — {days[6]}</div>
        </div>
      </div>

      {msg && <div className={msg.type === "ok" ? "notice" : "notice-warn"} style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => setMsg(null)}>{msg.text}</div>}
      {noShowResult && <div className={noShowResult.ok ? "notice" : "notice-warn"} style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => setNoShowResult(null)}>{noShowResult.ok ? "✓ Charged successfully" : `⚠ ${noShowResult.msg}`}</div>}

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
          <thead>
            <tr>
              <th style={{ width: 60, padding: "8px 6px", textAlign: "left", fontSize: 11, color: "var(--muted)", borderBottom: "1px solid var(--border)" }}>Slot</th>
              {days.map((d, i) => (
                <th key={d} style={{ padding: "8px 6px", textAlign: "left", fontSize: 11, color: d === today ? "var(--accent)" : "var(--muted)", borderBottom: "1px solid var(--border)", fontWeight: d === today ? 700 : 400 }}>
                  {DAY_NAMES[i]}<br/><span style={{ fontSize: 10 }}>{d.slice(5)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_SLOTS.map(slot => (
              <tr key={slot}>
                <td style={{ padding: "8px 6px", fontWeight: 700, fontSize: 12, color: "var(--accent)", verticalAlign: "top", borderBottom: "1px solid var(--border)" }}>{slot}</td>
                {days.map(date => {
                  const availableSlots = getSlotsForDate(date);
                  if (!availableSlots.includes(slot)) {
                    return (
                      <td key={date} style={{ padding: "6px", verticalAlign: "top", borderBottom: "1px solid var(--border)", background: "rgba(0,0,0,0.02)", minWidth: 110 }}>
                        <div style={{ fontSize: 10, color: "var(--border)", textAlign: "center", paddingTop: 8 }}>—</div>
                      </td>
                    );
                  }
                  const slotRes = getSlotReservations(date, slot);
                  const locked = isCutoffPassed(date);
                  const past = isPast(date);
                  return (
                    <td key={date} style={{ padding: "6px", verticalAlign: "top", borderBottom: "1px solid var(--border)", background: date === today ? "rgba(42,143,189,0.04)" : "transparent", minWidth: 110 }}>
                      {slotRes.map(r => {
                        const s = students.find(st => st.id === r.student_id);
                        const lt = lessonTypes.find(l => l.id === r.lesson_type);
                        return (
                          <div key={r.id} style={{ background: "var(--surface2)", borderRadius: 7, padding: "5px 8px", marginBottom: 4, fontSize: 11, border: "1px solid var(--border)" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontWeight: 600 }}>{s?.name || "?"}</span>
                              <span style={{ color: statusColors[r.status], fontSize: 10 }}>{statusLabels[r.status]}</span>
                            </div>
                            <div style={{ color: "var(--muted)", fontSize: 10, marginTop: 1 }}>{lt?.label || r.lesson_type} · {r.punch_cost}p</div>
                            {/* Instructor assignment */}
                            {instructors.length > 0 && (
                              <div style={{ marginTop: 4 }}>
                                <select
                                  style={{ fontSize: 10, padding: "2px 4px", width: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 4, color: r.instructor_id ? "var(--text)" : "var(--muted)" }}
                                  value={r.instructor_id || ""}
                                  onChange={e => updateReservationInstructor(r.id, e.target.value || null)}
                                >
                                  <option value="">No instructor</option>
                                  {instructors.map(ins => <option key={ins.id} value={ins.id}>{ins.name}</option>)}
                                </select>
                              </div>
                            )}
                            {r.status === "reserved" && (
                              <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                                {past
                                  ? <button className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: "2px 6px" }} disabled={busy} onClick={() => handleCharge(r.id)}>Charge</button>
                                  : !locked && <button className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: "2px 6px", color: "var(--red)" }} disabled={busy} onClick={() => handleCancel(r.id)}>✕</button>
                                }
                                {past && <button className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: "2px 6px", color: "var(--muted)" }} disabled={busy} onClick={() => handleCancel(r.id)}>Cancel</button>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {!locked && (
                        <button
                          style={{ width: "100%", background: "none", border: "1px dashed var(--border)", borderRadius: 7, color: "var(--muted)", fontSize: 11, padding: "4px", cursor: "pointer" }}
                          onClick={() => { setAdding({ date, slot }); setAddStudentId(""); }}
                        >+ Add</button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add reservation modal */}
      {adding && (
        <div className="modal-overlay" onClick={() => setAdding(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <div className="modal-title">Add Reservation</div>
              <button className="modal-close" onClick={() => setAdding(null)}>✕</button>
            </div>
            <div style={{ padding: "0 24px 24px" }}>
              <div style={{ fontSize: 13, color: "var(--accent)", marginBottom: 16 }}>{adding.date} · {adding.slot}</div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Student</div>
                <select className="input" value={addStudentId} onChange={e => setAddStudentId(e.target.value)}>
                  <option value="">— Select student —</option>
                  {students.filter(s => s.status !== "inactive").map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Session type</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {lessonTypes.map(lt => (
                    <div key={lt.id} className={`opt-card ${addLessonType === lt.id ? "selected" : ""}`} onClick={() => setAddLessonType(lt.id)}>
                      <div className="opt-card-label">{lt.label}</div>
                      <div className="opt-card-sub">{lt.punchCost}p</div>
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn btn-primary btn-full" disabled={!addStudentId || busy} onClick={handleAdd}>
                {busy ? "Adding…" : "Confirm Reservation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// INSTRUCTORS PAGE
// ─────────────────────────────────────────────
function InstructorsPage({ instructors, createInstructor, updateInstructor, deleteInstructor, logInstructorSession, todayStr }) {
  const [showNew, setShowNew]       = useState(false);
  const [editing, setEditing]       = useState(null);  // instructor being edited
  const [selected, setSelected]     = useState(null);  // id of expanded instructor
  const [showLogSession, setShowLogSession] = useState(false);
  const [form, setForm]             = useState({ name: "", email: "", phone: "", notes: "" });
  const [logForm, setLogForm]       = useState({ date: todayStr(), slot: "10am", notes: "" });
  const [busy, setBusy]             = useState(false);
  const [msg, setMsg]               = useState(null);

  const selectedInstructor = instructors.find(i => i.id === selected) || null;
  const allSlots = [...WEEKDAY_SLOTS, ...WEEKEND_SLOTS];
  const uniqueSlots = [...new Set(allSlots)].sort();

  function openNew() { setForm({ name: "", email: "", phone: "", notes: "" }); setEditing(null); setShowNew(true); }
  function openEdit(ins) { setForm({ name: ins.name, email: ins.email, phone: ins.phone || "", notes: ins.notes || "" }); setEditing(ins); setShowNew(true); }

  async function handleSave() {
    if (!form.name.trim() || !form.email.trim()) { setMsg({ text: "Name and email required", ok: false }); return; }
    setBusy(true); setMsg(null);
    try {
      if (editing) {
        await updateInstructor(editing.id, { name: form.name.trim(), email: form.email.trim(), phone: form.phone, notes: form.notes, avatar: form.name.trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) });
        setMsg({ text: "Instructor updated!", ok: true });
      } else {
        await createInstructor(form.name.trim(), form.email.trim(), form.phone, form.notes);
        setMsg({ text: "Instructor added!", ok: true });
      }
      setShowNew(false);
    } catch(e) { setMsg({ text: e.message, ok: false }); }
    finally { setBusy(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm("Remove this instructor?")) return;
    setBusy(true);
    try { await deleteInstructor(id); setSelected(null); setMsg({ text: "Removed.", ok: true }); }
    catch(e) { setMsg({ text: e.message, ok: false }); }
    finally { setBusy(false); }
  }

  async function handleLogSession() {
    if (!selected || !logForm.date || !logForm.slot) return;
    setBusy(true);
    try {
      await logInstructorSession(selected, logForm.date, logForm.slot, logForm.notes);
      setShowLogSession(false);
      setMsg({ text: "Session logged!", ok: true });
    } catch(e) { setMsg({ text: e.message, ok: false }); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">🏄 Instructors</div><div className="page-sub">Manage surf instructors and their session history</div></div>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Add Instructor</button>
      </div>

      {msg && (
        <div className={msg.ok ? "notice" : "notice-err"} style={{ cursor: "pointer" }} onClick={() => setMsg(null)}>{msg.text}</div>
      )}

      <div className="grid2" style={{ gap: 20 }}>
        {/* Instructor list */}
        <div>
          {instructors.length === 0 && (
            <div className="card"><div style={{ color: "var(--muted)", fontSize: 13 }}>No instructors yet. Add one to get started.</div></div>
          )}
          {instructors.map(ins => {
            const sessions = ins.instructor_sessions || [];
            const recentSessions = [...sessions].sort((a, b) => b.session_date.localeCompare(a.session_date)).slice(0, 3);
            const isSelected = selected === ins.id;
            return (
              <div key={ins.id} className="card" style={{ marginBottom: 12, cursor: "pointer", border: isSelected ? "2px solid var(--accent)" : "1px solid var(--border)" }} onClick={() => setSelected(isSelected ? null : ins.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div className="avatar" style={{ width: 40, height: 40, fontSize: 13 }}>{ins.avatar || ins.name.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{ins.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{ins.email}</div>
                      {ins.phone && <div style={{ fontSize: 11, color: "var(--muted)" }}>{ins.phone}</div>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>{sessions.length} sessions</span>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 11 }} onClick={e => { e.stopPropagation(); openEdit(ins); }}>Edit</button>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, color: "var(--red)" }} onClick={e => { e.stopPropagation(); handleDelete(ins.id); }}>Remove</button>
                  </div>
                </div>
                {isSelected && recentSessions.length > 0 && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 }}>Recent Sessions</div>
                    {recentSessions.map(s => (
                      <div key={s.id} style={{ fontSize: 12, padding: "4px 0", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text)" }}>{s.session_date} · <span style={{ color: "var(--accent)", fontWeight: 600 }}>{s.session_slot}</span></span>
                        {s.notes && <span style={{ color: "var(--muted)", fontSize: 11 }}>{s.notes}</span>}
                      </div>
                    ))}
                  </div>
                )}
                {isSelected && ins.notes && (
                  <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>{ins.notes}</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Detail / Log session panel */}
        {selectedInstructor ? (
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{selectedInstructor.name}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>{selectedInstructor.email}</div>

            <button className="btn btn-primary btn-sm" style={{ marginBottom: 20 }} onClick={() => { setLogForm({ date: todayStr(), slot: "10am", notes: "" }); setShowLogSession(true); }}>
              + Log a Session
            </button>

            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              Full Session History ({(selectedInstructor.instructor_sessions || []).length})
            </div>
            {(selectedInstructor.instructor_sessions || []).length === 0 && (
              <div style={{ fontSize: 12, color: "var(--muted)" }}>No sessions logged yet.</div>
            )}
            {[...(selectedInstructor.instructor_sessions || [])].sort((a, b) => b.session_date.localeCompare(a.session_date)).map(s => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{s.session_date}</span>
                  <span style={{ marginLeft: 8, color: "var(--accent)", fontWeight: 600 }}>{s.session_slot}</span>
                  {s.notes && <span style={{ marginLeft: 8, color: "var(--muted)", fontSize: 11 }}>— {s.notes}</span>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120 }}>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>← Select an instructor to view their sessions</div>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-header">
              <div className="modal-title">{editing ? "Edit Instructor" : "New Instructor"}</div>
              <button className="modal-close" onClick={() => setShowNew(false)}>✕</button>
            </div>
            <div style={{ padding: "0 24px 24px" }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Full Name *</div>
                <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ana Silva" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Email *</div>
                <input className="input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="ana@surf.com" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Phone</div>
                <input className="input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+351 912 345 678" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Notes</div>
                <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Certifications, specialisms…" />
              </div>
              <button className="btn btn-primary btn-full" disabled={busy || !form.name || !form.email} onClick={handleSave}>
                {busy ? "Saving…" : editing ? "Save Changes" : "Add Instructor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log session modal */}
      {showLogSession && selectedInstructor && (
        <div className="modal-overlay" onClick={() => setShowLogSession(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <div className="modal-title">Log Session</div>
              <button className="modal-close" onClick={() => setShowLogSession(false)}>✕</button>
            </div>
            <div style={{ padding: "0 24px 24px" }}>
              <div style={{ fontSize: 13, color: "var(--accent)", marginBottom: 16, fontWeight: 600 }}>{selectedInstructor.name}</div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Date</div>
                <input className="input" type="date" value={logForm.date} onChange={e => setLogForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Slot</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {ALL_SLOTS.map(slot => (
                    <div key={slot} className={`opt-card ${logForm.slot === slot ? "selected" : ""}`} style={{ padding: "8px 12px" }} onClick={() => setLogForm(p => ({ ...p, slot }))}>
                      <div className="opt-card-label" style={{ fontSize: 12 }}>{slot}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Notes (optional)</div>
                <input className="input" value={logForm.notes} onChange={e => setLogForm(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Beginner group, 6 students" />
              </div>
              <button className="btn btn-primary btn-full" disabled={busy} onClick={handleLogSession}>
                {busy ? "Logging…" : "Log Session"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// CAMPS PAGE
// ─────────────────────────────────────────────
function CampsPage({ students, camps, campEnrollments, campAttendance, createCamp, deleteCamp, enrollStudent, unenrollStudent, checkInCamper, todayStr }) {
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [showNewCamp, setShowNewCamp] = useState(false);
  const [newCamp, setNewCamp] = useState({ name: "", type: "easter", startDate: "", endDate: "" });
  const [showEnroll, setShowEnroll] = useState(false);
  const [enrollStudentId, setEnrollStudentId] = useState("");
  const [enrollSchedule, setEnrollSchedule] = useState("full_day");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const today = todayStr();

  const camp = camps.find(c => c.id === selectedCamp) || null;
  const enrolled = camp ? campEnrollments.filter(e => e.camp_id === camp.id) : [];
  const todayAttendance = camp ? campAttendance.filter(a => a.camp_id === camp.id && a.attendance_date === today) : [];
  const isCampActive = camp && camp.start_date <= today && camp.end_date >= today;

  function campTypeLabel(t) { return t === "easter" ? "🐣 Easter" : "☀️ Summer"; }
  function scheduleLabel(s) { return s === "full_day" ? "Full Day" : "Half Day"; }
  function campStatus(c) {
    if (today < c.start_date) return { label: "Upcoming", color: "var(--accent)" };
    if (today > c.end_date)   return { label: "Ended",    color: "var(--muted)" };
    return { label: "Active 🟢", color: "var(--green)" };
  }

  async function handleCreateCamp() {
    if (!newCamp.name || !newCamp.startDate || !newCamp.endDate) return;
    setBusy(true); setMsg(null);
    try {
      await createCamp(newCamp.name, newCamp.type, newCamp.startDate, newCamp.endDate);
      setShowNewCamp(false); setNewCamp({ name: "", type: "easter", startDate: "", endDate: "" });
      setMsg({ text: "Camp created!", ok: true });
    } catch(e) { setMsg({ text: e.message, ok: false }); }
    finally { setBusy(false); }
  }

  async function handleEnroll() {
    if (!enrollStudentId || !camp) return;
    setBusy(true);
    try {
      await enrollStudent(enrollStudentId, camp.id, enrollSchedule);
      setShowEnroll(false); setEnrollStudentId("");
      setMsg({ text: "Student enrolled!", ok: true });
    } catch(e) { setMsg({ text: e.message, ok: false }); }
    finally { setBusy(false); }
  }

  async function handleCheckIn(studentId) {
    setBusy(true);
    try {
      await checkInCamper(studentId, camp.id);
      setMsg({ text: "Checked in!", ok: true });
    } catch(e) { setMsg({ text: e.message, ok: false }); }
    finally { setBusy(false); }
  }

  async function handleUnenroll(studentId) {
    setBusy(true);
    try { await unenrollStudent(studentId, camp.id); }
    catch(e) { setMsg({ text: e.message, ok: false }); }
    finally { setBusy(false); }
  }

  const unenrolledStudents = students.filter(s => !enrolled.find(e => e.student_id === s.id));

  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">🏕 Camps</div><div className="page-sub">Manage camp programs and attendance</div></div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowNewCamp(true)}>+ New Camp</button>
      </div>

      {msg && <div className={msg.ok ? "notice" : "notice-warn"} style={{ marginBottom: 12, cursor: "pointer" }} onClick={() => setMsg(null)}>{msg.text}</div>}

      <div className="grid2" style={{ gap: 20 }}>
        {/* Camp list */}
        <div>
          {camps.length === 0 && <div className="card"><div style={{ color: "var(--muted)", fontSize: 13 }}>No camps yet. Create one to get started.</div></div>}
          {camps.map(c => {
            const st = campStatus(c);
            const count = campEnrollments.filter(e => e.camp_id === c.id).length;
            return (
              <div key={c.id} className={`card`} style={{ marginBottom: 12, cursor: "pointer", border: selectedCamp === c.id ? "1px solid var(--accent)" : "1px solid var(--border)" }} onClick={() => setSelectedCamp(c.id)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{campTypeLabel(c.type)} · {c.start_date} → {c.end_date}</div>
                    <div style={{ fontSize: 11, marginTop: 4, color: "var(--muted)" }}>{count} enrolled</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <span style={{ fontSize: 11, color: st.color, fontWeight: 600 }}>{st.label}</span>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: 10, color: "var(--red)", padding: "2px 8px" }}
                      onClick={e => { e.stopPropagation(); if (window.confirm("Delete this camp?")) deleteCamp(c.id); }}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Camp detail */}
        {camp ? (
          <div className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{camp.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{camp.start_date} → {camp.end_date}</div>
              </div>
              {isCampActive && <span style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>Active today</span>}
            </div>

            {/* Today's attendance summary if active */}
            {isCampActive && (
              <div style={{ background: "var(--surface2)", borderRadius: 10, padding: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 8 }}>
                  Today's Attendance — {todayAttendance.length}/{enrolled.length} checked in
                </div>
                <div style={{ height: 6, background: "var(--border)", borderRadius: 3, marginBottom: 10 }}>
                  <div style={{ height: 6, background: "var(--green)", borderRadius: 3, width: enrolled.length > 0 ? `${(todayAttendance.length / enrolled.length) * 100}%` : "0%" }} />
                </div>
                {enrolled.map(e => {
                  const s = students.find(st => st.id === e.student_id);
                  const checkedIn = todayAttendance.some(a => a.student_id === e.student_id);
                  return (
                    <div key={e.student_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{s?.name || "?"}</span>
                        <span style={{ fontSize: 10, color: "var(--muted)", marginLeft: 8 }}>{scheduleLabel(e.schedule)}</span>
                      </div>
                      {checkedIn
                        ? <span style={{ fontSize: 11, color: "var(--green)" }}>✓ In</span>
                        : <button className="btn btn-ghost btn-sm" style={{ fontSize: 11, padding: "3px 10px" }} disabled={busy} onClick={() => handleCheckIn(e.student_id)}>Check In</button>
                      }
                    </div>
                  );
                })}
              </div>
            )}

            {/* Enrolled students list */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Enrolled ({enrolled.length})</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowEnroll(true)}>+ Add Student</button>
            </div>
            {enrolled.length === 0 && <div style={{ fontSize: 12, color: "var(--muted)" }}>No students enrolled yet.</div>}
            {enrolled.map(e => {
              const s = students.find(st => st.id === e.student_id);
              const attendedDays = campAttendance.filter(a => a.student_id === e.student_id && a.camp_id === camp.id).length;
              return (
                <div key={e.student_id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{s?.name || "?"}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)" }}>{scheduleLabel(e.schedule)} · {attendedDays} days attended</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: 10, color: "var(--red)", padding: "2px 8px" }} disabled={busy} onClick={() => handleUnenroll(e.student_id)}>Remove</button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120 }}>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>← Select a camp to manage it</div>
          </div>
        )}
      </div>

      {/* New camp modal */}
      {showNewCamp && (
        <div className="modal-overlay" onClick={() => setShowNewCamp(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <div className="modal-title">New Camp Program</div>
              <button className="modal-close" onClick={() => setShowNewCamp(false)}>✕</button>
            </div>
            <div style={{ padding: "0 24px 24px" }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Camp Name</div>
                <input className="input" placeholder="e.g. Easter Camp 2026" value={newCamp.name} onChange={e => setNewCamp(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Type</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["easter","🐣 Easter"],["summer","☀️ Summer"]].map(([val, lbl]) => (
                    <div key={val} className={`opt-card ${newCamp.type === val ? "selected" : ""}`} onClick={() => setNewCamp(p => ({ ...p, type: val }))}>
                      <div className="opt-card-label">{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Start Date</div>
                  <input className="input" type="date" value={newCamp.startDate} onChange={e => setNewCamp(p => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>End Date</div>
                  <input className="input" type="date" value={newCamp.endDate} onChange={e => setNewCamp(p => ({ ...p, endDate: e.target.value }))} />
                </div>
              </div>
              <button className="btn btn-primary btn-full" disabled={!newCamp.name || !newCamp.startDate || !newCamp.endDate || busy} onClick={handleCreateCamp}>
                {busy ? "Creating…" : "Create Camp"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll student modal */}
      {showEnroll && camp && (
        <div className="modal-overlay" onClick={() => setShowEnroll(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <div className="modal-title">Enroll in {camp.name}</div>
              <button className="modal-close" onClick={() => setShowEnroll(false)}>✕</button>
            </div>
            <div style={{ padding: "0 24px 24px" }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Student</div>
                <select className="input" value={enrollStudentId} onChange={e => setEnrollStudentId(e.target.value)}>
                  <option value="">— Select student —</option>
                  {unenrolledStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>Schedule</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["full_day","Full Day"],["half_day","Half Day"]].map(([val, lbl]) => (
                    <div key={val} className={`opt-card ${enrollSchedule === val ? "selected" : ""}`} onClick={() => setEnrollSchedule(val)}>
                      <div className="opt-card-label">{lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary btn-full" disabled={!enrollStudentId || busy} onClick={handleEnroll}>
                {busy ? "Enrolling…" : "Enroll Student"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// STUDENTS PAGE
// ─────────────────────────────────────────────
function StudentsPage({ students, search, setSearch, setSelectedId, setModal }) {
  const t      = useLang();
  const { tiers } = useConfig();
  const colors = ["var(--accent)", "var(--gold)", "var(--green)"];
  return (
    <div>
      <div className="page-header">
        <div><div className="page-title">{t.students}</div><div className="page-sub">{t.enrolled(students.length)}</div></div>
        <div className="row gap8">
          <input className="search-bar" placeholder={t.searchPlaceholder} value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-primary btn-sm" onClick={() => setModal("addStudent")}>{t.addStudent}</button>
        </div>
      </div>
      <div className="card"><div className="table-wrap"><table>
        <thead><tr><th>{t.students}</th><th>{t.membership}</th><th>{t.weeklyUsage}</th><th>{t.punchCard}</th><th>{t.status}</th><th></th></tr></thead>
        <tbody>
          {students.map((s, i) => {
            const tier    = s.membership ? getTier(s.membership.tierId, tiers) : null;
            const used    = s.membership?.activeWeekEntries || 0, limit = tier?.entriesPerWeek || 0;
            const pct     = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
            const atLimit = tier && used >= limit;
            return (
              <tr key={s.id}>
                <td><div className="name-cell"><div className="avatar" style={{ background: colors[i % 3], color: "#0a0e12" }}>{s.avatar}</div><div><div className="bold">{s.name}</div><div className="small text-muted">{s.email}</div></div></div></td>
                <td>{tier ? <span className="badge badge-green">{tier.label} · {tier.entriesPerWeek}/wk</span> : <span className="badge badge-gray">{t.none}</span>}</td>
                <td style={{ minWidth: 120 }}>{tier ? (<><div className="small">{t.sessions(used, limit)}</div><div className="progress-bar" style={{ marginTop: 4, width: 100 }}><div className={`progress-fill ${pct >= 100 ? "fill-red" : pct > 60 ? "fill-gold" : "fill-green"}`} style={{ width: `${pct}%` }} /></div></>) : <span className="text-muted">—</span>}</td>
                <td>{s.punchCard ? <span className={`badge ${s.punchCard.balance === 0 ? "badge-red" : "badge-blue"}`}>{t.punches(s.punchCard.balance)}</span> : <span className="badge badge-gray">{t.none}</span>}</td>
                <td>{atLimit && !s.punchCard ? <span className="badge badge-red">{t.restricted}</span> : atLimit && s.punchCard?.balance > 0 ? <span className="badge badge-gold">{t.cardFallback}</span> : <span className="badge badge-green">{t.active}</span>}</td>
                <td><button className="btn btn-ghost btn-sm" onClick={() => { setSelectedId(s.id); setModal("studentDetail"); }}>{t.view}</button></td>
              </tr>
            );
          })}
        </tbody>
      </table></div></div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ENTRY PAGE
// ─────────────────────────────────────────────
function EntryPage({ students, processEntry }) {
  const t = useLang();
  const { tiers } = useConfig();
  const [mode, setMode]         = useState("search");
  const _setMode = (m) => { console.trace("[SurfTrack] setMode called with: " + m); setMode(m); };
  const [query, setQuery]       = useState("");
  const [selected, setSelected] = useState(null);
  const [result, setResult]     = useState(null);
  const [isGuest, setIsGuest]   = useState(false);
  const [guestName, setGuestName] = useState("");
  const [camErr, setCamErr]     = useState("");
  const [busy, setBusy]         = useState(false);
  const videoRef  = useRef(null);
  const streamRef = useRef(null);

  const matches = query.length > 1 ? students.filter(s => s.name.toLowerCase().includes(query.toLowerCase()) || s.email.toLowerCase().includes(query.toLowerCase())) : [];

  const canvasRef    = useRef(null);
  const rafRef       = useRef(null);
  const scanningRef  = useRef(false);
  const detectorRef  = useRef(null);

  async function startCamera() {
    setCamErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; }
      if (typeof BarcodeDetector !== "undefined") {
        detectorRef.current = new BarcodeDetector({ formats: ["qr_code"] });
      }
      scanningRef.current = true;
      scanFrame();
    } catch { setCamErr(t.cameraUnavailable); }
  }

  async function scanFrame() {
    if (!scanningRef.current) return;
    const video = videoRef.current;
    if (!video || video.readyState < 2) { rafRef.current = requestAnimationFrame(scanFrame); return; }
    try {
      let decoded = null;
      if (detectorRef.current) {
        // Native BarcodeDetector (Android Chrome, iOS Safari 17+)
        const barcodes = await detectorRef.current.detect(video);
        if (barcodes.length > 0) decoded = barcodes[0].rawValue;
      } else {
        // jsQR fallback — works everywhere including desktop Chrome
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width  = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          ctx.drawImage(video, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: "dontInvert" });
          if (code) decoded = code.data;
        }
      }
      if (decoded) {
        const match = students.find(s => s.id === decoded);
        if (match) {
          scanningRef.current = false;
          cancelAnimationFrame(rafRef.current);
          handleEntry(match.id, true);
          return;
        }
      }
    } catch { /* keep scanning */ }
    rafRef.current = requestAnimationFrame(scanFrame);
  }

  function stopCamera() {
    scanningRef.current = false;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(tr => tr.stop());
    streamRef.current = null;
  }
  useEffect(() => { if (mode === "camera") startCamera(); else stopCamera(); return stopCamera; }, [mode]);

  async function handleEntry(studentId, fromCamera = false) {
    const id = studentId || selected?.id;
    if (!id) return;
    setBusy(true);
    const student = students.find(s => s.id === id);
    const res = await processEntry(id, isGuest, guestName);
    setResult({ ...res, studentName: student?.name });
    setBusy(false);
    if (fromCamera) {
      setTimeout(() => {
        setResult(null);
        scanningRef.current = true;
        scanFrame();
      }, 2500);
    } else {
      _setMode("search");
    }
  }

  return (
    <div>
      <div className="page-header"><div><div className="page-title">{t.entryScannerTitle}</div><div className="page-sub">{t.entryScannerSub}</div></div></div>
      <div className="grid2" style={{ gap: 20, maxWidth: 860 }}>
        <div>
          <div className="tabs" style={{ marginBottom: 16 }}>
            <div className={`tab ${mode === "camera" ? "active" : ""}`} onClick={() => { _setMode("camera"); setResult(null); }}>{t.cameraScan}</div>
            <div className={`tab ${mode === "search" ? "active" : ""}`} onClick={() => { _setMode("search"); setResult(null); }}>{t.searchStudent}</div>
          </div>
          {mode === "camera" && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">{t.pointCamera}</div>
              {camErr ? <div className="notice-warn">{camErr}</div> : <>
                <div className="scanner-wrap">
                  <video ref={videoRef} autoPlay playsInline muted />
                  <canvas ref={canvasRef} style={{ display: "none" }} />
                  <div className="scanner-overlay"><div className="scanner-frame"><div className="scanner-line" /></div></div>
                </div>
                <div className="notice mt8" style={{ marginBottom: 8, fontSize: 12, textAlign: "center" }}>
                  🔍 Scanning… point at student's QR code to auto-check in
                </div>
              </>}
              <div className="notice mt8" style={{ marginBottom: 8 }}>{t.afterScanning}</div>
              {students.map(s => (
                <div key={s.id} className="timeline-item" style={{ marginBottom: 6, cursor: "pointer" }} onClick={() => handleEntry(s.id)}>
                  <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{s.avatar}</div>
                  <div className="timeline-info"><div className="timeline-title">{s.name}</div><div className="timeline-time">{s.membership ? getTier(s.membership.tierId, tiers)?.label : t.noMembership}{s.punchCard ? ` · ${s.punchCard.balance}p` : ""}</div></div>
                </div>
              ))}
            </div>
          )}
          {mode === "search" && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">{t.searchStudent}</div>
              <input className="search-bar" style={{ width: "100%", marginBottom: 10 }} placeholder={t.typeNameOrEmail} value={query} onChange={e => { setQuery(e.target.value); setSelected(null); setResult(null); }} />
              {matches.map(s => (
                <div key={s.id} style={{ padding: "10px 8px", borderBottom: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, background: selected?.id === s.id ? "rgba(56,200,232,.06)" : "", borderRadius: 6 }} onClick={() => { setSelected(s); setQuery(s.name); }}>
                  <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{s.avatar}</div>
                  <div><div className="bold small">{s.name}</div><div className="small text-muted">{s.email}</div></div>
                  {selected?.id === s.id && <span className="badge badge-blue" style={{ marginLeft: "auto" }}>{t.selected}</span>}
                </div>
              ))}
            </div>
          )}
          <div className="card">
            <div className="card-title">{t.guestEntry}</div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 10 }}>
              <input type="checkbox" checked={isGuest} onChange={e => setIsGuest(e.target.checked)} />
              <span className="small">{t.guestCheck}</span>
            </label>
            {isGuest && <div className="field"><label>{t.guestName}</label><input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder={t.guestNamePlaceholder} /></div>}
          </div>
        </div>
        <div>
          {mode === "search" && <button className="btn btn-primary btn-full" style={{ marginBottom: 16, padding: 14, fontSize: 15 }} disabled={!selected || busy} onClick={() => handleEntry()}>{busy ? t.processing : t.processEntry(selected?.name)}</button>}
          {result && (
            <div className={`entry-result ${result.allowed ? "entry-allowed" : "entry-denied"}`}>
              <div className="entry-icon">{result.allowed ? "✓" : "✗"}</div>
              {result.studentName && <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 4 }}>{result.studentName}</div>}
              <div className="entry-msg" style={{ color: result.allowed ? "var(--green)" : "var(--red)" }}>{result.message}</div>
              <div className="entry-detail">{result.detail}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// LESSONS PAGE
// ─────────────────────────────────────────────
function LessonsPage({ students, logLesson }) {
  const t = useLang();
  const { lessonTypes, groupClasses, tiers, cardOptions } = useConfig();
  const [selId, setSelId]           = useState("");
  const [lessonType, setLessonType] = useState("group");
  const [cls, setCls]               = useState(groupClasses[0] || "");
  const [result, setResult]         = useState(null);
  const [busy, setBusy]             = useState(false);
  const student    = students.find(s => s.id === selId);
  const lt         = lessonTypes.find(l => l.id === lessonType);
  const allLessons = students.flatMap(s => s.lessonHistory.map(l => ({ ...l, studentName: s.name }))).sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 20);

  return (
    <div>
      <div className="page-header"><div><div className="page-title">{t.logLessonTitle}</div><div className="page-sub">{t.logLessonSub}</div></div></div>
      <div className="grid2" style={{ gap: 20 }}>
        <div className="card">
          <div className="card-title">{t.recordLesson}</div>
          <div className="notice">{t.lessonNotice}</div>
          <div className="field"><label>{t.students}</label>
            <select value={selId} onChange={e => { setSelId(e.target.value); setResult(null); }}>
              <option value="">{t.selectStudent}</option>
              {students.filter(s => s.punchCard || s.membership).map(s => {
                const tier = s.membership ? getTier(s.membership.tierId, tiers) : null;
                const remaining = tier ? Math.max(0, tier.entriesPerWeek - (s.membership.activeWeekEntries || 0)) : 0;
                const info = s.punchCard && tier ? `${remaining} sessions + ${s.punchCard.balance}p` : s.punchCard ? `${s.punchCard.balance}p` : `${remaining} sessions`;
                return <option key={s.id} value={s.id}>{s.name} ({info})</option>;
              })}
            </select>
          </div>
          <div className="field"><label>{t.lessonType}</label>
            <div className="grid2" style={{ marginTop: 4 }}>
              {lessonTypes.map(l => <div key={l.id} className={`opt-card ${lessonType === l.id ? "selected" : ""}`} onClick={() => setLessonType(l.id)}><div className="opt-card-label">{l.label}</div><div className="opt-card-sub">{l.punchCost} {l.punchCost > 1 ? t.punches2 : t.punch}</div></div>)}
            </div>
          </div>
          {lessonType === "group" && <div className="field"><label>{t.class}</label><select value={cls} onChange={e => setCls(e.target.value)}>{groupClasses.map(g => <option key={g}>{g}</option>)}</select></div>}
          {student && lt && (() => {
            const tier2 = student.membership ? getTier(student.membership.tierId, tiers) : null;
            const wLeft = tier2 ? Math.max(0, tier2.entriesPerWeek - (student.membership.activeWeekEntries || 0)) : 0;
            const pBal = student.punchCard?.balance || 0;
            const canBook = wLeft > 0 || pBal >= lt.punchCost;
            const msg = canBook
              ? wLeft > 0 ? `✓ ${student.name} has ${wLeft} weekly session${wLeft !== 1 ? "s" : ""} remaining.` : t.punchesAvailable(pBal, student.name)
              : pBal > 0 ? t.notEnoughPunches(lt.punchCost, pBal) : "✗ No weekly sessions remaining and no punch card.";
            return <div className={canBook ? "notice" : "notice-warn"}>{msg}</div>;
          })()}
          <button className="btn btn-primary btn-full" disabled={!selId || busy} onClick={async () => { setBusy(true); setResult(await logLesson(selId, lessonType, lessonType === "group" ? cls : "")); setBusy(false); }}>{busy ? t.saving : t.logLessonBtn}</button>
          {result && <div className={`entry-result mt16 ${result.ok ? "entry-allowed" : "entry-denied"}`}><div className="entry-msg" style={{ color: result.ok ? "var(--green)" : "var(--red)" }}>{result.ok ? t.lessonRecorded : result.msg}</div></div>}
        </div>
        <div className="card">
          <div className="card-title">{t.recentLessons}</div>
          <div className="timeline">
            {allLessons.length === 0 && <div className="text-muted small">{t.noLessons}</div>}
            {allLessons.map((l, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-dot" style={{ background: l.type === "private" ? "var(--gold)" : "var(--accent)" }} />
                <div className="timeline-info"><div className="timeline-title">{l.studentName}</div><div className="timeline-time">{l.label}{l.class ? ` · ${l.class}` : ""} · {fmt(l.ts)}</div></div>
                <span className={`badge ${l.type === "private" ? "badge-gold" : "badge-blue"}`}>-{l.cost}p</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BILLING PAGE
// ─────────────────────────────────────────────
// Returns the euro value of punch cards sold to a student THIS calendar month
function punchRevenueThisMonth(student, cardOptions) {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  return (student.punchHistory || [])
    .filter(h => h.delta > 0 && new Date(h.ts) >= start)
    .reduce((sum, h) => {
      const opt = cardOptions.find(o => o.punches === h.delta);
      return sum + (opt ? opt.price : 0);
    }, 0);
}

function BillingPage({ students, addPunches, setMembership, removeMembership }) {
  const t = useLang();
  const { tiers, cardOptions } = useConfig();
  const [selId, setSelId]   = useState("");
  const [cardId, setCardId] = useState(cardOptions[0]?.id || "");
  const [tierId, setTierId] = useState(tiers[0]?.id || "");
  const [action, setAction] = useState("loadCard");
  const [msg, setMsg]       = useState("");
  const [busy, setBusy]     = useState(false);
  const flash = m => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const monthLabel      = t.monthLabel();
  const totalMembership = students.reduce((sum, s) => sum + (getTier(s.membership?.tierId, tiers)?.monthlyPrice || 0), 0);
  const totalPunchCards = students.reduce((sum, s) => sum + punchRevenueThisMonth(s, cardOptions), 0);
  const totalRevenue    = totalMembership + totalPunchCards;

  return (
    <div>
      <div className="page-header"><div><div className="page-title">{t.billingTitle}</div><div className="page-sub">{t.billingSub}</div></div></div>
      <div className="grid2" style={{ gap: 20 }}>
        <div className="card">
          <div className="card-title">{t.accountActions}</div>
          <div className="field"><label>{t.students}</label>
            <select value={selId} onChange={e => setSelId(e.target.value)}>
              <option value="">{t.selectStudent}</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="tabs" style={{ marginBottom: 16 }}>
            <div className={`tab ${action === "loadCard" ? "active" : ""}`} onClick={() => setAction("loadCard")}>{t.loadPunchCard}</div>
            <div className={`tab ${action === "membership" ? "active" : ""}`} onClick={() => setAction("membership")}>{t.setMembership}</div>
          </div>
          {action === "loadCard" && (<>
            <div className="section-label">{t.selectAmount}</div>
            <div className="grid3" style={{ marginBottom: 16 }}>{cardOptions.map(o => <div key={o.id} className={`opt-card ${cardId === o.id ? "selected" : ""}`} onClick={() => setCardId(o.id)}><div className="opt-card-label">{o.punches}p</div><div className="opt-card-sub">{CURRENCY}{o.price}</div></div>)}</div>
            <button className="btn btn-primary btn-full" disabled={!selId || busy} onClick={async () => { setBusy(true); await addPunches(selId, cardId); flash(t.cardLoaded); setBusy(false); }}>{busy ? t.saving : t.loadCard}</button>
          </>)}
          {action === "membership" && (<>
            <div className="section-label">{t.selectTier}</div>
            {tiers.map(tier => <div key={tier.id} className={`opt-card ${tierId === tier.id ? "selected" : ""}`} style={{ marginBottom: 8 }} onClick={() => setTierId(tier.id)}><div className="opt-card-label">{tier.label} — {t.sessionsPerWeek(tier.entriesPerWeek)}</div><div className="opt-card-sub">{CURRENCY}{tier.monthlyPrice}{t.mo}</div></div>)}
            <div className="row gap8 mt16">
              <button className="btn btn-primary" disabled={!selId || busy} onClick={async () => { setBusy(true); await setMembership(selId, tierId); flash(t.membershipUpdated); setBusy(false); }}>{busy ? t.saving : t.updateMembership}</button>
              {selId && students.find(s => s.id === selId)?.membership && <button className="btn btn-danger" onClick={async () => { await removeMembership(selId); flash(t.membershipRemoved); }}>{t.removeMembership}</button>}
            </div>
          </>)}
          {msg && <div className="notice mt16" style={{ marginBottom: 0 }}>{msg}</div>}
        </div>
        <div className="card">
          <div className="card-title">{t.revenueSummary(monthLabel)}</div>
          <div className="notice" style={{ marginBottom: 16 }}>{t.revenueNotice}</div>
          <table style={{ width: "100%" }}>
            <thead><tr><th>{t.students}</th><th>{t.membership}</th><th style={{ textAlign: "right" }}>{t.membershipFee}</th><th style={{ textAlign: "right" }}>{t.cardsThisMonth}</th></tr></thead>
            <tbody>
              {students.map(s => {
                const tier = s.membership ? getTier(s.membership.tierId, tiers) : null;
                const cardRevenue = punchRevenueThisMonth(s, cardOptions);
                return (
                  <tr key={s.id}>
                    <td><div className="bold small">{s.name}</div></td>
                    <td>{tier ? <span className="badge badge-green">{tier.label}</span> : <span className="badge badge-gray">{t.none}</span>}</td>
                    <td style={{ textAlign: "right" }} className="text-accent">{tier ? `${CURRENCY}${tier.monthlyPrice}` : "—"}</td>
                    <td style={{ textAlign: "right" }} className={cardRevenue > 0 ? "text-gold" : "text-muted"}>{cardRevenue > 0 ? `${CURRENCY}${cardRevenue}` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="separator" />
          <div className="flex justify-between" style={{ marginBottom: 8 }}><span className="small text-muted">{t.membershipFees}</span><span className="small text-accent">{CURRENCY}{totalMembership}</span></div>
          <div className="flex justify-between" style={{ marginBottom: 12 }}><span className="small text-muted">{t.punchCardSalesMonth}</span><span className="small text-gold">{CURRENCY}{totalPunchCards}</span></div>
          <div className="flex justify-between" style={{ paddingTop: 10, borderTop: "1px solid var(--border)" }}><span className="bold">{t.totalRevenue(monthLabel)}</span><span className="text-accent bold">{CURRENCY}{totalRevenue}</span></div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// EXPORT PAGE — download CSVs
// ─────────────────────────────────────────────
function ExportPage() {
  const t = useLang();
  const [busy, setBusy] = useState("");
  const [msg, setMsg]   = useState("");

  async function exportEntries() {
    setBusy("entries");
    const rows = await db.exportEntryLog();
    downloadCSV(rows, `surftrack-entries-${new Date().toISOString().slice(0,10)}.csv`);
    setMsg(t.entryLogDownloaded); setBusy(""); setTimeout(() => setMsg(""), 3000);
  }

  async function exportRevenue() {
    setBusy("revenue");
    const rows = await db.exportRevenue();
    downloadCSV(rows, `surftrack-revenue-${new Date().toISOString().slice(0,10)}.csv`);
    setMsg(t.revenueDownloaded); setBusy(""); setTimeout(() => setMsg(""), 3000);
  }

  return (
    <div>
      <div className="page-header"><div><div className="page-title">{t.exportTitle}</div><div className="page-sub">{t.exportSub}</div></div></div>
      <div className="grid2" style={{ gap: 20, maxWidth: 700 }}>
        <div className="card">
          <div className="card-title">{t.entryLog}</div>
          <div className="small text-muted mb16">{t.entryLogDesc}</div>
          <button className="btn btn-primary btn-full" disabled={busy === "entries"} onClick={exportEntries}>{busy === "entries" ? t.downloading : t.downloadEntryLog}</button>
        </div>
        <div className="card">
          <div className="card-title">{t.revenueSummaryTitle}</div>
          <div className="small text-muted mb16">{t.revenueSummaryDesc}</div>
          <button className="btn btn-primary btn-full" disabled={busy === "revenue"} onClick={exportRevenue}>{busy === "revenue" ? t.downloading : t.downloadRevenue}</button>
        </div>
      </div>
      {msg && <div className="notice mt16" style={{ maxWidth: 700 }}>{msg}</div>}
      <div className="notice mt16" style={{ maxWidth: 700 }}>{t.exportTip}</div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SETTINGS PAGE
// ─────────────────────────────────────────────
function SettingsPage() {
  const t = useLang();
  const { tiers, setTiers, cardOptions, setCardOptions, lessonTypes, setLessonTypes, groupClasses, setGroupClasses } = useConfig();
  const [savedSection, setSavedSection] = useState("");
  const [localTiers,   setLocalTiers]   = useState(() => JSON.parse(JSON.stringify(tiers)));
  const [localCards,   setLocalCards]   = useState(() => JSON.parse(JSON.stringify(cardOptions)));
  const [localLessons, setLocalLessons] = useState(() => JSON.parse(JSON.stringify(lessonTypes)));
  const [localClasses, setLocalClasses] = useState(() => [...groupClasses]);

  const flash = (s) => { setSavedSection(s); setTimeout(() => setSavedSection(""), 2000); };

  // Tiers
  const updateTier  = (i, k, v) => { const n = [...localTiers]; n[i] = { ...n[i], [k]: k === "label" ? v : Number(v) }; setLocalTiers(n); };
  const removeTier  = (i) => setLocalTiers(localTiers.filter((_, j) => j !== i));
  const addTier     = () => setLocalTiers([...localTiers, { id: `tier${Date.now()}`, label: "New Tier", entriesPerWeek: 3, monthlyPrice: 60 }]);
  const saveTiers   = () => { setTiers(localTiers); flash("tiers"); };

  // Cards
  const updateCard  = (i, k, v) => { const n = [...localCards]; n[i] = { ...n[i], [k]: k === "label" ? v : Number(v) }; setLocalCards(n); };
  const removeCard  = (i) => setLocalCards(localCards.filter((_, j) => j !== i));
  const addCard     = () => setLocalCards([...localCards, { id: `card${Date.now()}`, label: "New Card", punches: 10, price: 80 }]);
  const saveCards   = () => { setCardOptions(localCards); flash("cards"); };

  // Lesson types
  const updateLesson  = (i, k, v) => { const n = [...localLessons]; n[i] = { ...n[i], [k]: k === "label" ? v : Number(v) }; setLocalLessons(n); };
  const saveLessons   = () => { setLessonTypes(localLessons); flash("lessons"); };

  // Group classes
  const updateClass  = (i, v) => { const n = [...localClasses]; n[i] = v; setLocalClasses(n); };
  const removeClass  = (i) => setLocalClasses(localClasses.filter((_, j) => j !== i));
  const addCls       = () => setLocalClasses([...localClasses, ""]);
  const saveClasses  = () => { setGroupClasses(localClasses.filter(c => c.trim())); flash("classes"); };

  const inputStyle = { background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 8px", color: "var(--text)", fontFamily: "var(--font-body)", fontSize: 12, outline: "none", width: "100%" };
  const SaveBtn = ({ section, onSave, label }) => (
    <button className="btn btn-primary" style={{ fontSize: 12, padding: "6px 14px" }} onClick={onSave}>
      {savedSection === section ? t.saved : label}
    </button>
  );

  return (
    <div>
      <div className="page-header"><div><div className="page-title">{t.settingsTitle}</div><div className="page-sub">{t.settingsSub}</div></div></div>
      <div className="grid2" style={{ gap: 20 }}>

        {/* Membership Tiers */}
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
            <div className="card-title" style={{ margin: 0 }}>{t.membershipTiers}</div>
            <SaveBtn section="tiers" onSave={saveTiers} label={t.saveTiers} />
          </div>
          {localTiers.map((tier, i) => (
            <div key={tier.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 28px", gap: 6, marginBottom: 8, alignItems: "center" }}>
              <input style={inputStyle} value={tier.label} onChange={e => updateTier(i, "label", e.target.value)} placeholder={t.labelCol} />
              <input style={inputStyle} type="number" value={tier.entriesPerWeek} onChange={e => updateTier(i, "entriesPerWeek", e.target.value)} placeholder={t.sessionsWk} min={1} />
              <input style={inputStyle} type="number" value={tier.monthlyPrice} onChange={e => updateTier(i, "monthlyPrice", e.target.value)} placeholder={t.priceCol} min={0} />
              <button onClick={() => removeTier(i)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 28px", gap: 6, marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "var(--muted)", paddingLeft: 2 }}>{t.labelCol}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", paddingLeft: 2 }}>{t.sessionsWk}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", paddingLeft: 2 }}>{t.priceCol}</div>
            <div />
          </div>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 12px" }} onClick={addTier}>{t.addTier}</button>
        </div>

        {/* Punch Card Options */}
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
            <div className="card-title" style={{ margin: 0 }}>{t.punchCardOptions}</div>
            <SaveBtn section="cards" onSave={saveCards} label={t.saveCards} />
          </div>
          {localCards.map((card, i) => (
            <div key={card.id} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 28px", gap: 6, marginBottom: 8, alignItems: "center" }}>
              <input style={inputStyle} value={card.label} onChange={e => updateCard(i, "label", e.target.value)} placeholder={t.labelCol} />
              <input style={inputStyle} type="number" value={card.punches} onChange={e => updateCard(i, "punches", e.target.value)} placeholder={t.punchesCol} min={1} />
              <input style={inputStyle} type="number" value={card.price} onChange={e => updateCard(i, "price", e.target.value)} placeholder={t.priceCol} min={0} />
              <button onClick={() => removeCard(i)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 28px", gap: 6, marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "var(--muted)", paddingLeft: 2 }}>{t.labelCol}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", paddingLeft: 2 }}>{t.punchesCol}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", paddingLeft: 2 }}>{t.priceCol}</div>
            <div />
          </div>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 12px" }} onClick={addCard}>{t.addCard}</button>
        </div>

        {/* Lesson Types */}
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
            <div className="card-title" style={{ margin: 0 }}>{t.lessonRules}</div>
            <SaveBtn section="lessons" onSave={saveLessons} label={t.saveLessons} />
          </div>
          {localLessons.map((l, i) => (
            <div key={l.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 8, marginBottom: 8, alignItems: "center" }}>
              <input style={inputStyle} value={l.label} onChange={e => updateLesson(i, "label", e.target.value)} placeholder={t.labelCol} />
              <input style={inputStyle} type="number" value={l.punchCost} onChange={e => updateLesson(i, "punchCost", e.target.value)} placeholder={t.punchCostCol} min={0} />
            </div>
          ))}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 8, marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: "var(--muted)", paddingLeft: 2 }}>{t.labelCol}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", paddingLeft: 2 }}>{t.punchCostCol}</div>
          </div>
          <div className="notice-warn" style={{ marginTop: 8, marginBottom: 0, fontSize: 11 }}>Punch cost = 0 means the lesson uses a weekly membership session instead.</div>
        </div>

        {/* Group Class Types */}
        <div className="card">
          <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
            <div className="card-title" style={{ margin: 0 }}>{t.groupClassesLabel}</div>
            <SaveBtn section="classes" onSave={saveClasses} label={t.saveClasses} />
          </div>
          {localClasses.map((cls, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 28px", gap: 6, marginBottom: 8, alignItems: "center" }}>
              <input style={inputStyle} value={cls} onChange={e => updateClass(i, e.target.value)} />
              <button onClick={() => removeClass(i)} style={{ background: "none", border: "none", color: "var(--red)", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
          ))}
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "5px 12px" }} onClick={addCls}>{t.addClass}</button>
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STUDENT DETAIL MODAL
// ─────────────────────────────────────────────
function StudentDetailModal({ student, onClose, processEntry, logLesson, addPunches, setMembership, removeMembership, correctEntry, adjustPunchBalance, deleteStudent, sendWelcomeEmail }) {
  const t = useLang();
  const { lessonTypes, groupClasses, tiers, cardOptions } = useConfig();
  const [tab, setTab]               = useState("overview");
  const [result, setResult]         = useState(null);
  const [lessonType, setLessonType] = useState("group");
  const [cls, setCls]               = useState(groupClasses[0] || "");
  const [isGuest, setIsGuest]       = useState(false);
  const [guestName, setGuestName]   = useState("");
  const [cardId, setCardId] = useState(() => cardOptions[0]?.id || "");
  // If cardOptions changed since mount (Settings edit), reset to first valid option
  const validCardId = cardOptions.find(o => o.id === cardId) ? cardId : (cardOptions[0]?.id || "");
  const [newTier, setNewTier]       = useState(student?.membership?.tierId || tiers[0]?.id || "");
  const [msg, setMsg]               = useState("");
  const [busy, setBusy]             = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const flash = m => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  if (!student) return null;
  const tier  = student.membership ? getTier(student.membership.tierId, tiers) : null;
  const used  = student.membership?.activeWeekEntries || 0;
  const limit = tier?.entriesPerWeek || 0;
  const pct   = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const lt    = lessonTypes.find(l => l.id === lessonType);

  const [manualBalance, setManualBalance] = useState("");
  const [correctionNote, setCorrectionNote] = useState("");
  const tabKeys = ["overview", "qr code", "entry", "lessons", "billing", "history", "corrections"];
  const tabLabels = { "overview": t.overview, "qr code": t.qrCode, "entry": t.entry, "lessons": t.lessons, "billing": t.billing, "history": t.history, "corrections": "⚠ Correct" };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="avatar" style={{ width: 44, height: 44, fontSize: 14 }}>{student.avatar}</div>
            <div><div className="modal-title">{student.name}</div><div className="small text-muted">{student.email} · {t.joinedDate(fmt(student.joinDate))}</div></div>
          </div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="tabs">
          {tabKeys.map(k => (
            <div key={k} className={`tab ${tab === k ? "active" : ""}`} onClick={() => setTab(k)} style={{ textTransform: "capitalize" }}>{tabLabels[k]}</div>
          ))}
        </div>

        {msg && <div className="notice mb16">{msg}</div>}

        {tab === "overview" && (<>
          <div className="grid2">
            <div>
              <div className="section-label">{t.membershipLabel}</div>
              {tier ? (<><span className="badge badge-green" style={{ fontSize: 13, padding: "4px 12px" }}>{tier.label}</span><div className="small text-muted mt8">{t.sessionsThisWeekShort(used, limit)}</div><div className="progress-bar mt8"><div className={`progress-fill ${pct >= 100 ? "fill-red" : "fill-green"}`} style={{ width: `${pct}%` }} /></div></>) : <span className="badge badge-gray">{t.noMembershipBadge}</span>}
            </div>
            <div>
              <div className="section-label">{t.punchCard}</div>
              {student.punchCard ? <div style={{ fontSize: 28, fontFamily: "var(--font-head)" }}>{student.punchCard.balance}<span className="small text-muted"> {t.punches2}</span></div> : <span className="badge badge-gray">{t.noPunchCard}</span>}
            </div>
          </div>
          {student.notes && <div className="notice mt16">📝 {student.notes}</div>}
          <div className="separator" />
          <div className="section-label">{t.entryLogic}</div>
          <div className="small text-muted">
            {tier && student.punchCard ? t.bothPlansActive(used, limit)
              : tier ? t.membershipOnly(limit - used)
              : student.punchCard ? t.punchCardOnly(student.punchCard.balance)
              : t.noPlanDenied}
          </div>
          <div className="separator" />
          {student.email && (
            <button
              className="btn btn-ghost"
              style={{ fontSize: 12, marginBottom: 8 }}
              disabled={emailBusy}
              onClick={async () => {
                if (!sendWelcomeEmail) return;
                setEmailBusy(true); setEmailStatus(null);
                try {
                  await sendWelcomeEmail(student, student.membership?.tierId, student.punchCard ? "existing" : null);
                  setEmailStatus("sent");
                } catch(e) { setEmailStatus("error"); console.error(e); }
                finally { setEmailBusy(false); }
              }}
            >
              {emailBusy ? "⏳ Sending…" : emailStatus === "sent" ? "✅ Email sent!" : emailStatus === "error" ? "❌ Failed — retry?" : "✉ Send Welcome Email"}
            </button>
          )}
          {!confirmDelete
            ? <button className="btn btn-danger" style={{ fontSize: 12 }} onClick={() => setConfirmDelete(true)}>{t.deleteStudent}</button>
            : <div className="notice-err">
                <div className="bold" style={{ marginBottom: 6 }}>{t.deleteConfirmTitle}</div>
                <div style={{ fontSize: 12, marginBottom: 12 }}>{t.deleteConfirmText(student.name)}</div>
                <div className="row gap8">
                  <button className="btn btn-danger" disabled={busy} onClick={async () => { setBusy(true); await deleteStudent(student.id); }}>{busy ? t.deleting : t.deleteConfirm}</button>
                  <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>{t.cancel}</button>
                </div>
              </div>
          }
        </>)}

        {tab === "qr code" && (<>
          <div className="notice">{t.qrNotice}</div>
          <div className="qr-card" id={`qr-card-${student.id}`}>
            <QRCode clientId={student.id} size={200} fg="#e4eaf4" bg="#191f2e" />
            <div className="qr-name">{student.name}</div>
            <div className="qr-id">ID: {student.id}</div>
          </div>
          <div className="row gap8 mt16" style={{ justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-primary btn-sm" onClick={() => downloadQRPng(student)}>⬇ Download PNG</button>
            <button className="btn btn-ghost btn-sm" style={{ borderColor: "#555", color: "#fff" }} onClick={() => downloadWalletCard(student)}>🍎 Apple Wallet Card</button>
            <button className="btn btn-ghost btn-sm" style={{ borderColor: "#4285f4", color: "#4285f4" }} onClick={() => downloadWalletCard(student)}>G Google Wallet Card</button>
          </div>
          <div className="notice mt12" style={{ marginBottom: 0, fontSize: 11 }}>
            PNG: email it to the student. Wallet Card: send the downloaded image — student opens it and taps "Add to Wallet" from Photos.
          </div>
        </>)}

        {tab === "entry" && (<>
          <div className="notice">{t.membershipFirst}</div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 16 }}>
            <input type="checkbox" checked={isGuest} onChange={e => setIsGuest(e.target.checked)} />
            <span className="small">{t.guestEntryCheck}</span>
          </label>
          {isGuest && <div className="field"><label>{t.guestName}</label><input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder={t.guestNamePlaceholder} /></div>}
          <button className="btn btn-primary btn-full" disabled={busy} onClick={async () => { setBusy(true); setResult(await processEntry(student.id, isGuest, guestName)); setBusy(false); }}>{busy ? t.processing : t.processEntryBtn}</button>
          {result && <div className={`entry-result mt16 ${result.allowed ? "entry-allowed" : "entry-denied"}`}><div className="entry-icon">{result.allowed ? "✓" : "✗"}</div><div className="entry-msg" style={{ color: result.allowed ? "var(--green)" : "var(--red)" }}>{result.message}</div><div className="entry-detail">{result.detail}</div></div>}
        </>)}

        {tab === "lessons" && (<>
          {!student.punchCard && !student.membership && <div className="notice-warn">{t.studentNeedsPunchCard}</div>}
          <div className="grid2" style={{ marginBottom: 12 }}>
            {lessonTypes.map(l => <div key={l.id} className={`opt-card ${lessonType === l.id ? "selected" : ""}`} onClick={() => setLessonType(l.id)}><div className="opt-card-label">{l.label}</div><div className="opt-card-sub">{l.punchCost} {l.punchCost > 1 ? t.punches2 : t.punch}</div></div>)}
          </div>
          {lessonType === "group" && <div className="field"><label>{t.class}</label><select value={cls} onChange={e => setCls(e.target.value)}>{groupClasses.map(g => <option key={g}>{g}</option>)}</select></div>}
          {student.punchCard && lt && <div className={student.punchCard.balance >= lt.punchCost ? "notice" : "notice-warn"} style={{ marginBottom: 12 }}>{student.punchCard.balance >= lt.punchCost ? t.punchesAvailable(student.punchCard.balance, student.name) : t.notEnoughPunches(lt.punchCost, student.punchCard.balance)}</div>}
          <button className="btn btn-primary btn-full" disabled={(!student.punchCard && !student.membership) || busy} onClick={async () => { setBusy(true); const r = await logLesson(student.id, lessonType, lessonType === "group" ? cls : ""); flash(r.ok ? t.lessonRecorded : `✗ ${r.msg}`); setBusy(false); }}>{busy ? t.saving : t.logLessonBtn}</button>
        </>)}

        {tab === "billing" && (<>
          <div className="section-label">{t.loadPunchCard}</div>
          <div className="grid3" style={{ marginBottom: 16 }}>{cardOptions.map(o => <div key={o.id} className={`opt-card ${validCardId === o.id ? "selected" : ""}`} onClick={() => setCardId(o.id)}><div className="opt-card-label">{o.punches}p</div><div className="opt-card-sub">{CURRENCY}{o.price}</div></div>)}</div>
          <button className="btn btn-primary btn-full mb16" disabled={busy} onClick={async () => { setBusy(true); await addPunches(student.id, validCardId); flash(t.punchesLoaded); setBusy(false); }}>{busy ? t.saving : t.loadPunches}</button>
          <div className="separator" />
          <div className="section-label">{t.membershipTier}</div>
          {tiers.map(tier => <div key={tier.id} className={`opt-card ${newTier === tier.id ? "selected" : ""}`} style={{ marginBottom: 8 }} onClick={() => setNewTier(tier.id)}><div className="opt-card-label">{tier.label} — {t.sessionsPerWeek(tier.entriesPerWeek)}</div><div className="opt-card-sub">{CURRENCY}{tier.monthlyPrice}{t.mo}</div></div>)}
          <div className="row gap8 mt16">
            <button className="btn btn-primary" disabled={busy} onClick={async () => { setBusy(true); await setMembership(student.id, newTier); flash(t.membershipUpdated); setBusy(false); }}>{t.updateMembership}</button>
            {student.membership && <button className="btn btn-danger" onClick={async () => { await removeMembership(student.id); flash(t.membershipRemoved); }}>{t.removeMembership}</button>}
          </div>
        </>)}

        {tab === "history" && (<>
          <div className="section-label">{t.entryLogTab}</div>
          <div className="timeline" style={{ marginBottom: 20 }}>
            {student.entryLog.length === 0 && <div className="text-muted small">{t.noEntriesYet}</div>}
            {student.entryLog.slice(0, 15).map((e, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-dot" style={{ background: e.method === "denied" ? "var(--red)" : e.method === "membership" ? "var(--green)" : "var(--accent)" }} />
                <div className="timeline-info"><div className="timeline-title">{e.note}{e.guest ? t.guestLabel(e.guestName) : ""}</div><div className="timeline-time">{fmt(e.ts)} · {fmtTime(e.ts)}</div></div>
                <span className={`badge ${e.method === "denied" ? "badge-red" : "badge-green"}`}>{e.method}</span>
              </div>
            ))}
          </div>
          <div className="section-label">{t.punchCardHistory}</div>
          <div className="timeline">
            {student.punchHistory?.length === 0 && <div className="text-muted small">{t.noPunchActivity}</div>}
            {student.punchHistory?.slice(0, 15).map((h, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-dot" style={{ background: h.delta > 0 ? "var(--green)" : "var(--accent)" }} />
                <div className="timeline-info"><div className="timeline-title">{h.note}</div><div className="timeline-time">{fmt(h.ts)} · {fmtTime(h.ts)}</div></div>
                <span className={`badge ${h.delta > 0 ? "badge-green" : "badge-blue"}`}>{h.delta > 0 ? "+" : ""}{h.delta}p</span>
              </div>
            ))}
          </div>
        </>)}

        {tab === "corrections" && (<>
          <div className="notice-warn" style={{ marginBottom: 16 }}>Use this tab to reverse accidental scans or manually fix balances. Each action is logged.</div>

          <div className="section-label" style={{ marginBottom: 10 }}>Reverse a Recent Entry</div>
          {student.entryLog.length === 0 && <div className="text-muted small" style={{ marginBottom: 16 }}>No entries to reverse.</div>}
          {student.entryLog.slice(0, 10).map((e, i) => (
            <div key={i} className="timeline-item" style={{ marginBottom: 8, padding: "10px 12px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)" }}>
              <div className="timeline-dot" style={{ background: e.method === "denied" ? "var(--red)" : e.method === "membership" ? "var(--green)" : "var(--accent)", flexShrink: 0 }} />
              <div className="timeline-info" style={{ flex: 1 }}>
                <div className="timeline-title" style={{ fontSize: 12 }}>{e.note}{e.guest ? t.guestLabel(e.guestName) : ""}</div>
                <div className="timeline-time">{fmt(e.ts)} · {fmtTime(e.ts)}</div>
              </div>
              <span className={`badge ${e.method === "denied" ? "badge-red" : e.method === "membership" ? "badge-green" : "badge-blue"}`} style={{ marginRight: 8, flexShrink: 0 }}>{e.method}</span>
              {e.method !== "denied" && e.id && (
                <button
                  className="btn btn-danger btn-sm"
                  style={{ flexShrink: 0, fontSize: 11 }}
                  disabled={busy}
                  onClick={async () => {
                    if (!window.confirm(`Reverse this ${e.method} entry from ${fmtTime(e.ts)}? This will restore the ${e.method === "membership" ? "weekly session count" : "punch balance"}.`)) return;
                    setBusy(true);
                    await correctEntry(student.id, e.id, e.method);
                    flash("✓ Entry reversed.");
                    setBusy(false);
                  }}
                >↩ Undo</button>
              )}
            </div>
          ))}

          <div className="separator" style={{ margin: "20px 0" }} />

          <div className="section-label" style={{ marginBottom: 10 }}>Set Punch Balance Directly</div>
          <div className="notice" style={{ marginBottom: 12 }}>
            Current balance: <strong style={{ color: "var(--accent)" }}>{student.punchCard?.balance ?? "—"} punches</strong>
          </div>
          <div className="row gap8" style={{ alignItems: "flex-end" }}>
            <div className="field" style={{ marginBottom: 0, flex: 1 }}>
              <label>New Balance</label>
              <input type="number" min="0" value={manualBalance} onChange={e => setManualBalance(e.target.value)} placeholder="e.g. 8" />
            </div>
            <div className="field" style={{ marginBottom: 0, flex: 2 }}>
              <label>Reason (optional)</label>
              <input value={correctionNote} onChange={e => setCorrectionNote(e.target.value)} placeholder="e.g. Double-scanned on Monday" />
            </div>
            <button
              className="btn btn-primary"
              disabled={busy || manualBalance === "" || !student.punchCard}
              onClick={async () => {
                const val = parseInt(manualBalance, 10);
                if (isNaN(val) || val < 0) return;
                setBusy(true);
                await adjustPunchBalance(student.id, val, correctionNote || "Manual balance correction");
                setManualBalance("");
                setCorrectionNote("");
                flash("✓ Balance updated.");
                setBusy(false);
              }}
            >Set Balance</button>
          </div>
          {!student.punchCard && <div className="text-muted small" style={{ marginTop: 8 }}>Student has no punch card — load one from the Billing tab first.</div>}

          {msg && <div className="notice" style={{ marginTop: 16 }}>{msg}</div>}
        </>)}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ADD STUDENT MODAL
// ─────────────────────────────────────────────
function AddStudentModal({ onClose, onAdd }) {
  const t = useLang();
  const { tiers, cardOptions } = useConfig();
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [phone, setPhone]   = useState("");
  const [notes, setNotes]   = useState("");
  const [hasM, setHasM]     = useState(false);
  const [tierId, setTierId] = useState(tiers[0]?.id || "");
  const [hasP, setHasP]     = useState(false);
  const [cardId, setCardId] = useState(cardOptions[0]?.id || "");
  const [err, setErr]       = useState("");
  const [busy, setBusy]     = useState(false);

  async function submit() {
    if (!name.trim() || !email.trim()) { setErr(t.nameEmailRequired); return; }
    setBusy(true);
    try { await onAdd({ name: name.trim(), email: email.trim(), phone, notes }, hasM ? tierId : null, hasP ? cardId : null); }
    catch (e) { setErr(e.message); setBusy(false); }
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><div className="modal-title">{t.addNewStudent}</div><button className="close-btn" onClick={onClose}>×</button></div>
        <div className="grid2">
          <div className="field"><label>{t.fullName}</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" /></div>
          <div className="field"><label>{t.email}</label><input value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@email.com" /></div>
        </div>
        <div className="field"><label>{t.phone}</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+351 912 345 678" /></div>
        <div className="field"><label>{t.notes}</label><textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder={t.notesPlaceholder} /></div>
        <div className="separator" />
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 12 }}>
          <input type="checkbox" checked={hasM} onChange={e => setHasM(e.target.checked)} /><span className="bold">{t.addMonthlyMembership}</span>
        </label>
        {hasM && <div style={{ marginBottom: 16 }}>{tiers.map(tier => <div key={tier.id} className={`opt-card ${tierId === tier.id ? "selected" : ""}`} style={{ marginBottom: 6 }} onClick={() => setTierId(tier.id)}><div className="opt-card-label">{tier.label} — {t.sessionsPerWeek(tier.entriesPerWeek)}</div><div className="opt-card-sub">{CURRENCY}{tier.monthlyPrice}{t.mo}</div></div>)}</div>}
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 12 }}>
          <input type="checkbox" checked={hasP} onChange={e => setHasP(e.target.checked)} /><span className="bold">{t.addPunchCard}</span>
        </label>
        {hasP && <div className="grid3" style={{ marginBottom: 16 }}>{cardOptions.map(o => <div key={o.id} className={`opt-card ${cardId === o.id ? "selected" : ""}`} onClick={() => setCardId(o.id)}><div className="opt-card-label">{o.punches} {t.punches2}</div><div className="opt-card-sub">{CURRENCY}{o.price}</div></div>)}</div>}
        {err && <div className="err mb16">{err}</div>}
        <div className="row gap8">
          <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? t.creating : t.createStudent}</button>
          <button className="btn btn-ghost" onClick={onClose}>{t.cancel}</button>
        </div>
      </div>
    </div>
  );
}
