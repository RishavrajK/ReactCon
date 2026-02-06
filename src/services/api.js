const API_URL = "http://localhost/backend/api";
export const apiRequest = async (endpoint, method="GET", body=null) => {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(API_URL + endpoint, { method, headers, body: body && JSON.stringify(body) });
  return res.json();
};