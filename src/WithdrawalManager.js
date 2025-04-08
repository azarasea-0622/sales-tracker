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
  const [selectedIds, setSelectedIds] = useState([]);
  const [showWithdrawn, setShowWithdrawn] = useState(false);

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

  const handleToggle = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleMarkAsWithdrawn = async (id) => {
    await updateDoc(doc(db, "sales", id), { withdrawn: true });
    setSales((prev) =>
      prev.map((s) => (s.id === id ? { ...s, withdrawn: true } : s))
    );
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const handleUndoWithdrawn = async (id) => {
    await updateDoc(doc(db, "sales", id), { withdrawn: false });
    setSales((prev) =>
      prev.map((s) => (s.id === id ? { ...s, withdrawn: false } : s))
    );
  };

  const handleMarkSelectedAsWithdrawn = async () => {
    const updates = selectedIds.map((id) =>
      updateDoc(doc(db, "sales", id), { withdrawn: true })
    );
    await Promise.all(updates);
    setSales((prev) =>
      prev.map((s) =>
        selectedIds.includes(s.id) ? { ...s, withdrawn: true } : s
      )
    );
    setSelectedIds([]);
  };

  const filteredSales = sales
    .filter((s) => (showWithdrawn ? s.withdrawn : !s.withdrawn))
    .filter((s) => {
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

      <div style={{ marginBottom: "10px" }}>
  <label
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "10px",
      fontWeight: "bold",
      whiteSpace: "nowrap", // ←🔥 これ追加
    }}
  >
    出金済みを表示
    <input
      type="checkbox"
      checked={showWithdrawn}
      onChange={() => setShowWithdrawn(!showWithdrawn)}
      style={{ transform: "scale(1.2)", accentColor: "#ffd966", margin: 0 }}
    />
  </label>
</div>




      <input
        placeholder="検索（ライバー名・メモ）"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          marginBottom: "15px",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      />

      {!showWithdrawn && selectedIds.length > 0 && (
        <div style={{ margin: "10px 0", fontWeight: "bold" }}>
          ✅ 選択件数：{selectedIds.length}件 / 振込合計：¥
          {selectedPayoutTotal.toLocaleString()}
          <button
            onClick={handleMarkSelectedAsWithdrawn}
            style={{
              backgroundColor: "#FFB800",
              border: "none",
              padding: "10px 20px",
              borderRadius: "8px",
              cursor: "pointer",
              fontWeight: "bold",
              color: "#fff",
              marginLeft: "10px",
            }}
          >
            選択を出金済みにする
          </button>
        </div>
      )}

      <ul style={{ marginTop: "10px", paddingLeft: 0, listStyle: "none" }}>
        {filteredSales.map((s) => (
          <li
            key={s.id}
            style={{
              padding: "14px",
              marginBottom: "12px",
              borderRadius: "14px",
              boxShadow: "0 3px 8px rgba(0, 0, 0, 0.08)",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
              {!showWithdrawn && (
                <label style={{ display: "flex", alignItems: "center", margin: 0 }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(s.id)}
                    onChange={() => handleToggle(s.id)}
                    style={{
                      transform: "scale(1.2)",
                      accentColor: "#ffd966",
                      margin: 0,
                      verticalAlign: "middle",
                    }}
                  />
                </label>
              )}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: "1.05em" }}>
                  [{new Date(s.date).toLocaleDateString()}] {getLiverName(s.liverId)}
                </div>
                <div style={{ marginTop: "4px" }}>
                  ¥{s.amount.toLocaleString()} → 振込：¥{calcPayout(s.amount).toLocaleString()}
                </div>
              </div>
            </div>
            <button
              onClick={() =>
                showWithdrawn
                  ? handleUndoWithdrawn(s.id)
                  : handleMarkAsWithdrawn(s.id)
              }
              style={{
                backgroundColor: showWithdrawn ? "#f44336" : "#4CAF50",
                border: "none",
                padding: "6px 10px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.85em",
                color: "#fff",
              }}
            >
              {showWithdrawn ? "未出金に戻す" : "出金済みに"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
