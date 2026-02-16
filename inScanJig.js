document.addEventListener("DOMContentLoaded", () => {

    // ---------------- DOM ELEMENTS ----------------
    const serialInput = document.getElementById("serial");
    const itemDescInput = document.getElementById("itemDescription");
    const customerInput = document.getElementById("customer");
    const modelInput = document.getElementById("model");
    const areaSelect = document.getElementById("area");
    const usageInput = document.getElementById("usage");
    const remarkSelect = document.getElementById("remarks"); 
    const form = document.getElementById("masterlistForm");
    
    // Updated Modal Elements based on new naming
    const trcModal = document.getElementById("trcNotificationModal");
    const trcModalMessage = document.getElementById("trcModalMessage");
    const trcModalTitle = document.getElementById("trcModalTitle");
    const trcModalConfirmBtn = document.getElementById("trcModalConfirmBtn");
    const closeTrcModal = document.getElementById("closeTrcModal");

    // ---------------- TRC MODAL LOGIC ----------------
    function showTrcNotification(message, isSuccess = true) {
        const content = trcModal.querySelector(".trc-modal-content");
        
        // Reset classes
        content.classList.remove("trc-success", "trc-error");

        if (isSuccess) {
            content.classList.add("trc-success");
            trcModalTitle.innerText = "✓ Operation Successful";
        } else {
            content.classList.add("trc-error");
            trcModalTitle.innerText = "⚠ System Alert";
        }

        trcModalMessage.innerText = message;
        trcModal.style.display = "flex";
    }

    const hideModal = () => trcModal.style.display = "none";
    
    closeTrcModal.onclick = hideModal;
    trcModalConfirmBtn.onclick = hideModal;
    window.onclick = (e) => { if (e.target === trcModal) hideModal(); };

    // ---------------- AUTO-FILL SERIAL ----------------
    serialInput.addEventListener("change", async () => {
        const serialValue = serialInput.value.trim();
        if (!serialValue) return;

        try {
            const response = await fetch(`../php/inScanJig.php?serial=${encodeURIComponent(serialValue)}`);
            if (!response.ok) throw new Error("Server Error");

            const data = await response.json();

            if (data.status === "success" && data.found) {
                itemDescInput.value = data.description;
                customerInput.value = data.customer;
                areaSelect.value = data.area;
                itemDescInput.style.border = "2px solid #4CAF50";
            } else {
                itemDescInput.value = "";
                customerInput.value = "";
                areaSelect.value = "";
                itemDescInput.style.border = "";
            }
        } catch (err) {
            console.error("Auto-fill Error:", err);
        }
    });

    // ---------------- FORM SUBMISSION ----------------
    form.onsubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(form);

        try {
            const response = await fetch("../php/inScanJig.php", {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (result.status === "success") {
                showTrcNotification(result.message, true);
                form.reset();
                itemDescInput.style.border = "";
            } else {
                showTrcNotification(result.message, false);
            }

        } catch (err) {
            showTrcNotification("Error: Could not connect to database.", false);
            console.error(err);
        }
    };
});