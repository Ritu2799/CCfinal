#!/usr/bin/env python3
"""
CloudCP Calendar Backend API Testing Suite
Tests festival predictions, traffic spikes, and AWS scaling logic
"""

import requests
import json
from datetime import datetime, timedelta
import sys

# Backend URL from environment
BACKEND_URL = "https://cloudcp-calendar.preview.emergentagent.com/api"

class CloudCPTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.results = {
            'passed': 0,
            'failed': 0,
            'errors': []
        }
    
    def log_result(self, test_name, success, message="", expected=None, actual=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"   {message}")
        if not success and expected is not None and actual is not None:
            print(f"   Expected: {expected}")
            print(f"   Actual: {actual}")
        
        if success:
            self.results['passed'] += 1
        else:
            self.results['failed'] += 1
            self.results['errors'].append(f"{test_name}: {message}")
        print()
    
    def test_health_check(self):
        """Test health check endpoint"""
        print("🔍 Testing Health Check Endpoint...")
        try:
            response = self.session.get(f"{self.base_url}/health")
            
            if response.status_code != 200:
                self.log_result("Health Check Status", False, f"Expected 200, got {response.status_code}")
                return
            
            data = response.json()
            
            # Check required fields
            required_fields = ['status', 'models_loaded', 'aws_configured', 'total_festivals_2025']
            for field in required_fields:
                if field not in data:
                    self.log_result(f"Health Check - {field} field", False, f"Missing field: {field}")
                    continue
                self.log_result(f"Health Check - {field} field", True, f"Present: {data[field]}")
            
            # Verify models are loaded
            models_loaded = data.get('models_loaded', False)
            self.log_result("Models Loaded", models_loaded, f"Models loaded: {models_loaded}")
            
            # Check festival count
            festival_count = data.get('total_festivals_2025', 0)
            expected_count = 7  # Republic Day, Holi, Ram Navami, Independence Day, Diwali, Diwali Weekend, Christmas
            self.log_result("2025 Festivals Count", festival_count == expected_count, 
                          f"Expected {expected_count} festivals, got {festival_count}")
            
        except Exception as e:
            self.log_result("Health Check", False, f"Exception: {str(e)}")
    
    def test_2025_festivals_endpoint(self):
        """Test 2025 festivals endpoint with predictions"""
        print("🔍 Testing 2025 Festivals Endpoint...")
        try:
            response = self.session.get(f"{self.base_url}/festivals/2025?model_name=catboost")
            
            if response.status_code != 200:
                self.log_result("2025 Festivals Status", False, f"Expected 200, got {response.status_code}")
                return
            
            data = response.json()
            
            # Check structure
            required_fields = ['year', 'total_festivals', 'festivals']
            for field in required_fields:
                if field not in data:
                    self.log_result(f"2025 Festivals - {field}", False, f"Missing field: {field}")
                    continue
                self.log_result(f"2025 Festivals - {field}", True)
            
            # Check year
            year = data.get('year')
            self.log_result("2025 Festivals Year", year == 2025, f"Expected 2025, got {year}")
            
            festivals = data.get('festivals', [])
            festival_count = len(festivals)
            
            # Expected festivals
            expected_festivals = {
                'Republic Day': 2.5,
                'Holi': 3.0,
                'Ram Navami': 2.2,
                'Independence Day': 2.8,
                'Diwali': 4.5,
                'Diwali Weekend': 4.0,
                'Christmas': 3.2
            }
            
            self.log_result("2025 Festivals Count", festival_count == 7, 
                          f"Expected 7 festivals, got {festival_count}")
            
            # Check each festival
            found_festivals = {}
            for festival in festivals:
                name = festival.get('festival_name')
                boost = festival.get('boost')
                
                if name in expected_festivals:
                    found_festivals[name] = boost
                    expected_boost = expected_festivals[name]
                    self.log_result(f"Festival {name} boost", boost == expected_boost,
                                  f"Expected {expected_boost}x, got {boost}x")
                    
                    # Check required fields
                    required_festival_fields = ['date', 'avg_load', 'peak_load', 'peak_hour', 
                                              'recommended_instances', 'predictions']
                    for field in required_festival_fields:
                        if field in festival:
                            self.log_result(f"Festival {name} - {field}", True)
                        else:
                            self.log_result(f"Festival {name} - {field}", False, f"Missing field: {field}")
                    
                    # Check if predictions array has 24 hours
                    predictions = festival.get('predictions', [])
                    self.log_result(f"Festival {name} - 24h predictions", len(predictions) == 24,
                                  f"Expected 24 predictions, got {len(predictions)}")
            
            # Check if all expected festivals are found
            for expected_name in expected_festivals:
                if expected_name not in found_festivals:
                    self.log_result(f"Missing Festival: {expected_name}", False)
            
            # Verify Diwali has highest boost
            diwali_boost = found_festivals.get('Diwali', 0)
            self.log_result("Diwali Highest Boost", diwali_boost == 4.5,
                          f"Diwali boost should be 4.5x, got {diwali_boost}x")
            
        except Exception as e:
            self.log_result("2025 Festivals Endpoint", False, f"Exception: {str(e)}")
    
    def test_2026_festivals_endpoint(self):
        """Test 2026 festivals endpoint"""
        print("🔍 Testing 2026 Festivals Endpoint...")
        try:
            response = self.session.get(f"{self.base_url}/festivals/2026?model_name=catboost")
            
            if response.status_code != 200:
                self.log_result("2026 Festivals Status", False, f"Expected 200, got {response.status_code}")
                return
            
            data = response.json()
            
            # Check year
            year = data.get('year')
            self.log_result("2026 Festivals Year", year == 2026, f"Expected 2026, got {year}")
            
            festivals = data.get('festivals', [])
            festival_count = len(festivals)
            self.log_result("2026 Festivals Count", festival_count == 7,
                          f"Expected 7 festivals, got {festival_count}")
            
            # Check structure similar to 2025
            for festival in festivals:
                name = festival.get('festival_name')
                if 'previous_year' in festival and festival['previous_year']:
                    prev_year_data = festival['previous_year']
                    if 'date' in prev_year_data:
                        prev_date = prev_year_data['date']
                        self.log_result(f"Festival {name} - Previous Year Data", 
                                      prev_date.startswith('2025'),
                                      f"Previous year should be 2025, got {prev_date[:4]}")
            
        except Exception as e:
            self.log_result("2026 Festivals Endpoint", False, f"Exception: {str(e)}")
    
    def test_traffic_prediction_with_boost(self):
        """Test traffic prediction with festival boost multipliers"""
        print("🔍 Testing Traffic Prediction with Boost...")
        
        # Test Diwali prediction (should have 4.5x boost)
        diwali_date = "2025-10-20T12:00:00"
        normal_date = "2025-06-15T12:00:00"  # Non-festival date
        
        try:
            # Test Diwali prediction
            diwali_payload = {
                "start_time": diwali_date,
                "hours": 1,
                "model_name": "catboost"
            }
            
            response = self.session.post(f"{self.base_url}/predict", 
                                       json=diwali_payload)
            
            if response.status_code != 200:
                self.log_result("Diwali Prediction Status", False, f"Expected 200, got {response.status_code}")
                return
            
            diwali_data = response.json()
            
            if not diwali_data or len(diwali_data) == 0:
                self.log_result("Diwali Prediction Data", False, "Empty response")
                return
            
            diwali_pred = diwali_data[0]
            
            # Check Diwali prediction fields
            required_fields = ['predicted_load', 'is_festival', 'festival_name', 'boost']
            for field in required_fields:
                if field in diwali_pred:
                    self.log_result(f"Diwali Prediction - {field}", True, f"Value: {diwali_pred[field]}")
                else:
                    self.log_result(f"Diwali Prediction - {field}", False, f"Missing field")
            
            # Verify it's detected as festival
            is_festival = diwali_pred.get('is_festival', 0)
            self.log_result("Diwali Detected as Festival", is_festival == 1)
            
            # Verify festival name
            festival_name = diwali_pred.get('festival_name', '')
            self.log_result("Diwali Festival Name", festival_name == 'Diwali',
                          f"Expected 'Diwali', got '{festival_name}'")
            
            # Verify boost multiplier
            boost = diwali_pred.get('boost', 1.0)
            self.log_result("Diwali Boost Multiplier", boost == 4.5,
                          f"Expected 4.5x, got {boost}x")
            
            diwali_load = diwali_pred.get('predicted_load', 0)
            
            # Test normal day prediction for comparison
            normal_payload = {
                "start_time": normal_date,
                "hours": 1,
                "model_name": "catboost"
            }
            
            normal_response = self.session.post(f"{self.base_url}/predict", 
                                              json=normal_payload)
            
            if normal_response.status_code == 200:
                normal_data = normal_response.json()
                if normal_data and len(normal_data) > 0:
                    normal_pred = normal_data[0]
                    normal_load = normal_pred.get('predicted_load', 0)
                    normal_boost = normal_pred.get('boost', 1.0)
                    
                    self.log_result("Normal Day Boost", normal_boost == 1.0,
                                  f"Expected 1.0x, got {normal_boost}x")
                    
                    # Compare loads - Diwali should be significantly higher
                    if normal_load > 0 and diwali_load > 0:
                        ratio = diwali_load / normal_load
                        self.log_result("Diwali vs Normal Traffic Spike", ratio > 3.0,
                                      f"Diwali load: {diwali_load:.0f}, Normal load: {normal_load:.0f}, Ratio: {ratio:.2f}x")
            
        except Exception as e:
            self.log_result("Traffic Prediction with Boost", False, f"Exception: {str(e)}")
    
    def test_instance_scaling_logic(self):
        """Test instance scaling logic with different loads"""
        print("🔍 Testing Instance Scaling Logic...")
        
        # Test cases: (predicted_load, expected_instances)
        test_cases = [
            (500, 1),    # < 700
            (1000, 2),   # 700-1400
            (1800, 3),   # 1400-2100
            (2500, 4),   # 2100-3000
            (4000, 5),   # 3000-5000
            (6000, 10),  # > 5000
        ]
        
        for predicted_load, expected_instances in test_cases:
            try:
                payload = {
                    "predicted_load": predicted_load,
                    "asg_name": "test-asg"
                }
                
                response = self.session.post(f"{self.base_url}/scale", json=payload)
                
                if response.status_code != 200:
                    self.log_result(f"Scaling Load {predicted_load}", False, 
                                  f"Expected 200, got {response.status_code}")
                    continue
                
                data = response.json()
                
                # Check required fields
                required_fields = ['success', 'mode', 'desired_capacity', 'scaling_logic']
                for field in required_fields:
                    if field not in data:
                        self.log_result(f"Scaling {predicted_load} - {field}", False, f"Missing field")
                        continue
                
                # Verify desired capacity
                desired_capacity = data.get('desired_capacity', 0)
                self.log_result(f"Scaling Load {predicted_load} → {expected_instances} instances",
                              desired_capacity == expected_instances,
                              f"Expected {expected_instances}, got {desired_capacity}")
                
                # Verify mock mode (since no AWS credentials)
                mode = data.get('mode', '')
                self.log_result(f"Scaling {predicted_load} - Mock Mode", mode == 'mock')
                
            except Exception as e:
                self.log_result(f"Scaling Load {predicted_load}", False, f"Exception: {str(e)}")
    
    def test_next_festival(self):
        """Test next festival endpoint"""
        print("🔍 Testing Next Festival Endpoint...")
        try:
            response = self.session.get(f"{self.base_url}/next-festival?model_name=catboost")
            
            if response.status_code != 200:
                self.log_result("Next Festival Status", False, f"Expected 200, got {response.status_code}")
                return
            
            data = response.json()
            
            # Check structure
            required_fields = ['festival_name', 'date', 'days_until', 'avg_load', 'peak_load', 'recommended_instances']
            for field in required_fields:
                if field in data:
                    self.log_result(f"Next Festival - {field}", True, f"Value: {data[field]}")
                else:
                    self.log_result(f"Next Festival - {field}", False, f"Missing field")
            
            # If festival found, verify it has predictions
            if data.get('festival_name') and data.get('festival_name') != 'None':
                predictions = data.get('predictions', [])
                self.log_result("Next Festival - Predictions", len(predictions) > 0,
                              f"Got {len(predictions)} predictions")
            
        except Exception as e:
            self.log_result("Next Festival Endpoint", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting CloudCP Calendar Backend API Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Run all tests
        self.test_health_check()
        self.test_2025_festivals_endpoint()
        self.test_2026_festivals_endpoint()
        self.test_traffic_prediction_with_boost()
        self.test_instance_scaling_logic()
        self.test_next_festival()
        
        # Print summary
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print(f"✅ Passed: {self.results['passed']}")
        print(f"❌ Failed: {self.results['failed']}")
        print(f"📈 Success Rate: {(self.results['passed'] / (self.results['passed'] + self.results['failed']) * 100):.1f}%")
        
        if self.results['errors']:
            print("\n🔍 FAILED TESTS:")
            for error in self.results['errors']:
                print(f"   • {error}")
        
        return self.results['failed'] == 0

if __name__ == "__main__":
    tester = CloudCPTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)