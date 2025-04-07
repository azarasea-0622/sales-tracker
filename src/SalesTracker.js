import React, { useEffect, useState } from "react";
import { db } from "./lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";
import Modal from "./components/Modal";

const toKatakana = (str = "") =>
  str.replace(/[\u3041-\u3096]/g, (match) =>
    String.fromCharCode(match.charCodeAt(0) + 0x60)
  );

export default function SalesTracker() {
  const [sales, setSales] = useState([]);
  const [livers, setLivers] = useState([]);
  const [form, setForm] = useState({
    liverName: "",
    amount: "",
    type: "subscription",
    memo: "",
    date: "", // 🔥 日付追加
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchLivers();
    fetchSales();
  }, []);

  const fetchLivers = async () => {
    const snapshot = await getDocs(query(collection(db, "livers"), orderBy("displayName")));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setLivers(data);
  };

  const fetchSales = async () => {
    const snapshot = await getDocs(query(collection(db, "sales"), orderBy("date", "desc")));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setSales(data);
  };

  const getLiverName = (id) => {
    const found = livers.find((l) => l.id === id);
    return found ? found.displayName : "不明";
  };

  const handleSubmit = async () => {
    const selectedLiver = livers.find(
      (l) =>
        toKatakana(l.displayName.toLowerCase()) ===
        toKatakana(form.liverName.toLowerCase())
    );
    if (!selectedLiver || !form.amount) {
      alert("ライバー名 or 金額が正しくありません！");
      return;
    }

    const saleDate = form.date ? new Date(form.date).toISOString() : new Date().toISOString();

    const data = {
      liverId: selectedLiver.id,
      amount: Number(form.amount),
      type: form.type,
      memo: form.memo,
      withdrawn: false,
      date: saleDate,
    };

    if (editId) {
      await updateDoc(doc(db, "sales", editId), data);
      setSales((prev) =>
        prev.map((s) => (s.id === editId ? { ...data, id: editId } : s))
      );
    } else {
      const docRef = await addDoc(collection(db, "sales"), data);
      setSales((prev) => [...prev, { ...data, id: docRef.id }]);
    }

    setModalOpen(false);
    setForm({
      liverName: "",
      amount: "",
      type: "subscription",
      memo: "",
      date: "",
    });
    setEditId(null);
    setShowSuggestions(false);
  };

  const handleEdit = (sale) => {
    const liver = livers.find((l) => l.id === sale.liverId);
    const yyyyMMdd = sale.date?.substring(0, 10);
    setForm({
      liverName: liver ? liver.displayName : "",
      amount: sale.amount,
      type: sale.type,
      memo: sale.memo,
      date: yyyyMMdd || "",
    });
    setEditId(sale.id);
    setModalOpen(true);
    setShowSuggestions(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm("削除してもよいですか？")) {
      await deleteDoc(doc(db, "sales", id));
      setSales((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const filteredSales = sales.filter((s) => {
    const name = toKatakana(getLiverName(s.liverId).toLowerCase());
    const memo = toKatakana((s.memo || "").toLowerCase());
    const keyword = toKatakana(searchTerm.toLowerCase());
    return name.includes(keyword) || memo.includes(keyword);
  });

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h2 style={{ color: "#DAA520", display: "flex", justifyContent: "space-between" }}>
        売上管理
        <button onClick={() => setModalOpen(true)} style={buttonStyle}>＋ 売上登録</button>
      </h2>

      <input
        placeholder="検索（ライバー名・メモ）"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ ...inputStyle, marginBottom: "15px" }}
      />
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={thStyle}>日付</th>
            <th style={thStyle}>ライバー名</th>
            <th style={thStyle}>金額</th>
            <th style={thStyle}>種別</th>
            <th style={thStyle}>出金</th>
            <th style={thStyle}>メモ</th>
            <th style={thStyle}>操作</th>
          </tr>
        </thead>
        <tbody>
          {filteredSales.map((s) => (
            <tr key={s.id}>
              <td style={tdStyle}>{new Date(s.date).toLocaleDateString()}</td>
              <td style={tdStyle}>{getLiverName(s.liverId)}</td>
              <td style={tdStyle}>¥{s.amount.toLocaleString()}</td>
              <td style={tdStyle}>{s.type === "subscription" ? "サブスク" : "寄付"}</td>
              <td style={tdStyle}>
                <span style={{ color: s.withdrawn ? "green" : "red", fontWeight: "bold" }}>
                  {s.withdrawn ? "済" : "未"}
                </span>
              </td>
              <td style={tdStyle}>{s.memo}</td>
              <td style={tdStyle}>
                <button onClick={() => handleEdit(s)} style={miniButton}>編集</button>
                <button onClick={() => handleDelete(s.id)} style={{ ...miniButton, backgroundColor: "#f44336" }}>
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <h3>{editId ? "売上を編集" : "売上を登録"}</h3>

        <div style={{ position: "relative" }}>
          <input
            placeholder="ライバー名（ひらがなOK）"
            value={form.liverName}
            onChange={(e) => {
              setForm({ ...form, liverName: e.target.value });
              setShowSuggestions(true);
            }}
            style={inputStyle}
            autoComplete="off"
          />
          {form.liverName && showSuggestions && (
            <div style={suggestionBox}>
              {livers
                .filter((l) =>
                  toKatakana(l.displayName.toLowerCase()).includes(
                    toKatakana(form.liverName.toLowerCase())
                  )
                )
                .map((l) => (
                  <div
                    key={l.id}
                    style={suggestionItem}
                    onClick={() => {
                      setForm({ ...form, liverName: l.displayName });
                      setShowSuggestions(false);
                    }}
                  >
                    {l.displayName}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* 📅 カレンダー日付入力 */}
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          style={inputStyle}
        />

        <input
          type="number"
          placeholder="金額"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          style={inputStyle}
        />

        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          style={inputStyle}
        >
          <option value="subscription">サブスク</option>
          <option value="donation">寄付</option>
        </select>

        <input
          placeholder="メモ（任意）"
          value={form.memo}
          onChange={(e) => setForm({ ...form, memo: e.target.value })}
          style={inputStyle}
        />

        <button onClick={handleSubmit} style={{ ...buttonStyle, marginTop: "10px" }}>
          {editId ? "更新する" : "記録する"}
        </button>
      </Modal>
    </div>
  );
}

const inputStyle = {
  display: "block",
  margin: "10px 0",
  width: "100%",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
  boxSizing: "border-box",
};

const buttonStyle = {
  backgroundColor: "#FFD966",
  border: "none",
  padding: "10px 20px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};

const thStyle = {
  background: "#f4f4f4",
  padding: "8px",
  borderBottom: "1px solid #ccc",
  textAlign: "left",
};

const tdStyle = {
  padding: "8px",
  borderBottom: "1px solid #eee",
};

const miniButton = {
  backgroundColor: "#FFB800",
  border: "none",
  padding: "6px 10px",
  marginRight: "6px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.85em",
  color: "#fff",
};

const suggestionBox = {
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  background: "#fff",
  border: "1px solid #ccc",
  maxHeight: "150px",
  overflowY: "auto",
  zIndex: 10,
  borderRadius: "5px",
};

const suggestionItem = {
  padding: "8px",
  cursor: "pointer",
  borderBottom: "1px solid #eee",
};
