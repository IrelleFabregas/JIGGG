// masterlist.js - Handles MCB Masterlist with barcode scanning

let currentPage = 1;
const recordsPerPage = 10;
let allRecords = [];
let filteredRecords = [];
let selectedRecordId = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadMasterlistRecords();
    setupEventListeners();
    setupBarcodeScanning();
});

// Setup event listeners
function setupEventListeners() {
    // Form submission
    document.getElementById('inventoryForm').addEventListener('submit', handleFormSubmit);
    
    // Search functionality
    document.getElementById('searchInputs').addEventListener('input', handleSearch);
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', function() {
        loadMasterlistRecords();
        showNotification('Records refreshed successfully', 'success');
    });
    
    // Pagination
    document.getElementById('prevBtn').addEventListener('click', () => changePage(-1));
    document.getElementById('nextBtn').addEventListener('click', () => changePage(1));
    
    // Modal close buttons
    document.getElementById('closeModal').addEventListener('click', closeResponseModal);
    document.getElementById('closeActionModal').addEventListener('click', closeActionModal);
    document.getElementById('cancelActionBtn').addEventListener('click', closeActionModal);
    document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
    document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
    
    // Action modal buttons
    document.getElementById('editRecordBtn').addEventListener('click', openEditModal);
    document.getElementById('deleteRecordBtn').addEventListener('click', handleDelete);
    
    // Edit form submission
    document.getElementById('editInventoryForm').addEventListener('submit', handleEditSubmit);
    
    // Close modal on outside click
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('trc-modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Setup barcode scanning
function setupBarcodeScanning() {
    const mcbBarcodeInput = document.getElementById('mcbBarcode');
    const mechaBarcodeInput = document.getElementById('mechaBarcode');
    
    // Enter key moves to next field
    mcbBarcodeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            mechaBarcodeInput.focus();
        }
    });
    
    mechaBarcodeInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('itemDescription').focus();
        }
    });
    
    // Check for duplicate barcodes on input
    mcbBarcodeInput.addEventListener('blur', () => checkDuplicateBarcode('mcb'));
    mechaBarcodeInput.addEventListener('blur', () => checkDuplicateBarcode('mecha'));
}

// Check for duplicate barcodes
function checkDuplicateBarcode(type) {
    const mcbBarcode = document.getElementById('mcbBarcode').value.trim();
    const mechaBarcode = document.getElementById('mechaBarcode').value.trim();
    
    if ((type === 'mcb' && !mcbBarcode) || (type === 'mecha' && !mechaBarcode)) {
        return;
    }
    
    // Check if barcode already exists
    const duplicate = allRecords.find(record => {
        if (type === 'mcb') {
            return record.mcbBarcode === mcbBarcode;
        } else {
            return record.mechaBarcode === mechaBarcode;
        }
    });
    
    if (duplicate) {
        showNotification(`Warning: ${type.toUpperCase()} barcode already exists in masterlist`, 'warning');
    }
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        mcbBarcode: document.getElementById('mcbBarcode').value.trim(),
        mechaBarcode: document.getElementById('mechaBarcode').value.trim(),
        itemDescription: document.getElementById('itemDescription').value.trim(),
        serial: document.getElementById('serial').value.trim(),
        stockControl: document.getElementById('stockControl').value.trim(),
        customer: document.getElementById('customer').value,
        model: document.getElementById('model').value,
        area: document.getElementById('area').value,
        line: document.getElementById('line').value,
        remarks: document.getElementById('remarks').value,
        status: document.getElementById('status').value
    };
    
    // Validate required fields
    if (!formData.mcbBarcode || !formData.mechaBarcode || !formData.itemDescription || 
        !formData.serial || !formData.stockControl || !formData.area || 
        !formData.line || !formData.status) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Check for duplicate barcodes
    const duplicateMcb = allRecords.find(r => r.mcbBarcode === formData.mcbBarcode);
    const duplicateMecha = allRecords.find(r => r.mechaBarcode === formData.mechaBarcode);
    
    if (duplicateMcb || duplicateMecha) {
        showNotification('Error: Barcode already exists in masterlist', 'error');
        return;
    }
    
    try {
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/mcb/masterlist', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(formData)
        // });
        
        // Simulated API call - replace with actual implementation
        console.log('New masterlist item:', formData);
        
        // Add to local records (temporary - remove when API is connected)
        allRecords.unshift({
            id: Date.now(),
            ...formData
        });
        
        showNotification('Item added successfully!', 'success');
        document.getElementById('inventoryForm').reset();
        document.getElementById('mcbBarcode').focus();
        renderTable();
        
    } catch (error) {
        console.error('Error saving item:', error);
        showNotification('Error saving item', 'error');
    }
}

