#include <Wire.h> //libreria para poder tener comunicacion I2C con los dispositivos
#include <ESP8266WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <ThingerESP8266.h>
// #include <LCD.h>//libreria para el bus de datos de la pantalla LCD para su correcto funcionamiento
#include <LiquidCrystal_I2C.h> //libreria que se encarga de poder comunicarSE con el expansor I2C de la pantalla LCD
#include <Keypad_I2C.h>        //libreria que se encarga de poder comunicarse con el expansor I2C de el teclado 4x3
// #include <Keypad.h>//libreria que nos permite saber que tecla se ha presiona y definir los pines como entradas
#include <espnow.h>         //libreria que nos permitira la comunicacion I2C con el dispositivo SSEM LA
#include <SoftwareSerial.h> //libreria que hace que dos GPIO´s funcionen como RX y TX respectivamente para poder manejar comunicacion serial
#include <MFRC522_I2C.h>

#define EEPROM_I2C_ADDRESS 0x50 // definimos la direccion de EEPROM I2C
#define BOARD_ID 2
#define config_btn 0 // boton que nos permitira entrar a la configuracion de red
#define RST_PIN 14 // D5 Pin on NodeMCU
#define led_pin 12   // para el led indicativo en la PCB que nos indicara: 1.Que se entro a configuracion de red 2. que se envio datos por ESPNOW correctamente
#define door_btn 2


//variables que cambiaremos
bool visor = true;     // variable encargada de decirme si la conexion a sido exitosa
bool conexion = false; // variable que se ocupa en bluetooth para poder salir del bucle while y poder mostrar mensajes una vez
bool Ralarma = 0;      // variable que me ayuda auxiliarmente a entrar a un if en un bucle while explusivamente una vez dependiendo de su estado
bool RFIDCNAME;
bool RFID_NEW_NAME;
bool RFIDCCARD;
bool LED;
//(FALTA) generar una funcion que retorne los valores hexagesimales
uint8_t receiverAddress[] = {0x98, 0xCD, 0xAC, 0x32, 0x2D, 0xBB}; // IMPORTANTE, SE TIENE QUE PONER LA DIRECCION MAC DEL DISPOSITIVO QUE DESEAMOS ENVIARLE DATOS 7C:87:CE:9C:65:13
const byte lcd_width = 16;
const byte rows = 4;               // Indicamos cuantas lineas/filas tiene el teclado// variable que nos permite mover las posiciones de los arreglos y almacenas caracteres en este
const byte cols = 3;               // Indicamos cuantas columnas tiene el teclado
byte rowPins[rows] = {5, 0, 1, 3}; // declaramos los pines para las filas
byte colPins[cols] = {4, 6, 2};    // declaramos los pines para las columnas
const char keys[rows][cols] = {    // declaramos una matriz con las teclas del teclado para saber a que corresponden
    {'1', '2', '3'},
    {'4', '5', '6'},
    {'7', '8', '9'},
    {'*', '0', '#'}};
byte bloqueo = 0; // variable que se incrementara cada que se tenga la contraseña incorrecta
// byte cwifi=0;
byte attemps_espnow = 0;    //(FALTA) ver en que se ocupa esta variable
// byte id_usuario[limPos][4]; // variable que va a leer de la EEPROM el ID de las tarjetas
byte fila = 0;
byte NAMEB;
byte retraso_bloqueo = 0; // variable que aumentara para el retraso, dependiendo de el numero de intentos erroneos seguidos que tengamos esta aumentara
byte RFIDNUMBRER = 0;
unsigned long temp1; // variable auxiliar para poder hacer el truco de retrasos sin detener el programa 1
unsigned long temp2; // variable auxiliar para poder hacer el truco de retrasos sin detener el programa 2
unsigned long temp3; // variable auxiliar para poder hacer el truco de retrasos sin detener el programa 3
// long aux4;
// instancia de objetos
LiquidCrystal_I2C lcd0(0x27, 2, 1, 0, 4, 5, 6, 7); // indicamos la direccion y cuantos caracteres y lineas tiene nuestro lcd
LiquidCrystal_I2C lcd1(0x26, 2, 1, 0, 4, 5, 6, 7);
Keypad_I2C keypad = Keypad_I2C(makeKeymap(keys), rowPins, colPins, rows, cols, 0x20); // llamamos a la libreria del keypad y le pasamos los parámetros, creamos un objeto
// ThingerESP8266 thing(USERNAME, DEVICE_ID, DEVICE_CREDENTIAL);                          // CREO OBJETO DE THINGER.IO donde le pasamos el nombre de usuario en thinger, el nombre del dispositivo y la credencia previamente definidas
SoftwareSerial Bth(13, 15); // creamos objeto para simular la comunicacion serial por dos pines del microcontrolador no predefinidos para eso
MFRC522 mfrc522(0x28, RST_PIN);
WebSocketsClient webSocket;
//ESPACIOS RECERBADOS DE MEMORIA
#define EEPROM_STORAGE_INDEX_ssid_lenght 0
#define EEPROM_STORAGE_INDEX_password_lenght 1
#define EEPROM_STORAGE_INDEX_registered_cards 2
#define EEPROM_STORAGE_INDEX_ssid 3
#define EEPROM_STORAGE_INDEX_password 53
#define EEPROM_STORAGE_INDEX_restore 103
#define EEPROM_STORAGE_INDEX_device_password_lenght 104
#define EEPROM_STORAGE_INDEX_device_password 105
#define EEPROM_STORAGE_INDEX_cards_storage 121
#define EEPROM_STORAGE_INDEX_device_id 961
// Todo en lowercase y separdo por underscore
enum LCDDisplaymessages {
    HIDDEN_PASSWORD_DISPLAY,
    CORRECT_PASSWORD_DISPLAY,
    INCORRECT_PASSWORD_DISPLAY,
    SAVED_PASSWORD_DISPLAY,
    REGISTED_PASSWORD_DISPLAY,
    PASSWORD_SENT_TO_WEB_DISPLAY,
    ALARM_ON_DISPLAY,
    ALARM_OFF_DISPLAY,
    SCREEN_CLEAN_DISPLAY,
    LOCK_OFF_DISPLAY,
    LOCK_ON_DISPLAY,
    WIFI_NETWORK_SET_UP_DISPLAY,
    SYSTEM_LOCKED_OUT_DISPLAY,
    CARD_DETECTED_DISPLAY,
    ACCESS_DENIED_DISPLAY,
    ACCESS_ACCEPTED_DISPLAY,
    CARD_NAME_EDIT_ENABLED_DISPLAY,
    NEW_CARD_NAME_SET_UP_DISABLED_DISPLAY,
    ADD_CARD_ENABLED_DISPLAY,
    ADD_CARD_DISABLED_DISPLAY,
    CARD_TAPPED_SAVED_DISPLAY,
    CARD_TAPPED_EXISTENT_DISPLAY,
    DEVICE_UNLOCKED_DISPLAY,
    TRANSMISION_SSEM_ERROR,
    RESTORE_TO_DEFAULT_SETTING_DISPLAY,
};

