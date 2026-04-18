import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase.js";
import QRCodeLib from "qrcode";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
// Ocean-native aesthetic: deep water blues, sand, coral accent
// Matches admin app surface palette but student-facing feel is warmer/lighter

const PORTAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --ocean:    #1a3a4a;
    --deep:     #0f2030;
    --wave:     #2a8fbd;
    --foam:     #eef6fb;
    --sand:     #f7f2eb;
    --coral:    #e06b4f;
    --green:    #2d9b6f;
    --gold:     #c9933a;
    --text:     #1a2530;
    --muted:    #6b7f8c;
    --border:   rgba(26,58,74,.12);
    --surface:  #ffffff;
    --surface2: #f4f8fb;
    --radius:   16px;
    --radius-sm:10px;
    --shadow:   0 2px 16px rgba(26,58,74,.08);
    --shadow-lg:0 8px 40px rgba(26,58,74,.14);
    --font-head:'DM Serif Display', Georgia, serif;
    --font-body:'DM Sans', system-ui, sans-serif;
    --nav-h:    64px;
  }

  html, body, #portal-root {
    height: 100%;
    font-family: var(--font-body);
    background: var(--foam);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
  }

  /* ── LAYOUT ── */
  .portal-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    max-width: 480px;
    margin: 0 auto;
    background: var(--surface);
    box-shadow: var(--shadow-lg);
  }

  .portal-header {
    background: var(--ocean);
    color: #fff;
    padding: 20px 20px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    z-index: 100;
    min-height: var(--nav-h);
  }
  .portal-header-title {
    font-family: var(--font-head);
    font-size: 20px;
    letter-spacing: -.3px;
    color: #fff;
  }
  .portal-header-sub {
    font-size: 12px;
    opacity: .65;
    margin-top: 1px;
  }

  .portal-content {
    flex: 1;
    overflow-y: auto;
    padding-bottom: calc(var(--nav-h) + 16px);
  }

  /* ── BOTTOM NAV ── */
  .portal-nav {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 480px;
    background: var(--surface);
    border-top: 1px solid var(--border);
    display: flex;
    height: var(--nav-h);
    z-index: 100;
    box-shadow: 0 -4px 20px rgba(26,58,74,.06);
  }
  .nav-tab {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    cursor: pointer;
    color: var(--muted);
    transition: color .2s;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: .03em;
    text-transform: uppercase;
    -webkit-tap-highlight-color: transparent;
  }
  .nav-tab.active { color: var(--wave); }
  .nav-icon {
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .nav-badge {
    position: absolute;
    top: 8px;
    right: calc(50% - 22px);
    width: 8px;
    height: 8px;
    background: var(--coral);
    border-radius: 50%;
    border: 2px solid var(--surface);
  }

  /* ── CARDS ── */
  .p-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
  }
  .p-section { padding: 20px; }
  .p-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: .08em;
    margin-bottom: 10px;
  }

  /* ── HERO CARD ── */
  .hero-card {
    background: var(--ocean);
    color: #fff;
    padding: 28px 24px 24px;
    margin: 16px;
    border-radius: var(--radius);
    position: relative;
    overflow: hidden;
  }
  .hero-card::before {
    content: '';
    position: absolute;
    right: -30px;
    top: -30px;
    width: 160px;
    height: 160px;
    border-radius: 50%;
    background: rgba(255,255,255,.04);
  }
  .hero-card::after {
    content: '';
    position: absolute;
    right: 20px;
    bottom: -20px;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: rgba(255,255,255,.03);
  }
  .hero-name {
    font-family: var(--font-head);
    font-size: 26px;
    line-height: 1.1;
    margin-bottom: 4px;
  }
  .hero-plan {
    font-size: 13px;
    opacity: .75;
  }
  .hero-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 20px;
  }
  .hero-stat {
    background: rgba(255,255,255,.08);
    border-radius: 10px;
    padding: 12px 14px;
  }
  .hero-stat-val {
    font-family: var(--font-head);
    font-size: 28px;
    line-height: 1;
  }
  .hero-stat-lbl {
    font-size: 11px;
    opacity: .65;
    margin-top: 2px;
  }

  /* ── STATUS PILL ── */
  .status-pill {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 20px;
  }
  .status-active { background: rgba(45,155,111,.15); color: var(--green); }
  .status-pending { background: rgba(201,147,58,.15); color: var(--gold); }
  .status-inactive { background: rgba(224,107,79,.12); color: var(--coral); }
  .status-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    background: currentColor;
  }

  /* ── BUTTONS ── */
  .p-btn {
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 500;
    padding: 12px 20px;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    transition: all .15s;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    -webkit-tap-highlight-color: transparent;
  }
  .p-btn:active { transform: scale(.97); }
  .p-btn-primary { background: var(--wave); color: #fff; }
  .p-btn-primary:hover { background: #2480ab; }
  .p-btn-ghost { background: var(--surface2); color: var(--text); }
  .p-btn-ghost:hover { background: #e8f0f5; }
  .p-btn-danger { background: rgba(224,107,79,.1); color: var(--coral); }
  .p-btn-full { width: 100%; }
  .p-btn:disabled { opacity: .5; cursor: not-allowed; }

  /* ── INPUTS ── */
  .p-input {
    width: 100%;
    font-family: var(--font-body);
    font-size: 15px;
    padding: 12px 14px;
    border: 1.5px solid var(--border);
    border-radius: 10px;
    background: var(--surface);
    color: var(--text);
    outline: none;
    transition: border-color .15s;
  }
  .p-input:focus { border-color: var(--wave); }
  .p-input::placeholder { color: #aab5bc; }
  .p-select { appearance: none; cursor: pointer; }
  .p-field { margin-bottom: 16px; }
  .p-field-label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--muted);
    margin-bottom: 6px;
  }

  /* ── LIST ROWS ── */
  .p-row {
    display: flex;
    align-items: center;
    padding: 13px 0;
    border-bottom: 1px solid var(--border);
    gap: 12px;
  }
  .p-row:last-child { border-bottom: none; }
  .p-row-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--surface2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    font-size: 16px;
  }
  .p-row-main { flex: 1; min-width: 0; }
  .p-row-title { font-size: 14px; font-weight: 500; }
  .p-row-sub { font-size: 12px; color: var(--muted); margin-top: 1px; }
  .p-row-right { font-size: 13px; color: var(--muted); text-align: right; flex-shrink: 0; }

  /* ── SLOT CHIPS ── */
  .slot-grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .slot-chip {
    padding: 8px 16px;
    border-radius: 20px;
    border: 1.5px solid var(--border);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all .15s;
    background: var(--surface);
    color: var(--text);
    -webkit-tap-highlight-color: transparent;
  }
  .slot-chip.selected {
    background: var(--wave);
    border-color: var(--wave);
    color: #fff;
  }
  .slot-chip:disabled { opacity: .4; cursor: not-allowed; }

  /* ── AVATAR ── */
  .p-avatar {
    border-radius: 50%;
    object-fit: cover;
    background: var(--ocean);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-head);
    font-size: 20px;
    flex-shrink: 0;
  }

  /* ── QR ── */
  .qr-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 32px 24px;
    gap: 20px;
  }
  .qr-canvas-wrap {
    padding: 16px;
    background: #fff;
    border-radius: var(--radius);
    border: 1px solid var(--border);
    box-shadow: var(--shadow);
  }

  /* ── NOTICE ── */
  .p-notice {
    padding: 12px 14px;
    border-radius: 10px;
    font-size: 13px;
    line-height: 1.5;
    margin-bottom: 14px;
  }
  .p-notice-info { background: rgba(42,143,189,.1); color: #1a5c7a; }
  .p-notice-warn { background: rgba(201,147,58,.1); color: #8a6020; }
  .p-notice-ok { background: rgba(45,155,111,.1); color: #1a6045; }

  /* ── LOGIN ── */
  .login-wrap {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 24px;
    background: var(--ocean);
  }
  .login-card {
    width: 100%;
    max-width: 380px;
    background: var(--surface);
    border-radius: var(--radius);
    padding: 36px 28px;
    box-shadow: var(--shadow-lg);
  }
  .login-logo {
    font-family: var(--font-head);
    font-size: 28px;
    color: var(--ocean);
    text-align: center;
    margin-bottom: 4px;
  }
  .login-sub {
    text-align: center;
    font-size: 14px;
    color: var(--muted);
    margin-bottom: 28px;
  }

  /* ── OPT CARD ── */
  .p-opt-card {
    border: 1.5px solid var(--border);
    border-radius: 12px;
    padding: 14px 16px;
    cursor: pointer;
    transition: all .15s;
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 10px;
    -webkit-tap-highlight-color: transparent;
  }
  .p-opt-card.selected {
    border-color: var(--wave);
    background: rgba(42,143,189,.06);
  }
  .p-opt-title { font-size: 14px; font-weight: 500; }
  .p-opt-sub { font-size: 12px; color: var(--muted); margin-top: 2px; }

  /* ── FLASH ── */
  .portal-flash {
    position: fixed;
    bottom: calc(var(--nav-h) + 16px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--ocean);
    color: #fff;
    padding: 10px 20px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 500;
    z-index: 200;
    pointer-events: none;
    box-shadow: var(--shadow-lg);
    white-space: nowrap;
    animation: flash-in .2s ease;
  }
  @keyframes flash-in { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

  /* ── MODAL ── */
  .p-overlay {
    position: fixed;
    inset: 0;
    background: rgba(10,20,30,.5);
    z-index: 300;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .p-modal {
    background: var(--surface);
    border-radius: var(--radius) var(--radius) 0 0;
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 24px 20px 40px;
  }
  .p-modal-handle {
    width: 36px;
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    margin: 0 auto 20px;
  }
  .p-modal-title {
    font-family: var(--font-head);
    font-size: 22px;
    margin-bottom: 20px;
  }

  /* ── MISC ── */
  .gap12 { display: flex; flex-direction: column; gap: 12px; }
  .row { display: flex; gap: 10px; }
  .mt8 { margin-top: 8px; }
  .mt16 { margin-top: 16px; }
  .mt24 { margin-top: 24px; }
  .text-center { text-align: center; }
  .text-muted { color: var(--muted); }
  .bold { font-weight: 600; }
  .photo-upload-ring {
    width: 80px; height: 80px;
    border-radius: 50%;
    border: 2.5px dashed var(--wave);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; overflow: hidden; position: relative;
    flex-shrink: 0;
  }
  .photo-upload-ring input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
  .progress-bar { height: 6px; background: var(--surface2); border-radius: 3px; overflow: hidden; }
  .progress-fill { height: 100%; border-radius: 3px; background: var(--wave); transition: width .3s; }
  .fill-red { background: var(--coral); }
  .fill-gold { background: var(--gold); }
`;

// ─── SUPABASE HELPERS ─────────────────────────────────────────────────────────
const portalDb = {
  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },
  async getMyStudent() {
    // 1. Try to find by auth_user_id (already linked)
    const { data: linked } = await supabase
      .from("students")
      .select(`*, memberships(*), punch_cards(*), entry_log(id, method, note, created_at), lesson_log(id, lesson_type, label, class_name, created_at), reservations(*)`)
      .maybeSingle();

    if (linked) return linked;

    // 2. Not linked yet — look up by email using the RPC function that bypasses RLS
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) throw Object.assign(new Error("No student record linked"), { code: "PGRST116" });

    const { data: studentId, error: rpcError } = await supabase.rpc("link_student_by_email", {
      p_email: user.email,
      p_auth_user_id: user.id
    });

    if (rpcError || !studentId) throw Object.assign(new Error("No student record linked to this account"), { code: "PGRST116" });

    // 3. Now fetch the freshly linked student (RLS will now allow it)
    const { data: fresh, error } = await supabase
      .from("students")
      .select(`*, memberships(*), punch_cards(*), entry_log(id, method, note, created_at), lesson_log(id, lesson_type, label, class_name, created_at), reservations(*)`)
      .maybeSingle();

    if (error) throw error;
    if (!fresh) throw Object.assign(new Error("No student record linked to this account"), { code: "PGRST116" });
    return fresh;
  },
  async updateMyProfile(fields) {
    const { error } = await supabase.from("students").update(fields).eq("auth_user_id", (await supabase.auth.getUser()).data.user?.id);
    if (error) throw error;
  },
  async uploadPhoto(file, studentId) {
    const ext = file.name.split(".").pop();
    const path = `${studentId}.${ext}`;
    const { error } = await supabase.storage.from("student-photos").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("student-photos").getPublicUrl(path);
    return data.publicUrl;
  },
  async getMyReservations() {
    const { data, error } = await supabase
      .from("reservations")
      .select("*")
      .gte("session_date", new Date().toISOString().slice(0, 10))
      .neq("status", "cancelled")
      .order("session_date");
    if (error) throw error;
    return data || [];
  },
  async createReservation(studentId, sessionDate, sessionSlot, lessonType) {
    const { error } = await supabase.from("reservations").insert({
      student_id: studentId, session_date: sessionDate,
      session_slot: sessionSlot, lesson_type: lessonType,
      punch_cost: 1, status: "reserved"
    });
    if (error) throw error;
  },
  async cancelReservation(id) {
    const { error } = await supabase.from("reservations").update({ status: "cancelled" }).eq("id", id);
    if (error) throw error;
  },
  async getAvailableInstructors() {
    const { data, error } = await supabase
      .from("instructors")
      .select("id, name, avatar, available_for_private")
      .eq("available_for_private", true)
      .order("name");
    if (error) throw error;
    return data || [];
  },
  async submitRequest(studentId, type, payload) {
    const { error } = await supabase.from("student_requests").insert({ student_id: studentId, type, payload });
    if (error) throw error;
  },
  async getMyRequests(studentId) {
    const { data, error } = await supabase
      .from("student_requests")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    return data || [];
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmt(d) { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }
function fmtShort(d) { return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }); }
function initials(name) { return (name || "?").trim().split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2); }

const SLOTS = ["7am", "9:30am", "10am", "2pm"];
const SLOT_LABELS = { "7am": "7:00 AM", "9:30am": "9:30 AM", "10am": "10:00 AM", "2pm": "2:00 PM" };
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getSlotsForDate(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  const dow = d.getDay();
  return (dow === 0 || dow === 6) ? ["9:30am"] : ["7am", "10am", "2pm"];
}

function localDateStr(daysAhead = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function getNext14Days() {
  return Array.from({ length: 14 }, (_, i) => localDateStr(i + 1));
}

// ─── FLASH CONTEXT ────────────────────────────────────────────────────────────
function useFlash() {
  const [msg, setMsg] = useState(null);
  const flash = useCallback((text) => {
    setMsg(text);
    setTimeout(() => setMsg(null), 2500);
  }, []);
  return [msg, flash];
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function sendMagicLink(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true); setErr("");
    const redirectTo = window.location.origin + "/portal";
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo }
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setSent(true);
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-logo">Penas' SurfTrack</div>
        <div className="login-sub">Student Portal</div>
        {!sent ? (
          <form onSubmit={sendMagicLink}>
            <div className="p-field">
              <label className="p-field-label">Your email address</label>
              <input className="p-input" type="email" placeholder="you@email.com"
                value={email} onChange={e => setEmail(e.target.value)} autoFocus />
            </div>
            {err && <div className="p-notice p-notice-warn" style={{ marginBottom: 12 }}>{err}</div>}
            <button className="p-btn p-btn-primary p-btn-full" disabled={busy || !email.trim()}>
              {busy ? "Sending…" : "Send Magic Link"}
            </button>
            <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginTop: 14, lineHeight: 1.6 }}>
              We'll email you a one-tap sign-in link. No password needed.
            </p>
          </form>
        ) : (
          <div className="text-center">
            <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 20, marginBottom: 8 }}>Check your inbox</div>
            <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.6, marginBottom: 20 }}>
              We sent a sign-in link to <strong>{email}</strong>. Tap it to open the portal.
            </div>
            <button className="p-btn p-btn-ghost" onClick={() => { setSent(false); setEmail(""); }}>
              Try a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HOME TAB ─────────────────────────────────────────────────────────────────
function HomeTab({ student, requests, onTabChange }) {
  if (!student) return <div className="p-section text-muted" style={{ textAlign: "center", paddingTop: 60 }}>Loading…</div>;

  const m = student.memberships?.[0] || null;
  const pc = student.punch_cards?.[0] || null;
  const upcoming = (student.reservations || [])
    .filter(r => r.session_date >= localDateStr() && r.status !== "cancelled")
    .sort((a, b) => a.session_date.localeCompare(b.session_date))
    .slice(0, 3);
  const pendingReqs = requests.filter(r => r.status === "pending").length;

  const mActive = m?.active !== false;
  const mUntil = m?.valid_until;
  const pcActive = pc?.active !== false;

  return (
    <div>
      {/* Hero */}
      <div className="hero-card">
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          {student.photo_url
            ? <img src={student.photo_url} alt="" className="p-avatar" style={{ width: 52, height: 52 }} />
            : <div className="p-avatar" style={{ width: 52, height: 52, background: "rgba(255,255,255,.15)", fontSize: 18 }}>
                {initials(student.name)}
              </div>
          }
          <div>
            <div className="hero-name">{student.name?.split(" ")[0]}</div>
            <div className="hero-plan">
              {m ? `${m.tier_id} member` : pc ? "Punch card" : "No active plan"}
            </div>
          </div>
        </div>

        <div className="hero-stats">
          <div className="hero-stat">
            <div className="hero-stat-val">{pc?.balance ?? "—"}</div>
            <div className="hero-stat-lbl">
              {pc ? (pcActive ? "Punches left" : "⚠ Unpaid") : "No card"}
            </div>
          </div>
          <div className="hero-stat">
            <div className="hero-stat-val">{m ? (mActive ? "✓" : "⚠") : "—"}</div>
            <div className="hero-stat-lbl">
              {m ? (mActive ? `Active · ${mUntil ? "until " + fmtShort(mUntil) : ""}` : "Payment pending") : "No membership"}
            </div>
          </div>
        </div>
      </div>

      {/* Pending requests banner */}
      {pendingReqs > 0 && (
        <div style={{ margin: "0 16px 4px" }}>
          <div className="p-notice p-notice-warn" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>⏳ {pendingReqs} request{pendingReqs > 1 ? "s" : ""} pending admin review</span>
          </div>
        </div>
      )}

      {/* Upcoming reservations */}
      <div className="p-section" style={{ paddingTop: 12 }}>
        <div className="p-label">Upcoming sessions</div>
        {upcoming.length === 0
          ? <div className="p-notice p-notice-info">No upcoming reservations. <span style={{ cursor: "pointer", textDecoration: "underline" }} onClick={() => onTabChange("reserve")}>Book a class →</span></div>
          : upcoming.map(r => (
            <div key={r.id} className="p-row">
              <div className="p-row-icon">🏄</div>
              <div className="p-row-main">
                <div className="p-row-title">{DAYS[new Date(r.session_date + "T12:00:00").getDay()]} · {fmtShort(r.session_date + "T12:00:00")}</div>
                <div className="p-row-sub">{SLOT_LABELS[r.session_slot] || r.session_slot} · {r.lesson_type}</div>
              </div>
              <div className="p-row-right">
                <span className="status-pill status-active"><span className="status-dot" />Confirmed</span>
              </div>
            </div>
          ))
        }
      </div>

      {/* Quick actions */}
      <div className="p-section" style={{ paddingTop: 0 }}>
        <div className="p-label">Quick actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { icon: "📅", label: "Book class", tab: "reserve" },
            { icon: "🔑", label: "Private lesson", tab: "private" },
            { icon: "💳", label: "Add plan", tab: "shop" },
            { icon: "📱", label: "My QR code", tab: "qr" },
          ].map(a => (
            <button key={a.tab} className="p-btn p-btn-ghost" style={{ flexDirection: "column", gap: 6, padding: 16, height: "auto", borderRadius: "var(--radius)" }} onClick={() => onTabChange(a.tab)}>
              <span style={{ fontSize: 24 }}>{a.icon}</span>
              <span style={{ fontSize: 13 }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent history */}
      {(student.entry_log || []).length > 0 && (
        <div className="p-section" style={{ paddingTop: 0 }}>
          <div className="p-label">Recent visits</div>
          {[...(student.entry_log || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5).map((e, i) => (
            <div key={i} className="p-row">
              <div className="p-row-icon" style={{ fontSize: 13, background: e.method === "denied" ? "rgba(224,107,79,.1)" : "rgba(45,155,111,.1)", color: e.method === "denied" ? "var(--coral)" : "var(--green)" }}>
                {e.method === "denied" ? "✗" : "✓"}
              </div>
              <div className="p-row-main">
                <div className="p-row-title">{e.note || e.method}</div>
                <div className="p-row-sub">{fmt(e.created_at)}</div>
              </div>
              <div className="p-row-right" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".04em", color: e.method === "membership" ? "var(--wave)" : e.method === "punchcard" ? "var(--gold)" : "var(--muted)" }}>
                {e.method}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── QR TAB ───────────────────────────────────────────────────────────────────
function QRTab({ student }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!student?.id || !canvasRef.current) return;
    QRCodeLib.toCanvas(canvasRef.current, student.id, {
      width: 240, margin: 2,
      color: { dark: "#1a3a4a", light: "#ffffff" }
    });
  }, [student?.id]);

  async function download() {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(student?.name || "surfer").replace(/\s+/g, "_")}_QR.png`;
    a.click();
  }

  if (!student) return null;

  return (
    <div>
      <div className="qr-wrap">
        <div style={{ fontFamily: "var(--font-head)", fontSize: 22, color: "var(--ocean)", textAlign: "center" }}>
          My Check-in QR
        </div>
        <div className="qr-canvas-wrap">
          <canvas ref={canvasRef} />
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 18 }}>{student.name}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Show this at the entry scanner</div>
        </div>
        <button className="p-btn p-btn-primary" style={{ width: 220 }} onClick={download}>
          ↓ Download QR Code
        </button>
        <div className="p-notice p-notice-info" style={{ fontSize: 12, textAlign: "center", width: "100%" }}>
          Save this to your phone's home screen or wallet for quick access at the door.
        </div>
      </div>
    </div>
  );
}

// ─── RESERVE TAB ──────────────────────────────────────────────────────────────
function ReserveTab({ student, flash }) {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reservations, setReservations] = useState([]);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("book"); // "book" | "upcoming"

  const days = getNext14Days();

  useEffect(() => {
    if (!student) return;
    portalDb.getMyReservations().then(setReservations).catch(console.warn);
  }, [student?.id]);

  const slots = selectedDate ? getSlotsForDate(selectedDate) : [];

  async function handleBook() {
    if (!selectedDate || !selectedSlot || !student) return;
    setBusy(true);
    try {
      await portalDb.createReservation(student.id, selectedDate, selectedSlot, "group");
      flash("✓ Reservation confirmed!");
      setSelectedDate(""); setSelectedSlot("");
      const updated = await portalDb.getMyReservations();
      setReservations(updated);
    } catch (e) { flash("Error: " + e.message); }
    finally { setBusy(false); }
  }

  async function handleCancel(id) {
    setBusy(true);
    try {
      await portalDb.cancelReservation(id);
      flash("Reservation cancelled.");
      setReservations(prev => prev.filter(r => r.id !== id));
    } catch (e) { flash("Error: " + e.message); }
    finally { setBusy(false); }
  }

  return (
    <div>
      <div className="p-section">
        <div style={{ display: "flex", gap: 0, background: "var(--surface2)", borderRadius: 10, padding: 3, marginBottom: 20 }}>
          {[["book","Book a class"],["upcoming","Upcoming"]].map(([k,lbl]) => (
            <button key={k} onClick={() => setTab(k)}
              style={{ flex: 1, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer",
                background: tab === k ? "var(--surface)" : "transparent",
                color: tab === k ? "var(--text)" : "var(--muted)",
                fontWeight: tab === k ? 500 : 400, fontSize: 13,
                boxShadow: tab === k ? "0 1px 4px rgba(0,0,0,.08)" : "none",
                transition: "all .15s" }}>
              {lbl} {k === "upcoming" && reservations.length > 0 && `(${reservations.length})`}
            </button>
          ))}
        </div>

        {tab === "book" && (<>
          <div className="p-label">Select a date</div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, marginBottom: 16 }}>
            {days.map(d => {
              const dow = new Date(d + "T12:00:00").getDay();
              const isWeekend = dow === 0 || dow === 6;
              return (
                <button key={d} onClick={() => { setSelectedDate(d); setSelectedSlot(""); }}
                  style={{ flexShrink: 0, padding: "10px 14px", borderRadius: 12,
                    border: selectedDate === d ? "2px solid var(--wave)" : "1.5px solid var(--border)",
                    background: selectedDate === d ? "rgba(42,143,189,.08)" : "var(--surface)",
                    cursor: "pointer", textAlign: "center", minWidth: 60 }}>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{DAYS[dow]}</div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginTop: 2 }}>{d.slice(8)}</div>
                  <div style={{ fontSize: 10, color: isWeekend ? "var(--gold)" : "var(--muted)", marginTop: 1 }}>
                    {isWeekend ? "9:30" : "3 slots"}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedDate && (<>
            <div className="p-label">Pick a slot</div>
            <div className="slot-grid" style={{ marginBottom: 20 }}>
              {slots.map(s => (
                <button key={s} className={`slot-chip ${selectedSlot === s ? "selected" : ""}`}
                  onClick={() => setSelectedSlot(s)}>
                  {SLOT_LABELS[s]}
                </button>
              ))}
            </div>
          </>)}

          {selectedDate && selectedSlot && (
            <div>
              <div className="p-notice p-notice-info" style={{ marginBottom: 14 }}>
                Booking <strong>{DAYS[new Date(selectedDate + "T12:00:00").getDay()]} {fmtShort(selectedDate + "T12:00:00")}</strong> at <strong>{SLOT_LABELS[selectedSlot]}</strong>. This will use 1 punch or 1 weekly session.
              </div>
              <button className="p-btn p-btn-primary p-btn-full" disabled={busy} onClick={handleBook}>
                {busy ? "Booking…" : "Confirm Reservation"}
              </button>
            </div>
          )}
        </>)}

        {tab === "upcoming" && (<>
          {reservations.length === 0
            ? <div className="p-notice p-notice-info">No upcoming reservations.</div>
            : reservations.map(r => {
                const d = new Date(r.session_date + "T12:00:00");
                const cutoff = new Date(r.session_date + "T21:00:00");
                cutoff.setDate(cutoff.getDate() - 1);
                const canCancel = new Date() < cutoff;
                return (
                  <div key={r.id} className="p-row">
                    <div className="p-row-icon">🏄</div>
                    <div className="p-row-main">
                      <div className="p-row-title">{DAYS[d.getDay()]} {fmtShort(r.session_date + "T12:00:00")}</div>
                      <div className="p-row-sub">{SLOT_LABELS[r.session_slot] || r.session_slot} · {r.lesson_type}</div>
                    </div>
                    {canCancel
                      ? <button className="p-btn p-btn-danger" style={{ fontSize: 12, padding: "6px 12px" }} disabled={busy} onClick={() => handleCancel(r.id)}>Cancel</button>
                      : <span style={{ fontSize: 11, color: "var(--muted)" }}>Locked</span>
                    }
                  </div>
                );
              })
          }
        </>)}
      </div>
    </div>
  );
}

