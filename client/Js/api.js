// Base API URL
const API = "http://localhost:5000/api";


//  API request handler
const apiRequest=async(url, method = "GET", body)=> {

// getting token from session storage
   const token = sessionStorage.getItem("token");

  // Send request to backend
  const res = await fetch(API + url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: body ? JSON.stringify(body) : null,
    cache: "no-store",
  });

  // parsing response to extract data with in response
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}
// ================= SHOW TOAST =================
function showToast(msg) {

    // Get toast element
    const toast = document.getElementById("toast");

    // Set message
    toast.innerText = msg;

    // Show toast
    toast.classList.add("toast-show");

    // Hide after 2 sec
    setTimeout(() => {
        toast.classList.remove("toast-show");
    }, 2000);
}