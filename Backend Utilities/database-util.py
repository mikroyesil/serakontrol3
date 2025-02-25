# File: utils/database.py - Database handling

import json
import os
import sqlite3
import time
import logging

logger = logging.getLogger(__name__)

class Database:
    def __init__(self, db_path='vertical_farm.db'):
        self.db_path = db_path
        self._initialize_db()
    
    def _initialize_db(self):
        """Initialize the database if it doesn't exist"""
        try:
            # Create database tables if they don't exist
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Settings table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS settings (
                id TEXT PRIMARY KEY,
                value TEXT,
                updated_at INTEGER
            )
            ''')
            
            # Sensor readings table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS sensor_readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER,
                sensor_id TEXT,
                value REAL
            )
            ''')
            
            # Events table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER,
                event_type TEXT,
                details TEXT
            )
            ''')
            
            # Growing profiles table
            cursor.execute('''
            CREATE TABLE IF NOT EXISTS growing_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT,
                profile_data TEXT,
                created_at INTEGER,
                updated_at INTEGER
            )
            ''')
            
            # Create indexes for faster queries
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_id ON sensor_readings (sensor_id)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp ON sensor_readings (timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events (timestamp)')
            cursor.execute('CREATE INDEX IF NOT EXISTS idx_events_type ON events (event_type)')
            
            conn.commit()
            conn.close()
            logger.info('Database initialized successfully')
        except Exception as e:
            logger.error(f'Error initializing database: {str(e)}')
            raise
    
    def _save_setting(self, setting_id, value):
        """Save a setting to the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Convert value to JSON if it's not a string
            if not isinstance(value, str):
                value = json.dumps(value)
            
            # Update or insert the setting
            cursor.execute('''
            INSERT OR REPLACE INTO settings (id, value, updated_at)
            VALUES (?, ?, ?)
            ''', (setting_id, value, int(time.time())))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f'Error saving setting {setting_id}: {str(e)}')
            return False
    
    def _get_setting(self, setting_id, default=None):
        """Get a setting from the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('SELECT value FROM settings WHERE id = ?', (setting_id,))
            result = cursor.fetchone()
            
            conn.close()
            
            if result:
                try:
                    return json.loads(result[0])
                except json.JSONDecodeError:
                    return result[0]
            return default
        except Exception as e:
            logger.error(f'Error getting setting {setting_id}: {str(e)}')
            return default
    
    def save_sensor_reading(self, sensor_id, value):
        """Save a sensor reading to the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
            INSERT INTO sensor_readings (timestamp, sensor_id, value)
            VALUES (?, ?, ?)
            ''', (int(time.time()), sensor_id, value))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f'Error saving sensor reading for {sensor_id}: {str(e)}')
            return False
    
    def get_recent_sensor_readings(self, sensor_id, hours=24):
        """Get recent sensor readings from the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get readings from the last X hours
            start_time = int(time.time()) - (hours * 3600)
            
            cursor.execute('''
            SELECT timestamp, value FROM sensor_readings
            WHERE sensor_id = ? AND timestamp > ?
            ORDER BY timestamp ASC
            ''', (sensor_id, start_time))
            
            results = cursor.fetchall()
            conn.close()
            
            return [(r[0], r[1]) for r in results]
        except Exception as e:
            logger.error(f'Error getting recent sensor readings for {sensor_id}: {str(e)}')
            return []
    
    def log_event(self, event_type, details):
        """Log an event to the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Convert details to JSON if it's not a string
            if not isinstance(details, str):
                details = json.dumps(details)
            
            cursor.execute('''
            INSERT INTO events (timestamp, event_type, details)
            VALUES (?, ?, ?)
            ''', (int(time.time()), event_type, details))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f'Error logging event {event_type}: {str(e)}')
            return False
    
    def get_recent_events(self, event_type=None, limit=100):
        """Get recent events from the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            if event_type:
                cursor.execute('''
                SELECT timestamp, event_type, details FROM events
                WHERE event_type = ?
                ORDER BY timestamp DESC LIMIT ?
                ''', (event_type, limit))
            else:
                cursor.execute('''
                SELECT timestamp, event_type, details FROM events
                ORDER BY timestamp DESC LIMIT ?
                ''', (limit,))
            
            results = cursor.fetchall()
            conn.close()
            
            events = []
            for r in results:
                try:
                    details = json.loads(r[2])
                except json.JSONDecodeError:
                    details = r[2]
                
                events.append({
                    'timestamp': r[0],
                    'event_type': r[1],
                    'details': details
                })
            
            return events
        except Exception as e:
            logger.error(f'Error getting recent events: {str(e)}')
            return []
    
    # Specialized methods for different settings
    
    def save_light_schedules(self, schedules):
        """Save light schedules to the database"""
        return self._save_setting('light_schedules', schedules)
    
    def get_light_schedules(self):
        """Get light schedules from the database"""
        return self._get_setting('light_schedules', [])
    
    def save_nutrient_settings(self, settings):
        """Save nutrient settings to the database"""
        return self._save_setting('nutrient_settings', settings)
    
    def get_nutrient_settings(self):
        """Get nutrient settings from the database"""
        return self._get_setting('nutrient_settings', {})
    
    def save_environment_settings(self, settings):
        """Save environment settings to the database"""
        return self._save_setting('environment_settings', settings)
    
    def get_environment_settings(self):
        """Get environment settings from the database"""
        return self._get_setting('environment_settings', {})
    
    def save_watering_settings(self, settings):
        """Save watering settings to the database"""
        return self._save_setting('watering_settings', settings)
    
    def get_watering_settings(self):
        """Get watering settings from the database"""
        return self._get_setting('watering_settings', {})
    
    def save_growing_profile(self, profile):
        """Save a growing profile to the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            now = int(time.time())
            
            if 'id' in profile and profile['id']:
                # Update existing profile
                cursor.execute('''
                UPDATE growing_profiles SET
                name = ?, profile_data = ?, updated_at = ?
                WHERE id = ?
                ''', (
                    profile['name'],
                    json.dumps(profile),
                    now,
                    profile['id']
                ))
            else:
                # Create new profile
                cursor.execute('''
                INSERT INTO growing_profiles (name, profile_data, created_at, updated_at)
                VALUES (?, ?, ?, ?)
                ''', (
                    profile['name'],
                    json.dumps(profile),
                    now,
                    now
                ))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            logger.error(f'Error saving growing profile: {str(e)}')
            return False
    
    def get_growing_profiles(self):
        """Get all growing profiles from the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
            SELECT id, name, profile_data, created_at, updated_at
            FROM growing_profiles
            ORDER BY name
            ''')
            
            results = cursor.fetchall()
            conn.close()
            
            profiles = []
            for r in results:
                try:
                    profile_data = json.loads(r[2])
                except json.JSONDecodeError:
                    profile_data = {}
                
                profiles.append({
                    'id': r[0],
                    'name': r[1],
                    'data': profile_data,
                    'created_at': r[3],
                    'updated_at': r[4]
                })
            
            return profiles
        except Exception as e:
            logger.error(f'Error getting growing profiles: {str(e)}')
            return []
    
    def get_growing_profile(self, profile_id):
        """Get a specific growing profile from the database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
            SELECT profile_data FROM growing_profiles
            WHERE id = ?
            ''', (profile_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                try:
                    return json.loads(result[0])
                except json.JSONDecodeError:
                    return {}
            return None
        except Exception as e:
            logger.error(f'Error getting growing profile {profile_id}: {str(e)}')
            return None
