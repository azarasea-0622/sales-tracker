export default function Modal({ isOpen, onClose, children }) {
    if (!isOpen) return null;
  
    return (
      <div style={overlayStyle}>
        <div style={modalStyle}>
          <button onClick={onClose} style={closeButton}>×</button>
          {children}
        </div>
      </div>
    );
  }
  
  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  };
  
  const modalStyle = {
    backgroundColor: "#fff",
    padding: "30px",
    borderRadius: "12px",
    minWidth: "300px",
    maxWidth: "500px",
    position: "relative",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  };
  
  const closeButton = {
    position: "absolute",
    top: "10px",
    right: "15px",
    fontSize: "18px",
    background: "none",
    border: "none",
    cursor: "pointer",
  };
  