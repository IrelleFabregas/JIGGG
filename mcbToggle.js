// Toggle submenu functionality for MCB only
document.addEventListener('DOMContentLoaded', function() {
    
    // Get MCB submenu toggles only
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
    
    // Apply toggle functionality to MCB submenus only
    toggleSubmenu(mcbMasterlistToggle);
    toggleSubmenu(mcbTransactionToggle);
    
    // Auto-open MCB submenu if it contains an active item
    const mcbActiveSubmenus = document.querySelectorAll('#mcbMasterlistToggle.active, #mcbTransactionToggle.active');
    mcbActiveSubmenus.forEach(submenu => {
        submenu.classList.add('open');
    });
    
    // Auto-open MCB submenu if any child has active class
    const mcbActiveSubmenuItems = document.querySelectorAll('#mcbMasterlistToggle .submenu li.active, #mcbTransactionToggle .submenu li.active');
    mcbActiveSubmenuItems.forEach(item => {
        const parentSubmenu = item.closest('.has-submenu');
        if (parentSubmenu) {
            parentSubmenu.classList.add('open');
        }
    });
});