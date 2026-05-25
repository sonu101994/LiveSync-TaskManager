//================= LOGIN FUNCTION =========================

const login=async()=> {

    // Get input values
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {

        // Send login request using apiRequest()
        const data = await apiRequest(
            "/auth/login",
            "POST",
            { email, password }
        );

        // Check login success
        if (data.token) {

            // Store user data in session
            sessionStorage.setItem("token", data.token);
            sessionStorage.setItem("userId", data.user._id);
            sessionStorage.setItem("role", data.user.role);
            sessionStorage.setItem("username", data.user.username);
            // Redirect to dashboard
            window.location.href = "../dashboard.html";

        } else {

            // Show error
            showToast(data.message || "Login failed ❌");
        }

    } catch (error) {
        showToast(error.message || "Login failed ❌");
    }
}

// ================= FUNCTIO TO REGISTER USER =================
 const register=async()=> {

    // Get form values
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Validate empty fields
    if (!username || !email || !password || !confirmPassword) {
        showToast("All fields required ❗");
        return;
    }

    // Check password match
    if (password !== confirmPassword) {
        showToast("Passwords do not match ❌");
        return;
    }

    try {

        // Send register request using apiRequest()
        const data = await apiRequest(
            "/auth/register",
            "POST",
            { username, email, password }
        );

        // Success check
        if (data.message === "User registered successfully") {

            showToast("Registered successfully ✅");
            

            // Clear form fields
            document.getElementById("username").value = "";
            document.getElementById("email").value = "";
            document.getElementById("password").value = "";
            document.getElementById("confirmPassword").value = "";

            setTimeout(() => {
                window.location.href="../index.html";
            }, 1000);

        } else {

            // Error message
            showToast(data.message || "Error ❌");
        }

    } catch (error) {
        showToast(error.message || "Registration failed ❌");
    }
}

// ================= TOGGLE PASSWORD =================
function togglePassword(id) {

    // Get password input
    const input = document.getElementById(id);

    // Toggle type
    input.type =
        input.type === "password"
            ? "text"
            : "password";
}