enum Modes {
    CONNECTED_MODE,
    DISCONECTED_MODE
};
Modes system_mode;
// Definimos un enum para los estados web Socket
enum WebSocket {
    WEBSOCKET_DISABLED, // 0
    WEBSOCKET_ENABLED   // 1
};
enum Device{
    WEBSOCKET,
    BLUETOOTH
};
WebSocket web_socket;






struct wifi_struct {
    /* data */
    const int port=80;
    const String server="192.168.1.78";    //poner el servidor al que responde
    int ssid_length;
    int password_length;
    String ssid;
    String password;
    String session_cookie;
};
wifi_struct wifi;

struct bluetooth_struct {
    /* data */
    bool connection;
    String data;
};
bluetooth_struct bluetooth;

struct rfid_struct {
    String name;
    int id[4];
    int pos;
};
rfid_struct rfid_cards[40];

struct device_struct {
    String id;           // id de identificacion para saber a que cuenta pertenecemos
    String ws_id;        // id que nos proporcionara WS para identificarnos
    bool restart;        // para restablecer el dispositivo
    String password;     // contraseña del dispositivo  111111
    int password_lenght; /*FALTA ver si son mas parametros */
};
device_struct device;
String keypad_value;
typedef struct struct_message {
    /* data */
    String message;
} struct_message;
struct_message espnow;

struct device_output_peripherals_status {
    bool ALARM;
    bool GATE_LOCK;
};

struct device_output_peripherals_status output_peripherals;
byte await=0;//variable que me servira como espera
/*
Mensajes de ESP NOW
Mensaje que recibiremos de SSEM
    ALARM_TURN_ON
    ALARM_TURN_OFF
    BOLT_TURN_ON
    BOLT_TURN_OFF
    BOLT_TEMP
    ARE_YOU_ACTIVE
Mensajes que enviaremos a SSEM
    ALARM_ON
    ALARM_OFF
    BOLT_ON
    BOLT_OFF
    BOLT_TEMP
    I_AM_ACTIVE
*/
/*
COMANDOS DE SIMULACION
  WEBSOCKET_DISCONNECTED  //simula una desconexion web socket
  WEBSOCKET_CONNECTED     //simula la reconexion web socket
  
*/


