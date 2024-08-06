#include <ESP8266WiFi.h>
#include <WebSocketsClient.h>

//Configuracion de la red WiFi
const char* ssid="INFINITUM969_2.4_EXT";
const char* password="VNJ2KbPnPT";

//Direccion del servidor WebSocket   (PONER MANUALMENTE DEPENDIENDO DE LO QUE NOS DE NODE.JS)
const char* websocket_server="ws://192.168.1.78"; //WebSocket local

//Instancia del Websocket

WebSocketsClient webSocket;

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED: //saltara en caso de desconexion
      Serial.println("WebSocket Desconectado");
      
    break;
    case WStype_CONNECTED:  //saltara en caso de que la conexion sea exitosa
      Serial.println("WebSocket Conectado");
      // Enviar un mensaje al servidor WebSocket
      webSocket.sendTXT("Hola desde ESP8266");
    break;
    case WStype_TEXT: //en caso de que recibamos mensajes de texto
      Serial.printf("Mensaje Recibido: %s\n", payload);
      // Aquí puedes procesar el mensaje recibido
      
    break;
    case WStype_BIN:  //en caso de mensajes binarios
      Serial.printf("Mensaje Binario Recibido (%u bytes)\n", length);
    break;
    case WStype_PING: //Los ping-pong son utiles en los servidores ya que en ocasiones se cierra la comunicacion
      // Manejo del ping
      break;
    case WStype_PONG:
      // Manejo del pong
      break;
  }
}
void setup(){
  Serial.begin(115200);

  //conexion a la red WiFi
  WiFi.begin(ssid,password);
  Serial.println("Conectando a WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println();
  Serial.println("Conectado a WiFi");
  //Configuracion del cliente WebSocket
  webSocket.begin(websocket_server,81,"/"); //Ruta, puerto, si es en alguna ruta especifica
  //Asignar funcion de manejo de eventos
  webSocket.onEvent(webSocketEvent);

  //Establecemos un intervalo para tratar la reconexion
  webSocket.setReconnectInterval(5000);

  
}

void loop(){
  //Llamamos en el loop , el loop del Web Socket que manejara la conexion
}
