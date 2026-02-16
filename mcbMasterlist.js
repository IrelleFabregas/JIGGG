// mcbMasterlist.js - Frontend JavaScript for MCB Masterlist Management

// Configuration
const API_URL = '../php/mcbMasterlist.php'; // Adjust path to your PHP file location

// Pagination variables
let currentPage = 1;
let recordsPerPage = 10;
let allRecords = [];
let filteredRecords = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    loadMasterlistRecords();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Form submission
    document.getElementById('inventoryForm').addEventListener('submit', handleFormSubmit);
    
    // Search functionality
    document.getElementById('searchInputs').addEventListener('input', handleSearch);
    
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', function() {
        loadMasterlistRecords();
    });
    
    // Pagination buttons
    document.getElementById('prevBtn').addEventListener('click', previousPage);
    document.getElementById('nextBtn').addEventListener('click', nextPage);
    
    // Modal close buttons
    document.getElementById('closeModal').addEventListener('click', closeResponseModal);
    document.getElementById('closeActionModal').addEventListener('click', closeActionModal);
    document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
    document.getElementById('cancelActionBtn').addEventListener('click', closeActionModal);
    document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
    
    // Action modal buttons
    document.getElementById('editRecordBtn').addEventListener('click', handleEditClick);
    document.getElementById('deleteRecordBtn').addEventListener('click', handleDeleteClick);
    
    // Edit form submission
    document.getElementById('editInventoryForm').addEventListener('submit', handleEditSubmit);
    
    // Close modals when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('trc-modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Handle form submission (Add new item)
async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    formData.append('action', 'create');
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showResponseModal('Success', data.message);
            e.target.reset();
            document.getElementById('mcbBarcode').focus();
            loadMasterlistRecords();
        } else {
            showResponseModal('Error', data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showResponseModal('Error', 'Failed to add item. Please try again.');
    }
}

// Load masterlist records
async function loadMasterlistRecords() {
    try {
        const response = await fetch(`${API_URL}?action=read`);
        const data = await response.json();
        
        if (data.success) {
            allRecords = data.records;
            filteredRecords = allRecords;
            currentPage = 1;
            displayRecords();
        } else {
            console.error('Error loading records:', data.message);
            allRecords = [];
            filteredRecords = [];
            displayRecords();
        }
    } catch (error) {
        console.error('Error:', error);
        allRecords = [];
        filteredRecords = [];
        displayRecords();
    }
}

// Display records in table
function displayRecords() {
    const tbody = document.getElementById('masterlistTableBody');
    tbody.innerHTML = '';
    
    if (filteredRecords.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No records found</td></tr>';
        updatePaginationInfo(0, 0);
        return;
    }
    
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = Math.min(startIndex + recordsPerPage, filteredRecords.length);
    const recordsToDisplay = filteredRecords.slice(startIndex, endIndex);
    
    recordsToDisplay.forEach(record => {
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.setAttribute('data-id', record.id);
        
        row.innerHTML = `
            <td>${escapeHtml(record.mcb_barcode)}</td>
            <td>${escapeHtml(record.mecha_barcode)}</td>
            <td>${escapeHtml(record.item_description)}</td>
            <td>${escapeHtml(record.stock_control)}</td>
            <td>${escapeHtml(record.customer)}</td>
            <td>${escapeHtml(record.model)}</td>
            <td>${escapeHtml(record.remarks)}</td>
            <td><span class="status-badge status-${record.status.toLowerCase().replace(/\s+/g, '-')}">${escapeHtml(record.status)}</span></td>
        `;
        
        // Double-click to show action modal
        row.addEventListener('dblclick', function() {
            showActionModal(record);
        });
        
        tbody.appendChild(row);
    });
    
    updatePaginationInfo(startIndex + 1, endIndex);
}

