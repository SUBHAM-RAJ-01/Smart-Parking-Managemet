/*
 * Smart Parking System - Combined Entry/Exit Control with MQTT
 * Arduino Uno R4 WiFi with RFID Integration
 */

#include <SPI.h>
#include <MFRC522.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFiS3.h>
#include <ArduinoJson.h>
#include <PubSubClient.h>

// WiFi credentials
const char* ssid = "Galaxy S22";
const char* password = "12345678";

// MQTT Broker details
const char* mqttServer = "broker.hivemq.com"; // Public broker (replace with your MQTT broker)
const int mqttPort = 1883;
const char* mqttClientId = "ArduinoParkingSystem";
const char* mqttUsername = ""; // Set if your broker requires username
const char* mqttPassword = ""; // Set if your broker requires password

// MQTT Topics
const char* entryTopic = "parking/entry";
const char* entryResponseTopic = "parking/entry/response";
const char* exitTopic = "parking/exit";
const char* exitResponseTopic = "parking/exit/response";
const char* paymentStatusTopic = "parking/payment/status";

// Pin definitions
#define ENTRY_RST_PIN     9
#define ENTRY_SS_PIN      10
#define EXIT_RST_PIN      7
#define EXIT_SS_PIN       8
#define ENTRY_SERVO_PIN   3
#define EXIT_SERVO_PIN    5
#define SCREEN_WIDTH      128
#define SCREEN_HEIGHT     64
#define OLED_RESET        -1

// Initialize components
MFRC522 entryRfid(ENTRY_SS_PIN, ENTRY_RST_PIN);
MFRC522 exitRfid(EXIT_SS_PIN, EXIT_RST_PIN);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// WiFi and MQTT clients
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// State variables
boolean processingEntryVehicle = false;
boolean processingExitVehicle = false;
boolean entryMode = true;
boolean waitingForPayment = false;
String currentExitRfid = "";
unsigned long paymentCheckStartTime = 0;

// Response data storage
String userName = "";
int slotNumber = 0;
float parkingFee = 0.0;
String parkingDuration = "";
String paymentStatus = "";
float walletBalance = 0.0;
boolean responseReceived = false;
boolean paymentConfirmed = false;

// Servo control functions (PWM-based)
void setServoAngle(int servoPin, int angle) {
  int pulse = map(angle, 0, 180, 500, 2500);
  digitalWrite(servoPin, HIGH);
  delayMicroseconds(pulse);
  digitalWrite(servoPin, LOW);
  delayMicroseconds(20000 - pulse);
}

// Hold servo at an angle for ms milliseconds
void holdServo(int servoPin, int angle, int ms) {
  unsigned long end = millis() + ms;
  while (millis() < end) {
    setServoAngle(servoPin, angle);
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("Smart Parking System - Combined Entry/Exit Control with MQTT");

  // Servo pins setup
  pinMode(ENTRY_SERVO_PIN, OUTPUT);
  pinMode(EXIT_SERVO_PIN, OUTPUT);
  holdServo(ENTRY_SERVO_PIN, 0, 500);   // Barriers closed
  holdServo(EXIT_SERVO_PIN, 0, 500);

  // OLED display
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Initializing...");
  display.display();

  // SPI bus and RFID
  SPI.begin();
  entryRfid.PCD_Init();
  exitRfid.PCD_Init();

  // Setup MQTT
  mqttClient.setServer(mqttServer, mqttPort);
  mqttClient.setCallback(mqttCallback);

  // WiFi
  connectToWiFi();
  connectToMqtt();

  showReadyScreen("System Ready");
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }

  // Maintain MQTT connection
  if (!mqttClient.connected()) {
    connectToMqtt();
  }
  mqttClient.loop(); // Process MQTT messages

  // Toggle between entry and exit mode every 2 seconds
  static unsigned long lastToggleTime = 0;
  if (millis() - lastToggleTime > 2000) {
    lastToggleTime = millis();
    entryMode = !entryMode;
    if (entryMode) {
      showScanCardScreen("ENTRY");
    } else {
      showScanCardScreen("EXIT");
    }
  }

  // Entry check
  if (entryMode && !processingEntryVehicle && entryRfid.PICC_IsNewCardPresent() && entryRfid.PICC_ReadCardSerial()) {
    processEntryVehicle();
  }

  // Exit check
  if (!entryMode && !processingExitVehicle && exitRfid.PICC_IsNewCardPresent() && exitRfid.PICC_ReadCardSerial()) {
    processExitVehicle();
  }

  // Check for payment timeout
  if (waitingForPayment && (millis() - paymentCheckStartTime > 30000)) { // 30-second timeout
    waitingForPayment = false;
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("Payment timeout!");
    display.println("Please try again");
    display.display();
    delay(3000);
    showReadyScreen("System Ready");
    processingExitVehicle = false;
  }

  delay(100);
}

