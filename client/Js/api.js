// Base API URL
const API = "livesync-taskmanager-live-sync.up.railway.app/api";
const SOCKET_URL = "livesync-taskmanager-live-sync.up.railway.app";


//  API request handler
const apiRequest=async(url, method = "GET", body)=> {

// getting token from session storage
   const token = sessionStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = "Bearer " + token;
  }

  // Send request to backend
  const res = await fetch(API + url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
    cache: "no-store",
  });

  // parsing response to extract data with in response
  const text = await res.text();
  let data = {};

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = { message: text };
    }
  }

  // handle failed api response
  if (!res.ok) {
    throw new Error(data.message || `request failed with status ${res.status}`);
  }

  return data;
}
// ================= SHOW TOAST =================
function showToast(msg) {

    // Get toast element
    const toast = document.getElementById("toast");

    if (!toast) return;

    // Set message
    toast.innerText = msg;

    // Show toast
    toast.classList.add("toast-show");

    // Hide after 2 sec
    setTimeout(() => {
        toast.classList.remove("toast-show");
    }, 2000);
}
