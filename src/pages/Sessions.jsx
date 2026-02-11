import React, { useEffect, useState } from "react";
import { Monitor, Globe } from "lucide-react";

const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes

const defaultSessions = [
  { id: 1, username: "user1", ip: "172.168.10.1", status: "active", lastLeadTime: Date.now() - 2 * 60 * 1000 },
  { id: 2, username: "user2", ip: "49.36.217.187", status: "active", lastLeadTime: Date.now() },
  { id: 3, username: "user3", ip: "192.168.1.22", status: "active", lastLeadTime: Date.now() - 20 * 60 * 1000 },
  { id: 4, username: "user4", ip: "10.0.0.12", status: "active", lastLeadTime: Date.now() - 5 * 60 * 1000 },
  { id: 5, username: "user5", ip: "172.16.5.21", status: "active", lastLeadTime: Date.now() - 1 * 60 * 1000 },
  { id: 6, username: "user6", ip: "192.168.0.45", status: "active", lastLeadTime: Date.now() - 12 * 60 * 1000 },
  { id: 7, username: "user7", ip: "10.10.10.10", status: "active", lastLeadTime: Date.now() - 7 * 60 * 1000 },
];

const Sessions = () => {

  const [sessions, setSessions] = useState(defaultSessions);

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("history");
    return saved ? JSON.parse(saved) : [];
  });

  const [filter, setFilter] = useState("today");
  const [selectedUser, setSelectedUser] = useState(null);


  // Save history
  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);


  // Initial login history
  useEffect(() => {
    if (history.length === 0) {
      const logs = defaultSessions.map((s) => ({
        username: s.username,
        ip: s.ip,
        action: "login",
        timestamp: Date.now(),
      }));

      setHistory(logs);
    }
  }, []);


  const addHistory = (username, ip, action) => {
    setHistory((prev) => [
      { username, ip, action, timestamp: Date.now() },
      ...prev,
    ]);
  };


  // Register active sessions on load
  useEffect(() => {
    sessions.forEach((s) => {
      if (s.status === "active") {
        addHistory(s.username, s.ip, "login");
      }
    });
  }, []);


  // Auto logout
  useEffect(() => {
    const interval = setInterval(() => {
      setSessions((prev) =>
        prev.map((s) => {
          if (
            s.status === "active" &&
            Date.now() - s.lastLeadTime >= INACTIVITY_LIMIT
          ) {
            addHistory(s.username, s.ip, "auto-logout");
            return { ...s, status: "loggedOut" };
          }
          return s;
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);


  const handleLogout = (id) => {
    const session = sessions.find((s) => s.id === id);
    if (!session) return;

    if (!window.confirm(`Logout ${session.username}?`)) return;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: "loggedOut" } : s
      )
    );

    addHistory(session.username, session.ip, "logout");
  };


  const simulateLead = (id) => {
    const session = sessions.find((s) => s.id === id);
    if (!session || session.status !== "active") return;

    setSessions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, lastLeadTime: Date.now() } : s
      )
    );

    addHistory(session.username, session.ip, "lead");
  };


  const activeSessions = sessions.filter(
    (s) => s.status === "active"
  );


  // ================= TABLE LOGIC =================

  const getTableData = (type) => {

    const now = new Date();
    const map = {};

    history.forEach((h) => {

      const entryDate = new Date(h.timestamp);
      let valid = false;

      if (type === "today")
        valid = entryDate.toDateString() === now.toDateString();

      if (type === "week")
        valid = (now - entryDate) / (1000 * 60 * 60 * 24) <= 7;

      if (type === "month")
        valid =
          entryDate.getMonth() === now.getMonth() &&
          entryDate.getFullYear() === now.getFullYear();

      if (!valid) return;


      if (!map[h.username]) {
        map[h.username] = {
          username: h.username,
          ip: h.ip,
          sessions: 0,

          activeTime: null,
          inactiveTime: null,

          totalActiveMs: 0,
          lastLogin: null,
        };
      }


      // LOGIN
      if (h.action === "login") {

        map[h.username].sessions += 1;

        map[h.username].activeTime = h.timestamp;
        map[h.username].lastLogin = h.timestamp;

      }


      // LOGOUT
      if (h.action === "logout" || h.action === "auto-logout") {

        map[h.username].inactiveTime = h.timestamp;

        if (map[h.username].lastLogin) {

          const diff =
            h.timestamp - map[h.username].lastLogin;

          map[h.username].totalActiveMs += diff;

          map[h.username].lastLogin = null;
        }

      }

    });


    // Sync live sessions for TODAY only
    if (type === "today") {

      sessions.forEach((s) => {

        if (!map[s.username]) {

          map[s.username] = {
            username: s.username,
            ip: s.ip,
            sessions: 1,

            activeTime: s.lastLeadTime,
            inactiveTime: null,

            totalActiveMs: 0,
            lastLogin: s.lastLeadTime,
          };

        }


        if (s.status === "active") {

          map[s.username].activeTime = s.lastLeadTime;
          map[s.username].inactiveTime = null;

        }

      });

    }


    return Object.values(map).map((u) => {

      // ===== TODAY =====
      if (type === "today") {

        return {
          ...u,

          status: (
            <>
              {u.activeTime && (
                <>
                  Active -{" "}
                  {new Date(u.activeTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  <br />
                </>
              )}

              {u.inactiveTime && (
                <>
                  Inactive -{" "}
                  {new Date(u.inactiveTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </>
              )}
            </>
          ),

        };

      }


      // ===== WEEK / MONTH =====

      const hours =
        (u.totalActiveMs / (1000 * 60 * 60)).toFixed(2);

      return {
        ...u,
        status: `${hours} hrs`,
      };

    });

  };

  // ==============================================


  const handleUserClick = (username) => {

    const userData = getTableData("today").find(
      (u) => u.username === username
    );

    if (userData) setSelectedUser(userData);

  };



  return (
    <>
      <style>{`
        .sessions-container { padding: 24px; display: flex; flex-direction: column; gap: 24px; font-family: sans-serif; }
        .sessions-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .stat-card { position: relative; padding: 16px; border-radius: 12px; box-shadow: 0 6px 20px rgba(0,0,0,0.05); }
        .sessions-list { background: white; border-radius: 16px; padding: 20px; box-shadow: 0 6px 20px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 12px; max-height: 300px; overflow-y: auto; }
        .session-card { display: grid; grid-template-columns: 1.5fr 1.5fr 1fr 1fr; gap: 12px; padding: 12px 14px; border-radius: 10px; background: #f9fafb; align-items: center; }
        .loggedout { opacity: 0.5; text-decoration: line-through; }
        .logout-btn { background: #fee2e2; color: #b91c1c; border: none; border-radius: 6px; padding: 5px 8px; font-size: 12px; cursor: pointer; margin-left: 6px; }
        .lead-btn { background: #e0f2fe; color: #0369a1; border: none; border-radius: 6px; padding: 5px 8px; font-size: 12px; cursor: pointer; }
        table { width: 100%; border-collapse: collapse; font-size: 14px; }
        th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
        th { background: #f3f4f6; font-weight: 600; }
        .filter-btns { display: flex; gap: 10px; margin-bottom: 10px; }
        .filter-btn { padding: 6px 14px; border-radius: 6px; border: 1px solid #ddd; cursor: pointer; background: #f9fafb; }
        .filter-btn.active { background: #2563eb; color: white; border-color: #2563eb; }
      `}</style>

      <div className="sessions-container">

        <h1>Active Sessions</h1>

        <div className="sessions-stats">

          <div className="stat-card" style={{ background: "linear-gradient(135deg,#ffedd5,#fff7ed)", border: "1px solid #f97316" }}>
            <span>Total Sessions</span>
            <h2>{sessions.length}</h2>
          </div>

          <div className="stat-card" style={{ background: "linear-gradient(135deg,#dcfce7,#f0fdf4)", border: "1px solid #16a34a" }}>
            <span>Active Sessions</span>
            <h2>{activeSessions.length}</h2>
          </div>

          <div className="stat-card" style={{ background: "linear-gradient(135deg,#fee2e2,#fef2f2)", border: "1px solid #b91c1c" }}>
            <span>Logged Out</span>
            <h2>{sessions.length - activeSessions.length}</h2>
          </div>

        </div>


        {/* Sessions List */}

        <div className="sessions-list">

          {sessions.map((s) => {

            const inactiveTime = Math.floor(
              (Date.now() - s.lastLeadTime) / 60000
            );

            return (
              <div
                key={s.id}
                className={`session-card ${
                  s.status !== "active" ? "loggedout" : ""
                }`}
              >
                <div><Monitor size={16} /> {s.username}</div>
                <div><Globe size={14} /> {s.ip}</div>

                <div>
                  Last lead: {inactiveTime} min ago
                </div>

                <div>
                  {s.status === "active" && (
                    <>
                      <button
                        className="lead-btn"
                        onClick={() => simulateLead(s.id)}
                      >
                        Lead
                      </button>

                      <button
                        className="logout-btn"
                        onClick={() => handleLogout(s.id)}
                      >
                        Logout
                      </button>
                    </>
                  )}
                </div>

              </div>
            );
          })}

        </div>


        {/* TABLE */}

        <div style={{ background: "white", padding: 20, borderRadius: 12 }}>

          <h2>Session History</h2>

          <div className="filter-btns">

            <button
              className={`filter-btn ${filter === "today" ? "active" : ""}`}
              onClick={() => setFilter("today")}
            >
              Today
            </button>

            <button
              className={`filter-btn ${filter === "week" ? "active" : ""}`}
              onClick={() => setFilter("week")}
            >
              This Week
            </button>

            <button
              className={`filter-btn ${filter === "month" ? "active" : ""}`}
              onClick={() => setFilter("month")}
            >
              This Month
            </button>

          </div>


          <table>

            <thead>
              <tr>
                <th>Username</th>
                <th>IP Address</th>

                <th>
                  {filter === "today"
                    ? "Active / Inactive"
                    : "Hours Active"}
                </th>

                <th>No. of Sessions</th>
              </tr>
            </thead>


            <tbody>

              {getTableData(filter).map((u, i) => (
                <tr
                  key={i}
                  onClick={() =>
                    filter === "today" && handleUserClick(u.username)
                  }
                  style={{
                    cursor:
                      filter === "today" ? "pointer" : "default",
                  }}
                >
                  <td>{u.username}</td>
                  <td>{u.ip}</td>

                  <td>{u.status}</td>

                  <td>{u.sessions}</td>
                </tr>
              ))}

            </tbody>

          </table>

        </div>


       {/* USER POPUP */}
{selectedUser && (

  <div
    style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      background: "rgba(15, 23, 42, 0.6)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
      backdropFilter: "blur(4px)",
    }}
  >

    <div
      style={{
        background: "linear-gradient(135deg, #eff6ff, #ffffff)",
        padding: "26px 28px",
        borderRadius: "16px",
        width: "340px",
        border: "1px solid #bfdbfe",
        boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
        position: "relative",
      }}
    >

      {/* Header */}
      <div
        style={{
          marginBottom: 16,
          paddingBottom: 10,
          borderBottom: "1px solid #e0f2fe",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0, color: "#1e3a8a" }}>
          {selectedUser.username} Details
        </h3>

        <button
          onClick={() => setSelectedUser(null)}
          style={{
            background: "transparent",
            border: "none",
            fontSize: 20,
            cursor: "pointer",
            color: "#64748b",
          }}
        >
          ✕
        </button>
      </div>


      {/* Body */}
      <div style={{ fontSize: 14, color: "#334155" }}>

        <div style={{ marginBottom: 10 }}>
          <strong>IP Address:</strong>
          <div style={{ color: "#0369a1" }}>
            {selectedUser.ip}
          </div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <strong>Total Sessions:</strong>
          <div>{selectedUser.sessions}</div>
        </div>

        <div style={{ marginBottom: 10 }}>
          <strong>Activity Timeline:</strong>
        </div>

        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: 12,
          }}
        >

          {selectedUser.activeTime && (
            <div
              style={{
                marginBottom: 6,
                color: "#15803d",
                fontWeight: 500,
              }}
            >
              ● Active:{" "}
              {new Date(selectedUser.activeTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}

          {selectedUser.inactiveTime && (
            <div
              style={{
                color: "#b91c1c",
                fontWeight: 500,
              }}
            >
              ● Inactive:{" "}
              {new Date(selectedUser.inactiveTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}

        </div>

      </div>


      {/* Footer */}
      <button
        onClick={() => setSelectedUser(null)}
        style={{
          marginTop: 18,
          width: "100%",
          padding: "8px 0",
          borderRadius: 8,
          border: "none",
          background: "#2563eb",
          color: "white",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Close
      </button>

    </div>
  </div>
)}


      </div>
    </>
  );
};

export default Sessions;
