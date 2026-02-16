document.addEventListener("DOMContentLoaded", () => {

    /* =========================================
       1️⃣ SIDEBAR TOGGLE LOGIC
    ========================================== */
    const masterlistToggle = document.getElementById("masterlistToggle");
    const mcbTransactionToggle = document.getElementById("mcbTransactionToggle");
    
    if (masterlistToggle) {
        const currentPath = window.location.pathname;
        if (currentPath.includes("../html/.html") || currentPath.includes("outScanJig.html")) {
            masterlistToggle.classList.add("open");
        }
        masterlistToggle.addEventListener("click", function (e) {
            if (e.target.closest(".submenu")) return;
            e.preventDefault();
            this.classList.toggle("open");
        });
    }

    if (mcbTransactionToggle) {
        const currentPath = window.location.pathname;
        if (currentPath.includes("mcbIncoming.html") || currentPath.includes("mcbOutgoing.html")) {
            mcbTransactionToggle.classList.add("open");
        }
        mcbTransactionToggle.addEventListener("click", function (e) {
            if (e.target.closest(".submenu")) return;
            e.preventDefault();
            this.classList.toggle("open");
        });
    }

    /* =========================================
       2️⃣ MASTERLIST FORM SUBMIT
    ========================================== */
    const form = document.getElementById("inventoryForm");
    const modal = document.getElementById("responseModal");
    const modalMessage = document.getElementById("modalMessage");
    const closeModal = document.getElementById("closeModal");

    const actionModal = document.getElementById("actionModal");
    const selectedItemName = document.getElementById("selectedItemName");
    const closeActionModal = document.getElementById("closeActionModal");
    const cancelActionBtn = document.getElementById("cancelActionBtn");

    const deleteRecordBtn = document.getElementById("deleteRecordBtn");
    const editRecordBtn = document.getElementById("editRecordBtn");

    const editModal = document.getElementById("editModal");
    const editForm = document.getElementById("editInventoryForm");
    const closeEditModal = document.getElementById("closeEditModal");
    const cancelEditBtn = document.getElementById("cancelEditBtn");

    let masterlistData = [];
    let selectedId = null;
    let currentPage = 1;
    const rowsPerPage = 12;

    if (closeModal) closeModal.onclick = () => modal.style.display = "none";
    if (closeActionModal) closeActionModal.onclick = () => actionModal.style.display = "none";
    if (cancelActionBtn) cancelActionBtn.onclick = () => actionModal.style.display = "none";
    const closeEdit = () => { if(editModal) editModal.style.display = "none"; };
    if (closeEditModal) closeEditModal.onclick = closeEdit;
    if (cancelEditBtn) cancelEditBtn.onclick = closeEdit;

    window.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
        if (e.target === actionModal) actionModal.style.display = "none";
        if (e.target === editModal) editModal.style.display = "none";
    });

    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const formData = new FormData(form);

            fetch("../php/jigMasterlist.php", {
                method: "POST",
                body: formData
            })
            .then(res => res.text())
            .then(data => {
                if (data.trim() === "success") {
                    modalMessage.innerHTML = "✅ Item added successfully!";
                    form.reset();
                    loadMasterlist(); 
                } else {
                    modalMessage.innerHTML = "❌ " + data;
                }
                modal.style.display = "block";
            })
            .catch(err => console.error("Submit Error:", err));
        });
    }

    /* =========================================
       3️⃣ FETCH AND DISPLAY MASTERLIST DATA
    ========================================== */
    const tableBody = document.getElementById("masterlistTableBody");
    const searchInput = document.getElementById("searchInputs");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const pageInfo = document.getElementById("pageInfo");
    const refreshBtn = document.getElementById("refreshBtn");

    function loadMasterlist() {
        fetch("../php/jigMasterlist.php")
            .then(res => res.json())
            .then(data => {
                masterlistData = data.sort((a, b) => b.item_id - a.item_id); 
                currentPage = 1;
                renderTable();
            })
            .catch(err => console.error("Error loading masterlist:", err));
    }

    
    /* =========================================
       4️⃣ ACTION MODAL LOGIC (DELETE & EDIT)
    ========================================== */
    if (deleteRecordBtn) {
        deleteRecordBtn.onclick = () => {
            if (confirm("Are you sure you want to delete this record?")) {
                fetch(`../php/masterlist.php?delete_id=${selectedId}`)
                    .then(res => res.text())
                    .then(data => {
                        if (data.trim().includes("success")) {
                            actionModal.style.display = "none";
                            loadMasterlist();
                        } else {
                            alert("Delete failed: " + data);
                        }
                    });
            }
        };
    }

    if (editRecordBtn) {
        editRecordBtn.onclick = () => {
            const item = masterlistData.find(i => i.item_id == selectedId);
            if (item && editModal) {
                document.getElementById("editId").value = item.item_id;
                document.getElementById("editItemDescription").value = item.item_description;
                document.getElementById("editCustomer").value = item.customer;
                document.getElementById("editSerial").value = item.serial_number;
                document.getElementById("editStockControl").value = item.stockControl; // NEW
                document.getElementById("editModel").value = item.model;
                document.getElementById("editArea").value = item.area;
                document.getElementById("editLine").value = item.line;
                document.getElementById("editRemarks").value = item.remarks;
                document.getElementById("editStatus").value = item.status; // NEW

                actionModal.style.display = "none";
                editModal.style.display = "flex";
            }
        };
    }

    if (editForm) {
        editForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const formData = new FormData(editForm);

            fetch("../php/jigMasterlist.php", {
                method: "POST",
                body: formData
            })
            .then(res => res.text())
            .then(data => {
                if (data.trim() === "success") {
                    alert("✅ Record updated successfully!");
                    editModal.style.display = "none";
                    loadMasterlist();
                } else {
                    alert("❌ Update failed: " + data);
                }
            })
            .catch(err => console.error("Update Error:", err));
        });
    }

    /* =========================================
       5️⃣ PAGINATION & SEARCH
    ========================================== */
    if (prevBtn) prevBtn.onclick = () => { if (currentPage > 1) { currentPage--; renderTable(); } };
    if (nextBtn) nextBtn.onclick = () => { currentPage++; renderTable(); };
    if (searchInput) searchInput.oninput = () => { currentPage = 1; renderTable(); };
    if (refreshBtn) refreshBtn.onclick = () => { loadMasterlist(); };

    loadMasterlist(); 
});