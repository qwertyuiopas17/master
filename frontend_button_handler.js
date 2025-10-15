/**
 * Frontend Button Handler for Enhanced Sehat Sahara Chatbot
 * Shows how to handle interactive buttons from the chatbot response
 */

class SehatSaharaButtonHandler {
    constructor(chatContainerId = 'chat-container') {
        this.chatContainer = document.getElementById(chatContainerId);
        this.currentButtons = [];
    }

    /**
     * Handle chatbot response and show interactive buttons
     * @param {Object} response - Chatbot response object
     * @param {string} response.response - Text response
     * @param {string} response.action - Action to perform
     * @param {Array} response.interactive_buttons - Array of button objects
     */
    handleChatbotResponse(response) {
        // Display the text response
        this.displayMessage(response.response, 'bot');

        // Handle interactive buttons
        if (response.interactive_buttons && response.interactive_buttons.length > 0) {
            this.showInteractiveButtons(response.interactive_buttons);
        }

        // Handle different actions
        this.handleAction(response.action, response.parameters);
    }

    /**
     * Display interactive buttons in the chat interface
     * @param {Array} buttons - Array of button objects
     */
    showInteractiveButtons(buttons) {
        // Clear existing buttons
        this.clearButtons();

        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'interactive-buttons-container';
        buttonsContainer.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 10px;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 8px;
        `;

        buttons.forEach(button => {
            const buttonElement = this.createButton(button);
            buttonsContainer.appendChild(buttonElement);
        });

        // Add to chat container
        if (this.chatContainer) {
            this.chatContainer.appendChild(buttonsContainer);
        }

        this.currentButtons = buttons;
    }

    /**
     * Create a single interactive button element
     * @param {Object} button - Button configuration object
     * @param {string} button.type - Button type identifier
     * @param {string} button.text - Button display text
     * @param {string} button.action - Action to perform when clicked
     * @param {string} button.style - Button style (primary, secondary, danger)
     */
    createButton(button) {
        const buttonElement = document.createElement('button');
        buttonElement.textContent = button.text;
        buttonElement.className = `btn btn-${this.getButtonStyle(button.style)}`;
        buttonElement.style.cssText = `
            padding: 8px 16px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s ease;
        `;

        // Set button color based on style
        switch (button.style) {
            case 'primary':
                buttonElement.style.backgroundColor = '#007bff';
                buttonElement.style.color = 'white';
                break;
            case 'secondary':
                buttonElement.style.backgroundColor = '#6c757d';
                buttonElement.style.color = 'white';
                break;
            case 'danger':
                buttonElement.style.backgroundColor = '#dc3545';
                buttonElement.style.color = 'white';
                break;
            default:
                buttonElement.style.backgroundColor = '#007bff';
                buttonElement.style.color = 'white';
        }

        // Add hover effects
        buttonElement.addEventListener('mouseenter', () => {
            buttonElement.style.transform = 'translateY(-1px)';
            buttonElement.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        });

        buttonElement.addEventListener('mouseleave', () => {
            buttonElement.style.transform = 'translateY(0)';
            buttonElement.style.boxShadow = 'none';
        });

        // Handle button click
        buttonElement.addEventListener('click', () => {
            this.handleButtonClick(button);
        });

        return buttonElement;
    }

    /**
     * Handle button click events
     * @param {Object} button - Button configuration object
     */
    handleButtonClick(button) {
        console.log('Button clicked:', button);

        // Disable button temporarily
        const buttonElement = event.target;
        buttonElement.disabled = true;
        buttonElement.textContent = 'Processing...';

        // Handle different button types
        switch (button.type) {
            case 'appointment_booking':
                this.navigateToAppointmentBooking(button.parameters);
                break;
            case 'medicine_scan':
                this.startMedicineScanner(button.parameters);
                break;
            case 'prescription_view':
                this.showPrescription(button.parameters);
                break;
            case 'emergency_call':
                this.triggerEmergency(button.parameters);
                break;
            default:
                this.handleGenericAction(button.action, button.parameters);
        }

        // Re-enable button after a short delay
        setTimeout(() => {
            buttonElement.disabled = false;
            buttonElement.textContent = button.text;
        }, 1000);
    }

    /**
     * Navigate to appointment booking screen
     * @param {Object} parameters - Action parameters
     */
    navigateToAppointmentBooking(parameters) {
        console.log('Navigating to appointment booking...');

        // Example: Redirect to appointment booking page
        // window.location.href = '/book-appointment';

        // Or show appointment booking modal
        this.showNotification('Opening appointment booking...', 'info');

        // Call the appointment booking API
        this.callAPI('/v1/book-doctor', {
            userId: this.getCurrentUserId(),
            doctorId: parameters.doctorId || '',
            appointmentDatetime: parameters.preferredDate || '',
            appointmentType: 'consultation',
            chiefComplaint: parameters.reason || ''
        });
    }

    /**
     * Start medicine scanner
     * @param {Object} parameters - Action parameters
     */
    startMedicineScanner(parameters) {
        console.log('Starting medicine scanner...');

        // Check if camera is available
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            this.requestCameraPermission();
        } else {
            this.showNotification('Camera not available on this device', 'error');
        }
    }

    /**
     * Show prescription information
     * @param {Object} parameters - Action parameters
     */
    showPrescription(parameters) {
        console.log('Showing prescription...');

        // Call prescription API
        this.callAPI('/v1/prescription-summary', {
            userId: this.getCurrentUserId(),
            prescriptionId: parameters.prescriptionId || null
        }).then(response => {
            if (response.success) {
                this.displayPrescriptionSummary(response.prescription_summary);
            }
        });
    }

    /**
     * Trigger emergency response
     * @param {Object} parameters - Action parameters
     */
    triggerEmergency(parameters) {
        console.log('Emergency triggered!');

        // Show emergency number prominently
        const emergencyNumber = parameters.emergency_number || '108';
        this.showEmergencyModal(emergencyNumber);

        // Auto-dial if possible (mobile devices)
        if (this.isMobileDevice()) {
            window.location.href = `tel:${emergencyNumber}`;
        }
    }

    /**
     * Handle generic actions
     * @param {string} action - Action to perform
     * @param {Object} parameters - Action parameters
     */
    handleGenericAction(action, parameters) {
        console.log('Handling generic action:', action, parameters);

        // Route to appropriate handler based on action
        switch (action) {
            case 'FETCH_APPOINTMENTS':
                this.fetchAppointments();
                break;
            case 'FETCH_HEALTH_RECORD':
                this.fetchHealthRecords(parameters);
                break;
            case 'SHOW_PRESCRIPTION_SUMMARY':
                this.showPrescriptionSummary(parameters);
                break;
            default:
                this.showNotification(`Action: ${action}`, 'info');
        }
    }

    /**
     * Clear existing buttons from UI
     */
    clearButtons() {
        const existingButtons = document.querySelector('.interactive-buttons-container');
        if (existingButtons) {
            existingButtons.remove();
        }
        this.currentButtons = [];
    }

    /**
     * Display message in chat interface
     * @param {string} message - Message to display
     * @param {string} sender - Message sender ('user' or 'bot')
     */
    displayMessage(message, sender = 'bot') {
        if (!this.chatContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        messageElement.style.cssText = `
            margin: 8px 0;
            padding: 12px;
            border-radius: 8px;
            max-width: 80%;
            ${sender === 'bot' ? 'background: #e3f2fd; margin-right: auto;' : 'background: #007bff; color: white; margin-left: auto;'}
        `;

        // Handle Unicode characters in message
        const displayMessage = this.decodeUnicode(message);
        messageElement.textContent = displayMessage;

        this.chatContainer.appendChild(messageElement);
        this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
    }

    /**
     * Decode Unicode characters in message
     * @param {string} message - Message with Unicode characters
     * @returns {string} Decoded message
     */
    decodeUnicode(message) {
        try {
            // Handle JSON Unicode escapes
            return message.replace(/\\u[\dA-F]{4}/gi, (match) => {
                return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
            });
        } catch (e) {
            return message;
        }
    }

    /**
     * Handle main action from response
     * @param {string} action - Action to handle
     * @param {Object} parameters - Action parameters
     */
    handleAction(action, parameters) {
        switch (action) {
            case 'Maps_TO_APPOINTMENT_BOOKING':
                this.showNotification('Redirecting to appointment booking...', 'info');
                break;
            case 'TRIGGER_SOS':
                this.showNotification('Emergency services activated!', 'error');
                break;
            case 'CONTINUE_SYMPTOM_CHECK':
                this.showNotification('Continue with symptom checking', 'info');
                break;
            case 'SHOW_APP_FEATURES':
                this.showAppFeatures();
                break;
        }
    }

    /**
     * Show notification to user
     * @param {string} message - Notification message
     * @param {string} type - Notification type (info, success, error, warning)
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;

        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#28a745';
                break;
            case 'error':
                notification.style.backgroundColor = '#dc3545';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ffc107';
                notification.style.color = '#000';
                break;
            default:
                notification.style.backgroundColor = '#007bff';
        }

        notification.textContent = message;

        // Add to document
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    /**
     * Get current user ID (implement based on your auth system)
     * @returns {string} Current user ID
     */
    getCurrentUserId() {
        // Implement based on your authentication system
        return localStorage.getItem('currentUserId') || 'default_user';
    }

    /**
     * Call API endpoint
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request data
     * @returns {Promise} API response
     */
    async callAPI(endpoint, data) {
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            return await response.json();
        } catch (error) {
            console.error('API call failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get button style class
     * @param {string} style - Button style
     * @returns {string} CSS class name
     */
    getButtonStyle(style) {
        switch (style) {
            case 'primary':
                return 'primary';
            case 'secondary':
                return 'secondary';
            case 'danger':
                return 'danger';
            default:
                return 'primary';
        }
    }

    /**
     * Check if device is mobile
     * @returns {boolean} True if mobile device
     */
    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Request camera permission for medicine scanning
     */
    requestCameraPermission() {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                // Camera permission granted
                this.showNotification('Camera access granted. Starting medicine scanner...', 'success');
                // Implement medicine scanner logic here
            })
            .catch(error => {
                this.showNotification('Camera access denied. Please enable camera permissions.', 'error');
            });
    }

    /**
     * Show app features overview
     */
    showAppFeatures() {
        const features = [
            '📅 Book doctor appointments',
            '💊 Find nearby pharmacies',
            '📷 Scan medicine labels',
            '📋 View prescriptions',
            '📊 Check health records',
            '🚨 Emergency assistance (108)'
        ];

        const featuresText = features.join('\n');
        this.showNotification(`Sehat Sahara Features:\n${featuresText}`, 'info');
    }

    /**
     * Display prescription summary in a modal or dedicated area
     * @param {Object} prescriptionData - Prescription information
     */
    displayPrescriptionSummary(prescriptionData) {
        console.log('Displaying prescription summary:', prescriptionData);
        // Implement prescription display logic here
        this.showNotification('Prescription summary loaded', 'success');
    }

    /**
     * Show emergency modal with contact number
     * @param {string} emergencyNumber - Emergency contact number
     */
    showEmergencyModal(emergencyNumber) {
        // Create emergency modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(220, 53, 69, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            max-width: 400px;
            margin: 20px;
        `;

        modalContent.innerHTML = `
            <h2 style="color: #dc3545; margin-bottom: 20px;">🚨 EMERGENCY 🚨</h2>
            <p style="font-size: 18px; margin-bottom: 20px;">Call Emergency Services</p>
            <div style="font-size: 36px; font-weight: bold; color: #dc3545; margin-bottom: 20px;">
                ${emergencyNumber}
            </div>
            <p style="margin-bottom: 20px;">Click to call or go to nearest hospital immediately</p>
            <button onclick="this.parentElement.parentElement.parentElement.remove()"
                    style="background: #dc3545; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">
                Close
            </button>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Auto-click to call on mobile
        if (this.isMobileDevice()) {
            setTimeout(() => {
                window.location.href = `tel:${emergencyNumber}`;
            }, 2000);
        }
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SehatSaharaButtonHandler;
}

// Example usage in HTML/JavaScript:
/*
// Initialize button handler
const buttonHandler = new SehatSaharaButtonHandler('chat-messages');

// Example chatbot response with buttons
const sampleResponse = {
    "language": "hi",
    "response": "मैं आपकी मदद करने के लिए हूं। क्या आप अपॉइंटमेंट बुक करना चाहते हैं?",
    "action": "SHOW_APP_FEATURES",
    "parameters": {},
    "interactive_buttons": [
        {
            "type": "appointment_booking",
            "text": "अपॉइंटमेंट बुक करें",
            "action": "NAVIGATE_TO_APPOINTMENT_BOOKING",
            "style": "primary"
        },
        {
            "type": "medicine_scan",
            "text": "दवाई स्कैन करें",
            "action": "START_MEDICINE_SCANNER",
            "style": "secondary"
        }
    ]
};

// Handle the response
buttonHandler.handleChatbotResponse(sampleResponse);
*/