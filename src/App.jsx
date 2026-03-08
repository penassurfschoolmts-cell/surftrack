import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { supabase } from "./supabase.js";

// ─────────────────────────────────────────────
// APP CONFIG
// ─────────────────────────────────────────────
const APP_NAME    = "Penas' SurfTrack";
const APP_TAGLINE = "Surf School Management";
const CURRENCY    = "€";

const MEMBERSHIP_TIERS = [
  { id: "basic",    label: "Basic",    entriesPerWeek: 2, monthlyPrice: 49  },
  { id: "standard", label: "Standard", entriesPerWeek: 4, monthlyPrice: 79  },
  { id: "elite",    label: "Elite",    entriesPerWeek: 7, monthlyPrice: 119 },
];

const PUNCH_CARD_OPTIONS = [
  { id: "card10", label: "10 Punches", punches: 10, price: 90  },
  { id: "card20", label: "20 Punches", punches: 20, price: 160 },
  { id: "card50", label: "50 Punches", punches: 50, price: 350 },
];

const LESSON_TYPES = [
  { id: "group",   label: "Group Lesson",   punchCost: 1 },
  { id: "private", label: "Private Lesson", punchCost: 2 },
];

const GROUP_CLASSES = ["Beginner Surf", "Intermediate Surf", "Advanced Surf", "Bodyboard", "Ocean Safety", "Yoga"];

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
    settingsSub: "Current configuration",
    membershipTiers: "Membership Tiers",
    tiersEditHint: "Edit MEMBERSHIP_TIERS at the top of App.jsx to add or change tiers.",
    punchCardOptions: "Punch Card Options",
    cardsEditHint: "Edit PUNCH_CARD_OPTIONS at the top of App.jsx to add or change amounts.",
    perPunch: (p) => `${CURRENCY}${p} per punch`,
    lessonRules: "Lesson Rules",
    mo: "/mo",
    month: "/month",
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
    settingsSub: "Configuração atual",
    membershipTiers: "Planos de Subscrição",
    tiersEditHint: "Edite MEMBERSHIP_TIERS no topo do App.jsx para adicionar ou alterar planos.",
    punchCardOptions: "Opções de Cartão",
    cardsEditHint: "Edite PUNCH_CARD_OPTIONS no topo do App.jsx para adicionar ou alterar valores.",
    perPunch: (p) => `${CURRENCY}${p} por punção`,
    lessonRules: "Regras de Aulas",
    mo: "/mês",
    month: "/mês",
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
function getTier(id)    { return MEMBERSHIP_TIERS.find(t => t.id === id); }
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
    const { error } = await supabase
      .from("memberships")
      .upsert({ student_id: studentId, tier_id: tierId, active_week_entries: 0, week_start: getWeekStart() }, { onConflict: "student_id" });
    if (error) throw error;
  },

  async removeMembership(studentId) {
    await supabase.from("memberships").delete().eq("student_id", studentId);
  },

  async incrementWeekEntry(studentId, newCount) {
    await supabase.from("memberships").update({ active_week_entries: newCount }).eq("student_id", studentId);
  },

  async resetWeekIfNeeded(student) {
    if (student.membership && isNewWeek(student.membership.weekStart)) {
      await supabase.from("memberships").update({ active_week_entries: 0, week_start: getWeekStart() }).eq("student_id", student.id);
    }
  },

  // ── PUNCH CARDS ───────────────────────────
  async upsertPunchCard(studentId, balance) {
    const { error } = await supabase
      .from("punch_cards")
      .upsert({ student_id: studentId, balance }, { onConflict: "student_id" });
    if (error) throw error;
  },

  async updatePunchBalance(studentId, newBalance) {
    await supabase.from("punch_cards").update({ balance: newBalance }).eq("student_id", studentId);
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
function normalizeStudent(row) {
  const m = row.memberships?.[0] || null;
  const pc = row.punch_cards?.[0] || null;
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
// QR CODE — deterministic SVG per student UUID
// ─────────────────────────────────────────────
function QRCode({ clientId, size = 180, fg = "#e4eaf4", bg = "#191f2e" }) {
  const N    = 21;
  const seed = clientId.split("").reduce((a, c) => a + c.charCodeAt(0) * 31, 0);
  const rng  = i => { const x = Math.sin(seed + i * 127.1) * 43758.5453; return x - Math.floor(x); };
  const grid = Array.from({ length: N * N }, (_, i) => {
    const r = Math.floor(i / N), c = i % N;
    if (r < 7 && c < 7) return (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4));
    if (r < 7 && c >= N - 7) { const cc = c - (N - 7); return (r === 0 || r === 6 || cc === 0 || cc === 6 || (r >= 2 && r <= 4 && cc >= 2 && cc <= 4)); }
    if (r >= N - 7 && c < 7) { const rr = r - (N - 7); return (rr === 0 || rr === 6 || c === 0 || c === 6 || (rr >= 2 && rr <= 4 && c >= 2 && c <= 4)); }
    return rng(i) > 0.42;
  });
  const cs = size / N;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect width={size} height={size} fill={bg} rx="4" />
      {grid.map((on, i) => on ? <rect key={i} x={(i % N) * cs + 0.3} y={Math.floor(i / N) * cs + 0.3} width={cs - 0.6} height={cs - 0.6} fill={fg} rx="1" /> : null)}
    </svg>
  );
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
// ADMIN SHELL — loads data, handles all actions
// ─────────────────────────────────────────────
function AdminDashboard({ user }) {
  const [students, setStudents]       = useState([]);
  const [page, setPage]               = useState("dashboard");
  const [selectedId, setSelectedId]   = useState(null);
  const [modal, setModal]             = useState(null);
  const [search, setSearch]           = useState("");
  const [dataLoading, setDataLoading] = useState(true);
  const [dataErr, setDataErr]         = useState("");
  const [lang, setLang]               = useState(() => localStorage.getItem("st_lang") || "en");

  const toggleLang = (l) => { setLang(l); localStorage.setItem("st_lang", l); };

  const load = useCallback(async () => {
    try { setDataLoading(true); setStudents(await db.fetchStudents()); }
    catch (e) { setDataErr(e.message); }
    finally { setDataLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── ENTRY ──
  async function processEntry(studentId, isGuest = false, guestName = "") {
    const student = students.find(s => s.id === studentId);
    if (!student) return { allowed: false, message: "Student not found.", detail: "" };

    await db.resetWeekIfNeeded(student);

    if (student.membership) {
      const tier  = getTier(student.membership.tierId);
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
    if (!student?.punchCard) return { ok: false, msg: "No punch card." };
    const lt = LESSON_TYPES.find(l => l.id === lessonType);
    if (student.punchCard.balance < lt.punchCost) return { ok: false, msg: `Need ${lt.punchCost} punches, have ${student.punchCard.balance}.` };
    const newBal = student.punchCard.balance - lt.punchCost;
    await db.updatePunchBalance(studentId, newBal);
    await db.logPunchHistory(studentId, -lt.punchCost, `${lt.label}${className ? `: ${className}` : ""}`);
    await db.logLesson(studentId, lessonType, lt.label, className, lt.punchCost);
    await load();
    return { ok: true };
  }

  // ── ADD PUNCHES ──
  async function addPunches(studentId, cardId) {
    const opt     = PUNCH_CARD_OPTIONS.find(o => o.id === cardId);
    const student = students.find(s => s.id === studentId);
    const newBal  = (student?.punchCard?.balance || 0) + opt.punches;
    await db.upsertPunchCard(studentId, newBal);
    await db.logPunchHistory(studentId, opt.punches, `Loaded ${opt.label}`);
    await load();
  }

  // ── SET MEMBERSHIP ──
  async function setMembership(studentId, tierId) {
    await db.upsertMembership(studentId, tierId);
    await load();
  }

  async function removeMembership(studentId) {
    await db.removeMembership(studentId);
    await load();
  }

  // ── ADD STUDENT ──
  async function addStudent(fields, tierId, cardId) {
    const row = await db.createStudent(fields);
    if (tierId) await db.upsertMembership(row.id, tierId);
    if (cardId) {
      const opt = PUNCH_CARD_OPTIONS.find(o => o.id === cardId);
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
          {dataErr && <div className="notice-err mb16">{T[lang].dbError(dataErr)} <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={load}>{T[lang].retry}</span></div>}
          {page === "dashboard" && <Dashboard students={students} setPage={setPage} setModal={setModal} setSelectedId={setSelectedId} />}
          {page === "students"  && <StudentsPage students={filtered} search={search} setSearch={setSearch} setSelectedId={setSelectedId} setModal={setModal} />}
          {page === "entry"     && <EntryPage students={students} processEntry={processEntry} />}
          {page === "lessons"   && <LessonsPage students={students} logLesson={logLesson} />}
          {page === "billing"   && <BillingPage students={students} addPunches={addPunches} setMembership={setMembership} removeMembership={removeMembership} />}
          {page === "export"    && <ExportPage />}
          {page === "settings"  && <SettingsPage />}
        </div>
      </div>

      {modal === "addStudent" && (
        <AddStudentModal onClose={() => setModal(null)} onAdd={async (fields, tierId, cardId) => { await addStudent(fields, tierId, cardId); setModal(null); }} />
      )}
      {modal === "studentDetail" && selectedId && (
        <StudentDetailModal
          student={students.find(s => s.id === selectedId)}
          onClose={() => { setModal(null); setSelectedId(null); }}
          processEntry={processEntry} logLesson={logLesson}
          addPunches={addPunches} setMembership={setMembership} removeMembership={removeMembership}
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
  const monthly = students.filter(s => s.membership).length;
  const both    = students.filter(s => s.membership && s.punchCard).length;
  const atLimit = students.filter(s => s.membership && s.membership.activeWeekEntries >= (getTier(s.membership.tierId)?.entriesPerWeek || 0)).length;
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
            const tier  = s.membership ? getTier(s.membership.tierId) : null;
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
            const tier    = s.membership ? getTier(s.membership.tierId) : null;
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

  async function startCamera() {
    setCamErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { setCamErr(t.cameraUnavailable); }
  }

  function stopCamera() { streamRef.current?.getTracks().forEach(tr => tr.stop()); streamRef.current = null; }
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
              {camErr ? <div className="notice-warn">{camErr}</div> : <div className="scanner-wrap"><video ref={videoRef} autoPlay playsInline muted /><div className="scanner-overlay"><div className="scanner-frame"><div className="scanner-line" /></div></div></div>}
              <div className="notice mt16" style={{ marginBottom: 8 }}>{t.afterScanning}</div>
              {students.map(s => (
                <div key={s.id} className="timeline-item" style={{ marginBottom: 6, cursor: "pointer" }} onClick={() => handleEntry(s.id)}>
                  <div className="avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{s.avatar}</div>
                  <div className="timeline-info"><div className="timeline-title">{s.name}</div><div className="timeline-time">{s.membership ? getTier(s.membership.tierId)?.label : t.noMembership}{s.punchCard ? ` · ${s.punchCard.balance}p` : ""}</div></div>
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
  const [selId, setSelId]           = useState("");
  const [lessonType, setLessonType] = useState("group");
  const [cls, setCls]               = useState(GROUP_CLASSES[0]);
  const [result, setResult]         = useState(null);
  const [busy, setBusy]             = useState(false);
  const student    = students.find(s => s.id === selId);
  const lt         = LESSON_TYPES.find(l => l.id === lessonType);
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
              {students.filter(s => s.punchCard).map(s => <option key={s.id} value={s.id}>{s.name} ({s.punchCard.balance}p)</option>)}
            </select>
          </div>
          <div className="field"><label>{t.lessonType}</label>
            <div className="grid2" style={{ marginTop: 4 }}>
              {LESSON_TYPES.map(l => <div key={l.id} className={`opt-card ${lessonType === l.id ? "selected" : ""}`} onClick={() => setLessonType(l.id)}><div className="opt-card-label">{l.label}</div><div className="opt-card-sub">{l.punchCost} {l.punchCost > 1 ? t.punches2 : t.punch}</div></div>)}
            </div>
          </div>
          {lessonType === "group" && <div className="field"><label>{t.class}</label><select value={cls} onChange={e => setCls(e.target.value)}>{GROUP_CLASSES.map(g => <option key={g}>{g}</option>)}</select></div>}
          {student && lt && <div className={student.punchCard.balance >= lt.punchCost ? "notice" : "notice-warn"}>{student.punchCard.balance >= lt.punchCost ? t.punchesAvailable(student.punchCard.balance, student.name) : t.notEnoughPunches(lt.punchCost, student.punchCard.balance)}</div>}
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
function punchRevenueThisMonth(student) {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of this month, midnight
  return (student.punchHistory || [])
    .filter(h => h.delta > 0 && new Date(h.ts) >= start)
    .reduce((sum, h) => {
      // Match the loaded punches back to a card option to get the price paid
      const opt = PUNCH_CARD_OPTIONS.find(o => o.punches === h.delta);
      return sum + (opt ? opt.price : 0);
    }, 0);
}

function BillingPage({ students, addPunches, setMembership, removeMembership }) {
  const t = useLang();
  const [selId, setSelId]   = useState("");
  const [cardId, setCardId] = useState(PUNCH_CARD_OPTIONS[0].id);
  const [tierId, setTierId] = useState(MEMBERSHIP_TIERS[0].id);
  const [action, setAction] = useState("loadCard");
  const [msg, setMsg]       = useState("");
  const [busy, setBusy]     = useState(false);
  const flash = m => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  const monthLabel      = t.monthLabel();
  const totalMembership = students.reduce((sum, s) => sum + (getTier(s.membership?.tierId)?.monthlyPrice || 0), 0);
  const totalPunchCards = students.reduce((sum, s) => sum + punchRevenueThisMonth(s), 0);
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
            <div className="grid3" style={{ marginBottom: 16 }}>{PUNCH_CARD_OPTIONS.map(o => <div key={o.id} className={`opt-card ${cardId === o.id ? "selected" : ""}`} onClick={() => setCardId(o.id)}><div className="opt-card-label">{o.punches}p</div><div className="opt-card-sub">{CURRENCY}{o.price}</div></div>)}</div>
            <button className="btn btn-primary btn-full" disabled={!selId || busy} onClick={async () => { setBusy(true); await addPunches(selId, cardId); flash(t.cardLoaded); setBusy(false); }}>{busy ? t.saving : t.loadCard}</button>
          </>)}
          {action === "membership" && (<>
            <div className="section-label">{t.selectTier}</div>
            {MEMBERSHIP_TIERS.map(tier => <div key={tier.id} className={`opt-card ${tierId === tier.id ? "selected" : ""}`} style={{ marginBottom: 8 }} onClick={() => setTierId(tier.id)}><div className="opt-card-label">{tier.label} — {t.sessionsPerWeek(tier.entriesPerWeek)}</div><div className="opt-card-sub">{CURRENCY}{tier.monthlyPrice}{t.mo}</div></div>)}
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
                const tier = s.membership ? getTier(s.membership.tierId) : null;
                const cardRevenue = punchRevenueThisMonth(s);
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
  return (
    <div>
      <div className="page-header"><div><div className="page-title">{t.settingsTitle}</div><div className="page-sub">{t.settingsSub}</div></div></div>
      <div className="grid2" style={{ gap: 20 }}>
        <div className="card">
          <div className="card-title">{t.membershipTiers}</div>
          <div className="notice">{t.tiersEditHint}</div>
          {MEMBERSHIP_TIERS.map(tier => <div key={tier.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}><div className="flex justify-between items-center"><div><div className="bold">{tier.label}</div><div className="small text-muted">{t.sessionsPerWeek(tier.entriesPerWeek)}</div></div><div className="text-accent bold">{CURRENCY}{tier.monthlyPrice}{t.mo}</div></div></div>)}
        </div>
        <div className="card">
          <div className="card-title">{t.punchCardOptions}</div>
          <div className="notice">{t.cardsEditHint}</div>
          {PUNCH_CARD_OPTIONS.map(o => <div key={o.id} style={{ padding: "12px 0", borderBottom: "1px solid var(--border)" }}><div className="flex justify-between items-center"><div><div className="bold">{o.label}</div><div className="small text-muted">{t.perPunch((o.price / o.punches).toFixed(2))}</div></div><div className="text-accent bold">{CURRENCY}{o.price}</div></div></div>)}
          <div className="separator" />
          <div className="section-label">{t.lessonRules}</div>
          {LESSON_TYPES.map(l => <div key={l.id} style={{ padding: "8px 0" }} className="flex justify-between"><span>{l.label}</span><span className="badge badge-blue">{l.punchCost} {l.punchCost > 1 ? t.punches2 : t.punch}</span></div>)}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// STUDENT DETAIL MODAL
// ─────────────────────────────────────────────
function StudentDetailModal({ student, onClose, processEntry, logLesson, addPunches, setMembership, removeMembership }) {
  const t = useLang();
  const [tab, setTab]               = useState("overview");
  const [result, setResult]         = useState(null);
  const [lessonType, setLessonType] = useState("group");
  const [cls, setCls]               = useState(GROUP_CLASSES[0]);
  const [isGuest, setIsGuest]       = useState(false);
  const [guestName, setGuestName]   = useState("");
  const [cardId, setCardId]         = useState(PUNCH_CARD_OPTIONS[0].id);
  const [newTier, setNewTier]       = useState(student?.membership?.tierId || MEMBERSHIP_TIERS[0].id);
  const [msg, setMsg]               = useState("");
  const [busy, setBusy]             = useState(false);
  const flash = m => { setMsg(m); setTimeout(() => setMsg(""), 3000); };

  if (!student) return null;
  const tier  = student.membership ? getTier(student.membership.tierId) : null;
  const used  = student.membership?.activeWeekEntries || 0;
  const limit = tier?.entriesPerWeek || 0;
  const pct   = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const lt    = LESSON_TYPES.find(l => l.id === lessonType);

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
        </>)}

        {tab === "qr code" && (<>
          <div className="notice">{t.qrNotice}</div>
          <div className="qr-card">
            <QRCode clientId={student.id} size={200} fg="#e4eaf4" bg="#191f2e" />
            <div className="qr-name">{student.name}</div>
            <div className="qr-id">ID: {student.id}</div>
          </div>
          <div className="notice mt16" style={{ marginBottom: 0 }}>{t.qrPrintHint}</div>
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
          {!student.punchCard && <div className="notice-warn">{t.studentNeedsPunchCard}</div>}
          <div className="grid2" style={{ marginBottom: 12 }}>
            {LESSON_TYPES.map(l => <div key={l.id} className={`opt-card ${lessonType === l.id ? "selected" : ""}`} onClick={() => setLessonType(l.id)}><div className="opt-card-label">{l.label}</div><div className="opt-card-sub">{l.punchCost} {l.punchCost > 1 ? t.punches2 : t.punch}</div></div>)}
          </div>
          {lessonType === "group" && <div className="field"><label>{t.class}</label><select value={cls} onChange={e => setCls(e.target.value)}>{GROUP_CLASSES.map(g => <option key={g}>{g}</option>)}</select></div>}
          {student.punchCard && lt && <div className={student.punchCard.balance >= lt.punchCost ? "notice" : "notice-warn"} style={{ marginBottom: 12 }}>{student.punchCard.balance >= lt.punchCost ? t.punchesAvailable(student.punchCard.balance, student.name) : t.notEnoughPunches(lt.punchCost, student.punchCard.balance)}</div>}
          <button className="btn btn-primary btn-full" disabled={!student.punchCard || busy} onClick={async () => { setBusy(true); const r = await logLesson(student.id, lessonType, lessonType === "group" ? cls : ""); flash(r.ok ? t.lessonRecorded : `✗ ${r.msg}`); setBusy(false); }}>{busy ? t.saving : t.logLessonBtn}</button>
        </>)}

        {tab === "billing" && (<>
          <div className="section-label">{t.loadPunchCard}</div>
          <div className="grid3" style={{ marginBottom: 16 }}>{PUNCH_CARD_OPTIONS.map(o => <div key={o.id} className={`opt-card ${cardId === o.id ? "selected" : ""}`} onClick={() => setCardId(o.id)}><div className="opt-card-label">{o.punches}p</div><div className="opt-card-sub">{CURRENCY}{o.price}</div></div>)}</div>
          <button className="btn btn-primary btn-full mb16" disabled={busy} onClick={async () => { setBusy(true); await addPunches(student.id, cardId); flash(t.punchesLoaded); setBusy(false); }}>{busy ? t.saving : t.loadPunches}</button>
          <div className="separator" />
          <div className="section-label">{t.membershipTier}</div>
          {MEMBERSHIP_TIERS.map(tier => <div key={tier.id} className={`opt-card ${newTier === tier.id ? "selected" : ""}`} style={{ marginBottom: 8 }} onClick={() => setNewTier(tier.id)}><div className="opt-card-label">{tier.label} — {t.sessionsPerWeek(tier.entriesPerWeek)}</div><div className="opt-card-sub">{CURRENCY}{tier.monthlyPrice}{t.mo}</div></div>)}
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
  const [name, setName]     = useState("");
  const [email, setEmail]   = useState("");
  const [phone, setPhone]   = useState("");
  const [notes, setNotes]   = useState("");
  const [hasM, setHasM]     = useState(false);
  const [tierId, setTierId] = useState(MEMBERSHIP_TIERS[0].id);
  const [hasP, setHasP]     = useState(false);
  const [cardId, setCardId] = useState(PUNCH_CARD_OPTIONS[0].id);
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
        {hasM && <div style={{ marginBottom: 16 }}>{MEMBERSHIP_TIERS.map(tier => <div key={tier.id} className={`opt-card ${tierId === tier.id ? "selected" : ""}`} style={{ marginBottom: 6 }} onClick={() => setTierId(tier.id)}><div className="opt-card-label">{tier.label} — {t.sessionsPerWeek(tier.entriesPerWeek)}</div><div className="opt-card-sub">{CURRENCY}{tier.monthlyPrice}{t.month}</div></div>)}</div>}
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", marginBottom: 12 }}>
          <input type="checkbox" checked={hasP} onChange={e => setHasP(e.target.checked)} /><span className="bold">{t.addPunchCard}</span>
        </label>
        {hasP && <div className="grid3" style={{ marginBottom: 16 }}>{PUNCH_CARD_OPTIONS.map(o => <div key={o.id} className={`opt-card ${cardId === o.id ? "selected" : ""}`} onClick={() => setCardId(o.id)}><div className="opt-card-label">{o.punches} {t.punches2}</div><div className="opt-card-sub">{CURRENCY}{o.price}</div></div>)}</div>}
        {err && <div className="err mb16">{err}</div>}
        <div className="row gap8">
          <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? t.creating : t.createStudent}</button>
          <button className="btn btn-ghost" onClick={onClose}>{t.cancel}</button>
        </div>
      </div>
    </div>
  );
}
