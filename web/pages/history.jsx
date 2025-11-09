// web/pages/history.jsx
import React, { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import {
  auth,
  exportArrayToCSV,
  listAllPredictions,
  listPredictionsByUser,
  normalizeDocForCSV,
  updatePrediction,
  deletePrediction,
} from "../src/lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

const PIN = process.env.NEXT_PUBLIC_ADMIN_PIN;
const ADMIN_UID = process.env.NEXT_PUBLIC_ADMIN_UID;

function labelFrom(pred, probs) {
  const p = Number(pred);
  if (p === 0 || p === 1 || p === 2) return p === 2 ? "High" : p === 1 ? "Moderate" : "Low";
  if (Array.isArray(probs) && probs.length >= 3) {
    const max = Math.max(probs[0] || 0, probs[1] || 0, probs[2] || 0);
    const i = [probs[0] || 0, probs[1] || 0, probs[2] || 0].indexOf(max);
    return i === 2 ? "High" : i === 1 ? "Moderate" : "Low";
  }
  return "-";
}
function colorForRisk(lbl) {
  return lbl === "High" ? "#ef4444" : lbl === "Moderate" ? "#f59e0b" : lbl === "Low" ? "#10b981" : "#334155";
}

export default function HistoryPage() {
  const [authUser, setAuthUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [pinOk, setPinOk] = useState(false); // admin path
  const [isAdmin, setIsAdmin] = useState(false);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // admin sign-in form (optional, only if PIN entered)
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [authError, setAuthError] = useState("");

  // 1) Track auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUser(u || null);
      setLoadingAuth(false);
      setIsAdmin(!!u && u.uid === ADMIN_UID);
    });
    return () => unsub();
  }, []);

  // 2) If admin wants full history → PIN gate
  useEffect(() => {
    if (!isAdmin) return;
    const cached = typeof window !== "undefined" ? sessionStorage.getItem("hist_auth") : null;
    if (cached && PIN && cached === PIN) {
      setPinOk(true);
    } else {
      const attempt = typeof window !== "undefined" ? window.prompt("Enter admin PIN to view all history:") : "";
      if (PIN && attempt === PIN) {
        sessionStorage.setItem("hist_auth", attempt);
        setPinOk(true);
      } else {
        setErr("Not authorized for admin history.");
      }
    }
  }, [isAdmin]);

  async function refresh() {
    setLoading(true);
    setErr("");
    try {
      if (isAdmin && pinOk) {
        const data = await listAllPredictions(500);
        setRows(data || []);
      } else if (authUser) {
        const mine = await listPredictionsByUser(authUser.uid, 200);
        setRows(mine || []);
      } else {
        setRows([]);
      }
    } catch (e) {
      setErr(String(e?.message || e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // 3) Load data
  useEffect(() => {
    if (loadingAuth) return;
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingAuth, isAdmin, pinOk, authUser]);

  const summary = useMemo(() => {
    const out = { total: rows.length, low: 0, mod: 0, high: 0 };
    rows.forEach((r) => {
      const res0 = r?.apiResponse?.results?.[0] || {};
      const lbl = labelFrom(res0.pred_risk, res0.probs);
      if (lbl === "Low") out.low++;
      else if (lbl === "Moderate") out.mod++;
      else if (lbl === "High") out.high++;
    });
    return out;
  }, [rows]);

  function exportCSV() {
    if (!rows?.length) return;
    const normalized = rows.map(normalizeDocForCSV);
    exportArrayToCSV("predictions.csv", normalized, [
      "id",
      "createdAt",
      "userId",
      "name",
      "age",
      "gender",
      "psqi_global",
      "rem_total_min",
      "rem_latency_min",
      "rem_pct",
      "pred_risk",
      "prob_low",
      "prob_moderate",
      "prob_high",
    ]);
  }

  async function doAdminSignIn(e) {
    e.preventDefault();
    setSigningIn(true);
    setAuthError("");
    try {
      if (!adminEmail || !adminPass) throw new Error("Enter admin email and password.");
      const cred = await signInWithEmailAndPassword(auth, adminEmail, adminPass);
      if (cred.user.uid !== ADMIN_UID) {
        await signOut(auth);
        throw new Error("This account is not the configured admin (UID mismatch).");
      }
    } catch (e) {
      setAuthError(e?.message || "Sign-in failed");
    } finally {
      setSigningIn(false);
    }
  }

  async function doSignOut() {
    await signOut(auth);
  }

  async function onDelete(row) {
    if (!authUser) return;
    const can = authUser.uid === row.userId || authUser.uid === ADMIN_UID;
    if (!can) return alert("Not allowed.");
    if (!confirm("Delete this record permanently?")) return;
    try {
      await deletePrediction(row.userId, row.id);
      await refresh();
    } catch (e) {
      alert("Delete failed: " + String(e?.message || e));
    }
  }

  async function onEdit(row) {
    if (!authUser) return;
    const can = authUser.uid === row.userId || authUser.uid === ADMIN_UID;
    if (!can) return alert("Not allowed.");

    const name = prompt("Patient name:", row?.personalInfo?.name || "");
    if (name == null) return;
    const ageStr = prompt("Age:", String(row?.personalInfo?.age ?? ""));
    if (ageStr == null) return;
    const gender = prompt("Gender:", row?.personalInfo?.gender || "");
    if (gender == null) return;

    const age = Number(ageStr) || ageStr;
    const newPI = { ...(row.personalInfo || {}), name, age, gender };
    try {
      await updatePrediction(row.userId, row.id, { personalInfo: newPI });
      await refresh();
    } catch (e) {
      alert("Update failed: " + String(e?.message || e));
    }
  }

  return (
    <div style={{ maxWidth: 1100, margin: "24px auto", padding: 16 }}>
      <Head><title>History</title></Head>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>📚 History</h1>
        <div>
          <Link href="/" style={{ marginRight: 12 }}>← Back to App</Link>
          {(isAdmin && pinOk && rows.length > 0) && <button onClick={exportCSV} style={btnPrimary}>⬇ Export CSV</button>}
          {authUser && <button onClick={doSignOut} style={btn}>Sign out</button>}
        </div>
      </div>

      {/* Admin but not signed in yet */}
      {isAdmin && !authUser && (
        <form onSubmit={doAdminSignIn} style={{ display: "grid", gap: 12, maxWidth: 360, marginBottom: 16 }}>
          <input
            type="email"
            placeholder="Admin email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            style={inp}
          />
          <input
            type="password"
            placeholder="Password"
            value={adminPass}
            onChange={(e) => setAdminPass(e.target.value)}
            style={inp}
          />
          {authError && <div style={alertErr}>{authError}</div>}
          <button type="submit" style={btnPrimary} disabled={signingIn}>
            {signingIn ? "Signing in…" : "Sign in"}
          </button>
        </form>
      )}

      {err && <div style={alertErr}>{err}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : rows.length === 0 ? (
        <div style={emptyBox}>No records yet.</div>
      ) : (
        <>
          {/* Summary cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12, marginBottom: 16 }}>
            <KPI title="Total Analyses" value={summary.total} color="#2563eb" />
            <KPI title="Low Risk" value={summary.low} color="#10b981" />
            <KPI title="Moderate Risk" value={summary.mod} color="#f59e0b" />
            <KPI title="High Risk" value={summary.high} color="#ef4444" />
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>When</th>
                  <th style={th}>Name</th>
                  <th style={th}>Age</th>
                  <th style={th}>Gender</th>
                  <th style={th}>PSQI</th>
                  <th style={th}>Risk</th>
                  <th style={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const firstRow = Array.isArray(r?.rows) && r.rows.length ? r.rows[0] : {};
                  const res0 = r?.apiResponse?.results?.[0] || {};
                  const riskLabel = labelFrom(res0.pred_risk, res0.probs);
                  const when = r?.createdAtDate
                    ? r.createdAtDate
                    : (r?.createdAt?.toDate ? r.createdAt.toDate() : null);
                  const canEdit = authUser && (authUser.uid === r.userId || authUser.uid === ADMIN_UID);
                  return (
                    <tr key={r.id}>
                      <td style={td}>{when ? when.toLocaleString() : "-"}</td>
                      <td style={td}>{r?.personalInfo?.name || "-"}</td>
                      <td style={td}>{r?.personalInfo?.age ?? "-"}</td>
                      <td style={td}>{r?.personalInfo?.gender || "-"}</td>
                      <td style={td}>{firstRow?.psqi_global ?? "-"}</td>
                      <td style={{ ...td, fontWeight: 600, color: colorForRisk(riskLabel) }}>{riskLabel}</td>
                      <td style={td}>
                        <Link href={`/patient/${r.userId || (authUser?.uid || "")}/${r.id}`} style={{ color: "#2563eb", marginRight: 10 }}>
                          View
                        </Link>
                        {canEdit && (
                          <>
                            <button onClick={() => onEdit(r)} style={btnSmall}>Edit</button>
                            <button onClick={() => onDelete(r)} style={btnSmallDanger}>Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function KPI({ title, value, color }) {
  return (
    <div style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
      <div style={{ fontSize: 12, color: "#475569" }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

const btn = { padding: "8px 12px", borderRadius: 8, background: "#e2e8f0", border: "none", cursor: "pointer" };
const btnPrimary = { ...btn, background: "#2563eb", color: "#fff" };
const btnSmall = { ...btn, padding: "6px 8px", marginRight: 6 };
const btnSmallDanger = { ...btnSmall, background: "#fee2e2", color: "#991b1b" };

const table = { width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 720 };
const th = { textAlign: "left", padding: "10px 8px", borderBottom: "1px solid #e2e8f0" };
const td = { padding: "8px 8px", borderBottom: "1px solid #f1f5f9" };
const alertErr = { padding: 12, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, color: "#991b1b" };
const emptyBox = { padding: 16, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8 };
const inp = { padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, width: "100%" };
