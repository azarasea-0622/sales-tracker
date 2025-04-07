import { useEffect, useState } from "react";
import { db } from "./lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
} from "firebase/firestore";
import Modal from "./components/Modal";

const toKatakana = (str = "") =>
  str.replace(/[\u3041-\u3096]/g, (match) =>
    String.fromCharCode(match.charCodeAt(0) + 0x60)
  );

export default function LiverManager() {
  const [livers, setLivers] = useState([]);
  const [form, setForm] = useState({
    realName: "",
    displayName: "",
    bankName: "",
    branchName: "",
    accountType: "",
    accountNumber: "",
    accountHolder: "",
  });
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchLivers();
  }, []);

  const fetchLivers = async () => {
    const q = query(collection(db, "livers"));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => {
      const d = doc.data();
      return {
        ...d,
        id: doc.id,
        _katakana: {
          realName: toKatakana(d.realName.toLowerCase()),
          displayName: toKatakana(d.displayName.toLowerCase()),
          accountHolder: toKatakana(d.accountHolder.toLowerCase()),
        },
      };
    });
    setLivers(data);
  };

  const handleSubmit = async () => {
    const isFormValid = Object.values(form).every(
      (value) => value.trim() !== ""
    );
    if (!isFormValid) {
      alert("すべての項目を入力してください。");
      return;
    }

    try {
      if (editId) {
        await updateDoc(doc(db, "livers", editId), form);
        setLivers((prev) =>
          prev.map((l) =>
            l.id === editId
              ? {
                  ...form,
                  id: editId,
                  _katakana: {
                    realName: toKatakana(form.realName.toLowerCase()),
                    displayName: toKatakana(form.displayName.toLowerCase()),
                    accountHolder: toKatakana(form.accountHolder.toLowerCase()),
                  },
                }
              : l
          )
        );
      } else {
        const docRef = await addDoc(collection(db, "livers"), {
          ...form,
          createdAt: new Date().toISOString(),
        });
        setLivers((prev) => [
          ...prev,
          {
            ...form,
            id: docRef.id,
            _katakana: {
              realName: toKatakana(form.realName.toLowerCase()),
              displayName: toKatakana(form.displayName.toLowerCase()),
              accountHolder: toKatakana(form.accountHolder.toLowerCase()),
            },
          },
        ]);
      }

      setModalOpen(false);
      setForm({
        realName: "",
        displayName: "",
        bankName: "",
        branchName: "",
        accountType: "",
        accountNumber: "",
        accountHolder: "",
      });
      setEditId(null);
    } catch (err) {
      console.error("登録エラー:", err);
      alert("登録中にエラーが発生しました。");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("削除してもよいですか？")) {
      await deleteDoc(doc(db, "livers", id));
      setLivers((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const openModalForEdit = (liver) => {
    setForm({ ...liver });
    setEditId(liver.id);
    setModalOpen(true);
  };

  const filteredLivers = livers.filter((l) => {
    const search = toKatakana(searchTerm.toLowerCase());
    return (
      l._katakana.realName.includes(search) ||
      l._katakana.displayName.includes(search) ||
      l._katakana.accountHolder.includes(search)
    );
  });

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <h2 style={{ color: "#DAA520", display: "flex", justifyContent: "space-between" }}>
        ライバー管理
        <button onClick={() => setModalOpen(true)} style={buttonStyle}>＋ 新規追加</button>
      </h2>

      <input
        placeholder="検索（活動名・本名・口座名義）"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ ...inputStyle, marginBottom: "15px" }}
        autoComplete="off"
      />

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.95em" }}>
        <thead>
          <tr>
            <th style={thStyle}>活動名</th>
            <th style={thStyle}>本名</th>
            <th style={thStyle}>銀行</th>
            <th style={thStyle}>支店</th>
            <th style={thStyle}>種目</th>
            <th style={thStyle}>口座番号</th>
            <th style={thStyle}>名義</th>
            <th style={thStyle}>操作</th>
          </tr>
        </thead>
        <tbody>
          {filteredLivers.map((liver) => (
            <tr key={liver.id}>
              <td style={tdStyle}>{liver.displayName}</td>
              <td style={tdStyle}>{liver.realName}</td>
              <td style={tdStyle}>{liver.bankName}</td>
              <td style={tdStyle}>{liver.branchName}</td>
              <td style={tdStyle}>{liver.accountType}</td>
              <td style={tdStyle}>{liver.accountNumber}</td>
              <td style={tdStyle}>{liver.accountHolder}</td>
              <td style={tdStyle}>
                <button onClick={() => openModalForEdit(liver)} style={miniButton}>編集</button>
                <button
                  onClick={() => handleDelete(liver.id)}
                  style={{ ...miniButton, backgroundColor: "#f44336" }}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <h3>{editId ? "ライバー情報を編集" : "ライバーを登録"}</h3>
        {[
          { name: "realName", label: "本名" },
          { name: "displayName", label: "活動名" },
          { name: "bankName", label: "金融機関名" },
          { name: "branchName", label: "支店名" },
          { name: "accountType", label: "預金種目" },
          { name: "accountNumber", label: "口座番号" },
          { name: "accountHolder", label: "口座名義" },
        ].map(({ name, label }) => (
          <input
            key={name}
            name={name}
            placeholder={label}
            value={form[name]}
            onChange={(e) => setForm({ ...form, [name]: e.target.value })}
            style={inputStyle}
            autoComplete="off" // ✅ ここでサジェスト無効化！
          />
        ))}

        <button onClick={handleSubmit} style={{ ...buttonStyle, marginTop: "10px" }}>
          {editId ? "更新する" : "登録する"}
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