void setup(){
    //Inicializacion de objetos principales
    Serial.begin(115200); //inicializo el puerto serie del microcontrolador
    Wire.begin(); //inicializo la comunicacion I2C
    bluetooth.connection=true;
    Bth.begin(9600); //Inicializo la comunicacion seria con el modulo bluetooth
    lcd0.begin(0,lcd_width); //Inicializo las pantallas LCD
    lcd1.begin(0,lcd_width); //Inicializo las pantallas LCD
    lcd0.setBacklightPin(3,POSITIVE);//prendo la luz de la pantalla
    lcd0.setBacklight(HIGH);//prendo la luz de la pantalla
    lcd1.setBacklightPin(3,POSITIVE);//prendo la luz de la pantalla
    lcd1.setBacklight(HIGH);//prendo la luz de la pantalla
    keypad.begin(); //inicializo el teclado I2C
    ShowReaderDetails(); //Invoco la funcion del MFRC522 para inicializar
    Serial.println(F("Scan PICC to see UID, type, and data blocks..."));
    //inicializacion de los pines
    pinMode(config_btn,INPUT_PULLUP);
    //pinMode(door_btn,INPUT_PULLUP);
    pinMode(led_pin,OUTPUT);
    //inicializamos el sistema
    Serial.println("Inicializando");
    system_mode=CONNECTED_MODE;
    digitalWrite(led_pin, LOW);
    //obtenemos las credenciales de la EEPROM
    //deleteCredentials();
    getCredentials();
    Serial.println("Iniciando en el modo conexion");
    Serial.println("Mi direccion MAC es:");
    Serial.println(WiFi.macAddress());
    Serial.println("Iniciando conexion a internet");
    //(FALTA) poner esto en la funcion de la pantalla lcd
    lcd0.clear();
    lcd0.setCursor(0,0);
    lcd0.print(wifi.ssid);
    lcd0.setCursor(0,1);
    lcd0.print("  CONECTING...  ");
    WiFi.mode(WIFI_AP_STA);//ponemos al ESP8266 como punto de acceso y estacion(necesario para tener correcta comunicacion con ESP NOW)
    digitalWrite(led_pin,HIGH);//prendo led azul de PCB como señalizacion para el inicio de conexion wifi
    WiFi.begin(wifi.ssid.c_str(), wifi.password.c_str()); // inicializamos la red
    await=0;
    while ((WiFi.status() != WL_CONNECTED) and (await < 100)){
        delay(200);
        Serial.print(".");
        if (await % 10 == 0) Serial.println();
        await++;
    }
    Serial.println();
    if(await > 99){ //no tuvimos exito en la conexion
        Serial.println("Conexion fallida, inicio del sistema sin conexion");
        system_mode = DISCONECTED_MODE;
        web_socket = WEBSOCKET_DISABLED;
        await=0;
        //(FALTA) poner esto en la funcion de la pantalla lcd
        lcd0.clear();
        lcd0.setCursor(0,0);
        lcd0.print("   CONNECTION   ");
        lcd0.setCursor(0,1);
        lcd0.print("     FAILED     ");
    }
    else{
        digitalWrite(led_pin, LOW);
        //(FALTA) poner esto en la funcion de la pantalla lcd
        lcd0.clear();
        lcd0.setCursor(0,0);
        lcd0.print("   IP ADDRESS   ");
        lcd0.setCursor(0,1);
        lcd0.print(WiFi.localIP());//imprimimos la direccion IP por pantalla
        Serial.print("Conexion exitosa tu direccion IP es: ");
        Serial.println(WiFi.localIP());
        Serial.print("Wi-Fi Channel: ");
        Serial.println(WiFi.channel());//imprimimos el canal que asigna la red(importante que ambos dispositivos tengan el mismo canal)
        //autenticacion, obtenemos la session cookie y conectarnos a web socket
        if(authenticate() && device.id!=""){    //si tenemos un id ya guardado intentamos la verificacion
            Serial.println("Autenticacion exitosa");
            web_socket=WEBSOCKET_ENABLED;
            //Nos conectamos a web socket ahora que ya estamos autenticados
            Serial.println("Conectandonos al Web Socket");
            connectWebSocket();
        }
        else{
            web_socket=WEBSOCKET_DISABLED;
            Serial.println("Error en la autenticacion");
            Serial.println("Sin conexion al web socket");
        }
    }
    //Inicializamos el ESP NOW
    if(esp_now_init() != 0){//funcion encargada de inicializar el ESP NOW
        Serial.println("ESP-NOW inicializacion fallida");//imprimimos mensaje en monitor serial
        return;//retorna para no iniciar el programa por error
    }
    esp_now_set_self_role(ESP_NOW_ROLE_CONTROLLER);//le Asignamos el rol de controlador(el que envia)
    esp_now_register_send_cb(OnDataSent); //esta funcion siempre sera llamada cada que se envie el dato(sea correcto o erroneo el envio del dato)
    esp_now_add_peer(receiverAddress, ESP_NOW_ROLE_SLAVE, 1, NULL, 0);//le decimos a que dispositivos le queremos mandar el dato, el rol del otro dispositivo y el canal por el que se va a enviar
    temp2=millis(); //iniciamos ciclo de inactividad del dispositivo
    temp3=millis(); //iniciamos ciclo para enviar datos a SSEM LA, como sistema de seguridad cada 2 minutos se enviaran datos a 
    Serial.println("Inicializado");
}

void loop() {
	  systemFunction();
    serialFunction();
}
//funcion provisional para simular acciones
void serialFunction(){
  if (Serial.available()){ //si entra a este if quiere decir que hay datos bluetooth en espera
        String action;
        action=Serial.readStringUntil('\n');
        Serial.println("Simulando accion");
        if(action=="WEBSOCKET_DISCONNECTED"){
          Serial.println("Desconexion web socket");
          web_socket=WEBSOCKET_DISABLED;
          webSocket.setReconnectInterval(0); // Desactiva la reconexión automática
          webSocket.disconnect();
        }
        else if(action=="WEBSOCKET_CONNECTED"){
          Serial.println("Reconexion web socket");
          web_socket=WEBSOCKET_ENABLED;
          webSocket.setReconnectInterval(5000);
        }
   }
}


//Funcion General del sistema
void systemFunction(){
    if(system_mode==CONNECTED_MODE && 
        web_socket==WEBSOCKET_ENABLED){//si ambas condiciones se cumplen ponemos el listener webSocket
        webSocket.loop();
    }
    bluetoothFunction();
    keypadFunction();
    rfidFunction();
}


void keypadFunction(){  //(FALTA)funcion para el keypad

}
void rfidFunction(){    //(FALTA) funcion para el lector de tarjetas

}





