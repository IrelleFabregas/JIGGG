document.addEventListener("DOMContentLoaded", () => {
    // Globals
    let currentPage = 1;
    const rowsPerPage = 13;
    let tableData = [];
    let originalData = [];

    const tableBody = document.getElementById("tableBody");
    const pageInfo = document.getElementById("pageInfo");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const searchInput = document.getElementById("searchInput");

    const masterlistToggle = document.getElementById("masterlistToggle");

    // ---------------- Sidebar toggle ----------------
    if (masterlistToggle) {
        if (window.location.pathname.includes("../html/inScanJig.html") || window.location.pathname.includes("../html/outScanJig.html")) {
            masterlistToggle.classList.add("open");
        }

        masterlistToggle.addEventListener("click", (e) => {
            if (!e.target.closest('.submenu')) {
                masterlistToggle.classList.toggle("open");
            }
        });
    }

async function loadDashboardData() {
    try {
        const response = await fetch("../php/fetchData.php");
        const data = await response.json();
        
        // Because PHP sent data sorted DESC, 
        // index [0] is now the newest record.
        originalData = [...data];
        tableData = [...data];
        
        renderTable();
        renderSummaryTable();
    } catch (err) {
        console.error("Error loading data:", err);
    }
}

    loadDashboardData();
    // ---------------- Usage color ----------------
function getUsageClass(item) {
    const usage = parseInt(item.usage_count) || 0;
    const limit = parseInt(item.limit) || 1000;

    // 1. If usage is 1000 or more (100%+) -> RED
    if (usage >= limit) {
        return "usage-red";
    } 
    // 2. If usage is 80% of limit (800) or more -> ORANGE
    else if (usage >= (limit * 0.8)) {
        return "usage-orange";
    } 
    // 3. Below 80% (less than 800) -> WHITE/DEFAULT
    else {
        return "usage-white";
    }
}

    // ---------------- Render table ----------------
 // ---------------- Render table ----------------
function renderTable() {
    if (!tableBody) return;
    tableBody.innerHTML = "";

    const start = (currentPage - 1) * rowsPerPage;
    const pageData = tableData.slice(start, start + rowsPerPage);

    for (let i = 0; i < rowsPerPage; i++) {
        const item = pageData[i];
        const row = document.createElement("tr");

        // Inside renderTable() loop
if (item) {
    const usageClass = getUsageClass(item);
    
    // Apply the class to the <tr> element
    row.className = usageClass; 

    row.innerHTML = `
        <td>${item.serial || ''}</td>
        <td>${item.item_description || ''}</td>
        <td>${item.customer || ''}</td>
        <td>${item.model || ''}</td>
        <td>${item.area || ''}</td>
        <td>${item.usage_count || 0}</td>
        <td>${item.limit || 1000}</td>
        <td>${item.remarks || ''}</td>
    `;
} else {
    row.innerHTML = `<td>&nbsp;</td>`.repeat(8);
}

        tableBody.appendChild(row);
    }

    // Update pagination
    const totalPages = Math.ceil(tableData.length / rowsPerPage) || 1;
    if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage >= totalPages;
}


    // ---------------- Pagination ----------------
    prevBtn?.addEventListener("click", () => {
        if (currentPage > 1) { currentPage--; renderTable(); }
    });
    nextBtn?.addEventListener("click", () => {
        const totalPages = Math.ceil(tableData.length / rowsPerPage) || 1;
        if (currentPage < totalPages) { currentPage++; renderTable(); }
    });

    // ---------------- Search ----------------
   searchInput?.addEventListener("keyup", (e) => {
    const filter = e.target.value.toLowerCase();
    
    // Filter logic now only evaluates the 'serial' field
    tableData = originalData.filter(item => {
        const serial = (item.serial || "").toLowerCase();
        return serial.includes(filter);
    });

    currentPage = 1;
    renderTable();
});
    // ---------------- Export to CSV ----------------
    document.getElementById("exportBtn")?.addEventListener("click", () => {
        const table = document.querySelector(".responsive-table");
        if (!table) return;

        const rows = table.querySelectorAll("tr");
        const csv = Array.from(rows).map(row => {
            return Array.from(row.querySelectorAll("td, th"))
                        .map(cell => cell.innerText.replace(/,/g, ";"))
                        .join(",");
        }).join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `TRC_Report_${new Date().toLocaleDateString()}.csv`;
        link.click();
    });

    // ---------------- Summary Table ----------------
    function renderSummaryTable() {
        const summaryBody = document.getElementById("summaryBody");
        if (!summaryBody) return;
        summaryBody.innerHTML = "";

        const summaryMap = {};
        originalData.forEach(item => {
            const area = item.area || "N/A";
            const desc = item.item_description || "Unknown";
            const remarks = (item.remarks || "").toUpperCase();

            const key = `${area}-${desc}`;
            if (!summaryMap[key]) summaryMap[key] = { area, description: desc, totalQty: 0, good: 0, ng: 0 };

            summaryMap[key].totalQty++;
            if (remarks === "GOOD") summaryMap[key].good++;
            if (remarks === "NG") summaryMap[key].ng++;
        });

        Object.values(summaryMap).forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.area}</td>
                <td>${row.description}</td>
                <td><strong>${row.totalQty}</strong></td>
                <td class="text-success">${row.good}</td>
                <td class="text-danger">${row.ng}</td>
            `;
            summaryBody.appendChild(tr);
        });
    }

    // ---------------- Logout ----------------
    document.getElementById("logoutBtn")?.addEventListener("click", (e) => {
        if (!confirm("Are you sure you want to logout?")) e.preventDefault();
    });
});


function renderSummaryTable() {
    const summaryBody = document.getElementById("summaryBody");
    if (!summaryBody) return;

    summaryBody.innerHTML = "";

    // Object to store our grouped calculations
    const summaryMap = {};

    originalData.forEach(item => {
        const area = item.area || item.location || "N/A";
        const desc = item.item_description || item.description || "Unknown";
        const remarks = (item.remarks || item.status || "").toUpperCase();

        // Create a unique key for grouping by Area and Description
        const key = `${area}-${desc}`;

        if (!summaryMap[key]) {
            summaryMap[key] = {
                area: area,
                description: desc,
                totalQty: 0,
                good: 0,
                ng: 0
            };
        }

        summaryMap[key].totalQty++;
        
        if (remarks === "GOOD") {
            summaryMap[key].good++;
        } else if (remarks === "NG") {
            summaryMap[key].ng++;
        }
    });

    // Convert map to rows and append to table
    Object.values(summaryMap).forEach(row => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${row.area}</td>
            <td>${row.description}</td>
            <td><strong>${row.totalQty}</strong></td>
            <td class="text-success">${row.good}</td>
            <td class="text-danger">${row.ng}</td>
        `;
        summaryBody.appendChild(tr);
    });
}

