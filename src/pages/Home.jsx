import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [showContent, setShowContent] = useState(false); // for title + buttons
  const navigate = useNavigate();

  useEffect(() => {
    // Start intro animation immediately
    const timer = setTimeout(() => {
      setShowContent(true); 
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const image = "/HomeScreen.png";

  return (
    <div
      className="page-container"
      style={{
        position: "relative",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        width: "100vw",
        maxWidth: "100vw",
        margin: 0,
        backgroundColor: "#000",
        backgroundImage: `url(${image})`,
        backgroundSize: showContent ? "100% auto" : "140% auto",
        backgroundPosition: showContent ? "center center" : "top center",
        backgroundRepeat: "no-repeat",
        transition: "background-size 1.8s ease, background-position 1.8s ease",
        overflow: "hidden",
      }}
    >
      {/* Title + Buttons appear AFTER animation */}
      <div
        style={{
          opacity: showContent ? 1 : 0,
          transition: "opacity 1s ease 1.5s",
          textAlign: "center",
          width: "100%",
          maxWidth: "600px",
          padding: "0 12px",
          zIndex: 1,
        }}
      >
        <h1 style={{ color: "#000", fontSize: "clamp(2.4rem, 6vw, 3rem)", marginBottom: "20px" }}>
          WingIt
        </h1>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", justifyContent: "center" }}>
          <button
            style={buttonStyle}
            onClick={() => navigate("/plan")}
          >
            Plan
          </button>
          <button
            style={buttonStyle}
            onClick={() => navigate("/saved")}
          >
            Saved
          </button>
        </div>
      </div>
    </div>
  );
}

// Reusable button style
const buttonStyle = {
  padding: "10px 25px",
  fontSize: "1.2rem",
  borderRadius: "10px",
  border: "1px solid #000",
  cursor: "pointer",
  backgroundColor: "#000",
  color: "#fff",
  transition: "background-color 0.3s ease, transform 0.2s ease",
};

export default Home;