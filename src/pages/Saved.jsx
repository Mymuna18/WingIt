import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Saved() {
  const [trips, setTrips] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("trips")) || [];
    setTrips(saved);
  }, []);

  const deleteTrip = (tripId) => {
    const updatedTrips = trips.filter(trip => trip.id !== tripId);
    setTrips(updatedTrips);
    localStorage.setItem("trips", JSON.stringify(updatedTrips));
  };

  const loadTrip = (trip) => {
    navigate('/plan', { state: { loadedTrip: trip } });
  };

  return (
    <div className="page-container" style={{ width: "100vw", maxWidth: "100vw", margin: 0, padding: "24px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "20px", width: "100%" }}>
        <h1 style={{ margin: 0, color: "#000" }}>Saved Trips</h1>
        <button 
          onClick={() => navigate('/plan')}
          style={{
            padding: "12px 20px",
            borderRadius: "50px",
            border: "none",
            background: "#2f3236",
            color: "#fff",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 2px 8px rgba(0,123,255,0.3)",
            transition: "all 0.2s",
            width: "min(100%, 240px)",
          }}
        >
          ➕ Plan New Trip
        </button>
      </div>

      {trips.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ fontSize: "18px", color: "#666", marginBottom: "20px" }}>No saved trips yet</p>
          <button 
            onClick={() => navigate('/plan')}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "2px solid, #2f3236",
              background: "transparent",
              color: "#2f3236",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            Start Planning Your First Trip
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "20px", width: "100%", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
          {trips.map((trip) => (
            <div key={trip.id} style={{
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              padding: "20px",
              background: "#fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              minWidth: 0,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "15px" }}>
                <div>
                  <h2 style={{ margin: "0 0 5px", fontSize: "24px", color: "#333" }}>
                    Trip to {trip.city}
                  </h2>
                  <p style={{ margin: 0, color: "#666", fontSize: "16px" }}>
                    {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                  </p>
                  <p style={{ margin: "5px 0 0", color: "#888", fontSize: "14px" }}>
                    {trip.selectedPlaces?.length || 0} places • {trip.schedule?.days?.length || 0} days
                  </p>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  <button 
                    onClick={() => loadTrip(trip)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "1px solid, #2f3236",
                      background: "#2f3236",
                      color: "#fff",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      width: "min(100%, 140px)",
                    }}
                  >
                    Load Trip
                  </button>
                  <button 
                    onClick={() => deleteTrip(trip.id)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "1px solid #dc3545",
                      background: "transparent",
                      color: "#dc3545",
                      fontSize: "14px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      width: "min(100%, 140px)",
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {trip.selectedPlaces && trip.selectedPlaces.length > 0 && (
                <div>
                  <h3 style={{ margin: "15px 0 10px", fontSize: "16px", color: "#555" }}>Places to visit:</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {trip.selectedPlaces.slice(0, 5).map((place, i) => (
                      <span key={i} style={{
                        background: "#f0f0f0",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#666"
                      }}>
                        {place.name}
                      </span>
                    ))}
                    {trip.selectedPlaces.length > 5 && (
                      <span style={{
                        background: "#f0f0f0",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        color: "#666"
                      }}>
                        +{trip.selectedPlaces.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <p style={{ margin: "10px 0 0", fontSize: "12px", color: "#999" }}>
                Saved on {new Date(trip.savedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Saved; 