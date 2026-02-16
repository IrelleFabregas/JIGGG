document.addEventListener("DOMContentLoaded", () => {

    // ---------------- DOM ELEMENTS ----------------
    const serialInput = document.getElementById("serial");
    const itemDescInput = document.getElementById("itemDescription");
    const customerInput = document.getElementById("customer");
    const modelInput = document.getElementById("model");
    const areaSelect = document.getElementById("area");
    const lineSelect = document.getElementById("line");
    const statusSelect = document.getElementById("status");
    const remarkSelect = document.getElementById("remarks"); 
    const form = document.getElementById("masterlistForm");
    
    // Modal Elements
    const trcModal = document.getElementById("trcNotificationModal");
    const trcModalMessage = document.getElementById("trcModalMessage");
    const trcModalTitle = document.getElementById("trcModalTitle");
    const trcModalConfirmBtn = document.getElementById("trcModalConfirmBtn");
    const closeTrcModal = document.getElementById("closeTrcModal");

    // ---------------- TRC MODAL LOGIC ----------------
    function showTrcNotification(message, isSuccess = true) {
        const content = trcModal.querySelector(".trc-modal-content");
        
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

    // Expose globally for scanner
    window.showTrcNotification = showTrcNotification;

    // ---------------- OPTIMIZED AUTO-FILL API ----------------
    async function lookupItemDescriptionFromAPI(serialValue) {
        if (!serialValue) return false;

        // Performance tracking
        const startTime = performance.now();

        try {
            // OPTIMIZED: Use Promise.race for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 sec timeout
            
            const response = await fetch(
                `../php/jigIncoming.php?serial=${encodeURIComponent(serialValue)}`,
                { signal: controller.signal }
            );
            
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error("Server Error");

            const data = await response.json();

            if (data.status === "success" && data.found) {
                // INSTANT FILL - No delays
                itemDescInput.value = data.description || '';
                customerInput.value = data.customer || '';
                areaSelect.value = data.area || '';
                
                // Model might not be in API response, keep existing if any
                if (data.model) {
                    modelInput.value = data.model;
                }
                
                // Apply styling IMMEDIATELY
                const successFields = [itemDescInput, customerInput, areaSelect];
                successFields.forEach(field => {
                    if (field && field.value) {
                        field.style.border = "2px solid #4CAF50";
                        field.style.transition = "all 0.2s";
                        field.classList.add('field-locked');
                        
                        if (field.tagName === 'SELECT') {
                            field.disabled = true;
                        } else {
                            field.readOnly = true;
                        }
                    }
                });
                
                // Performance log
                const duration = performance.now() - startTime;
                console.log(`✅ Auto-fill completed in ${duration.toFixed(2)}ms`);
                
                return true; // Found
                
            } else {
                // NOT FOUND - Reset immediately
                itemDescInput.value = "";
                customerInput.value = "";
                areaSelect.value = "";
                
                // Remove styling
                [itemDescInput, customerInput, areaSelect].forEach(field => {
                    if (field) {
                        field.style.border = "";
                        field.readOnly = false;
                        if (field.tagName === 'SELECT') field.disabled = false;
                        field.classList.remove('field-locked');
                    }
                });
                
                return false; // Not found
            }
            
        } catch (err) {
            console.error("Auto-fill Error:", err);
            
            // Reset on error
            itemDescInput.value = "";
            customerInput.value = "";
            areaSelect.value = "";
            itemDescInput.readOnly = false;
            customerInput.readOnly = false;
            areaSelect.disabled = false;
            
            if (err.name !== 'AbortError') {
                showTrcNotification("Error connecting to database", false);
            }
            
            return false;
        }
    }

    // Expose globally for scanner
    window.lookupItemDescriptionFromAPI = lookupItemDescriptionFromAPI;

    // ---------------- MANUAL INPUT HANDLER (DEBOUNCED) ----------------
    let manualInputTimeout;
    
    serialInput.addEventListener("input", (e) => {
        clearTimeout(manualInputTimeout);
        
        // Shorter debounce for faster response
        manualInputTimeout = setTimeout(async () => {
            const serialValue = e.target.value.trim().toUpperCase();
            
            if (serialValue.length >= 3) {
                // Update input with uppercase
                serialInput.value = serialValue;
                
                // Lookup
                await lookupItemDescriptionFromAPI(serialValue);
            }
        }, 500); // Reduced from 800ms to 500ms
    });

    // ---------------- FORM SUBMISSION ----------------
    form.onsubmit = async (e) => {
        e.preventDefault();

        // Disable submit button to prevent double-submit
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = '💾 Saving...';

        const formData = new FormData(form);

        try {
            const response = await fetch("../php/jigIncoming.php", {
                method: "POST",
                body: formData
            });

            const result = await response.json();

            if (result.status === "success") {
                showTrcNotification(result.message, true);
                
                // Reset form
                form.reset();
                
                // Reset all styling and locks
                resetAllFields();
                
                // Focus back to serial for next entry
                setTimeout(() => {
                    serialInput.focus();
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }, 500);
                
            } else {
                showTrcNotification(result.message, false);
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }

        } catch (err) {
            showTrcNotification("Error: Could not connect to database.", false);
            console.error(err);
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    };

    // ---------------- HELPER: RESET ALL FIELDS ----------------
    function resetAllFields() {
        const fields = [
            itemDescInput, 
            customerInput, 
            modelInput, 
            areaSelect
        ];
        
        fields.forEach(field => {
            if (field) {
                field.style.border = "";
                field.readOnly = false;
                if (field.tagName === 'SELECT') {
                    field.disabled = false;
                }
                field.classList.remove('field-locked');
            }
        });
    }

    // Expose for scanner script
    window.resetAllFields = resetAllFields;

    // ---------------- INTEGRATION WITH SCANNER ----------------
    // Override scanner's lookup to use our optimized API
    if (window.scannerUtils) {
        console.log('✅ Scanner integration active');
    }

    // ---------------- KEYBOARD SHORTCUTS ----------------
    document.addEventListener('keydown', function(e) {
        // Ctrl + Enter to submit from anywhere in form
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            if (form.checkValidity()) {
                form.requestSubmit();
            } else {
                showTrcNotification('Please fill all required fields', false);
            }
        }
        
        // Ctrl + R to reset form
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            if (confirm('Reset form?')) {
                form.reset();
                resetAllFields();
                serialInput.focus();
            }
        }
    });

    console.log('✅ JIG Incoming form initialized - Optimized mode');
});