void connectToWiFi() {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Connecting to WiFi");
  display.println(ssid);
  display.display();

  if (WiFi.status() == WL_NO_MODULE) {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("ERROR: WiFi module");
    display.println("not detected!");
    display.display();
    Serial.println("ERROR: WiFi module not detected!");
    while (true); // Don't continue
  }

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    Serial.print("Attempting to connect to SSID: ");
    Serial.println(ssid);
    WiFi.begin(ssid, password);
    delay(1000);
    display.print(".");
    display.display();
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected");
    display.println("\nWiFi connected!");
    IPAddress ip = WiFi.localIP();
    display.println(ip[0] + String(".") + ip[1] + String(".") + ip[2] + String(".") + ip[3]);
    display.display();
    delay(2000);
  } else {
    Serial.println("\nWiFi connection failed");
    display.println("\nWiFi failed!");
    display.println("Check credentials.");
    display.display();
    delay(2000);
  }
}

void connectToMqtt() {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Connecting to MQTT");
  display.println(mqttServer);
  display.display();

  // Loop until we're reconnected
  int attempts = 0;
  while (!mqttClient.connected() && attempts < 5) {
    Serial.print("Attempting MQTT connection...");
    // Attempt to connect
    if (mqttClient.connect(mqttClientId, mqttUsername, mqttPassword)) {
      Serial.println("connected");
      display.println("\nMQTT connected!");
      display.display();
      
      // Subscribe to response topics
      mqttClient.subscribe(entryResponseTopic);
      mqttClient.subscribe(exitResponseTopic);
      mqttClient.subscribe(paymentStatusTopic);
      
      delay(1000);
    } else {
      Serial.print("failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" try again in 1 second");
      display.print(".");
      display.display();
      delay(1000);
      attempts++;
    }
  }

  if (!mqttClient.connected()) {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("MQTT connection");
    display.println("failed!");
    display.display();
    delay(2000);
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");
  
  // Convert payload to string
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);

  // Parse the JSON response
  DynamicJsonDocument doc(1024);
  DeserializationError error = deserializeJson(doc, message);
  
  if (error) {
    Serial.print("deserializeJson() failed: ");
    Serial.println(error.c_str());
    return;
  }

  // Handle different topics
  if (String(topic) == entryResponseTopic) {
    handleEntryResponse(doc);
  } 
  else if (String(topic) == exitResponseTopic) {
    handleExitResponse(doc);
  }
  else if (String(topic) == paymentStatusTopic) {
    String rfidTag = doc["rfid"];
    if (rfidTag == currentExitRfid && waitingForPayment) {
      paymentConfirmed = doc["paid"];
      if (paymentConfirmed) {
        waitingForPayment = false;
        
        display.clearDisplay();
        display.setCursor(0, 0);
        display.println("Payment received!");
        display.println("Thank you!");
        display.println("Opening barrier...");
        display.display();
        
        holdServo(EXIT_SERVO_PIN, 90, 5000); // Open 5s
        holdServo(EXIT_SERVO_PIN, 0, 500);   // Close
        
        processingExitVehicle = false;
        showReadyScreen("System Ready");
      }
    }
  }
}

void handleEntryResponse(JsonDocument &doc) {
  bool success = doc["success"];
  
  if (success) {
    userName = doc["userName"].as<String>();
    slotNumber = doc["slotNumber"];
    
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("Welcome " + userName + "!");
    display.println("Assigned slot: " + String(slotNumber));
    display.println("Opening barrier...");
    display.display();
    
    holdServo(ENTRY_SERVO_PIN, 90, 5000); // Open 5s
    holdServo(ENTRY_SERVO_PIN, 0, 500);   // Close
  } else {
    String errorMsg = doc["message"];
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("Error:");
    display.println(errorMsg);
    display.display();
    delay(3000);
  }
  
  processingEntryVehicle = false;
  responseReceived = true;
}

void handleExitResponse(JsonDocument &doc) {
  bool success = doc["success"];
  
  if (success) {
    userName = doc["userName"].as<String>();
    parkingFee = doc["parkingFee"];
    parkingDuration = doc["parkingDuration"].as<String>();
    paymentStatus = doc["paymentStatus"].as<String>();
    walletBalance = doc["walletBalance"];
    
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("User: " + userName);
    display.println("Duration: " + parkingDuration);
    display.println("Fee: $" + String(parkingFee, 2));
    
    if (paymentStatus == "PAID" || paymentStatus == "WALLET") {
      display.println("Payment: SUCCESSFUL");
      display.println("Wallet: $" + String(walletBalance, 2));
      display.println("Opening barrier...");
      display.display();
      
      holdServo(EXIT_SERVO_PIN, 90, 5000); // Open 5s
      holdServo(EXIT_SERVO_PIN, 0, 500);   // Close
      
      processingExitVehicle = false;
    } else {
      display.println("Insufficient balance!");
      display.println("Please add funds");
      display.display();
      
      waitingForPayment = true;
      paymentCheckStartTime = millis();
    }
  } else {
    String errorMsg = doc["message"];
    display.clearDisplay();
    display.setCursor(0, 0);
    display.println("Error:");
    display.println(errorMsg);
    display.display();
    delay(3000);
    
    processingExitVehicle = false;
  }
  
  responseReceived = true;
}

void showReadyScreen(String message) {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Smart Parking System");
  display.println("-----------------");
  display.println(message);
  display.display();
}

void showScanCardScreen(String point) {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Smart Parking System");
  display.println("-----------------");
  display.println(point + " Mode Active");
  display.println("Scan RFID card...");
  display.display();
}

String getRfidTag(MFRC522 &rfid) {
  String tag = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    tag += (rfid.uid.uidByte[i] < 0x10 ? "0" : "") + String(rfid.uid.uidByte[i], HEX);
  }
  tag.toUpperCase();
  return tag;
}