//Funcion que pondra todas las credenciales (FALTA)
void getCredentials(){
    //credenciales wifi id,ssid y password
    //provisionalmente pondre las licencias a mano
    wifi.ssid="INFINITUM969C_2.4_EXT";
    wifi.password="VNJ2kbPnPT";
       //ID de 36 caracteres
    //id unico de usuario
    device.id="";

    //Obtenemos las credenciales del dispositivo
    Serial.println("Obteniendo las licencias del dispositivo");

    Serial.println("1. Credenciales del dispositivo");
    device.id=readStringEEPROM(EEPROM_STORAGE_INDEX_device_id,36);
    Serial.println("ID:" + device.id);
    device.password_lenght=readEEPROM(EEPROM_STORAGE_INDEX_device_password_lenght,EEPROM_I2C_ADDRESS);
    device.password=readStringEEPROM(EEPROM_STORAGE_INDEX_device_password,device.password_lenght);
    Serial.println("Password:" + device.password + "/Longitud:" + String(device.password_lenght));

    Serial.println("2. Credenciales de la red");
    wifi.ssid_length=readEEPROM(EEPROM_STORAGE_INDEX_ssid_lenght,EEPROM_I2C_ADDRESS);
    wifi.ssid=readStringEEPROM(EEPROM_STORAGE_INDEX_ssid,wifi.ssid_length);
    Serial.println("SSID:" + wifi.ssid + "/Longitud:" + String(wifi.ssid_length));
    wifi.password_length=readEEPROM(EEPROM_STORAGE_INDEX_password_lenght,EEPROM_I2C_ADDRESS);
    wifi.password=readStringEEPROM(EEPROM_STORAGE_INDEX_password,wifi.password_length);
    Serial.println("SSID Password:" + wifi.password + "/Longitud:" + String(wifi.password_length));

    Serial.println("3. Tarjetas registradas y no registradas");
    //tarjetas registradas (FALTA)

    //

}
/*
//Solo seteo las credenciales wifi
void setWifiCredentials(){

}
//Solo seteo la contraseña y tarjetas
void setDeviceCredentials(){

}
*/
//Funcion para Setear todas las credentiales
void setCredentials(){
    //Primero escribimos las licencias wifi
    Serial.println("SSID escribiendose en EEPROM...");
    writeStringEEPROM(EEPROM_STORAGE_INDEX_ssid,wifi.ssid);
    Serial.println("SSID length escribiendose en EEPROM...");
    writeEEPROM(EEPROM_STORAGE_INDEX_ssid_lenght,wifi.ssid.length(),EEPROM_I2C_ADDRESS);
    Serial.println("SSID password escribiendose en EEPROM...");
    writeStringEEPROM(EEPROM_STORAGE_INDEX_password,wifi.password);
    Serial.println("SSID password length escribiendose en EEPROM...");
    writeEEPROM(EEPROM_STORAGE_INDEX_password_lenght,wifi.password.length(),EEPROM_I2C_ADDRESS);
    Serial.println("Password del dispositivo escribiendose en EEPROM...");
    writeStringEEPROM(EEPROM_STORAGE_INDEX_device_password,device.password);
    Serial.println("Password length del dispositivo escribiendose en EEPROM...");
    writeEEPROM(EEPROM_STORAGE_INDEX_device_password_lenght,device.password.length(),EEPROM_I2C_ADDRESS);
    Serial.println("ID de identificacion escribiendose en EEPROM");
    writeStringEEPROM(EEPROM_STORAGE_INDEX_device_id,device.id);
    //en caso de que exista las tarjetas las guardamos
}

//Funcion para remover todas las credenciales
void deleteCredentials(){
    //Credenciales del dispositivo


    //Credenciales wifi
    writeEEPROM(EEPROM_STORAGE_INDEX_ssid_lenght,0,EEPROM_I2C_ADDRESS);
    writeEEPROM(EEPROM_STORAGE_INDEX_password_lenght,0,EEPROM_I2C_ADDRESS);

    //Credenciales del dispositivo
    writeEEPROM(EEPROM_STORAGE_INDEX_device_password_lenght,6,EEPROM_I2C_ADDRESS);
    writeStringEEPROM(EEPROM_STORAGE_INDEX_device_password,"111111");
    writeStringEEPROM(EEPROM_STORAGE_INDEX_device_id,"00000000-0000-0000-0000-000000000000");

    //Tarjetas registradas




}

// funcion para manipular datos bluetooth
void bluetoothFunction() {
    if (Bth.available()){ //si entra a este if quiere decir que hay datos bluetooth en espera
        bluetooth.data=Bth.readStringUntil('\n');
        bluetooth.connection = false;
    }
    if (bluetooth.connection == false){ // el dispositivo a terminado de enviar
        Serial.println();
        if (bluetooth.data != "ERROR" && 
            bluetooth.data!= "OK+CONN" &&
            bluetooth.data != "OK+LOST") {
           Serial.println("Informacion Bluetooth recibida:");
           Serial.println(bluetooth.data); 
           parseJSONString(bluetooth.data,BLUETOOTH);
        }
        else{
          if(bluetooth.data != "OK+LOST"){
            for(int i=0;i<bluetooth.data.length();i++){
              char letter=bluetooth.data[i];
              Bth.write(letter);
            }
          }
        }
        bluetooth.connection = true;
        bluetooth.data = "";
    }
}

