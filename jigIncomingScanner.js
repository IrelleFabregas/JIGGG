// ============================================
// OPTIMIZED HANDHELD SCANNER INTEGRATION
// ============================================

// Scanner Configuration
const scannerConfig = {
    bufferTimeout: 50,      // REDUCED from 100ms - faster processing
    minScanLength: 3,
    scanPrefix: '',
    scanSuffix: '',
    enabled: true,
    instantFill: true       // NEW: Enable instant auto-fill
};

// Scanner state
let scanBuffer = '';
let scanTimeout = null;
let lastKeyTime = 0;
let isScanning = false;     // NEW: Track scanning state

// ============================================
// OPTIMIZED SCANNER INPUT HANDLER
// ============================================

function initializeScannerListener() {
    document.addEventListener('keypress', function(e) {
        if (!scannerConfig.enabled) return;
        
        const activeElement = document.activeElement;
        const isSerialField = activeElement && activeElement.id === 'serial';
        
        // Only process if in serial field or no input focused
        const shouldProcess = isSerialField || 
                             activeElement.tagName !== 'INPUT' && 
                             activeElement.tagName !== 'SELECT' && 
                             activeElement.tagName !== 'TEXTAREA';
        
        if (!shouldProcess) return;

        const currentTime = new Date().getTime();
        const timeDiff = currentTime - lastKeyTime;
        
        // Scanner detection: < 50ms between keys (was 50ms, now even more sensitive)
        if (timeDiff < 50) {
            e.preventDefault();
            isScanning = true;  // Mark as active scan
            
            if (e.key === 'Enter') {
                processScan();
            } else {
                scanBuffer += e.key;
                
                if (scanTimeout) clearTimeout(scanTimeout);
                scanTimeout = setTimeout(processScan, scannerConfig.bufferTimeout);
            }
        } else {
            // Reset for new scan
            scanBuffer = e.key;
            isScanning = false;
            
            if (scanTimeout) clearTimeout(scanTimeout);
            scanTimeout = setTimeout(processScan, scannerConfig.bufferTimeout);
        }
        
        lastKeyTime = currentTime;
    });
}

// ============================================
// OPTIMIZED SCAN PROCESSING
// ============================================

function processScan() {
    if (scanBuffer.length >= scannerConfig.minScanLength) {
        let scannedValue = scanBuffer;
        
        // Clean the value
        if (scannerConfig.scanPrefix && scannedValue.startsWith(scannerConfig.scanPrefix)) {
            scannedValue = scannedValue.substring(scannerConfig.scanPrefix.length);
        }
        
        if (scannerConfig.scanSuffix && scannedValue.endsWith(scannerConfig.scanSuffix)) {
            scannedValue = scannedValue.substring(0, scannedValue.length - scannerConfig.scanSuffix.length);
        }
        
        scannedValue = scannedValue.trim().toUpperCase();
        
        // IMMEDIATE processing - no delays
        handleScannedSerialNumber(scannedValue);
    }
    
    scanBuffer = '';
    isScanning = false;
    if (scanTimeout) {
        clearTimeout(scanTimeout);
        scanTimeout = null;
    }
}

// ============================================
// OPTIMIZED SCAN HANDLER - INSTANT FILL
// ============================================

async function handleScannedSerialNumber(serialNumber) {
    const serialInput = document.getElementById('serial');
    
    // Set serial immediately
    serialInput.value = serialNumber;
    
    // Instant visual feedback (no delay)
    serialInput.style.backgroundColor = '#d4edda';
    serialInput.style.transition = 'background-color 0.3s';
    
    // Play beep immediately (non-blocking)
    playBeep();
    
    // Start API lookup IMMEDIATELY (don't wait)
    lookupItemDescription(serialNumber);
    
    // Remove green highlight after animation
    setTimeout(() => {
        serialInput.style.backgroundColor = '';
    }, 300);
}

// ============================================
// ULTRA-FAST API LOOKUP
// ============================================

async function lookupItemDescription(serialNumber) {
    // Show loading state immediately
    const itemDescInput = document.getElementById('itemDescription');
    const customerInput = document.getElementById('customer');
    const areaSelect = document.getElementById('area');
    
    // Set loading state
    itemDescInput.placeholder = '⏳ Loading...';
    
    try {
        // Use the API lookup from jigIncoming.js
        if (typeof window.lookupItemDescriptionFromAPI === 'function') {
            const found = await window.lookupItemDescriptionFromAPI(serialNumber);
            
            if (found) {
                // SUCCESS - Auto-fill happened
                // Focus next field immediately
                setTimeout(() => focusNextField(), 50);
            } else {
                // NOT FOUND - Reset placeholder
                itemDescInput.placeholder = 'Description will appear here';
                
                // Show notification
                if (typeof window.showTrcNotification === 'function') {
                    window.showTrcNotification(
                        'Serial number not found. Please enter details manually.', 
                        false
                    );
                }
                
                // Focus on description field for manual entry
                setTimeout(() => itemDescInput.focus(), 100);
            }
        } else {
            console.warn('API lookup function not available');
            itemDescInput.placeholder = 'Description will appear here';
        }
    } catch (error) {
        console.error('Lookup error:', error);
        itemDescInput.placeholder = 'Description will appear here';
    }
}