void processEntryVehicle() {
  if (processingEntryVehicle) return;
  processingEntryVehicle = true;

  String rfidTag = getRfidTag(entryRfid);

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Processing Entry...");
  display.println("RFID: " + rfidTag);
  display.display();

  if (WiFi.status() == WL_CONNECTED && mqttClient.connected()) {
    // Create JSON message
    DynamicJsonDocument doc(256);
    doc["rfid"] = rfidTag;
    doc["deviceId"] = mqttClientId;
    
    // Serialize JSON and publish to entry topic
    String jsonPayload;
    serializeJson(doc, jsonPayload);
    
    if (mqttClient.publish(entryTopic, jsonPayload.c_str())) {
      Serial.println("Entry request published to MQTT");
      
      // Wait for response with timeout
      responseReceived = false;
      unsigned long startTime = millis();
      while (!responseReceived && (millis() - startTime < 10000)) {
        mqttClient.loop();
        delay(100);
      }
      
      if (!responseReceived) {
        display.clearDisplay();
        display.setCursor(0, 0);
        display.println("Error: No response");
        display.println("from server");
        display.display();
        delay(3000);
        processingEntryVehicle = false;
      }
    } else {
      display.clearDisplay();
      display.setCursor(0, 0);
      display.println("Failed to publish");
      display.println("to MQTT broker");
      display.display();
      delay(3000);
      processingEntryVehicle = false;
    }
  } else {
    display.clearDisplay();
    display.setCursor(0, 0);
    if (WiFi.status() != WL_CONNECTED) {
      display.println("WiFi disconnected!");
      display.println("Reconnecting...");
      display.display();
      connectToWiFi();
    } else {
      display.println("MQTT disconnected!");
      display.println("Reconnecting...");
      display.display();
      connectToMqtt();
    }
    processingEntryVehicle = false;
  }

  entryRfid.PICC_HaltA();
  entryRfid.PCD_StopCrypto1();
  
  if (!responseReceived) {
    showReadyScreen("System Ready");
  }
}

void processExitVehicle() {
  if (processingExitVehicle) return;
  processingExitVehicle = true;

  String rfidTag = getRfidTag(exitRfid);
  currentExitRfid = rfidTag;

  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("Processing Exit...");
  display.println("RFID: " + rfidTag);
  display.display();

  if (WiFi.status() == WL_CONNECTED && mqttClient.connected()) {
    // Create JSON message
    DynamicJsonDocument doc(256);
    doc["rfid"] = rfidTag;
    doc["deviceId"] = mqttClientId;
    
    // Serialize JSON and publish to exit topic
    String jsonPayload;
    serializeJson(doc, jsonPayload);
    
    if (mqttClient.publish(exitTopic, jsonPayload.c_str())) {
      Serial.println("Exit request published to MQTT");
      
      // Wait for response with timeout
      responseReceived = false;
      unsigned long startTime = millis();
      while (!responseReceived && (millis() - startTime < 10000)) {
        mqttClient.loop();
        delay(100);
      }
      
      if (!responseReceived) {
        display.clearDisplay();
        display.setCursor(0, 0);
        display.println("Error: No response");
        display.println("from server");
        display.display();
        delay(3000);
        processingExitVehicle = false;
        showReadyScreen("System Ready");
      }
    } else {
      display.clearDisplay();
      display.setCursor(0, 0);
      display.println("Failed to publish");
      display.println("to MQTT broker");
      display.display();
      delay(3000);
      processingExitVehicle = false;
      showReadyScreen("System Ready");
    }
  } else {
    display.clearDisplay();
    display.setCursor(0, 0);
    if (WiFi.status() != WL_CONNECTED) {
      display.println("WiFi disconnected!");
      display.println("Reconnecting...");
      display.display();
      connectToWiFi();
    } else {
      display.println("MQTT disconnected!");
      display.println("Reconnecting...");
      display.display();
      connectToMqtt();
    }
    processingExitVehicle = false;
    showReadyScreen("System Ready");
  }

  exitRfid.PICC_HaltA();
  exitRfid.PCD_StopCrypto1();
  
  if (!responseReceived && !waitingForPayment) {
    showReadyScreen("System Ready");
  }
} 