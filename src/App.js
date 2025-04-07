import React, { useState } from "react";
import LiverManager from "./LiverManager";
import SalesTracker from "./SalesTracker";
import WithdrawalManager from "./WithdrawalManager";
import RankingPage from "./RankingPage";

function App() {
  const [page, setPage] = useState("livers");

  return (
    <div>
      {/* トップメニュー */}
      <nav style={navStyle}>
        <button onClick={() => setPage("livers")} style={buttonStyle}>ライバー管理</button>
        <button onClick={() => setPage("sales")} style={buttonStyle}>売上登録</button>
        <button onClick={() => setPage("withdraw")} style={buttonStyle}>出金管理</button>
        <button onClick={() => setPage("ranking")} style={buttonStyle}>ランキング</button>
      </nav>

      {/* コンテンツ表示切り替え */}
      <div style={{ padding: "20px" }}>
        {page === "livers" && <LiverManager />}
        {page === "sales" && <SalesTracker />}
        {page === "withdraw" && <WithdrawalManager />}
        {page === "ranking" && <RankingPage />}
      </div>
    </div>
  );
}

const navStyle = {
  display: "flex",
  justifyContent: "center",
  gap: "10px",
  padding: "10px",
  backgroundColor: "#FFD966",
  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
};

const buttonStyle = {
  padding: "10px 20px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  fontWeight: "bold",
  backgroundColor: "#fff",
  color: "#333",
  fontSize: "1em",
};

export default App;