// Load masterlist records
async function loadMasterlistRecords() {
    try {
        // TODO: Replace with actual API endpoint
        // const response = await fetch('/api/mcb/masterlist');
        // allRecords = await response.json();
        
        // Simulated data - replace with actual API call
        allRecords = generateMockMasterlistData();
        
        filteredRecords = [...allRecords];
        renderTable();
        
    } catch (error) {
        console.error('Error loading records:', error);
        showNotification('Error loading records', 'error');
    }
}

// Generate mock masterlist data for testing
function generateMockMasterlistData() {
    const mockRecords = [];
    const customers = ['EPPI', 'TRC'];
    const models = ['MODEL 1', 'MODEL 2', 'MODEL 3', 'MODEL 4'];
    const areas = ['SCANNER ASSY', 'FT CHECKER', 'ADF ASSY'];
    const lines = ['LINE 1', 'LINE 2', 'LINE 3'];
    const remarks = ['GOOD', 'NO GOOD'];
    const statuses = ['IN-USE', 'FOR REPAIR', 'FOR MODIFICATION', 'OTHERS'];
    
    for (let i = 0; i < 50; i++) {
        mockRecords.push({
            id: i + 1,
            mcbBarcode: `MCB${String(i + 1000).padStart(6, '0')}`,
            mechaBarcode: `MECH${String(i + 2000).padStart(6, '0')}`,
            itemDescription: `MCB Circuit Board Assembly Type ${Math.floor(i / 10) + 1}`,
            serial: `SN-MCB-${String(i + 1000).padStart(8, '0')}`,
            stockControl: `SC-${String(10000 + i).padStart(5, '0')}`,
            customer: customers[Math.floor(Math.random() * customers.length)],
            model: models[Math.floor(Math.random() * models.length)],
            area: areas[Math.floor(Math.random() * areas.length)],
            line: lines[Math.floor(Math.random() * lines.length)],
            remarks: remarks[Math.floor(Math.random() * remarks.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)]
        });
    }
    
    return mockRecords;
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredRecords = [...allRecords];
    } else {
        filteredRecords = allRecords.filter(record => {
            return Object.values(record).some(value => 
                String(value).toLowerCase().includes(searchTerm)
            );
        });
    }
    
    currentPage = 1;
    renderTable();
}

// Render table with pagination
function renderTable() {
    const tbody = document.getElementById('masterlistTableBody');
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    const pageRecords = filteredRecords.slice(startIndex, endIndex);
    
    if (pageRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="text-center">No records found</td></tr>';
        updatePaginationControls();
        return;
    }
    
    tbody.innerHTML = pageRecords.map(record => `
        <tr ondblclick="showActionModal(${record.id})" style="cursor: pointer;">
            <td>${record.mcbBarcode}</td>
            <td>${record.mechaBarcode}</td>
            <td>${record.itemDescription}</td>
            <td>${record.customer}</td>
            <td>${record.serial}</td>
            <td>${record.stockControl}</td>
            <td>${record.model}</td>
            <td>${record.area}</td>
            <td>${record.line}</td>
            <td>${record.remarks}</td>
            <td>${record.status}</td>
        </tr>
    `).join('');
    
    updatePaginationControls();
}

// Show action modal (Edit or Delete)
function showActionModal(recordId) {
    selectedRecordId = recordId;
    const record = allRecords.find(r => r.id === recordId);
    
    if (record) {
        document.getElementById('selectedItemName').textContent = 
            `${record.mcbBarcode} - ${record.itemDescription}`;
        document.getElementById('actionModal').style.display = 'block';
    }
}

