//Codigo para la placa SSEM
#include <espnow.h>
#include <ESP8266WiFi.h>


void setup(){
    Serial.begin(9600);
}

void loop(){
    Serial.println("Hola mundo");
    delay(600);
}