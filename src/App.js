import React, { useEffect, useState } from "react";
import LiverManager from "./LiverManager";
import SalesTracker from "./SalesTracker";
import WithdrawalManager from "./WithdrawalManager";
import RankingPage from "./RankingPage";
import LoginPage from "./LoginPage";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import "./theme.css";

function App() {
  const [page, setPage] = useState("livers");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ロード中制御

  // 🔐 ログイン状態を監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <p>読み込み中...</p>;

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div>
      {/* トップメニュー */}
      <nav style={navStyle}>
        <button onClick={() => setPage("livers")} style={buttonStyle}>ライバー管理</button>
        <button onClick={() => setPage("sales")} style={buttonStyle}>売上登録</button>
        <button onClick={() => setPage("withdraw")} style={buttonStyle}>出金管理</button>
        <button onClick={() => setPage("ranking")} style={buttonStyle}>ランキング</button>
      </nav>

      {/* 表示画面 */}
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
