#if defined(__has_include)
#if __has_include(<Arduino.h>)
#include <Arduino.h>
#endif
#endif

#ifndef ARDUINO
#define HIGH 0x1
#define LOW 0x0
#define INPUT 0x0
#define OUTPUT 0x1
#define INPUT_PULLUP 0x2

#ifndef A0
#define A0 14
#endif
#ifndef A1
#define A1 15
#endif
#ifndef A2
#define A2 16
#endif
#ifndef A3
#define A3 17
#endif
#ifndef A4
#define A4 18
#endif
#ifndef A5
#define A5 19
#endif

inline void pinMode(int, int) {}
inline void digitalWrite(int, int) {}
inline int digitalRead(int) { return 0; }
inline int analogRead(int) { return 0; }
inline unsigned long pulseIn(int, int, unsigned long = 1000000UL) { return 0UL; }
inline void delayMicroseconds(unsigned int) {}
inline unsigned long millis() { return 0UL; }

struct SerialMock {
  void begin(unsigned long) {}
  template <typename T>
  void print(const T&) {}
  template <typename T>
  void print(const T&, int) {}
  template <typename T>
  void println(const T&) {}
};

static SerialMock Serial;
#endif

// GreenBlock sensor hub
// Sends one JSON line to Serial every 2 seconds.

#define PIN_DHT22 4
#define PIN_PIR 7
#define PIN_BUZZER 3
#define PIN_RELAY1 8
#define PIN_RELAY2 9
#define PIN_LASER_TX 5
#define PIN_LASER_RX 2
#define PIN_RAIN_DO 6
#define PIN_TRIG A1
#define PIN_ECHO A2
#define PIN_MQ_AOUT A0
#define PIN_INA_SDA A4
#define PIN_INA_SCL A5
#define RFID_SS 10
#define RFID_RST A3

static unsigned long lastPublishMs = 0;
static int visitorCount = 0;
static int lastLaserBroken = 0;

long readDistanceCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  unsigned long duration = pulseIn(PIN_ECHO, HIGH, 30000UL);
  if (duration == 0) {
    return -1;
  }
  return (long)(duration * 0.0343 / 2.0);
}

void setup() {
  Serial.begin(9600);

  pinMode(PIN_PIR, INPUT);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_RELAY1, OUTPUT);
  pinMode(PIN_RELAY2, OUTPUT);
  pinMode(PIN_LASER_TX, OUTPUT);
  pinMode(PIN_LASER_RX, INPUT_PULLUP);
  pinMode(PIN_RAIN_DO, INPUT);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(RFID_RST, OUTPUT);

  // Active LOW relays default OFF
  digitalWrite(PIN_RELAY1, HIGH);
  digitalWrite(PIN_RELAY2, HIGH);

  // Laser transmitter ON
  digitalWrite(PIN_LASER_TX, HIGH);
  digitalWrite(PIN_BUZZER, LOW);
  digitalWrite(RFID_RST, HIGH);
}

void loop() {
  int laserBroken = (digitalRead(PIN_LASER_RX) == LOW) ? 1 : 0;
  if (laserBroken == 1 && lastLaserBroken == 0) {
    visitorCount++;
  }
  lastLaserBroken = laserBroken;

  unsigned long now = millis();
  if (now - lastPublishMs < 2000UL) {
    return;
  }
  lastPublishMs = now;

  // Placeholder values for sensors that require dedicated libraries.
  float temp = -1.0;
  float humidity = -1.0;
  float solarV = -1.0;
  int solarMw = -1;

  int pir = digitalRead(PIN_PIR) == HIGH ? 1 : 0;
  long distanceCm = readDistanceCm();
  int co2Raw = analogRead(PIN_MQ_AOUT);
  int rain = digitalRead(PIN_RAIN_DO) == HIGH ? 1 : 0;

  // 0 means ON for active LOW relays
  int relay1 = (digitalRead(PIN_RELAY1) == LOW) ? 1 : 0;
  int relay2 = (digitalRead(PIN_RELAY2) == LOW) ? 1 : 0;

  Serial.print("{");
  Serial.print("\"temp\":"); Serial.print(temp, 1); Serial.print(",");
  Serial.print("\"humidity\":"); Serial.print(humidity, 1); Serial.print(",");
  Serial.print("\"solar_v\":"); Serial.print(solarV, 1); Serial.print(",");
  Serial.print("\"solar_mw\":"); Serial.print(solarMw); Serial.print(",");
  Serial.print("\"pir\":"); Serial.print(pir); Serial.print(",");
  Serial.print("\"distance_cm\":"); Serial.print(distanceCm); Serial.print(",");
  Serial.print("\"co2_raw\":"); Serial.print(co2Raw); Serial.print(",");
  Serial.print("\"rain\":"); Serial.print(rain); Serial.print(",");
  Serial.print("\"laser_broken\":"); Serial.print(laserBroken); Serial.print(",");
  Serial.print("\"visitor_count\":"); Serial.print(visitorCount); Serial.print(",");
  Serial.print("\"relay1\":"); Serial.print(relay1); Serial.print(",");
  Serial.print("\"relay2\":"); Serial.print(relay2); Serial.print(",");
  Serial.print("\"rfid_uid\":\"\"");
  Serial.println("}");
}