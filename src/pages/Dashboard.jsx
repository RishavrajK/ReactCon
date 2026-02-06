import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost/backend/api/leads/getLeads.php", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          setLeads(data.leads || []);
        } else {
          setError(data.error || "Failed to load leads");
        }
      } catch (err) {
        setError("Server error: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={handleLogout}>Logout</button>

      {loading && <p>Loading leads...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {leads.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id}>
                <td>{lead.id}</td>
                <td>{lead.name}</td>
                <td>{lead.email}</td>
                <td>{lead.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <p>No leads found</p>
      )}
    </div>
  );
}

export default Dashboard;