// Toggle submenu functionality
document.addEventListener('DOMContentLoaded', function() {
    
    // Get all submenu toggles
    const jigMasterlistToggle = document.getElementById('jigMasterlistToggle');
    const jigTransactionToggle = document.getElementById('jigTransactionToggle');
    const mcbMasterlistToggle = document.getElementById('mcbMasterlistToggle');
    const mcbTransactionToggle = document.getElementById('mcbTransactionToggle');
    
    // Function to toggle submenu
    function toggleSubmenu(element) {
        if (element) {
            element.addEventListener('click', function(e) {
                e.preventDefault();
                this.classList.toggle('open');
            });
        }
    }
    
    // Apply toggle functionality to all submenus
    toggleSubmenu(jigMasterlistToggle);
    toggleSubmenu(jigTransactionToggle);
    toggleSubmenu(mcbMasterlistToggle);
    toggleSubmenu(mcbTransactionToggle);
    
    // Auto-open submenu if it contains an active item
    const activeSubmenus = document.querySelectorAll('.has-submenu.active');
    activeSubmenus.forEach(submenu => {
        submenu.classList.add('open');
    });
    
    // Auto-open submenu if any child has active class
    const activeSubmenuItems = document.querySelectorAll('.submenu li.active');
    activeSubmenuItems.forEach(item => {
        const parentSubmenu = item.closest('.has-submenu');
        if (parentSubmenu) {
            parentSubmenu.classList.add('open');
        }
    });
});