import React, { useState, useEffect } from "react";
import { auth } from "./lib/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await setPersistence(auth, browserSessionPersistence); // 🔥 セッション限定ログインに設定
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert("ログイン失敗: " + err.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setEmail("");
    setPassword("");
  };

  return (
    <div style={container}>
      <h2 style={{ color: "#DAA520" }}>ログイン</h2>

      {user ? (
        <>
          <p>ログイン中：{user.email}</p>
          <button onClick={handleLogout} style={buttonStyle}>
            ログアウト
          </button>
        </>
      ) : (
        <>
          <input
            type="email"
            placeholder="メールアドレス"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />
          <button onClick={handleLogin} style={buttonStyle}>
            ログイン
          </button>
        </>
      )}
    </div>
  );
}

const container = {
  maxWidth: "400px",
  margin: "0 auto",
  padding: "40px",
  border: "1px solid #ccc",
  borderRadius: "10px",
  textAlign: "center",
};

const inputStyle = {
  display: "block",
  width: "100%",
  margin: "10px 0",
  padding: "10px",
  borderRadius: "8px",
  border: "1px solid #ccc",
};

const buttonStyle = {
  backgroundColor: "#FFD966",
  border: "none",
  padding: "10px 20px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "bold",
};
