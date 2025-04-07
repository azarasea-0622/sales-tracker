import React, { useEffect, useState } from "react";
import { db } from "./lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore";

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function RankingPage() {
  const [sales, setSales] = useState([]);
  const [livers, setLivers] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

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
    const snapshot = await getDocs(query(collection(db, "sales"), orderBy("date", "desc")));
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setSales(data);
  };

  const getLiverName = (id) => {
    const liver = livers.find((l) => l.id === id);
    return liver ? liver.displayName : "不明";
  };

  const monthlySales = sales.filter((s) => {
    return (
      s.type === "subscription" &&
      s.date &&
      s.date.startsWith(selectedMonth)
    );
  });

  const rankedData = Object.values(
    monthlySales.reduce((acc, sale) => {
      if (!acc[sale.liverId]) {
        acc[sale.liverId] = {
          liverId: sale.liverId,
          total: 0,
        };
      }
      acc[sale.liverId].total += Number(sale.amount);
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const monthOptions = generateMonthOptions();

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ color: "#DAA520" }}>ライバー別 サブスク売上ランキング</h2>

      <label>
        表示する月：
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          style={inputStyle}
        >
          {monthOptions.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </label>

      <ul style={{ marginTop: "20px" }}>
        {rankedData.map((item, index) => (
          <li key={item.liverId} style={listItemStyle}>
            <strong>{index + 1}位：</strong> {getLiverName(item.liverId)} - ¥
            {item.total.toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}

function generateMonthOptions() {
  const now = new Date();
  const options = [];
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    options.push(month);
  }
  return options;
}

const inputStyle = {
  display: "block",
  margin: "10px 0",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
};

const listItemStyle = {
  marginBottom: "10px",
  paddingBottom: "5px",
  borderBottom: "1px solid #eee",
};
