import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Plan from "./pages/Plan";
import Saved from "./pages/Saved";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/plan", label: "Plan" },
  { to: "/saved", label: "Saved" },
];

function NavBar() {
  return (
    <nav style={{
      width: "100%",
      background: "#fff",
      borderBottom: "1px solid #e0e0e0",
      padding: "12px 24px",
      display: "flex",
      alignItems: "center",
      gap: "24px",
      position: "sticky",
      top: 0,
      zIndex: 1000,
    }}>
      <img src="/logo.png" alt="WingIt logo" style={{ width: "32px", height: "32px" }} />
      {navLinks.map(link => (
        <Link key={link.to} to={link.to} style={{
          color: "#000",
          textDecoration: "none",
          fontWeight: 700,
          fontSize: "0.95rem",
        }}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

function Layout({ children }) {
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/plan" element={<Layout><Plan /></Layout>} />
        <Route path="/saved" element={<Layout><Saved /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App; 