//Funcion de autenticacion, obtencion de una session cookie para que me permita la conexion Web Socket
bool authenticate() {
    String sessionCookie;
    WiFiClient client;
  
    if (!client.connect(wifi.server, wifi.port)) {
        Serial.println("Conexión fallida con el servidor" + wifi.server);
        return false;
    }
    DynamicJsonDocument doc(1024);
    doc["id"]=device.id;
    size_t jsonSize = measureJson(doc);
    // Creamos un buffer del tamaño exacto necesario
    String json_string;
    json_string.reserve(jsonSize);
    // Serializamos el objeto JSON directamente a la String
    serializeJson(doc, json_string);
    Serial.println("Data que vamos a enviar para autenticarnos"+ json_string);
    // que en la solicitud en la parte de id pasemos Wifi.id
    String request = "POST /sign-in-device HTTP/1.1\r\n";
    request += "Host: " + String(wifi.server) + "\r\n";
    request += "Content-Type: application/json\r\n";
    request += "Content-Length: " + String(json_string.length()) + "\r\n";
    request += "Connection: close\r\n\r\n";
    request += json_string;
    client.print(request);

    Serial.println("Solicitud enviada, esperando respuesta...");
  
    bool headerEnded = false;
    while (client.connected() || client.available()) {
        String line = client.readStringUntil('\n');
        line.trim();
        Serial.println(line);
        
        if (line.startsWith("Set-Cookie:")) {
            int startPos = line.indexOf("connect.sid=");
            if (startPos != -1) {
                startPos += 12; // longitud de "connect.sid=" (incluye el '=')
                int endPos = line.indexOf(';', startPos);
                if (endPos == -1) endPos = line.length();
                sessionCookie = line.substring(startPos, endPos);
                Serial.println("Cookie encontrada: " + sessionCookie);
            }
        }
        
        if (line.isEmpty() && headerEnded) {
            break;
        }
        
        if (line.isEmpty()) {
            headerEnded = true;
        }
    }

    String payload = client.readString();
    Serial.println("Respuesta del servidor: " + payload);

    client.stop();
  
    if (sessionCookie.length() > 0) {
        wifi.session_cookie=sessionCookie;
        Serial.println("Autenticación exitosa, cookie obtenida: " + wifi.session_cookie);
    return true;
    } 
    else {
        Serial.println("La cookie capturada no tiene el formato esperado");
        return false;
    }
}
//Funcion para el envio y decodificacion de JSON
//Funcion para parsear JSON
void parseJSONString(const String& payload,Device dvc) {
    // Calcular el tamaño necesario para el documento JSON
    const size_t capacity = JSON_OBJECT_SIZE(10) + payload.length();
    DynamicJsonDocument doc(capacity);

    // Deserializar el String JSON
    DeserializationError error = deserializeJson(doc, payload);

    // Verificar si hubo un error en la deserialización
    if (error) {
        Serial.print(F("Error al deserializar el JSON: "));
        Serial.println(error.c_str());
        return;
    }
    String issue=doc["issue"];
    if(dvc==WEBSOCKET){
        if(issue=="Web Socket connected"){
            String ws_id=doc["ws_id"];
            Serial.println("Asignando Web Socket ID al dispositivo");
            Serial.println("ID: " + ws_id);
            device.ws_id=ws_id;
        }
        if(issue=="client message"){
          Serial.println("Mensaje recibido de cliente web");
          JsonObject body = doc["body"];
          String bodyIssue = body["issue"];
          Serial.println("Body Issue: " + bodyIssue);
          if(bodyIssue=="Delete credentials"){  //si nos llega este mensaje desde la web eliminamos las credenciales
            Serial.println("Eliminando credenciales"); 
            //(FALTA) poner algun mensaje en pantalla de que el dispositivo se esta restableciendo
            deleteCredentials();
            for (int i = 0; i <= 5; i++){
                delay(500);
                digitalWrite(led_pin, HIGH);
                delay(500);
                digitalWrite(led_pin, LOW);
            }
            ESP.restart();
          }
        }
    }
    else if(dvc==BLUETOOTH){
        if(issue=="Device name"){ //me esta solicitando mi nombre, se lo mando
          Serial.println("Mandando nombre de identificacion bluetooth");
          DynamicJsonDocument doc(1024);  //Tamaño inicial de 1024 bytes, puede ajustarse segun sea el caso
          //Creamos objeto JSON
          doc["name"]="SSEM";
          if(device.id!="00000000-0000-0000-0000-000000000000"){
            Serial.println("Dispositivo ya asociado a cuenta, no configurar");
            doc["message"]="Device already registred";
          }
          else{
            doc["message"]="OK";
          }
          sendJSONMessage(doc,BLUETOOTH);
        }
        if(issue=="Set credentials"){ //configura credentiales del dispositivo para que se asocie a una cuenta
          Serial.println("Configurando credenciales para conectarse a cuenta");
          String id=doc["id"];
          String ssid=doc["ssid"];
          String ssid_password=doc["ssid_password"];
          String password=doc["password"];
          Serial.println("ID:"+id);
          Serial.println("Password:" + password);
          Serial.println("SSID:"+ssid);
          Serial.println("SSID password:"+ssid_password);
          device.id=id;
          device.password=password;
          wifi.ssid=ssid;
          wifi.password=ssid_password;
          setCredentials();
          //Mandando respuesta de regreso
          DynamicJsonDocument doc(1024);
          doc["issue"]="Set credentials";
          doc["state"]="OK";
          sendJSONMessage(doc,BLUETOOTH);
          Serial.println("Restableciendo dispositivo");
            for (int i = 0; i <= 8; i++){
                delay(500);
                digitalWrite(led_pin, HIGH);
                delay(500);
                digitalWrite(led_pin, LOW);
            }
          ESP.restart();
        }
    }
}

