document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.querySelector(".login-form");
    const trcModal = document.getElementById("trcNotificationModal");

    // Helper Function to Show Modal without a button
    function showTrcNotification(message, isSuccess = true) {
        const title = document.getElementById("trcModalTitle");
        const msgBody = document.getElementById("trcModalMessage");
        const content = trcModal.querySelector(".trc-modal-content");

        content.classList.remove("trc-success", "trc-error");
        content.classList.add(isSuccess ? "trc-success" : "trc-error");
        
        title.innerText = isSuccess ? "✓ Success" : "⚠ Alert";
        msgBody.innerText = message;
        
        // Use 'flex' for centering
        trcModal.style.display = "flex";

        // AUTO-CLOSE LOGIC: Closes after 3 seconds
        setTimeout(() => {
            trcModal.style.display = "none";
            if (isSuccess) {
                window.location.href = "../html/dashboard.html";
            }
        }, 800);
    }

    // Notice: We removed document.getElementById("trcModalConfirmBtn") to avoid errors!
    document.getElementById("closeTrcModal").onclick = () => {
        trcModal.style.display = "none";
    };

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);

        try {
            const response = await fetch("../php/login.php", {
                method: "POST",
                body: formData
            });

            const result = (await response.text()).trim();

            if (result === "success") {
                showTrcNotification("Login verified. Redirecting...", true);
            } else {
                showTrcNotification(result || "Invalid credentials.", false);
            }
        } catch (err) {
            showTrcNotification("Connection error.", false);
        }
    });
});