document.addEventListener("DOMContentLoaded", function() {
    const masterlistToggle = document.getElementById("masterlistToggle");
    const submenu = masterlistToggle.querySelector(".submenu");
    const currentPath = window.location.pathname;

    // 1. Auto-expand if we are on the correct page
    if (currentPath.includes("inScanJig.html") || currentPath.includes("outScanJig.html")) {
        masterlistToggle.classList.add("open");
    }

    // 2. The Toggle Logic
    masterlistToggle.addEventListener("click", function(e) {
        // Stop the click from triggering if we click a sub-link (the actual IN/OUT links)
        if (e.target.closest('.submenu')) {
            return; 
        }

        // Toggle the 'open' class
        this.classList.toggle("open");
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const currentPath = window.location.pathname;
    const menuLinks = document.querySelectorAll(".menu a");

    menuLinks.forEach(link => {
        // Get the filename from the href (e.g., 'dashboard.html')
        const linkPath = link.getAttribute("href");

        if (linkPath && currentPath.includes(linkPath.replace('../html/', ''))) {
            // Add active class to the link
            link.classList.add("active");

            // If it's inside a submenu, keep the parent submenu open
            const parentSubmenu = link.closest(".has-submenu");
            if (parentSubmenu) {
                parentSubmenu.classList.add("open");
            }
            
            // Highlight the parent menu item if it's a simple list item
            const parentItem = link.closest(".menu-item");
            if (parentItem) {
                parentItem.classList.add("active-item");
            }
        }
    });
});