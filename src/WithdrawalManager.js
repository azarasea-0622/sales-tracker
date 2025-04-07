import React, { useEffect, useState } from "react";
import { db } from "./lib/firebase";
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  query,
  orderBy,
} from "firebase/firestore";

// 税抜＆75%の振込金額計算
const calcPayout = (amount) => {
  const taxExcluded = amount / 1.1;
  return Math.round(taxExcluded * 0.75);
};

const toKatakana = (str = "") =>
  str.replace(/[\u3041-\u3096]/g, (match) =>
    String.fromCharCode(match.charCodeAt(0) + 0x60)
  );

export default function WithdrawalManager() {
  const [sales, setSales] = useState([]);
  const [livers, setLivers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]); // ✅ 選択状態を管理

  useEffect(() => {
    fetchLivers();
    fetchSales();
  }, []);

  const fetchLivers = async () => {
    const snapshot = await getDocs(collection(db, "livers"));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setLivers(data);
  };

  const fetchSales = async () => {
    const q = query(collection(db, "sales"), orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((s) => !s.withdrawn);
    setSales(data);
  };

  const getLiverName = (id) => {
    const liver = livers.find((l) => l.id === id);
    return liver ? liver.displayName : "不明";
  };

  const handleToggle = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleMarkAsWithdrawn = async (id) => {
    await updateDoc(doc(db, "sales", id), { withdrawn: true });
    setSales((prev) => prev.filter((s) => s.id !== id));
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const handleMarkSelectedAsWithdrawn = async () => {
    const updates = selectedIds.map((id) =>
      updateDoc(doc(db, "sales", id), { withdrawn: true })
    );
    await Promise.all(updates);
    setSales((prev) => prev.filter((s) => !selectedIds.includes(s.id)));
    setSelectedIds([]);
  };

  const filteredSales = sales.filter((s) => {
    const name = toKatakana(getLiverName(s.liverId).toLowerCase());
    const memo = toKatakana((s.memo || "").toLowerCase());
    const keyword = toKatakana(searchTerm.toLowerCase());
    return name.includes(keyword) || memo.includes(keyword);
  });

  const selectedPayoutTotal = filteredSales
    .filter((s) => selectedIds.includes(s.id))
    .reduce((sum, s) => sum + calcPayout(s.amount), 0);

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h2 style={{ color: "#DAA520" }}>出金管理</h2>

      <input
        placeholder="検索（ライバー名・メモ）"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={inputStyle}
      />

      {selectedIds.length > 0 && (
        <div style={{ margin: "10px 0", fontWeight: "bold" }}>
          ✅ 選択件数：{selectedIds.length}件 / 振込合計：¥
          {selectedPayoutTotal.toLocaleString()}
          <button onClick={handleMarkSelectedAsWithdrawn} style={buttonStyle}>
            選択を出金済みにする
          </button>
        </div>
      )}

      <ul style={{ marginTop: "10px" }}>
        {filteredSales.map((s) => (
          <li key={s.id} style={listItemStyle}>
            <label>
              <input
                type="checkbox"
                checked={selectedIds.includes(s.id)}
                onChange={() => handleToggle(s.id)}
              />{" "}
              [{new Date(s.date).toLocaleDateString()}] {getLiverName(s.liverId)} / ¥
              {s.amount} → 振込：¥{calcPayout(s.amount)}
            </label>
            <button
              onClick={() => handleMarkAsWithdrawn(s.id)}
              style={miniButton}
            >
              出金済みに
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginBottom: "15px",
  border: "1px solid #ccc",
  borderRadius: "8px",
};

const buttonStyle = {
  backgroundColor: "#FFB800",
  border: "none",
  padding: "10px 20px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
  color: "#fff",
  marginLeft: "10px",
};

const miniButton = {
  backgroundColor: "#4CAF50",
  border: "none",
  padding: "6px 10px",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "0.85em",
  color: "#fff",
  marginLeft: "10px",
};

const listItemStyle = {
  padding: "10px 0",
  borderBottom: "1px solid #ddd",
};