//Funcion para mandar JSON
void sendJSONMessage(const DynamicJsonDocument& doc,Device dvc) {
  // Calculamos el tamaño necesario para el JSON serializado
  size_t jsonSize = measureJson(doc);
  // Creamos un buffer del tamaño exacto necesario
  String json_string;
  json_string.reserve(jsonSize);
  // Serializamos el objeto JSON directamente a la String
  serializeJson(doc, json_string);
  // Opcionalmente, puedes imprimir el JSON enviado para debugging
  
  if(dvc==WEBSOCKET){   //el mensaje lo mandamos por Web Socket
    // Enviamos el mensaje JSON al servidor WebSocket
    webSocket.sendTXT(json_string);
    Serial.println("Mensaje web socket enviado: " + json_string);
  }
  else if(dvc==BLUETOOTH){  //el mensaje lo mandamos al bluetooth
    // Añadimos un prefijo con la longitud del mensaje
    String message = String(json_string.length()) + "|" + json_string + "#";
    // Enviamos el mensaje completo de una vez
    Bth.print(message);
    // Aseguramos que todo se ha enviado
    Bth.flush();
    Serial.println("Mensaje Bluetooth enviado: " + message);
  }
}

//Funcion manejadora de los eventos Web Sockets
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED: //saltara en caso de desconexion
      Serial.println("[WSc] WebSocket Desconectado");
    break;
    case WStype_CONNECTED:  //saltara en caso de que la conexion sea exitosa
      Serial.println("[WSc] WebSocket Conectado");
    break;
    case WStype_TEXT: //en caso de que recibamos mensajes de texto
    {
        Serial.printf("[WSc] Mensaje Recibido: %s\n", payload);
        // Aquí puedes procesar el mensaje recibido
        //TRANSFORMACION DEL payload a JSON
        String payloadString = String((char*)payload);
        parseJSONString(payloadString,WEBSOCKET);
      
    }
    break;
    case WStype_BIN:  //en caso de mensajes binarios
      Serial.printf("Mensaje Binario Recibido (%u bytes)\n", length);
    break;
    case WStype_PING: //Los ping-pong son utiles en los servidores ya que en ocasiones se cierra la comunicacion
      // Manejo del ping    //estas activo?  SSEM,        PING-PONG

    break;
    case WStype_PONG:
      // Manejo del pong

    break;
  }
}
//funcion para la conexion Web Socket
void connectWebSocket(){
  //Configuracion del cliente WebSocket
  webSocket.begin(wifi.server,wifi.port,"/"); //Ruta, puerto, si es en alguna ruta especifica   //http  80  ws  81
  String headers = "Cookie: connect.sid= " + wifi.session_cookie;
  Serial.println("Cookie que se enviará: " + headers);
  webSocket.setExtraHeaders(headers.c_str());  //agregamos la cookie a la cabecera para que no nos bote la conexion
  //Asignar funcion de manejo de eventos
  webSocket.onEvent(webSocketEvent);
  //Establecemos un intervalo para tratar la reconexion
  webSocket.setReconnectInterval(5000); //a los 5 seg tratara de reconectarse
}
//Funciones para la EEPROM
//Funcion para escribir en una posicion
void writeEEPROM(int address, byte val, int i2c_address) {
    Wire.beginTransmission(i2c_address); // Iniciamos la transmision I2C EEPROM
    // Enviar dirección de memoria como 16 bits o 2 bytes
    Wire.write((int)(address >> 8));   // MSB
    Wire.write((int)(address & 0xFF)); // LSB
    Wire.write(val);                   // Enviar datos para ser almacenados
    Wire.endTransmission();            // Fin de la transmision
    delay(10);                         // pequeño delay que necesita la EEPROM para escribir
}
//funcion para leer una posicion
byte readEEPROM(int address, int i2c_address) {
      byte rcvData = 0xFF;// Definir byte para datos recibidos(datos de 8 bits)
    Wire.beginTransmission(i2c_address); // Inicia la transmision para I2C EEPROM
    //Enviar dirección de memoria como 16 bits o 2 bytes
    Wire.write((int)(address >> 8)); // MSB
    Wire.write((int)(address & 0xFF)); // LSB
    Wire.endTransmission(); //Fin de la transmission
    Wire.requestFrom(i2c_address, 1); //Solicitar un byte de datos en la dirección de memoria actual
    rcvData =  Wire.read(); // Leer los datos y asignar a la variable
    return rcvData; //regresa en la funcion el dato que se leyo
}
//funcion para leer un string
String readStringEEPROM(const int pos_start, const int lenght) {
    String data = "";
    Serial.print("String obtenida de la EEPROM:");
    for (int i = pos_start; i <pos_start + lenght; i++){
        char letter;
        letter= readEEPROM(i,EEPROM_I2C_ADDRESS);
        Serial.print(letter);
        data =data + String(letter);
    }
    Serial.println();
    return data;
}
//funcion para escribir un string
void writeStringEEPROM(const int pos_start, String data) {
    const int length = data.length();
    char dataArray[data.length() + 1];
    data.toCharArray(dataArray, data.length() + 1);
    Serial.print("Escribiendo string en la EEPROM:");
    for (int i = pos_start; i <pos_start + length; i++) {
        writeEEPROM(i, dataArray[i - pos_start],EEPROM_I2C_ADDRESS);
        char letter;
        letter=readEEPROM(i,EEPROM_I2C_ADDRESS);
        Serial.print(letter);
    }
}
//funcion encargada de informar si se ha enviado exitosamente la informacion por ESPNOW (FALTA) modificarla
void OnDataSent(uint8_t *mac_addr, uint8_t sendStatus) {
  //dado a que se envian diferentes datos se hacen if para modificar diferentes cosas o mostrar diferentes mensajes
  if(sendStatus == 0){
    
  }  
  else{
    Serial.println("Error en transmision");
    attemps_espnow++;
    if(attemps_espnow>100){
      Serial.println("Demasiados intentos de transmision, SSEM LA DESCONECTADO");
      //(FALTA) mandar mensaje a la web si estamos conectados a websocket de que ha habido un proble con la comunicacion SSEM LA

      attemps_espnow=0;
      LCD_MessageDisplay(TRANSMISION_SSEM_ERROR);   //escribimos en la lcd el mensaje
    }
  }
}
//funcion para el modulo RFID
void ShowReaderDetails() {
  // Get the MFRC522 software version
  byte v = mfrc522.PCD_ReadRegister(mfrc522.VersionReg);
  Serial.print(F("MFRC522 Software Version: 0x"));
  Serial.print(v, HEX);
  if (v == 0x91)
    Serial.print(F(" = v1.0"));
  else if (v == 0x92)
    Serial.print(F(" = v2.0"));
  else
    Serial.print(F(" (unknown)"));
  Serial.println("");
  // When 0x00 or 0xFF is returned, communication probably failed
  if ((v == 0x00) || (v == 0xFF)) {
    Serial.println(F("WARNING: Communication failure, is the MFRC522 properly connected?"));
  }
}
//funciones para escribir texto en la pantalla
void lcdMessage(String firstRow, String secondRow, LiquidCrystal_I2C &display) {
    display.clear();
    display.setCursor(0, 0);
    display.print(firstRow);
    if (secondRow != "") {
        display.setCursor(0, 1);
        display.print(secondRow);
    }
}

