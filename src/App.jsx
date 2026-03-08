import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
const APP_V = "6";
import { supabase } from "./supabase.js";
import QRCodeLib from "qrcode";

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
  const load = (key, def) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; } };
  const [tiers,        setTiersRaw]   = useState(() => load("st_tiers",   DEFAULT_MEMBERSHIP_TIERS));
  const [cardOptions,  setCardsRaw]   = useState(() => load("st_cards",   DEFAULT_PUNCH_CARD_OPTIONS));
  const [lessonTypes,  setLessonsRaw] = useState(() => load("st_lessons", DEFAULT_LESSON_TYPES));
  const [groupClasses, setClassesRaw] = useState(() => load("st_classes", DEFAULT_GROUP_CLASSES));

  const save = (key, val, setter) => { localStorage.setItem(key, JSON.stringify(val)); setter(val); };
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
  const now  = new Date();
  const diff = now.getDate() - now.getDay();
  const mon  = new Date(now.setDate(diff));
  mon.setHours(0, 0, 0, 0);
  return mon.toISOString();
}
function isNewWeek(ws)  { return ws ? new Date(ws) < new Date(getWeekStart()) : true; }
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
  async logEntry(studentId, method, note, isGuest = false, guestName = "") {
    await supabase.from("entry_log").insert({ student_id: studentId, method, note, is_guest: isGuest, guest_name: guestName });
  },

  // ── LESSONS ───────────────────────────────
  async logLesson(studentId, lessonType, label, className, punchCost) {
    await supabase.from("lesson_log").insert({ student_id: studentId, lesson_type: lessonType, label, class_name: className, punch_cost: punchCost });
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
    entryLog: (row.entry_log || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(e => ({ ts: e.created_at, method: e.method, note: e.note, guest: e.is_guest, guestName: e.guest_name })),
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
    --bg: #0a0e12; --surface: #111620; --surface2: #191f2e; --border: #252d40;
    --accent: #38c8e8; --gold: #f0a040; --red: #f05060; --green: #40d090;
    --text: #e4eaf4; --muted: #6a7890; --radius: 12px;
    --font-head: 'Playfair Display', serif; --font-body: 'Outfit', sans-serif;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font-body); font-size: 14px; line-height: 1.5; }
  .app { display: flex; height: 100vh; overflow: hidden; }

  .login-wrap { display: flex; align-items: center; justify-content: center; height: 100vh; background: var(--bg); background-image: radial-gradient(ellipse at 20% 50%, rgba(56,200,232,.08) 0%, transparent 60%); }
  .login-card { background: var(--surface); border: 1px solid var(--border); border-radius: 20px; padding: 48px 44px; width: 400px; }
  .login-logo { font-family: var(--font-head); font-size: 24px; color: var(--accent); margin-bottom: 4px; }
  .login-sub  { color: var(--muted); margin-bottom: 36px; font-size: 13px; }

  .field { margin-bottom: 16px; }
  .field label { display: block; font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 6px; }
  .field input { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 11px 14px; color: var(--text); font-family: var(--font-body); font-size: 14px; outline: none; transition: border .2s; }
  .field input:focus { border-color: var(--accent); }

  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 8px; border: none; cursor: pointer; font-family: var(--font-body); font-size: 13px; font-weight: 600; transition: all .15s; }
  .btn-primary { background: var(--accent); color: #0a0e12; }
  .btn-primary:hover { filter: brightness(1.1); }
  .btn-primary:disabled { opacity: .4; cursor: not-allowed; }
  .btn-ghost  { background: transparent; color: var(--muted); border: 1px solid var(--border); }
  .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
  .btn-danger { background: var(--red); color: #fff; }
  .btn-sm   { padding: 6px 12px; font-size: 12px; }
  .btn-full { width: 100%; justify-content: center; }
  .err { color: var(--red); font-size: 12px; margin-top: 8px; }

  .sidebar { width: 236px; min-width: 236px; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 24px 0; }
  .sidebar-logo { font-family: var(--font-head); font-size: 17px; color: var(--accent); padding: 0 20px 24px; border-bottom: 1px solid var(--border); line-height: 1.3; }
  .sidebar-logo span { font-size: 11px; font-family: var(--font-body); color: var(--muted); display: block; margin-top: 4px; }
  .nav { flex: 1; padding: 16px 0; }
  .nav-item { display: flex; align-items: center; gap: 10px; padding: 10px 20px; color: var(--muted); cursor: pointer; transition: all .15s; font-size: 13px; font-weight: 500; border-left: 2px solid transparent; }
  .nav-item:hover { color: var(--text); background: var(--surface2); }
  .nav-item.active { color: var(--accent); border-left-color: var(--accent); background: rgba(56,200,232,.06); }
  .nav-section { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); padding: 16px 20px 6px; }
  .sidebar-user { padding: 16px 20px; border-top: 1px solid var(--border); font-size: 12px; color: var(--muted); }
  .sidebar-user strong { color: var(--text); display: block; margin-bottom: 2px; }

  .main { flex: 1; overflow-y: auto; padding: 32px; background: var(--bg); }
  .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
  .page-title { font-family: var(--font-head); font-size: 28px; }
  .page-sub   { color: var(--muted); font-size: 13px; margin-top: 2px; }

  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
  .card-title { font-weight: 600; font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .1em; margin-bottom: 14px; }

  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
  .stat { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; }
  .stat-val   { font-family: var(--font-head); font-size: 30px; }
  .stat-label { font-size: 12px; color: var(--muted); margin-top: 4px; }
  .stat-t1 { border-top: 2px solid var(--accent); }
  .stat-t2 { border-top: 2px solid var(--gold); }
  .stat-t3 { border-top: 2px solid var(--green); }
  .stat-t4 { border-top: 2px solid var(--red); }

  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--muted); padding: 10px 12px; border-bottom: 1px solid var(--border); }
  td { padding: 12px; border-bottom: 1px solid var(--border); font-size: 13px; vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(255,255,255,.02); }
  .avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--accent); color: #0a0e12; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
  .name-cell { display: flex; align-items: center; gap: 10px; }

  .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 600; }
  .badge-green { background: rgba(64,208,144,.15); color: var(--green); }
  .badge-blue  { background: rgba(56,200,232,.15); color: var(--accent); }
  .badge-red   { background: rgba(240,80,96,.15);  color: var(--red); }
  .badge-gold  { background: rgba(240,160,64,.15); color: var(--gold); }
  .badge-gray  { background: var(--surface2); color: var(--muted); }

  .progress-bar { height: 5px; background: var(--surface2); border-radius: 3px; overflow: hidden; margin-top: 4px; }
  .progress-fill { height: 100%; border-radius: 3px; transition: width .3s; }
  .fill-green { background: var(--green); } .fill-red { background: var(--red); } .fill-gold { background: var(--gold); }

  .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.72); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(4px); }
  .modal { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 32px; width: 560px; max-height: 88vh; overflow-y: auto; }
  .modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
  .modal-title { font-family: var(--font-head); font-size: 22px; }
  .close-btn { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 22px; line-height: 1; }
  .close-btn:hover { color: var(--text); }

  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }

  .opt-card { background: var(--surface2); border: 2px solid var(--border); border-radius: 10px; padding: 14px; cursor: pointer; transition: all .15s; }
  .opt-card:hover { border-color: var(--muted); }
  .opt-card.selected { border-color: var(--accent); background: rgba(56,200,232,.07); }
  .opt-card-label { font-weight: 600; font-size: 13px; }
  .opt-card-sub   { font-size: 11px; color: var(--muted); margin-top: 3px; }

  .tabs { display: flex; gap: 4px; background: var(--surface2); padding: 4px; border-radius: 10px; margin-bottom: 24px; }
  .tab { flex: 1; text-align: center; padding: 8px; border-radius: 7px; cursor: pointer; font-size: 11px; font-weight: 600; color: var(--muted); transition: all .15s; }
  .tab.active { background: var(--surface); color: var(--text); }

  .timeline { display: flex; flex-direction: column; gap: 8px; }
  .timeline-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; background: var(--surface2); border-radius: 8px; }
  .timeline-dot  { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
  .timeline-info { flex: 1; }
  .timeline-title { font-size: 13px; font-weight: 500; }
  .timeline-time  { font-size: 11px; color: var(--muted); }

  .entry-result   { padding: 24px 20px; border-radius: 12px; text-align: center; margin-top: 16px; }
  .entry-allowed  { background: rgba(64,208,144,.1); border: 1px solid rgba(64,208,144,.3); }
  .entry-denied   { background: rgba(240,80,96,.1);  border: 1px solid rgba(240,80,96,.3); }
  .entry-icon     { font-size: 40px; margin-bottom: 8px; }
  .entry-msg      { font-family: var(--font-head); font-size: 22px; }
  .entry-detail   { font-size: 12px; color: var(--muted); margin-top: 6px; }

  .search-bar { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 9px 14px; color: var(--text); font-family: var(--font-body); font-size: 13px; outline: none; width: 240px; }
  .search-bar:focus { border-color: var(--accent); }

  .qr-card { background: var(--surface2); border: 1px solid var(--border); border-radius: 14px; padding: 24px; text-align: center; max-width: 260px; margin: 0 auto; }
  .qr-name { font-weight: 700; margin-top: 14px; font-size: 15px; }
  .qr-id   { font-size: 10px; color: var(--muted); font-family: monospace; margin-top: 3px; }

  .scanner-wrap    { position: relative; width: 100%; border-radius: 12px; overflow: hidden; background: #000; aspect-ratio: 1; max-height: 320px; }
  .scanner-wrap video { width: 100%; height: 100%; object-fit: cover; display: block; }
  .scanner-overlay { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; }
  .scanner-frame   { width: 58%; aspect-ratio: 1; border: 2px solid var(--accent); border-radius: 10px; box-shadow: 0 0 0 9999px rgba(0,0,0,.55); position: relative; }
  .scanner-line    { width: 54%; height: 2px; background: linear-gradient(90deg, transparent, var(--accent), transparent); position: absolute; animation: scanline 2s ease-in-out infinite; }
  @keyframes scanline { 0%,100% { top: 22%; } 50% { top: 76%; } }

  .loading { display: flex; align-items: center; justify-content: center; height: 100vh; font-family: var(--font-head); font-size: 22px; color: var(--muted); gap: 12px; }
  .spinner { width: 20px; height: 20px; border: 2px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin .8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .lang-toggle { display: flex; align-items: center; gap: 4px; background: var(--surface2); border: 1px solid var(--border); border-radius: 20px; padding: 3px; margin: 0 20px 12px; }
  .lang-btn { flex: 1; text-align: center; padding: 5px 8px; border-radius: 16px; cursor: pointer; font-size: 11px; font-weight: 700; color: var(--muted); transition: all .15s; letter-spacing: .04em; border: none; background: transparent; font-family: var(--font-body); }
  .lang-btn.active { background: var(--accent); color: #0a0e12; }
  .lang-btn:hover:not(.active) { color: var(--text); } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  select { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 9px 14px; color: var(--text); font-family: var(--font-body); font-size: 13px; outline: none; width: 100%; cursor: pointer; }
  select:focus { border-color: var(--accent); }
  textarea { background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; color: var(--text); font-family: var(--font-body); font-size: 13px; outline: none; width: 100%; resize: vertical; }
  textarea:focus { border-color: var(--accent); }
  .separator   { height: 1px; background: var(--border); margin: 20px 0; }
  .row         { display: flex; gap: 12px; align-items: center; }
  .chip        { background: var(--surface2); border-radius: 20px; padding: 3px 9px; font-size: 11px; color: var(--muted); }
  .section-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: var(--muted); margin-bottom: 10px; }
  .text-accent { color: var(--accent); } .text-red { color: var(--red); } .text-muted { color: var(--muted); } .text-gold { color: var(--gold); } .text-green { color: var(--green); }
  .mt8 { margin-top: 8px; } .mt16 { margin-top: 16px; } .mb16 { margin-bottom: 16px; }
  .flex { display: flex; } .items-center { align-items: center; } .justify-between { justify-content: space-between; }
  .gap8 { gap: 8px; } .gap16 { gap: 16px; } .bold { font-weight: 600; } .small { font-size: 12px; }
  .notice      { background: rgba(56,200,232,.08);  border: 1px solid rgba(56,200,232,.2);  border-radius: 8px; padding: 12px 14px; font-size: 12px; color: var(--accent); margin-bottom: 16px; }
  .notice-warn { background: rgba(240,160,64,.08);  border: 1px solid rgba(240,160,64,.2);  border-radius: 8px; padding: 12px 14px; font-size: 12px; color: var(--gold);   margin-bottom: 16px; }
  .notice-err  { background: rgba(240,80,96,.08);   border: 1px solid rgba(240,80,96,.2);   border-radius: 8px; padding: 12px 14px; font-size: 12px; color: var(--red);    margin-bottom: 16px; }
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
  const [dataLoading, setDataLoading] = useState(true);
  const [dataErr, setDataErr]         = useState("");
  const [writeErr, setWriteErr]       = useState("");
  const [lang, setLang]               = useState(() => localStorage.getItem("st_lang") || "en");

  const toggleLang = (l) => { setLang(l); localStorage.setItem("st_lang", l); };

  const load = useCallback(async () => {
    try { setDataLoading(true); setStudents(await db.fetchStudents()); }
    catch (e) { setDataErr(e.message); }
    finally { setDataLoading(false); }
  }, []);

  // Wrap any async fn — catches errors and shows them visibly
  const safe = (fn) => async (...args) => {
    try { setWriteErr(""); return await fn(...args); }
    catch (e) { console.error("[safe]", e); setWriteErr(e?.message || String(e)); }
  };

  useEffect(() => { load(); }, [load]);

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
        await load();
        return { allowed: true, message: "Welcome in! 🏄", detail: `Membership entry ${used + 1}/${limit} this week.` };
      }
    }

    if (student.punchCard?.balance > 0) {
      const newBal = student.punchCard.balance - 1;
      await db.updatePunchBalance(studentId, newBal);
      await db.logPunchHistory(studentId, -1, isGuest ? `Guest: ${guestName}` : "Entry");
      await db.logEntry(studentId, "punchcard", isGuest ? `Guest entry for ${guestName}` : "Punch card entry", isGuest, guestName);
      await load();
      return { allowed: true, message: isGuest ? "Guest Admitted! 🏄" : "Welcome in! 🏄", detail: `Punch card used. ${newBal} punches remaining.` };
    }

    await db.logEntry(studentId, "denied", "No available entries", isGuest, guestName);
    await load();
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
      await load();
      return { ok: true, method: "membership" };
    }

    // Punch card fallback
    if (!student?.punchCard) return { ok: false, msg: "No punch card and no weekly sessions remaining." };
    if (student.punchCard.balance < lt.punchCost) return { ok: false, msg: `Need ${lt.punchCost} punches, have ${student.punchCard.balance}.` };
    const newBal = student.punchCard.balance - lt.punchCost;
    await db.updatePunchBalance(studentId, newBal);
    await db.logPunchHistory(studentId, -lt.punchCost, `${lt.label}${className ? `: ${className}` : ""}`);
    await db.logLesson(studentId, lessonType, lt.label, className, lt.punchCost);
    await load();
    return { ok: true, method: "punch_card" };
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
    await load();
  }

  // ── SET MEMBERSHIP ──
  async function setMembership(studentId, tierId) {
    console.log("[setMembership]", { studentId, tierId });
    await db.upsertMembership(studentId, tierId);
    await load();
  }

  async function removeMembership(studentId) {
    await db.removeMembership(studentId);
    await load();
  }

  // ── DELETE STUDENT ──
  async function deleteStudent(studentId) {
    await supabase.from("punch_card_history").delete().eq("student_id", studentId);
    await supabase.from("lesson_log").delete().eq("student_id", studentId);
    await supabase.from("entry_log").delete().eq("student_id", studentId);
    await supabase.from("punch_cards").delete().eq("student_id", studentId);
    await supabase.from("memberships").delete().eq("student_id", studentId);
    await supabase.from("students").delete().eq("id", studentId);
    await load();
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
    await load();
  }

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  if (dataLoading) return <><style>{css}</style><div className="loading"><div className="spinner" />{T[lang].loadingSchool}</div></>;

  return (
    <LangContext.Provider value={lang}>
      <style>{css}</style>
      <div className="app">
        <Sidebar page={page} setPage={setPage} userEmail={user.email} onLogout={() => supabase.auth.signOut()} lang={lang} toggleLang={toggleLang} />
        <div className="main">
          {dataErr  && <div className="notice-err mb16">{T[lang].dbError(dataErr)} <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={load}>{T[lang].retry}</span></div>}
          {writeErr && <div className="notice-err mb16" style={{ cursor: "pointer" }} onClick={() => setWriteErr("")}>⚠ Write error (tap to dismiss): {writeErr}</div>}
          {page === "dashboard" && <Dashboard students={students} setPage={setPage} setModal={setModal} setSelectedId={setSelectedId} />}
          {page === "students"  && <StudentsPage students={filtered} search={search} setSearch={setSearch} setSelectedId={setSelectedId} setModal={setModal} />}
          {page === "entry"     && <EntryPage students={students} processEntry={safe(processEntry)} />}
          {page === "lessons"   && <LessonsPage students={students} logLesson={safe(logLesson)} />}
          {page === "billing"   && <BillingPage students={students} addPunches={safe(addPunches)} setMembership={safe(setMembership)} removeMembership={safe(removeMembership)} />}
          {page === "export"    && <ExportPage />}
          {page === "settings"  && <SettingsPage />}
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
  const nav = [
    { id: "dashboard", icon: "◈", label: t.dashboard     },
    { id: "students",  icon: "◉", label: t.students      },
    { id: "entry",     icon: "⬡", label: t.entryScanner  },
    { id: "lessons",   icon: "◆", label: t.logLesson     },
    { id: "billing",   icon: "◇", label: t.billing       },
    { id: "export",    icon: "↓", label: t.exportData    },
    { id: "settings",  icon: "⊙", label: t.settings      },
  ];
  return (
    <div className="sidebar">
      <div className="sidebar-logo">🏄 {APP_NAME}<span>{APP_TAGLINE}</span></div>
      <div className="nav">
        <div className="nav-section">{t.menu}</div>
        {nav.map(n => <div key={n.id} className={`nav-item ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}><span>{n.icon}</span>{n.label}</div>)}
      </div>
      <div className="sidebar-user">
        <strong>{userEmail}</strong>
        <div className="lang-toggle">
          <button className={`lang-btn ${lang === "en" ? "active" : ""}`} onClick={() => toggleLang("en")}>EN</button>
          <button className={`lang-btn ${lang === "pt" ? "active" : ""}`} onClick={() => toggleLang("pt")}>PT</button>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onLogout}>{t.signOut}</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────
function Dashboard({ students, setPage, setModal, setSelectedId }) {
  const t       = useLang();
  const { tiers } = useConfig();
  const monthly = students.filter(s => s.membership).length;
  const both    = students.filter(s => s.membership && s.punchCard).length;
  const atLimit = students.filter(s => s.membership && s.membership.activeWeekEntries >= (getTier(s.membership.tierId, tiers)?.entriesPerWeek || 0)).length;
  const recent  = students.flatMap(s => s.entryLog.map(e => ({ ...e, studentName: s.name }))).sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 8);

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
      <div className="grid2" style={{ gap: 20 }}>
        <div className="card">
          <div className="card-title">{t.recentEntries}</div>
          {recent.length === 0 && <div className="text-muted small">{t.noEntries}</div>}
          <div className="timeline">
            {recent.map((e, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-dot" style={{ background: e.method === "denied" ? "var(--red)" : e.method === "membership" ? "var(--green)" : "var(--accent)" }} />
                <div className="timeline-info">
                  <div className="timeline-title">{e.studentName}{e.guest ? <span className="chip" style={{ marginLeft: 6 }}>Guest</span> : null}</div>
                  <div className="timeline-time">{fmt(e.ts)} · {fmtTime(e.ts)} · {e.note}</div>
                </div>
                <span className={`badge ${e.method === "denied" ? "badge-red" : e.method === "membership" ? "badge-green" : "badge-blue"}`}>{e.method}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-title">{t.studentOverview}</div>
          {students.map(s => {
            const tier  = s.membership ? getTier(s.membership.tierId, tiers) : null;
            const used  = s.membership?.activeWeekEntries || 0, limit = tier?.entriesPerWeek || 0;
            const pct   = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
            return (
              <div key={s.id} style={{ marginBottom: 14, cursor: "pointer" }} onClick={() => { setSelectedId(s.id); setModal("studentDetail"); }}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap8"><div className="avatar" style={{ width: 26, height: 26, fontSize: 9 }}>{s.avatar}</div><span className="small bold">{s.name}</span></div>
                  <div className="flex gap8">
                    {tier && <span className="badge badge-green">{tier.label}</span>}
                    {s.punchCard && <span className="badge badge-blue">{s.punchCard.balance}p</span>}
                  </div>
                </div>
                {tier && (<div style={{ marginTop: 4 }}><div className="progress-bar"><div className={`progress-fill ${pct >= 100 ? "fill-red" : pct > 60 ? "fill-gold" : "fill-green"}`} style={{ width: `${pct}%` }} /></div><div className="small text-muted" style={{ marginTop: 2 }}>{t.sessionsThisWeek(used, limit)}</div></div>)}
              </div>
            );
          })}
        </div>
      </div>
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
        const barcodes = await detectorRef.current.detect(video);
        if (barcodes.length > 0) decoded = barcodes[0].rawValue;
      } else {
        // Fallback: draw frame to canvas and read data URL for manual inspection
        // (BarcodeDetector not available — scanning won't work, user must tap name)
      }
      if (decoded) {
        const match = students.find(s => s.id === decoded);
        if (match) {
          scanningRef.current = false;
          cancelAnimationFrame(rafRef.current);
          handleEntry(match.id);
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

  async function handleEntry(studentId) {
    const id = studentId || selected?.id;
    if (!id) return;
    setBusy(true);
    const student = students.find(s => s.id === id);
    const res = await processEntry(id, isGuest, guestName);
    setResult({ ...res, studentName: student?.name });
    setMode("search");
    setBusy(false);
  }

  return (
    <div>
      <div className="page-header"><div><div className="page-title">{t.entryScannerTitle}</div><div className="page-sub">{t.entryScannerSub}</div></div></div>
      <div className="grid2" style={{ gap: 20, maxWidth: 860 }}>
        <div>
          <div className="tabs" style={{ marginBottom: 16 }}>
            <div className={`tab ${mode === "camera" ? "active" : ""}`} onClick={() => { setMode("camera"); setResult(null); }}>{t.cameraScan}</div>
            <div className={`tab ${mode === "search" ? "active" : ""}`} onClick={() => { setMode("search"); setResult(null); }}>{t.searchStudent}</div>
          </div>
          {mode === "camera" && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-title">{t.pointCamera}</div>
              {camErr ? <div className="notice-warn">{camErr}</div> : <>
                <div className="scanner-wrap">
                  <video ref={videoRef} autoPlay playsInline muted />
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
function StudentDetailModal({ student, onClose, processEntry, logLesson, addPunches, setMembership, removeMembership, deleteStudent }) {
  const t = useLang();
  const { lessonTypes, groupClasses, tiers, cardOptions } = useConfig();
  const [tab, setTab]               = useState("overview");
  const [result, setResult]         = useState(null);
  const [lessonType, setLessonType] = useState("group");
  const [cls, setCls]               = useState(groupClasses[0] || "");
  const [isGuest, setIsGuest]       = useState(false);
  const [guestName, setGuestName]   = useState("");
  const [cardId, setCardId]         = useState(cardOptions[0]?.id || "");
  const [newTier, setNewTier]       = useState(student?.membership?.tierId || tiers[0]?.id || "");
  const [msg, setMsg]               = useState("");
  const [busy, setBusy]             = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const flash = m => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  if (!student) return null;
  const tier  = student.membership ? getTier(student.membership.tierId, tiers) : null;
  const used  = student.membership?.activeWeekEntries || 0;
  const limit = tier?.entriesPerWeek || 0;
  const pct   = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const lt    = lessonTypes.find(l => l.id === lessonType);

  const tabKeys = ["overview", "qr code", "entry", "lessons", "billing", "history"];
  const tabLabels = { "overview": t.overview, "qr code": t.qrCode, "entry": t.entry, "lessons": t.lessons, "billing": t.billing, "history": t.history };

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
          <div className="grid3" style={{ marginBottom: 16 }}>{cardOptions.map(o => <div key={o.id} className={`opt-card ${cardId === o.id ? "selected" : ""}`} onClick={() => setCardId(o.id)}><div className="opt-card-label">{o.punches}p</div><div className="opt-card-sub">{CURRENCY}{o.price}</div></div>)}</div>
          <button className="btn btn-primary btn-full mb16" disabled={busy} onClick={async () => { setBusy(true); await addPunches(student.id, cardId); flash(t.punchesLoaded); setBusy(false); }}>{busy ? t.saving : t.loadPunches}</button>
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
        {hasM && <div style={{ marginBottom: 16 }}>{tiers.map(tier => <div key={tier.id} className={`opt-card ${tierId === tier.id ? "selected" : ""}`} style={{ marginBottom: 6 }} onClick={() => setTierId(tier.id)}><div className="opt-card-label">{tier.label} — {t.sessionsPerWeek(tier.entriesPerWeek)}</div><div className="opt-card-sub">{CURRENCY}{tier.monthlyPrice}{t.month}</div></div>)}</div>}
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
