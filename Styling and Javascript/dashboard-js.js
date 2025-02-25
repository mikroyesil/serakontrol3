/**
 * dashboard.js - Dashboard page functionality for Vertical Farm Control System
 */

// Chart objects
let tempHumidityChart, phEcChart, co2Chart;

// Data arrays for charts
const tempData = [];
const humidityData = [];
const phData = [];
const ecData = [];
const co2Data = [];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initCharts();
    setupDashboardControls();
    
    // Process initial data if available
    socket.on('initial_data', function(data) {
        if (data.sensors) {
            updateSensorDisplays(data.sensors);
        }
        
        // Update environmental controls
        if (data.environment_settings) {
            updateEnvironmentControls(data.environment_settings);
        }
        
        // Update nutrient settings
        if (data.nutrient_settings) {
            updateNutrientControls(data.nutrient_settings);
        }
        
        // Update light settings
        if (data.light_schedules) {
            updateLightControls(data.light_schedules);
        }
        
        // Update watering settings
        if (data.watering_settings) {
            updateWateringControls(data.watering_settings);
        }
    });
    
    // Update charts with new sensor data
    socket.on('sensor_update', function(data) {
        updateCharts(data);
    });
});

// Initialize charts
function initCharts() {
    // Temperature and Humidity Chart
    const tempHumidityCtx = document.getElementById('tempHumidityChart').getContext('2d');
    tempHumidityChart = new Chart(tempHumidityCtx, {
        type: 'line',
        data: {
            labels: chartTimeLabels,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: tempData,
                    borderColor: '#4ade80',
                    backgroundColor: 'rgba(74, 222, 128, 0.1)',
                    tension: 0.3,
                    yAxisID: 'y-temp',
                },
                {
                    label: 'Humidity (%)',
                    data: humidityData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.3,
                    yAxisID: 'y-humidity',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                'y-temp': {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    },
                    suggestedMin: 10,
                    suggestedMax: 30
                },
                'y-humidity': {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Humidity (%)'
                    },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });

    // pH and EC Chart
    const phEcCtx = document.getElementById('phEcChart').getContext('2d');
    phEcChart = new Chart(phEcCtx, {
        type: 'line',
        data: {
            labels: chartTimeLabels,
            datasets: [
                {
                    label: 'pH',
                    data: phData,
                    borderColor: '#eab308',
                    backgroundColor: 'rgba(234, 179, 8, 0.1)',
                    tension: 0.3,
                    yAxisID: 'y-ph',
                },
                {
                    label: 'EC (mS/cm)',
                    data: ecData,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.3,
                    yAxisID: 'y-ec',
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                'y-ph': {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'pH'
                    },
                    suggestedMin: 5,
                    suggestedMax: 7
                },
                'y-ec': {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'EC (mS/cm)'
                    },
                    suggestedMin: 0,
                    suggestedMax: 2,
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });

    // CO2 Chart
    const co2Ctx = document.getElementById('co2Chart').getContext('2d');
    co2Chart = new Chart(co2Ctx, {
        type: 'line',
        data: {
            labels: chartTimeLabels,
            datasets: [
                {
                    label: 'CO2 (ppm)',
                    data: co2Data,
                    borderColor: '#4ade80',
                    backgroundColor: 'rgba(74, 222, 128, 0.1)',
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'CO2 (ppm)'
                    },
                    suggestedMin: 400,
                    suggestedMax: 1500
                }
            }
        }
    });
}

// Update charts with new data
function updateCharts(data) {
    // Add current time to labels
    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + 
                      now.getMinutes().toString().padStart(2, '0');
    
    chartTimeLabels.push(timeString);
    if (chartTimeLabels.length > MAX_DATA_POINTS) {
        chartTimeLabels.shift();
    }
    
    // Add new data points
    if (data.temperature !== undefined) {
        tempData.push(data.temperature);
        if (tempData.length > MAX_DATA_POINTS) tempData.shift();
    }
    
    if (data.humidity !== undefined) {
        humidityData.push(data.humidity);
        if (humidityData.length > MAX_DATA_POINTS) humidityData.shift();
    }
    
    if (data.ph !== undefined) {
        phData.push(data.ph);
        if (phData.length > MAX_DATA_POINTS) phData.shift();
    }
    
    if (data.ec !== undefined) {
        ecData.push(data.ec);
        if (ecData.length > MAX_DATA_POINTS) ecData.shift();
    }
    
    if (data.co2 !== undefined) {
        co2Data.push(data.co2);
        if (co2Data.length > MAX_DATA_POINTS) co2Data.shift();
    }
    
    // Update all charts
    tempHumidityChart.update();
    phEcChart.update();
    co2Chart.update();
}

// Set up dashboard controls
function setupDashboardControls() {
    // Light control buttons
    const allLightsOn = document.getElementById('all-lights-on');
    if (allLightsOn) {
        allLightsOn.addEventListener('click', function() {
            for (let i = 1; i <= 7; i++) {
                sendManualControl('light', i, true);
            }
            showToast('All lights turned on', 'success');
        });
    }
    
    const allLightsOff = document.getElementById('all-lights-off');
    if (allLightsOff) {
        allLightsOff.addEventListener('click', function() {
            for (let i = 1; i <= 7; i++) {
                sendManualControl('light', i, false);
            }
            showToast('All lights turned off', 'success');
        });
    }
    
    // Nutrient control buttons
    const doseNutrients = document.getElementById('dose-nutrients');
    if (doseNutrients) {
        doseNutrients.addEventListener('click', function() {
            sendManualControl('nutrient', 'nutrient', 5);
            showToast('Dosing nutrients (5ml)', 'success');
        });
    }
    
    const dosePh = document.getElementById('dose-ph');
    if (dosePh) {
        dosePh.addEventListener('click', function() {
            // Determine if we need pH up or down based on current pH
            if (sensorData.ph < 6.0) {
                sendManualControl('nutrient', 'ph_up', 3);
                showToast('Dosing pH up solution (3ml)', 'success');
            } else {
                sendManualControl('nutrient', 'ph_down', 3);
                showToast('Dosing pH down solution (3ml)', 'success');
            }
        });
    }
    
    // Watering control buttons
    const startWatering = document.getElementById('start-watering');
    if (startWatering) {
        startWatering.addEventListener('click', function() {
            sendWateringCommand('start', 1);
            showToast('Starting watering cycle (1 minute)', 'success');
        });
    }
    
    const stopWatering = document.getElementById('stop-watering');
    if (stopWatering) {
        stopWatering.addEventListener('click', function() {
            sendWateringCommand('stop');
            showToast('Stopping watering cycle', 'success');
        });
    }
}

// Send manual control command
function sendManualControl(type, id, state) {
    const data = { type: type };
    
    if (type === 'light') {
        data.id = id;
        data.state = state;
    } else if (type === 'nutrient') {
        data.pump_id = id;
        data.duration = state; // For nutrients, state is actually duration
    } else if (type === 'environment') {
        data.device_id = id;
        data.state = state;
    }
    
    fetchAPI('/api/manual-control', 'POST', data);
}

// Send watering command
function sendWateringCommand(command, duration = null) {
    const data = {
        type: 'watering',
        command: command
    };
    
    if (duration !== null) {
        data.duration = duration;
    }
    
    fetchAPI('/api/manual-control', 'POST', data);
}

// Update dashboard sections with settings
function updateEnvironmentControls(settings) {
    const humidityRange = document.getElementById('humidity-range');
    if (humidityRange) {
        humidityRange.textContent = `${settings.humidity_min}% - ${settings.humidity_max}%`;
    }
    
    const co2Status = document.getElementById('co2-control-status');
    if (co2Status) {
        co2Status.textContent = settings.co2_control ? 'Active' : 'Inactive';
        co2Status.className = `badge ${settings.co2_control ? 'bg-success' : 'bg-secondary'}`;
    }
    
    const humidityStatus = document.getElementById('humidity-control-status');
    if (humidityStatus) {
        humidityStatus.textContent = settings.humidity_control ? 'Active' : 'Inactive';
        humidityStatus.className = `badge ${settings.humidity_control ? 'bg-success' : 'bg-secondary'}`;
    }
}

function updateNutrientControls(settings) {
    const targetEc = document.getElementById('target-ec');
    if (targetEc) {
        targetEc.textContent = settings.ec_target;
    }
    
    const targetPh = document.getElementById('target-ph');
    if (targetPh) {
        targetPh.textContent = settings.ph_target;
    }
    
    const nutrientStatus = document.getElementById('nutrient-status');
    if (nutrientStatus) {
        nutrientStatus.textContent = settings.auto_nutrient && settings.auto_ph 
            ? 'Auto-dosing is active' 
            : (settings.auto_nutrient 
                ? 'Auto EC dosing active, manual pH' 
                : (settings.auto_ph 
                    ? 'Auto pH adjustment active, manual EC' 
                    : 'Manual dosing mode'));
    }
}

function updateLightControls(schedules) {
    const lightStatusSummary = document.getElementById('light-status-summary');
    if (lightStatusSummary) {
        // Count active lights
        const activeCount = schedules.filter(schedule => schedule.enabled).length;
        
        // Get current time and determine if we're in daylight period
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeMinutes = currentHour * 60 + currentMinute;
        
        let inLightPeriod = false;
        let firstOnTime = null;
        let lastOffTime = null;
        
        schedules.forEach(schedule => {
            if (!schedule.enabled) return;
            
            const onTimeParts = schedule.on_time.split(':');
            const onTimeMinutes = parseInt(onTimeParts[0]) * 60 + parseInt(onTimeParts[1]);
            
            const offTimeParts = schedule.off_time.split(':');
            const offTimeMinutes = parseInt(offTimeParts[0]) * 60 + parseInt(offTimeParts[1]);
            
            // Determine if current time is between on and off times
            if (onTimeMinutes < offTimeMinutes) {
                // Normal case (e.g., 6:00 to 22:00)
                if (currentTimeMinutes >= onTimeMinutes && currentTimeMinutes < offTimeMinutes) {
                    inLightPeriod = true;
                }
            } else {
                // Overnight case (e.g., 22:00 to 6:00)
                if (currentTimeMinutes >= onTimeMinutes || currentTimeMinutes < offTimeMinutes) {
                    inLightPeriod = true;
                }
            }
            
            // Track earliest on time and latest off time for progress bar
            if (firstOnTime === null || onTimeMinutes < firstOnTime) {
                firstOnTime = onTimeMinutes;
            }
            if (lastOffTime === null || offTimeMinutes > lastOffTime) {
                lastOffTime = offTimeMinutes;
            }
        });
        
        // Update summary text
        lightStatusSummary.textContent = `${activeCount} of 7 zones active, ${inLightPeriod ? 'lights are ON' : 'lights are OFF'}`;
        
        // Update progress bar if we have valid times
        if (firstOnTime !== null && lastOffTime !== null) {
            const lightProgress = document.getElementById('light-schedule-progress');
            if (lightProgress) {
                if (inLightPeriod) {
                    let progressPercentage;
                    if (firstOnTime < lastOffTime) {
                        // Normal day period
                        const totalLightPeriod = lastOffTime - firstOnTime;
                        const elapsedTime = currentTimeMinutes - firstOnTime;
                        progressPercentage = (elapsedTime / totalLightPeriod) * 100;
                    } else {
                        // Overnight period
                        const totalLightPeriod = (24 * 60) - firstOnTime + lastOffTime;
                        let elapsedTime;
                        if (currentTimeMinutes >= firstOnTime) {
                            elapsedTime = currentTimeMinutes - firstOnTime;
                        } else {
                            elapsedTime = (24 * 60) - firstOnTime + currentTimeMinutes;
                        }
                        progressPercentage = (elapsedTime / totalLightPeriod) * 100;
                    }
                    
                    lightProgress.style.width = `${progressPercentage}%`;
                    lightProgress.className = 'progress-bar bg-primary';
                } else {
                    lightProgress.style.width = '0%';
                    lightProgress.className = 'progress-bar bg-secondary';
                }
            }
        }
    }
}

function updateWateringControls(settings) {
    const wateringSchedule = document.getElementById('watering-schedule');
    if (wateringSchedule) {
        wateringSchedule.textContent = `${settings.cycle_minutes_per_hour} min/hour`;
    }
    
    const wateringStatus = document.getElementById('watering-status-badge');
    if (wateringStatus) {
        wateringStatus.textContent = settings.pump_state ? 'Active' : 'Inactive';
        wateringStatus.className = `badge ${settings.pump_state ? 'bg-success' : 'bg-secondary'}`;
    }
    
    const waterUsage = document.getElementById('water-usage');
    if (waterUsage) {
        waterUsage.textContent = `${settings.daily_run_minutes}/${settings.max_daily_minutes}`;
    }
}
