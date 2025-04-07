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

const toKatakana = (str = "") =>
  str.replace(/[\u3041-\u3096]/g, (match) =>
    String.fromCharCode(match.charCodeAt(0) + 0x60)
  );

export default function WithdrawalManager() {
  const [sales, setSales] = useState([]);
  const [livers, setLivers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAll, setShowAll] = useState(false); // 🔁 すべて表示切替

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
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setSales(data);
  };

  const getLiverName = (id) => {
    const liver = livers.find((l) => l.id === id);
    return liver ? liver.displayName : "不明";
  };

  const setWithdrawnState = async (id, state) => {
    await updateDoc(doc(db, "sales", id), { withdrawn: state });
    setSales((prev) =>
      prev.map((s) => (s.id === id ? { ...s, withdrawn: state } : s))
    );
  };

  const markAllAsWithdrawn = async () => {
    const updates = filteredSales
      .filter((s) => !s.withdrawn)
      .map((s) => updateDoc(doc(db, "sales", s.id), { withdrawn: true }));
    await Promise.all(updates);
    fetchSales();
  };

  const filteredSales = sales
    .filter((s) => (showAll ? true : !s.withdrawn))
    .filter((s) => {
      const name = toKatakana(getLiverName(s.liverId).toLowerCase());
      const memo = toKatakana((s.memo || "").toLowerCase());
      const keyword = toKatakana(searchTerm.toLowerCase());
      return name.includes(keyword) || memo.includes(keyword);
    });

  const totalAmount = filteredSales
    .filter((s) => !s.withdrawn)
    .reduce((sum, s) => sum + s.amount, 0);

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h2 style={{ color: "#DAA520" }}>出金管理</h2>

      <input
        placeholder="検索（ライバー名・メモ）"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={inputStyle}
      />

      <label style={{ display: "block", marginBottom: "10px" }}>
        <input
          type="checkbox"
          checked={showAll}
          onChange={() => setShowAll(!showAll)}
        />
        出金済みも含めてすべて表示
      </label>

      {!showAll && filteredSales.length > 0 && (
        <button onClick={markAllAsWithdrawn} style={buttonStyle}>
          全て出金済みにする
        </button>
      )}

      <h4 style={{ marginTop: "20px" }}>
        表示件数：{filteredSales.length}件 / 未出金合計：¥
        {totalAmount.toLocaleString()}
      </h4>

      <ul style={{ marginTop: "10px" }}>
        {filteredSales.map((s) => (
          <li key={s.id} style={listItemStyle}>
            [{new Date(s.date).toLocaleDateString()}] {getLiverName(s.liverId)} / ¥
            {s.amount} - {s.memo}{" "}
            <span style={{ color: s.withdrawn ? "green" : "red", fontWeight: "bold" }}>
              {s.withdrawn ? "済" : "未"}
            </span>
            {s.withdrawn ? (
              <button
                onClick={() => setWithdrawnState(s.id, false)}
                style={{ ...miniButton, backgroundColor: "#f44336" }}
              >
                未出金に戻す
              </button>
            ) : (
              <button onClick={() => setWithdrawnState(s.id, true)} style={miniButton}>
                出金済みに
              </button>
            )}
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
  marginBottom: "10px",
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
