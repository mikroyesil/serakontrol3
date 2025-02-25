/**
 * main.js - Main JavaScript for Vertical Farm Control System
 * Handles common functionality across all pages
 */

// Initialize Socket.IO connection
const socket = io();

// Global variables
let sensorData = {};
let chartTimeLabels = [];
const MAX_DATA_POINTS = 50;

// Connect to Socket.IO server
socket.on('connect', function() {
    console.log('Connected to server');
    showToast('System connected', 'success');
});

socket.on('disconnect', function() {
    console.log('Disconnected from server');
    showToast('System disconnected', 'danger');
});

// Handle sensor updates
socket.on('sensor_update', function(data) {
    sensorData = data;
    updateSensorDisplays(data);
});

// Update sensor displays if they exist on the current page
function updateSensorDisplays(data) {
    // Temperature
    const tempElement = document.getElementById('current-temperature');
    if (tempElement && data.temperature) {
        tempElement.textContent = `${data.temperature.toFixed(1)}°C`;
        
        const tempStatus = document.getElementById('temp-status');
        if (tempStatus) {
            if (data.temperature < 15 || data.temperature > 24) {
                tempStatus.textContent = 'Warning';
                tempStatus.className = 'badge bg-warning';
            } else {
                tempStatus.textContent = 'Normal';
                tempStatus.className = 'badge bg-success';
            }
        }
    }
    
    // Humidity
    const humidityElement = document.getElementById('current-humidity');
    if (humidityElement && data.humidity) {
        humidityElement.textContent = `${data.humidity.toFixed(0)}%`;
        
        const humidityStatus = document.getElementById('humidity-status');
        if (humidityStatus) {
            if (data.humidity < 50 || data.humidity > 80) {
                humidityStatus.textContent = 'Warning';
                humidityStatus.className = 'badge bg-warning';
            } else {
                humidityStatus.textContent = 'Normal';
                humidityStatus.className = 'badge bg-success';
            }
        }
    }
    
    // pH
    const phElement = document.getElementById('current-ph');
    if (phElement && data.ph) {
        phElement.textContent = data.ph.toFixed(1);
        
        const phStatus = document.getElementById('ph-status');
        if (phStatus) {
            if (data.ph < 5.5 || data.ph > 6.5) {
                phStatus.textContent = 'Warning';
                phStatus.className = 'badge bg-warning';
            } else {
                phStatus.textContent = 'Normal';
                phStatus.className = 'badge bg-success';
            }
        }
    }
    
    // EC
    const ecElement = document.getElementById('current-ec');
    if (ecElement && data.ec) {
        ecElement.textContent = `${data.ec.toFixed(2)} mS/cm`;
        
        const ecStatus = document.getElementById('ec-status');
        if (ecStatus) {
            if (data.ec < 0.8 || data.ec > 1.6) {
                ecStatus.textContent = 'Warning';
                ecStatus.className = 'badge bg-warning';
            } else {
                ecStatus.textContent = 'Normal';
                ecStatus.className = 'badge bg-success';
            }
        }
    }
    
    // CO2
    const co2Element = document.getElementById('current-co2');
    if (co2Element && data.co2) {
        co2Element.textContent = `${data.co2.toFixed(0)} ppm`;
        
        const co2Progress = document.getElementById('co2-progress');
        if (co2Progress) {
            const co2Percentage = Math.min(100, (data.co2 / 1500) * 100);
            co2Progress.style.width = `${co2Percentage}%`;
            
            if (data.co2 < 600 || data.co2 > 1400) {
                co2Progress.className = 'progress-bar bg-warning';
            } else {
                co2Progress.className = 'progress-bar bg-primary';
            }
        }
    }
}

// Utility function to format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp * 1000);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Utility function to format date
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
}

// Show a toast notification
function showToast(message, type = 'info') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastId = 'toast-' + Date.now();
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    toast.id = toastId;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // Toast content
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Initialize and show toast
    const toastInstance = new bootstrap.Toast(toast, {
        delay: 3000
    });
    toastInstance.show();
    
    // Remove from DOM after hidden
    toast.addEventListener('hidden.bs.toast', function() {
        toast.remove();
    });
}

// Generic function to fetch API data
async function fetchAPI(url, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API error:', error);
        showToast(`API Error: ${error.message}`, 'danger');
        return null;
    }
}

// Load recent events
function loadRecentEvents(limit = 5) {
    const eventsContainer = document.getElementById('recent-events');
    if (!eventsContainer) return;
    
    fetchAPI(`/api/events?limit=${limit}`)
        .then(events => {
            if (!events || events.length === 0) {
                eventsContainer.innerHTML = '<tr><td colspan="3" class="text-center">No recent events</td></tr>';
                return;
            }
            
            eventsContainer.innerHTML = '';
            events.forEach(event => {
                const row = document.createElement('tr');
                
                // Format timestamp
                const timeCell = document.createElement('td');
                timeCell.textContent = formatTimestamp(event.timestamp);
                
                // Event type
                const typeCell = document.createElement('td');
                typeCell.textContent = event.event_type;
                
                // Details
                const detailsCell = document.createElement('td');
                if (typeof event.details === 'object') {
                    detailsCell.textContent = Object.entries(event.details)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(', ');
                } else {
                    detailsCell.textContent = event.details;
                }
                
                row.appendChild(timeCell);
                row.appendChild(typeCell);
                row.appendChild(detailsCell);
                eventsContainer.appendChild(row);
            });
        });
}

// Document ready
document.addEventListener('DOMContentLoaded', function() {
    // Load recent events if we're on a page with that element
    if (document.getElementById('recent-events')) {
        loadRecentEvents();
        
        // Refresh events every 30 seconds
        setInterval(() => {
            loadRecentEvents();
        }, 30000);
    }
});