void LCD_MessageDisplay(LCDDisplaymessages display_message) {
    switch (display_message){
    case HIDDEN_PASSWORD_DISPLAY: // muestra si lleva 1 digito nuestra contraseña
        {
            String password_hidden="";
            for (int i = 0; i < keypad_value.length(); i++) {
                password_hidden += "*";
            }
            lcdMessage("    PASSWORD    ", password_hidden, lcd0);
            lcdMessage("    PASSWORD    ", password_hidden, lcd1);
        }
    break;
    case CORRECT_PASSWORD_DISPLAY: // muestra si la contraseña a sido correcta
        // thing["Ingreso"] >> outputValue("Acceso Aceptado");
        lcdMessage("     PASSWORD   ", "     CORRECT    ", lcd0);
        lcdMessage("     PASSWORD   ", "     CORRECT    ", lcd1);
        delay(1000);
    break;
    case INCORRECT_PASSWORD_DISPLAY: // muestra si la contraseña a sido incorrecta
        lcdMessage("     PASSWORD   ", "    INCORRECT   ", lcd0);
        lcdMessage("     PASSWORD   ", "    INCORRECT   ", lcd1);
        delay(1500);
        lcdMessage("    PLEASE TRY  ", "      AGAIN     ", lcd0);
        lcdMessage("    PLEASE TRY  ", "      AGAIN     ", lcd1);
        delay(1000);
        lcdMessage("     PASSWORD   ", "", lcd0);
        lcdMessage("     PASSWORD   ", "", lcd1);
    break;
    case SAVED_PASSWORD_DISPLAY: // muestra que la contraseña a sido guardada(en caso de cambio de contraseña)
        delay(500);
        lcdMessage("     PASSWORD   ", "      SAVED     ", lcd0);
        delay(1000);
        lcdMessage("     PASSWORD   ", "", lcd0);
    break;
    case REGISTED_PASSWORD_DISPLAY: // nos muestra la nueva contraseña que estamos registrando
        lcdMessage("    PASSWORD   ", keypad_value, lcd0);
    break;
    case PASSWORD_SENT_TO_WEB_DISPLAY: // nos muestra nuestra contraseña
        lcdMessage("    PASSWORD   ","   SENT TO WEB  ", lcd0);
        lcdMessage("    PASSWORD   ","   SENT TO WEB  ", lcd1);
        delay(1000);
    break;
    case ALARM_ON_DISPLAY: // muestra que se ha prendido la alarma
        lcdMessage("    ALARM ON    ", "", lcd0);
        lcdMessage("    ALARM ON    ", "", lcd1);
    break;
    case ALARM_OFF_DISPLAY: // muestra que se ha desactivado la alarma
        lcdMessage("     ALARM OFF  ", "", lcd0);
        lcdMessage("     ALARM OFF  ", "", lcd1);
    break;
    case SCREEN_CLEAN_DISPLAY: // limpia la pantalla
        lcdMessage("     PASSWORD   ", "", lcd0);
        lcdMessage("     PASSWORD   ", "", lcd1);
    break;
    case LOCK_OFF_DISPLAY: // muestra que se ha apagado el cerrojo
        lcdMessage("    OPEN LOCK   ", "", lcd0);
        lcdMessage("    OPEN LOCK   ", "", lcd1);
    break;
    case LOCK_ON_DISPLAY: // muestra que se ha prendido el cerrojo
        lcdMessage("   CLOSED LOCK  ", "", lcd0);
        lcdMessage("   CLOSED LOCK  ", "", lcd1);
    break;
    case WIFI_NETWORK_SET_UP_DISPLAY: // muestra que nos el modo configuracion de red ha finalizado
        lcdMessage("  Wi-Fi NETWORK ", "      SAVED     ", lcd0);
        delay(1500);
        lcdMessage(" Wi-Fi PASSWORD ", "      SAVED     ", lcd0);
        delay(1500);
        lcdMessage(wifi.ssid,wifi.password, lcd0);
        // Primer argumento: nos muestra la red wifi registrada
        // Segundo argumento: mos muestra la contraseña de red registrada
    break;
    case SYSTEM_LOCKED_OUT_DISPLAY: // muestra que se ha bloqueado el dispositivo
        lcdMessage("     SYSTEM     ", "   LOCKED OUT   ", lcd0);
        lcdMessage("     SYSTEM     ", "   LOCKED OUT   ", lcd1);
        delay(1000);
        lcdMessage("   PLEASE WAIT  ", "     " + String(retraso_bloqueo / 1000)+" MIN", lcd0);
        lcdMessage("   PLEASE WAIT  ", "     " + String(retraso_bloqueo / 1000)+" MIN", lcd1);
        delay(retraso_bloqueo);
        lcdMessage("    PASSWORD    ", "", lcd0);
        lcdMessage("    PASSWORD    ", "", lcd1);
        temp2 = millis(); // iniciamos ciclo de inactividad del dispositivo
    break;
    case CARD_DETECTED_DISPLAY: // Nos dice que la tarjeta ha sido detectada
        lcdMessage(" CARD  DETECTED ", "", lcd0);
        lcdMessage(" CARD  DETECTED ", "", lcd1);
        delay(1000);
    break;
    case ACCESS_DENIED_DISPLAY: // Nos dice que no se ha permitido el acceso por la tarjeta
        delay(1000);
        lcdMessage(" ACCESS  DENIED ", "", lcd0);
        lcdMessage(" ACCESS  DENIED ", "", lcd1);
    break;
    case ACCESS_ACCEPTED_DISPLAY: // Nos dice si el acceso ha sido permitido por la tarjeta
        delay(1500);
        lcdMessage("ACCESS  ACCEPTED", "", lcd0);
        lcdMessage("ACCESS  ACCEPTED", "", lcd1);
        delay(1500);
        //lcdMessage("    WELCOME    " + String(fila), NAME, lcd);  //(FALTA) ubicar quien es, con la estrucutra rfid_cards[]
        //lcdMessage("    WELCOME    " + String(fila), NAME, lcd0);
        delay(1000);
    break;
    case CARD_NAME_EDIT_ENABLED_DISPLAY: // Inserta el numero de la tarjeta y el nombre/se va a ocupar para el nombre que tiene ahora y el que tiene despues en bluetooth
        //lcdMessage("  CARD NUMBER  ", "       " + String(RFIDNUMBRERS), lcd); //(FALTA) poner esto con el rfid_cards
    break;
    case NEW_CARD_NAME_SET_UP_DISABLED_DISPLAY: // Inserta el numero de la tarjeta y el nombre/se va a ocupar para el nombre que tiene ahora y el que tiene despues en bluetooth
        //lcdMessage(" NAME SAVED IN ", "CARD NUMBER  " + String(RFIDNUMBRER), lcd0); //(FALTA) poner esto con el rfid_cards
        delay(2000);
        //lcdMessage(String(NAME), "", lcd0);    //(FALTA) poner esto con el rfid_cards
        delay(2000);
        lcdMessage("    PASSWORD    ", "", lcd0);
        lcdMessage("    PASSWORD    ", "", lcd1);
    break;
    case ADD_CARD_ENABLED_DISPLAY: // Informa que el modo de cambio de nombre de tarjeta a sido activado  (FALTA) se va a retirar
        lcdMessage("    ADD CARD    ", "     ENABLED    ", lcd0);
        delay(2000);
        lcdMessage("  PLEASE TYPE   ", "    NEW CARD    ", lcd0);
        delay(2000);
        //lcdMessage("  CARD NAME " + String(RFIDNUMBRERS), String(NAME), lcd); 
    break;
    case ADD_CARD_DISABLED_DISPLAY: // Informa que el modo de cambio de nombre de tarjeta a sido activado
        lcdMessage("    ADD CARD    ", "    DISABLED    ", lcd0);
        delay(2000);
        //(FALTA) lcdMessage(" CARD SAVED IN  ", " THE POSITION " + String(RFIDNUMBRER), lcd);
        delay(2000);
        lcdMessage("    PASSWORD    ", "", lcd0);
        lcdMessage("    PASSWORD    ", "", lcd1);;
        delay(2000);
    break;
    case CARD_TAPPED_SAVED_DISPLAY: // Informa que el modo de cambio de nombre de tarjeta a sido activado
        lcdMessage("    NEW CARD    ", "   REGISTERED   ", lcd0);
        delay(2000);
        lcdMessage("    PASSWORD    ", "", lcd0);
        lcdMessage("    PASSWORD    ", "", lcd1);;
        delay(2000);
    break;
    case CARD_TAPPED_EXISTENT_DISPLAY:
        delay(1000);
        lcdMessage(" CARD TAPED     ", "    EXISTENT    ", lcd0);
        delay(2000);
        lcdMessage("  CARD NUMBER " + String(fila), "", lcd0);
        delay(2000);
        lcdMessage("     TAP NEW    ", "      CARD      ", lcd0);
        delay(2000);
        lcdMessage("    NEW CARD    ", "", lcd0);
    break;
    case DEVICE_UNLOCKED_DISPLAY: // muestra que se ha apagado el cerrojo
        lcdMessage("    UNLOCKED    ", "", lcd0);
        lcdMessage("    UNLOCKED    ", "", lcd1);
    break;
    case TRANSMISION_SSEM_ERROR:
        lcdMessage("  TRANSMISSION  ", " SSEM LA ERROR  ", lcd0);
    break;
    case RESTORE_TO_DEFAULT_SETTING_DISPLAY:
        lcdMessage(" DEVICE DELETED ", "   TO ACCOUNT   ", lcd0);
        delay(1500);
        lcdMessage("  RESTORE   TO  ", " DEFAULT ENABLED", lcd0);
        delay(1500);
    break;
    default:

    break;
    }
}