// ─── PRIVATE LESSON TAB ───────────────────────────────────────────────────────
function PrivateTab({ student, flash }) {
  const [instructors, setInstructors] = useState([]);
  const [form, setForm] = useState({ instructorId: "", date: "", slot: "10am", notes: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    portalDb.getAvailableInstructors().then(setInstructors).catch(console.warn);
  }, []);

  async function handleSubmit() {
    if (!form.instructorId || !form.date) return;
    setBusy(true);
    try {
      const ins = instructors.find(i => i.id === form.instructorId);
      await portalDb.submitRequest(student.id, "private_lesson", {
        instructor_id: form.instructorId,
        instructor_name: ins?.name || "",
        date: form.date,
        slot: form.slot,
        notes: form.notes,
      });
      setSent(true);
      flash("✓ Private lesson request sent!");
    } catch (e) { flash("Error: " + e.message); }
    finally { setBusy(false); }
  }

  if (sent) return (
    <div className="p-section text-center" style={{ paddingTop: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🤙</div>
      <div style={{ fontFamily: "var(--font-head)", fontSize: 22, marginBottom: 8 }}>Request sent!</div>
      <div style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
        We'll confirm your private lesson and get back to you shortly.
      </div>
      <button className="p-btn p-btn-ghost" onClick={() => { setSent(false); setForm({ instructorId: "", date: "", slot: "10am", notes: "" }); }}>
        Request another
      </button>
    </div>
  );

  return (
    <div className="p-section">
      <div className="p-label">Request a private lesson</div>
      <div className="p-notice p-notice-info" style={{ marginBottom: 20 }}>
        Private lessons are subject to instructor availability and admin confirmation. Pricing will be confirmed before the lesson.
      </div>

      <div className="p-field">
        <label className="p-field-label">Choose an instructor</label>
        {instructors.length === 0
          ? <div style={{ color: "var(--muted)", fontSize: 13 }}>No instructors available for private lessons right now.</div>
          : instructors.map(ins => (
            <div key={ins.id} className={`p-opt-card ${form.instructorId === ins.id ? "selected" : ""}`}
              onClick={() => setForm(p => ({ ...p, instructorId: ins.id }))}>
              <div className="p-avatar" style={{ width: 40, height: 40, background: "var(--ocean)", fontSize: 14, color: "#fff" }}>
                {initials(ins.name)}
              </div>
              <div>
                <div className="p-opt-title">{ins.name}</div>
                <div className="p-opt-sub">Available for private lessons</div>
              </div>
            </div>
          ))
        }
      </div>

      <div className="p-field">
        <label className="p-field-label">Preferred date</label>
        <input className="p-input" type="date"
          min={localDateStr(1)}
          value={form.date}
          onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
      </div>

      <div className="p-field">
        <label className="p-field-label">Preferred time slot</label>
        <div className="slot-grid">
          {SLOTS.map(s => (
            <button key={s} className={`slot-chip ${form.slot === s ? "selected" : ""}`}
              onClick={() => setForm(p => ({ ...p, slot: s }))}>
              {SLOT_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="p-field">
        <label className="p-field-label">Notes (optional)</label>
        <textarea className="p-input" rows={3} placeholder="Anything you'd like us to know — skill level, goals, etc."
          value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
          style={{ resize: "none" }} />
      </div>

      <button className="p-btn p-btn-primary p-btn-full" disabled={busy || !form.instructorId || !form.date} onClick={handleSubmit}>
        {busy ? "Sending request…" : "Request Private Lesson"}
      </button>
    </div>
  );
}

// ─── SHOP TAB ─────────────────────────────────────────────────────────────────
function ShopTab({ student, flash }) {
  const [mode, setMode] = useState(null); // 'punch' | 'membership'
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const PUNCH_OPTS = [
    { id: "3", label: "3 punches", sub: "€60", punches: 3, price: 60 },
    { id: "5", label: "5 punches", sub: "€90 · most flexible", punches: 5, price: 90 },
    { id: "10", label: "10 punches", sub: "€160 · sweet spot", punches: 10, price: 160 },
    { id: "20", label: "20 punches", sub: "€220 · best value", punches: 20, price: 220 },
  ];
  const MEM_OPTS = [
    { id: "1x", label: "1× / week", sub: "€60 / month · ~4 sessions", sessions: 1 },
    { id: "2x", label: "2× / week", sub: "€90 / month · ~8 sessions", sessions: 2 },
    { id: "3x", label: "3× / week", sub: "€130 / month · ~12 sessions", sessions: 3 },
    { id: "unlimited", label: "Unlimited", sub: "€250 / month · surf every day", sessions: 99 },
  ];

  async function handleSubmit() {
    if (!selected) return;
    setBusy(true);
    try {
      const type = mode === "punch" ? "punch_topup" : "membership_change";
      const opt = mode === "punch" ? PUNCH_OPTS.find(o => o.id === selected) : MEM_OPTS.find(o => o.id === selected);
      await portalDb.submitRequest(student.id, type, { ...opt, notes });
      setSent(true);
      flash("✓ Request sent to admin!");
    } catch (e) { flash("Error: " + e.message); }
    finally { setBusy(false); }
  }

  if (sent) return (
    <div className="p-section text-center" style={{ paddingTop: 60 }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <div style={{ fontFamily: "var(--font-head)", fontSize: 22, marginBottom: 8 }}>Request received!</div>
      <div style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
        Your request has been sent to the team. Once payment is confirmed, your account will be updated automatically.
      </div>
      <button className="p-btn p-btn-ghost" onClick={() => { setSent(false); setMode(null); setSelected(null); setNotes(""); }}>
        Make another request
      </button>
    </div>
  );

  if (!mode) return (
    <div className="p-section">
      <div style={{ fontFamily: "var(--font-head)", fontSize: 22, marginBottom: 6 }}>Add to your plan</div>
      <div style={{ color: "var(--muted)", fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
        Submit a request and we'll activate your account once payment is received.
      </div>
      <button className="p-btn p-btn-ghost p-btn-full" style={{ justifyContent: "space-between", marginBottom: 10, padding: "16px 20px" }} onClick={() => setMode("punch")}>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontWeight: 600 }}>Buy punch card</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>From €60 for 3 punches</div>
        </div>
        <span style={{ color: "var(--wave)" }}>→</span>
      </button>
      <button className="p-btn p-btn-ghost p-btn-full" style={{ justifyContent: "space-between", padding: "16px 20px" }} onClick={() => setMode("membership")}>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontWeight: 600 }}>Change/add membership</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>From €60 / month</div>
        </div>
        <span style={{ color: "var(--wave)" }}>→</span>
      </button>
    </div>
  );

  const opts = mode === "punch" ? PUNCH_OPTS : MEM_OPTS;

  return (
    <div className="p-section">
      <button className="p-btn p-btn-ghost" style={{ marginBottom: 20, padding: "8px 14px", fontSize: 13 }} onClick={() => { setMode(null); setSelected(null); }}>
        ← Back
      </button>
      <div className="p-label">{mode === "punch" ? "Choose a punch card" : "Choose a membership tier"}</div>
      {opts.map(o => (
        <div key={o.id} className={`p-opt-card ${selected === o.id ? "selected" : ""}`}
          onClick={() => setSelected(o.id)}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: selected === o.id ? "var(--wave)" : "var(--surface2)", color: selected === o.id ? "#fff" : "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
            {selected === o.id ? "✓" : mode === "punch" ? o.punches : o.sessions + "×"}
          </div>
          <div>
            <div className="p-opt-title">{o.label}</div>
            <div className="p-opt-sub">{o.sub}</div>
          </div>
        </div>
      ))}
      {selected && (<>
        <div className="p-field" style={{ marginTop: 16 }}>
          <label className="p-field-label">Notes (optional)</label>
          <textarea className="p-input" rows={2} placeholder="e.g. Paying by Mbway, transferring this week…"
            value={notes} onChange={e => setNotes(e.target.value)} style={{ resize: "none" }} />
        </div>
        <button className="p-btn p-btn-primary p-btn-full" disabled={busy} onClick={handleSubmit}>
          {busy ? "Sending…" : "Submit Request"}
        </button>
      </>)}
    </div>
  );
}

// ─── PROFILE TAB ──────────────────────────────────────────────────────────────
function ProfileTab({ student, onUpdated, flash }) {
  const [form, setForm] = useState({ name: student?.name || "", email: student?.email || "", phone: student?.phone || "" });
  const [busy, setBusy] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);

  useEffect(() => {
    if (student) setForm({ name: student.name || "", email: student.email || "", phone: student.phone || "" });
  }, [student?.id]);

  async function handleSave() {
    setBusy(true);
    try {
      await portalDb.updateMyProfile(form);
      flash("✓ Profile updated!");
      onUpdated();
    } catch (e) { flash("Error: " + e.message); }
    finally { setBusy(false); }
  }

  async function handlePhotoUpload(e) {
    const file = e.target.files?.[0];
    if (!file || !student) return;
    setUploadBusy(true);
    try {
      const url = await portalDb.uploadPhoto(file, student.id);
      await portalDb.updateMyProfile({ photo_url: url });
      flash("✓ Photo updated!");
      onUpdated();
    } catch (e) { flash("Could not upload photo: " + e.message); }
    finally { setUploadBusy(false); }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  if (!student) return null;

  return (
    <div className="p-section">
      {/* Photo */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <div className="photo-upload-ring">
          {student.photo_url
            ? <img src={student.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: 28, color: "var(--wave)" }}>+</span>
          }
          <input type="file" accept="image/*" onChange={handlePhotoUpload} />
        </div>
        <div>
          <div style={{ fontWeight: 600 }}>{uploadBusy ? "Uploading…" : "Tap to change photo"}</div>
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>JPG or PNG, max 5 MB</div>
        </div>
      </div>

      <div className="p-field">
        <label className="p-field-label">Full name</label>
        <input className="p-input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
      </div>
      <div className="p-field">
        <label className="p-field-label">Email</label>
        <input className="p-input" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
      </div>
      <div className="p-field">
        <label className="p-field-label">Phone</label>
        <input className="p-input" type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+351 912 345 678" />
      </div>

      <button className="p-btn p-btn-primary p-btn-full" style={{ marginBottom: 12 }} disabled={busy || !form.name.trim()} onClick={handleSave}>
        {busy ? "Saving…" : "Save Changes"}
      </button>

      {/* Plan status summary */}
      <div className="p-label" style={{ marginTop: 24 }}>My plan</div>
      {student.memberships?.[0] && (
        <div className="p-row">
          <div className="p-row-icon">🏅</div>
          <div className="p-row-main">
            <div className="p-row-title">Membership</div>
            <div className="p-row-sub">
              {student.memberships[0].active !== false ? `Active · valid until ${student.memberships[0].valid_until || "—"}` : "Payment pending"}
            </div>
          </div>
          <span className={`status-pill ${student.memberships[0].active !== false ? "status-active" : "status-pending"}`}>
            <span className="status-dot" />{student.memberships[0].active !== false ? "Active" : "Pending"}
          </span>
        </div>
      )}
      {student.punch_cards?.[0] && (
        <div className="p-row">
          <div className="p-row-icon">🎟️</div>
          <div className="p-row-main">
            <div className="p-row-title">Punch card</div>
            <div className="p-row-sub">{student.punch_cards[0].balance} punches remaining</div>
          </div>
          <span className={`status-pill ${student.punch_cards[0].active !== false ? "status-active" : "status-pending"}`}>
            <span className="status-dot" />{student.punch_cards[0].active !== false ? "Active" : "Pending"}
          </span>
        </div>
      )}

      <button className="p-btn p-btn-ghost p-btn-full" style={{ marginTop: 32, color: "var(--coral)" }} onClick={handleSignOut}>
        Sign out
      </button>
    </div>
  );
}

// ─── NAV ICONS ────────────────────────────────────────────────────────────────
function NavIcon({ tab }) {
  const icons = {
    home: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    reserve: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    qr: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/>
      </svg>
    ),
    shop: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
    ),
    profile: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
    ),
  };
  return <div className="nav-icon">{icons[tab] || null}</div>;
}

// ─── PORTAL APP ───────────────────────────────────────────────────────────────
export default function Portal() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);
  const [noAccount, setNoAccount] = useState(false);
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState("home");
  const [flashMsg, flash] = useFlash();

  // Inject CSS immediately — synchronous so it's ready before first paint
  useEffect(() => {
    const existing = document.getElementById("portal-css");
    if (existing) return;
    const style = document.createElement("style");
    style.id = "portal-css";
    style.innerHTML = PORTAL_CSS;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById("portal-css");
      if (el) document.head.removeChild(el);
    };
  }, []);

  // Auth listener — onAuthStateChange is the single source of truth.
  // It fires immediately with the current session AND handles incoming
  // magic link tokens from the URL hash automatically.
  useEffect(() => {
    // First, let onAuthStateChange handle everything including hash tokens
    const { data: listener } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      setLoading(false);
      // Clean the hash from the URL after a magic link lands
      if (event === "SIGNED_IN" && window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }
    });

    // Also call getSession as a fallback for when there's no auth event
    // (e.g. already logged in, page refresh)
    supabase.auth.getSession()
      .then(({ data }) => {
        if (data.session) {
          setSession(data.session);
        }
        // Always clear loading after getSession resolves,
        // unless onAuthStateChange already cleared it
        setLoading(false);
      })
      .catch(() => setLoading(false));

    return () => listener.subscription.unsubscribe();
  }, []);

  // Load student data
  const loadStudent = useCallback(async () => {
    if (!session) return;
    try {
      const s = await portalDb.getMyStudent();
      setStudent(s);
      setNoAccount(false);
      const reqs = await portalDb.getMyRequests(s.id);
      setRequests(reqs);
    } catch (e) {
      console.warn("[portal] load student:", e);
      // If no student record found for this auth user, show a "not linked" state
      if (e.code === "PGRST116" || e.message?.includes("JSON object requested") || e.message?.includes("0 rows")) {
        setNoAccount(true);
      }
    }
  }, [session]);

  useEffect(() => { loadStudent(); }, [loadStudent]);

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#1a3a4a", color: "#fff", fontFamily: "Georgia, serif", fontSize: 22 }}>
      Penas' SurfTrack
    </div>
  );

  if (!session) return <LoginScreen onLogin={() => {}} />;

  if (noAccount) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#eef6fb", padding: 32, textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🏄</div>
      <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 8, color: "#1a3a4a" }}>Account not linked</div>
      <div style={{ fontSize: 14, color: "#6b7f8c", lineHeight: 1.7, maxWidth: 320, marginBottom: 24 }}>
        Your email is not yet connected to a student record. Please contact Penas Surf School to get your portal access set up.
      </div>
      <div style={{ fontSize: 13, color: "#6b7f8c", marginBottom: 24 }}>Signed in as: <strong>{session.user?.email}</strong></div>
      <button onClick={() => supabase.auth.signOut().then(() => window.location.reload())}
        style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "#1a3a4a", color: "#fff", cursor: "pointer", fontSize: 14 }}>
        Sign out
      </button>
    </div>
  );

  const NAV_TABS = ["home", "reserve", "qr", "shop", "profile"];
  const NAV_LABELS = { home: "Home", reserve: "Book", qr: "QR", shop: "Plans", profile: "Me" };

  const tabTitles = {
    home: student?.name?.split(" ")[0] || "Home",
    reserve: "Book a Class",
    qr: "My QR Code",
    shop: "Plans",
    private: "Private Lesson",
    profile: "My Profile",
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div className="portal-shell">
      <div className="portal-header">
        <div>
          <div className="portal-header-title">{tabTitles[tab] || "SurfTrack"}</div>
          <div className="portal-header-sub">Penas Surf School</div>
        </div>
        {student?.photo_url
          ? <img src={student.photo_url} alt="" className="p-avatar" style={{ width: 36, height: 36 }} onClick={() => setTab("profile")} />
          : <div className="p-avatar" style={{ width: 36, height: 36, background: "rgba(255,255,255,.15)", fontSize: 14, cursor: "pointer" }} onClick={() => setTab("profile")}>
              {initials(student?.name)}
            </div>
        }
      </div>

      <div className="portal-content">
        {tab === "home"    && <HomeTab student={student} requests={requests} onTabChange={setTab} />}
        {tab === "reserve" && <ReserveTab student={student} flash={flash} />}
        {tab === "qr"      && <QRTab student={student} />}
        {tab === "shop"    && <ShopTab student={student} flash={flash} />}
        {tab === "private" && <PrivateTab student={student} flash={flash} />}
        {tab === "profile" && <ProfileTab student={student} onUpdated={loadStudent} flash={flash} />}
      </div>

      <nav className="portal-nav">
        {NAV_TABS.map(t => (
          <div key={t} className={`nav-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)} style={{ position: "relative" }}>
            <NavIcon tab={t} />
            <span>{NAV_LABELS[t]}</span>
            {t === "shop" && pendingCount > 0 && <div className="nav-badge" />}
          </div>
        ))}
      </nav>

      {flashMsg && <div className="portal-flash">{flashMsg}</div>}
    </div>
  );
}
