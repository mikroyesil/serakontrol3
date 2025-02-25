# coding=utf-8
#
# app.py - Flask web server for Vertical Farm Control System
#
import os
import time
import threading
import logging
import flask_login
import json
from flask import Flask, render_template, request, jsonify, redirect, url_for, flash
from flask_socketio import SocketIO

# Import controllers
from controllers.light_controller import LightController
from controllers.nutrient_controller import NutrientController
from controllers.environment_controller import EnvironmentController
from controllers.watering_controller import WateringController
from controllers.sensor_manager import SensorManager
from utils.database import Database

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("farm_control.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = 'vertical-farm-secret-key'
app.config['DEBUG'] = True

# Initialize Socket.IO
socketio = SocketIO(app)

# Initialize database
db = Database()

# Initialize sensor manager and controllers
sensor_manager = SensorManager()
light_controller = LightController(db, socketio)
nutrient_controller = NutrientController(db, socketio, sensor_manager)
environment_controller = EnvironmentController(db, socketio, sensor_manager)
watering_controller = WateringController(db, socketio)

# Background task for sensor readings and control logic
def background_task():
    while True:
        try:
            # Read all sensors
            sensor_data = sensor_manager.read_all_sensors()
            
            # Update controllers with sensor data
            light_controller.update(sensor_data)
            nutrient_controller.update(sensor_data)
            environment_controller.update(sensor_data)
            watering_controller.update(sensor_data)
            
            # Emit updated data to connected clients
            socketio.emit('sensor_update', sensor_data)
            
            # Sleep for 5 seconds
            time.sleep(5)
        except Exception as e:
            logger.error(f"Error in background task: {str(e)}")
            time.sleep(5)  # Continue after error

# Routes for web interface
@app.route('/')
def index():
    """Home/Dashboard page with overview"""
    return render_template('dashboard.html')

@app.route('/lights')
def lights():
    """Light control settings page"""
    return render_template('lights.html')

@app.route('/nutrients')
def nutrients():
    """Nutrient dosing settings page"""
    return render_template('nutrients.html')

@app.route('/watering')
def watering():
    """Watering control settings page"""
    return render_template('watering.html')

@app.route('/environment')
def environment():
    """Environmental control settings page"""
    return render_template('environment.html')

@app.route('/settings')
def settings():
    """General system settings page"""
    return render_template('settings.html')

@app.route('/profiles')
def profiles():
    """Growing profiles management page"""
    return render_template('profiles.html')

@app.route('/logs')
def logs():
    """System logs and history page"""
    return render_template('logs.html')

# API Routes for AJAX requests
@app.route('/api/sensor-data', methods=['GET'])
def get_sensor_data():
    """Get current sensor data"""
    return jsonify(sensor_manager.read_all_sensors())

# Light control API
@app.route('/api/light-schedules', methods=['GET'])
def get_light_schedules():
    """Get all light schedules"""
    return jsonify(light_controller.get_schedules())

@app.route('/api/light-schedules', methods=['POST'])
def set_light_schedule():
    """Update light schedules"""
    data = request.json
    light_controller.update_schedule(data)
    return jsonify({"status": "success"})

# Nutrient control API
@app.route('/api/nutrient-settings', methods=['GET'])
def get_nutrient_settings():
    """Get nutrient controller settings"""
    return jsonify(nutrient_controller.get_settings())

@app.route('/api/nutrient-settings', methods=['POST'])
def set_nutrient_settings():
    """Update nutrient controller settings"""
    data = request.json
    nutrient_controller.update_settings(data)
    return jsonify({"status": "success"})

# Environment control API
@app.route('/api/environment-settings', methods=['GET'])
def get_environment_settings():
    """Get environment controller settings"""
    return jsonify(environment_controller.get_settings())

@app.route('/api/environment-settings', methods=['POST'])
def set_environment_settings():
    """Update environment controller settings"""
    data = request.json
    environment_controller.update_settings(data)
    return jsonify({"status": "success"})

# Watering control API
@app.route('/api/watering-settings', methods=['GET'])
def get_watering_settings():
    """Get watering controller settings"""
    return jsonify(watering_controller.get_settings())

@app.route('/api/watering-settings', methods=['POST'])
def set_watering_settings():
    """Update watering controller settings"""
    data = request.json
    watering_controller.update_settings(data)
    return jsonify({"status": "success"})

# Common manual control API for all systems
@app.route('/api/manual-control', methods=['POST'])
def manual_control():
    """Process manual control commands"""
    control = request.json
    
    try:
        if control['type'] == 'light':
            success = light_controller.manual_control(control['id'], control['state'])
            return jsonify({"status": "success" if success else "error"})
            
        elif control['type'] == 'nutrient':
            success = nutrient_controller.manual_control(control['pump_id'], control.get('duration', 5))
            return jsonify({"status": "success" if success else "error"})
            
        elif control['type'] == 'environment':
            success = environment_controller.manual_control(control['device_id'], control['state'])
            return jsonify({"status": "success" if success else "error"})
            
        elif control['type'] == 'watering':
            if control['command'] == 'start':
                success = watering_controller.manual_control(True, control.get('duration'))
                if not success:
                    return jsonify({"status": "error", "message": "Daily watering limit reached"})
            elif control['command'] == 'stop':
                success = watering_controller.manual_control(False)
            return jsonify({"status": "success" if success else "error"})
        
        else:
            return jsonify({"status": "error", "message": "Unknown control type"})
    
    except Exception as e:
        logger.error(f"Error in manual control: {str(e)}")
        return jsonify({"status": "error", "message": str(e)})

# API for getting recent events
@app.route('/api/events', methods=['GET'])
def get_events():
    """Get recent system events"""
    event_type = request.args.get('type')
    limit = request.args.get('limit', 20, type=int)
    events = db.get_recent_events(event_type, limit)
    return jsonify(events)

# WebSocket events
@socketio.on('connect')
def handle_connect():
    """Send initial data to client upon connection"""
    try:
        socketio.emit('initial_data', {
            'sensors': sensor_manager.read_all_sensors(),
            'light_schedules': light_controller.get_schedules(),
            'nutrient_settings': nutrient_controller.get_settings(),
            'environment_settings': environment_controller.get_settings(),
            'watering_settings': watering_controller.get_settings()
        })
    except Exception as e:
        logger.error(f"Error sending initial data: {str(e)}")

# Start the background task when the application starts
@socketio.on('connect')
def start_background_task():
    """Start the background task if not already running"""
    global background_thread
    if not background_thread or not background_thread.is_alive():
        background_thread = socketio.start_background_task(background_task)

# Main entry point
if __name__ == '__main__':
    # Create a background thread for sensor readings and control logic
    background_thread = threading.Thread(target=background_task)
    background_thread.daemon = True
    background_thread.start()
    
    # Start the Flask application with Socket.IO
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
