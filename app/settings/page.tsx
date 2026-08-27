"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../firebase/config";
import {
  onAuthStateChanged,
  updateEmail,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  writeBatch
} from "firebase/firestore";
import { useTheme } from "../components/ThemeProvider";

export default function SettingsPage() {
  const router = useRouter();
  const { darkMode, setDarkMode, fontSize, setFontSize } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [blocked, setBlocked] = useState<any[]>([]);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/"); return; }
      setUser(u);
      const snap = await getDocs(collection(db, `users/${u.uid}/blocks`));
      const list = await Promise.all(snap.docs.map(async d => {
        const ud = await getDoc(doc(db, "users", d.id));
        return { id: d.id, ...ud.data() };
      }));
      setBlocked(list);
    });
    return () => unsub();
  }, []);

  const handleChangeEmail = async () => {
    if (!newEmail || !password) return;
    setLoading(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, cred);
      await updateEmail(user, newEmail);
      await updateDoc(doc(db, "users", user.uid), { email: newEmail });
      setShowEmailModal(false);
      setNewEmail(""); setPassword("");
    } catch (e: any) {
      alert(e.message);
    }
    setLoading(false);
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      const cols = ["friends", "blocks", "chats", "posts", "friendRequests"];
      for (const c of cols) {
        const snap = await getDocs(collection(db, `users/${user.uid}/${c}`));
        snap.forEach(d => batch.delete(d.ref));
      }
      const allUsers = await getDocs(collection(db, "users"));
      allUsers.forEach(u => {
        batch.delete(doc(db, `users/${u.id}/friends/${user.uid}`));
        batch.delete(doc(db, `users/${u.id}/blocks/${user.uid}`));
      });
      batch.delete(doc(db, "users", user.uid));
      await batch.commit();
      await deleteUser(user);
      router.push("/");
    } catch (e: any) {
      await signOut(auth);
      router.push("/");
    }
    setLoading(false);
  };

  const handleUnblock = async (id: string) => {
    await deleteDoc(doc(db, `users/${user.uid}/blocks/${id}`));
    setBlocked(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div style={{ minHeight: "100vh", background: darkMode ? "#111" : "#fff", color: darkMode ? "#fff" : "#000", fontSize: fontSize + "px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderBottom: `1px solid ${darkMode ? "#222" : "#eee"}` }}>
        <button onClick={() => router.back()} style={{ fontSize: 28, background: "none", border: "none", cursor: "pointer", color: darkMode ? "#fff" : "#000" }}>←</button>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Settings</h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={rowStyle(darkMode)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={iconStyle}>🌙</span><span>Dark mode</span></div>
          <label className="switch"><input type="checkbox" checked={darkMode} onChange={e => setDarkMode(e.target.checked)} /><span className="slider"></span></label>
        </div>

        <div style={rowStyle(darkMode)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={iconStyle}>🔤</span><span>Font size</span></div>
          <select value={fontSize} onChange={e => setFontSize(Number(e.target.value))} style={selectStyle(darkMode)}>
            <option value={14}>Small</option><option value={16}>Medium</option><option value={18}>Large</option><option value={20}>Extra Large</option>
          </select>
        </div>

        <div style={rowStyle(darkMode)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={iconStyle}>🚫</span><span>Block List ({blocked.length})</span></div>
          <span style={{ opacity: 0.5 }}>›</span>
        </div>

        <div style={rowStyle(darkMode)} onClick={() => setShowEmailModal(true)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={iconStyle}>✉️</span><span>Change email</span></div>
          <span style={{ opacity: 0.5 }}>›</span>
        </div>

        <div style={{...rowStyle(darkMode), color: "#ef4444"}} onClick={() => setShowDeleteModal(true)}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span style={iconStyle}>🗑️</span><span style={{ fontWeight: 600 }}>Delete account</span></div>
          <span>›</span>
        </div>
      </div>

      <div style={{ padding: 14 }}>
        <h3 style={{ margin: "16px 0", fontWeight: 700 }}>Blocked Users</h3>
        {blocked.length === 0 && <p style={{ opacity: 0.6 }}>No blocked users</p>}
        {blocked.map(b => (
          <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${darkMode ? "#222" : "#eee"}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src={b.photoURL || "/default.png"} style={{ width: 36, height: 36, borderRadius: "50%" }} />
              <span>{b.displayName || b.email}</span>
            </div>
            <button onClick={() => handleUnblock(b.id)} style={{ background: "#7c3aed", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, cursor: "pointer" }}>Unblock</button>
          </div>
        ))}
      </div>

      {showEmailModal && (
        <Modal title="Change Email">
          <p style={{ fontSize: 13, opacity: 0.7, marginBottom: 12 }}>Your new email will keep your account. Old email will become fresh.</p>
          <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="New email" style={inputStyle(darkMode)} />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Current password" style={inputStyle(darkMode)} />
          <div style={modalBtnRow}>
            <button onClick={() => setShowEmailModal(false)} style={cancelBtn}>Cancel</button>
            <button onClick={handleChangeEmail} style={okBtn}>{loading ? "..." : "Change Email"}</button>
          </div>
        </Modal>
      )}

      {showDeleteModal && (
        <Modal title="Delete Account?">
          <p style={{ fontSize: 14, lineHeight: "20px", marginBottom: 18 }}>
            If you delete your account, all your account data will be permanently deleted and you will not be able to login again. Your email will become a fresh account.
          </p>
          <div style={modalBtnRow}>
            <button onClick={() => setShowDeleteModal(false)} style={cancelBtn}>Cancel</button>
            <button onClick={handleDeleteAccount} style={{...okBtn, background: "#ef4444"}}>{loading ? "..." : "Delete account"}</button>
          </div>
        </Modal>
      )}

      <style>{`.switch{position:relative;display:inline-block;width:42px;height:24px}.switch input{opacity:0;width:0;height:0}.slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#ccc;border-radius:24px;transition:.3s}.slider:before{content:"";position:absolute;height:18px;width:18px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.3s}input:checked + .slider{background:#7c3aed}input:checked + .slider:before{transform:translateX(18px)}`}</style>
    </div>
  );
}

function Modal({ title, children }: any) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20 }}>
      <div style={{ background: "#fff", color: "#000", borderRadius: 16, padding: 20, width: "100%", maxWidth: 340 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 18 }}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

const rowStyle = (dark: boolean): any => ({ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 14px", borderBottom: `1px solid ${dark ? "#222" : "#f1f1f1"}`, cursor: "pointer" });
const iconStyle: any = { fontSize: 20, width: 26, textAlign: "center" };
const selectStyle = (dark: boolean): any => ({ borderRadius: 8, padding: "6px 10px", border: `1px solid ${dark ? "#333" : "#ddd"}`, background: dark ? "#222" : "#fff", color: dark ? "#fff" : "#000" });
const inputStyle = (dark: boolean): any => ({ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #ddd", marginBottom: 10, outline: "none", boxSizing: "border-box" });
const modalBtnRow: any = { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 10 };
const cancelBtn: any = { padding: "10px 18px", borderRadius: 20, border: "1px solid #ddd", background: "#fff", cursor: "pointer" };
const okBtn: any = { padding: "10px 18px", borderRadius: 20, border: "none", background: "#7c3aed", color: "#fff", cursor: "pointer", fontWeight: 600 };
