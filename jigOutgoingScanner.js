// ============================================
// OPTIMIZED HANDHELD SCANNER INTEGRATION - OUTGOING
// ============================================

// Scanner Configuration
const scannerConfig = {
    bufferTimeout: 50,
    minScanLength: 3,
    scanPrefix: '',
    scanSuffix: '',
    enabled: true,
    instantFill: true
};

// Scanner state
let scanBuffer = '';
let scanTimeout = null;
let lastKeyTime = 0;
let isScanning = false;

// ============================================
// SCANNER INPUT HANDLER
// ============================================

function initializeScannerListener() {
    document.addEventListener('keypress', function(e) {
        if (!scannerConfig.enabled) return;
        
        const activeElement = document.activeElement;
        const isSerialField = activeElement && activeElement.id === 'serial';
        
        const shouldProcess = isSerialField || 
                             activeElement.tagName !== 'INPUT' && 
                             activeElement.tagName !== 'SELECT' && 
                             activeElement.tagName !== 'TEXTAREA';
        
        if (!shouldProcess) return;

        const currentTime = new Date().getTime();
        const timeDiff = currentTime - lastKeyTime;
        
        if (timeDiff < 50) {
            e.preventDefault();
            isScanning = true;
            
            if (e.key === 'Enter') {
                processScan();
            } else {
                scanBuffer += e.key;
                
                if (scanTimeout) clearTimeout(scanTimeout);
                scanTimeout = setTimeout(processScan, scannerConfig.bufferTimeout);
            }
        } else {
            scanBuffer = e.key;
            isScanning = false;
            
            if (scanTimeout) clearTimeout(scanTimeout);
            scanTimeout = setTimeout(processScan, scannerConfig.bufferTimeout);
        }
        
        lastKeyTime = currentTime;
    });
}

// ============================================
// PROCESS SCAN
// ============================================

function processScan() {
    if (scanBuffer.length >= scannerConfig.minScanLength) {
        let scannedValue = scanBuffer;
        
        if (scannerConfig.scanPrefix && scannedValue.startsWith(scannerConfig.scanPrefix)) {
            scannedValue = scannedValue.substring(scannerConfig.scanPrefix.length);
        }
        
        if (scannerConfig.scanSuffix && scannedValue.endsWith(scannerConfig.scanSuffix)) {
            scannedValue = scannedValue.substring(0, scannedValue.length - scannerConfig.scanSuffix.length);
        }
        
        scannedValue = scannedValue.trim().toUpperCase();
        
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
// HANDLE SCANNED SERIAL
// ============================================

async function handleScannedSerialNumber(serialNumber) {
    const serialInput = document.getElementById('serial');
    
    serialInput.value = serialNumber;
    
    serialInput.style.backgroundColor = '#d4edda';
    serialInput.style.transition = 'background-color 0.3s';
    
    playBeep();
    
    lookupItemDescription(serialNumber);
    
    setTimeout(() => {
        serialInput.style.backgroundColor = '';
    }, 300);
}

// ============================================
// LOOKUP
// ============================================

async function lookupItemDescription(serialNumber) {
    const itemDescInput = document.getElementById('itemDescription');
    
    itemDescInput.placeholder = '⏳ Loading...';
    
    try {
        if (typeof window.lookupItemDescriptionFromAPI === 'function') {
            const found = await window.lookupItemDescriptionFromAPI(serialNumber);
            
            if (found) {
                setTimeout(() => focusNextField(), 50);
            } else {
                itemDescInput.placeholder = 'Description will appear here';
                
                if (typeof window.showTrcNotification === 'function') {
                    window.showTrcNotification(
                        'Serial number not found. Please enter details manually.', 
                        false
                    );
                }
                
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
// SMART FOCUS
// ============================================

function focusNextField() {
    const fields = ['itemDescription', 'customer', 'model', 'area', 'line', 'usageCount', 'status', 'remarks'];
    
    for (const fieldId of fields) {
        const field = document.getElementById(fieldId);
        
        if (field && !field.value && !field.readOnly && !field.disabled) {
            field.focus();
            
            const originalBorder = field.style.border;
            field.style.border = '2px solid #667eea';
            setTimeout(() => {
                field.style.border = originalBorder;
            }, 500);
            
            return;
        }
    }
    
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.focus();
}

// ============================================
// AUDIO FEEDBACK
// ============================================

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
        
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.08);
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
    console.log('🚀 Optimized Scanner Integration Loaded (Outgoing)');
    initializeScannerListener();
    addScannerStatusIndicator();
    
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
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        toggleScanner(!scannerConfig.enabled);
        if (typeof window.showTrcNotification === 'function') {
            window.showTrcNotification(`Scanner ${scannerConfig.enabled ? 'enabled' : 'disabled'}`, true);
        }
    }
    
    if (e.ctrlKey && e.key === 'q') {
        e.preventDefault();
        const testBarcode = prompt('Enter barcode to simulate scan:', 'TEST123');
        if (testBarcode) {
            handleScannedSerialNumber(testBarcode);
        }
    }
    
    if (e.key === 'Escape') {
        const activeElement = document.activeElement;
        if (activeElement.tagName === 'INPUT' || activeElement.tagName === 'SELECT') {
            return;
        }
        
        if (confirm('Clear all fields?')) {
            const form = document.getElementById('masterlistForm');
            if (form) {
                form.reset();
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
// EXPORT FUNCTIONS
// ============================================

window.scannerUtils = {
    toggleScanner,
    playBeep,
    handleScannedSerialNumber,
    lookupItemDescription,
    resetFieldLocks
};

window.scannerConfig = scannerConfig;

console.log('✅ Scanner ready - Optimized for speed! (Outgoing)');