// Open edit modal
function openEditModal() {
    const record = allRecords.find(r => r.id === selectedRecordId);
    
    if (record) {
        document.getElementById('editId').value = record.id;
        document.getElementById('editMcbBarcode').value = record.mcbBarcode;
        document.getElementById('editMechaBarcode').value = record.mechaBarcode;
        document.getElementById('editItemDescription').value = record.itemDescription;
        document.getElementById('editCustomer').value = record.customer;
        document.getElementById('editSerial').value = record.serial;
        document.getElementById('editStockControl').value = record.stockControl;
        document.getElementById('editModel').value = record.model;
        document.getElementById('editArea').value = record.area;
        document.getElementById('editLine').value = record.line;
        document.getElementById('editRemarks').value = record.remarks;
        document.getElementById('editStatus').value = record.status;
        
        closeActionModal();
        document.getElementById('editModal').style.display = 'block';
    }
}

// Handle edit form submission
async function handleEditSubmit(e) {
    e.preventDefault();
    
    const recordId = parseInt(document.getElementById('editId').value);
    const updatedData = {
        mcbBarcode: document.getElementById('editMcbBarcode').value.trim(),
        mechaBarcode: document.getElementById('editMechaBarcode').value.trim(),
        itemDescription: document.getElementById('editItemDescription').value.trim(),
        customer: document.getElementById('editCustomer').value.trim(),
        serial: document.getElementById('editSerial').value.trim(),
        stockControl: document.getElementById('editStockControl').value.trim(),
        model: document.getElementById('editModel').value.trim(),
        area: document.getElementById('editArea').value.trim(),
        line: document.getElementById('editLine').value.trim(),
        remarks: document.getElementById('editRemarks').value.trim(),
        status: document.getElementById('editStatus').value
    };
    
    try {
        // TODO: Replace with actual API endpoint
        // const response = await fetch(`/api/mcb/masterlist/${recordId}`, {
        //     method: 'PUT',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(updatedData)
        // });
        
        // Update local records (temporary - remove when API is connected)
        const index = allRecords.findIndex(r => r.id === recordId);
        if (index !== -1) {
            allRecords[index] = { id: recordId, ...updatedData };
        }
        
        showNotification('Record updated successfully!', 'success');
        closeEditModal();
        renderTable();
        
    } catch (error) {
        console.error('Error updating record:', error);
        showNotification('Error updating record', 'error');
    }
}

// Handle delete
async function handleDelete() {
    if (!confirm('Are you sure you want to delete this record?')) {
        return;
    }
    
    try {
        // TODO: Replace with actual API endpoint
        // const response = await fetch(`/api/mcb/masterlist/${selectedRecordId}`, {
        //     method: 'DELETE'
        // });
        
        // Delete from local records (temporary - remove when API is connected)
        allRecords = allRecords.filter(r => r.id !== selectedRecordId);
        filteredRecords = filteredRecords.filter(r => r.id !== selectedRecordId);
        
        showNotification('Record deleted successfully!', 'success');
        closeActionModal();
        renderTable();
        
    } catch (error) {
        console.error('Error deleting record:', error);
        showNotification('Error deleting record', 'error');
    }
}

// Update pagination controls
function updatePaginationControls() {
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
    document.getElementById('pageInfo').textContent = `Page ${currentPage} of ${totalPages}`;
    
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages || totalPages === 0;
}

// Change page
function changePage(direction) {
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderTable();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const modal = document.getElementById('responseModal');
    const modalMessage = document.getElementById('modalMessage');
    
    modalMessage.textContent = message;
    modalMessage.className = type === 'error' ? 'text-danger' : 
                             type === 'warning' ? 'text-warning' : 
                             type === 'success' ? 'text-success' : '';
    
    modal.style.display = 'block';
    
    // Auto-close after 3 seconds for success messages
    if (type === 'success') {
        setTimeout(() => {
            modal.style.display = 'none';
        }, 3000);
    }
}

// Close modals
function closeResponseModal() {
    document.getElementById('responseModal').style.display = 'none';
}

function closeActionModal() {
    document.getElementById('actionModal').style.display = 'none';
    selectedRecordId = null;
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}