// ============================================
// SMART FOCUS - SKIP LOCKED FIELDS
// ============================================

function focusNextField() {
    const fields = ['itemDescription', 'customer', 'model', 'area', 'line', 'status', 'remarks'];
    
    for (const fieldId of fields) {
        const field = document.getElementById(fieldId);
        
        // Skip locked/disabled/filled fields
        if (field && !field.value && !field.readOnly && !field.disabled) {
            field.focus();
            
            // Highlight the field briefly
            const originalBorder = field.style.border;
            field.style.border = '2px solid #667eea';
            setTimeout(() => {
                field.style.border = originalBorder;
            }, 500);
            
            return;
        }
    }
    
    // If all fields filled, focus on submit button
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.focus();
}

// ============================================
// OPTIMIZED AUDIO FEEDBACK
// ============================================

// Pre-create audio context for faster playback
let audioContext;
try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
} catch (e) {
    console.log('Web Audio API not supported');
}

function playBeep() {
    if (!audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 880; // Higher pitch = more noticeable
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.08); // Shorter beep
    } catch (error) {
        // Silent fail
    }
}

// ============================================
// SCANNER TOGGLE
// ============================================

function toggleScanner(enabled) {
    scannerConfig.enabled = enabled;
    console.log(`Scanner ${enabled ? 'enabled' : 'disabled'}`);
    updateScannerStatusIndicator();
}

// ============================================
// INITIALIZE
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Optimized Scanner Integration Loaded');
    initializeScannerListener();
    addScannerStatusIndicator();
    
    // Pre-warm audio context on first user interaction
    document.addEventListener('click', function initAudio() {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        document.removeEventListener('click', initAudio);
    }, { once: true });
});

// ============================================
// STATUS INDICATOR
// ============================================

function addScannerStatusIndicator() {
    const contentContainer = document.querySelector('.content-container h2');
    if (contentContainer) {
        const indicator = document.createElement('span');
        indicator.id = 'scannerStatus';
        indicator.style.cssText = `
            display: inline-block;
            margin-left: 15px;
            padding: 4px 12px;
            background: #28a745;
            color: white;
            border-radius: 12px;
            font-size: 12px;
            font-weight: normal;
            animation: pulse 2s infinite;
        `;
        indicator.textContent = '📱 Scanner Ready';
        contentContainer.appendChild(indicator);
        
        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
        `;
        document.head.appendChild(style);
    }
}

function updateScannerStatusIndicator() {
    const indicator = document.getElementById('scannerStatus');
    if (indicator) {
        if (scannerConfig.enabled) {
            indicator.style.background = '#28a745';
            indicator.textContent = '📱 Scanner Ready';
            indicator.style.animation = 'pulse 2s infinite';
        } else {
            indicator.style.background = '#6c757d';
            indicator.textContent = '📱 Scanner Disabled';
            indicator.style.animation = 'none';
        }
    }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

document.addEventListener('keydown', function(e) {
    // Ctrl + S to toggle scanner
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        toggleScanner(!scannerConfig.enabled);
        if (typeof window.showTrcNotification === 'function') {
            window.showTrcNotification(`Scanner ${scannerConfig.enabled ? 'enabled' : 'disabled'}`, true);
        }
    }
    
    // Ctrl + Q for quick test scan
    if (e.ctrlKey && e.key === 'q') {
        e.preventDefault();
        const testBarcode = prompt('Enter barcode to simulate scan:', 'TEST123');
        if (testBarcode) {
            handleScannedSerialNumber(testBarcode);
        }
    }
    
    // Escape to clear form
    if (e.key === 'Escape') {
        const activeElement = document.activeElement;
        if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT') {
            // Just in a field, don't clear
            return;
        }
        
        if (confirm('Clear all fields?')) {
            const form = document.getElementById('masterlistForm');
            if (form) {
                form.reset();
                
                // Reset field locks
                resetFieldLocks();
                
                document.getElementById('serial').focus();
            }
        }
    }
});

function resetFieldLocks() {
    const fields = ['itemDescription', 'customer', 'area'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.readOnly = false;
            if (field.tagName === 'SELECT') {
                field.disabled = false;
            }
            field.style.border = '';
            field.classList.remove('field-locked');
        }
    });
}

// ============================================
// PERFORMANCE MONITORING (Optional - for debugging)
// ============================================

let scanPerformance = {
    totalScans: 0,
    averageTime: 0,
    lastScanTime: 0
};

function trackScanPerformance(startTime) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    scanPerformance.totalScans++;
    scanPerformance.averageTime = 
        (scanPerformance.averageTime * (scanPerformance.totalScans - 1) + duration) / 
        scanPerformance.totalScans;
    scanPerformance.lastScanTime = duration;
    
    console.log(`📊 Scan Performance: ${duration.toFixed(2)}ms (avg: ${scanPerformance.averageTime.toFixed(2)}ms)`);
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

window.scannerUtils = {
    toggleScanner,
    playBeep,
    handleScannedSerialNumber,
    lookupItemDescription,
    resetFieldLocks,
    getScanStats: () => scanPerformance
};

window.scannerConfig = scannerConfig;

console.log('✅ Scanner ready - Optimized for speed!');