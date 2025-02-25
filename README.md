# Vertical Farm Control System

A comprehensive control system for vertical farming with a focus on leafy greens. Features include lighting control, nutrient dosing, watering automation, and environmental monitoring - all through an intuitive mint green web interface optimized for Raspberry Pi.

## Features

- 📊 **Real-time Dashboard**: Monitor all system parameters at a glance
- 💡 **Light Control**: Manage 7 light zones with custom schedules
- 💧 **Irrigation System**: Configure automatic watering cycles
- 🧪 **Nutrient Dosing**: Automated EC and pH management
- 🌱 **Environmental Controls**: CO2 and humidity automation
- 📱 **Mobile Responsive**: Control your farm from any device
- 📈 **Data Logging**: Historical data tracking and visualization
- 🔔 **Alerts**: Get notified when parameters exceed safe ranges

## Installation on Raspberry Pi

Follow these steps to install the Vertical Farm Control System on your Raspberry Pi:

### 1. Update System

```bash
sudo apt-get update
sudo apt-get upgrade
```

### 2. Install Required Packages

```bash
sudo apt-get install python3-pip python3-dev git
```

### 3. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/vertical-farm-control.git
cd vertical-farm-control
```

### 4. Install Python Dependencies

```bash
pip3 install -r requirements.txt
```

### 5. Install Additional Hardware Dependencies

For Raspberry Pi GPIO:
```bash
sudo pip3 install RPi.GPIO
```

For Atlas Scientific sensors (optional):
```bash
sudo pip3 install atlas-i2c
```

### 6. Run the Application

```bash
python3 app.py
```

### 7. Set Up Autostart (Optional)

Create a systemd service:

```bash
sudo nano /etc/systemd/system/vertical-farm.service
```

Add the following:
```
[Unit]
Description=Vertical Farm Control System
After=network.target

[Service]
User=pi
WorkingDirectory=/home/pi/vertical-farm-control
ExecStart=/usr/bin/python3 app.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl enable vertical-farm.service
sudo systemctl start vertical-farm.service
```

## Hardware Setup

### Recommended Hardware

1. Raspberry Pi 5 (main controller)
2. Atlas Scientific pH sensor
3. Atlas Scientific EC sensor
4. DHT22 Temperature/Humidity sensor
5. MH-Z19 CO2 sensor
6. Relay board (for pumps and lights)
7. Peristaltic pumps for nutrient dosing
8. Water pump for irrigation

### Wiring Diagram

Detailed wiring instructions are available in the [docs/hardware_setup.md](docs/hardware_setup.md) file.

## Accessing the Interface

After installation, access the web interface by opening a browser and navigating to:

```
http://YOUR_PI_IP_ADDRESS:5000
```

## Configuration

The system comes with default settings optimized for leafy greens like lettuce, kale, and herbs. You can customize these settings through the web interface.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions, please open an issue on the GitHub repository.