// Show action modal (Edit/Delete)
function showActionModal(record) {
    const modal = document.getElementById('actionModal');
    const selectedItemName = document.getElementById('selectedItemName');
    
    selectedItemName.textContent = `${record.mcb_barcode} - ${record.item_description}`;
    
    // Store record data for edit/delete operations
    modal.setAttribute('data-record', JSON.stringify(record));
    
    modal.style.display = 'block';
}

// Handle edit click
function handleEditClick() {
    const modal = document.getElementById('actionModal');
    const recordData = JSON.parse(modal.getAttribute('data-record'));
    
    // Populate edit form
    document.getElementById('editId').value = recordData.id;
    document.getElementById('editMcbBarcode').value = recordData.mcb_barcode;
    document.getElementById('editMechaBarcode').value = recordData.mecha_barcode;
    document.getElementById('editItemDescription').value = recordData.item_description;
    document.getElementById('editStockControl').value = recordData.stock_control;
    document.getElementById('editCustomer').value = recordData.customer;
    document.getElementById('editModel').value = recordData.model;
    document.getElementById('editRemarks').value = recordData.remarks;
    document.getElementById('editStatus').value = recordData.status;
    
    closeActionModal();
    document.getElementById('editModal').style.display = 'block';
}

// Handle edit form submission
async function handleEditSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    formData.append('action', 'update');
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showResponseModal('Success', data.message);
            closeEditModal();
            loadMasterlistRecords();
        } else {
            showResponseModal('Error', data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showResponseModal('Error', 'Failed to update item. Please try again.');
    }
}

// Handle delete click
async function handleDeleteClick() {
    const modal = document.getElementById('actionModal');
    const recordData = JSON.parse(modal.getAttribute('data-record'));
    
    if (!confirm(`Are you sure you want to delete:\n${recordData.mcb_barcode} - ${recordData.item_description}?`)) {
        return;
    }
    
    const formData = new FormData();
    formData.append('action', 'delete');
    formData.append('id', recordData.id);
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showResponseModal('Success', data.message);
            closeActionModal();
            loadMasterlistRecords();
        } else {
            showResponseModal('Error', data.message);
        }
    } catch (error) {
        console.error('Error:', error);
        showResponseModal('Error', 'Failed to delete item. Please try again.');
    }
}

// Search functionality
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredRecords = allRecords;
    } else {
        filteredRecords = allRecords.filter(record => {
            return (
                record.mcb_barcode.toLowerCase().includes(searchTerm) ||
                record.mecha_barcode.toLowerCase().includes(searchTerm) ||
                record.item_description.toLowerCase().includes(searchTerm) ||
                record.stock_control.toLowerCase().includes(searchTerm) ||
                record.customer.toLowerCase().includes(searchTerm) ||
                record.model.toLowerCase().includes(searchTerm) ||
                record.remarks.toLowerCase().includes(searchTerm) ||
                record.status.toLowerCase().includes(searchTerm)
            );
        });
    }
    
    currentPage = 1;
    displayRecords();
}

// Pagination functions
function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        displayRecords();
    }
}

function nextPage() {
    const totalPages = Math.ceil(filteredRecords.length / recordsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        displayRecords();
    }
}

function updatePaginationInfo(startIndex, endIndex) {
    const totalRecords = filteredRecords.length;
    const totalPages = Math.ceil(totalRecords / recordsPerPage);
    
    document.getElementById('pageInfo').textContent = 
        `Page ${currentPage} of ${totalPages} (${startIndex}-${endIndex} of ${totalRecords})`;
    
    document.getElementById('prevBtn').disabled = currentPage === 1;
    document.getElementById('nextBtn').disabled = currentPage === totalPages || totalPages === 0;
}

// Modal functions
function showResponseModal(title, message) {
    const modal = document.getElementById('responseModal');
    const messageElement = document.getElementById('modalMessage');
    
    messageElement.textContent = message;
    modal.style.display = 'block';
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 3000);
}

function closeResponseModal() {
    document.getElementById('responseModal').style.display = 'none';
}

function closeActionModal() {
    document.getElementById('actionModal').style.display = 'none';
}

function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

