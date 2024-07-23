#include<ESP8266WiFi.h>//libreria para que el ESP8266 tenga WiFi
#include<espnow.h>//libreria para que podamos ocupar el ESPNOW
#include<EEPROM.h>
#include <SoftwareSerial.h>//libreria que hace que dos GPIO´s funcionen como RX y TX respectivamente para poder manejar comunicacion serial
#define MY_NAME "SLAVE_MODE"//Nombre del dispositivo
#define alarma_1 14//pin donde esta conectado el rele de la alarma
#define cerrojo_1 16//pin donde esta conectado el rele del cerrojo
#define boton_cr 12//boton que nos permitira entrar a la configuracion de red
#define EEPROM_SIZE 110
#define RSTLECTURE 105//lugar de memoria donde se lee si vamos a regresar a valores de fabrica o no
#define limWFI 0//espacio del 0 al 50 donde escribe el nombre de la red
#define limWifi 51//espacio de memoria donde escribe la longitud del nombre de la red
#define limPwifi 52//espacio de memoria donde escribimos la longitud de la contraseña de red
#define limPWFI 53//espacio del 90 al 139 donde escribe la contraseña de red
#define señal 0//para el led indicativo en la PCB que nos indicara: 1.Que se entro a configuracion de red 2. que se envio datos por ESPNOW correctamente
//Estructura que debe coincidir con la estructura del receptor
typedef struct struct_message {
    int alarma1;
  int cerrojo1;
} struct_message;
struct_message incomingReadings;//estructura de mensajes llamado incomingReadings
bool ALR=0;//variable bool para que entre una vez a un if determinado
bool CRJ=0;//variable bool para que entre una vez a un if determinado
bool visor=true;
bool conexion=false;
bool estado=0;//variable para que entre solo una vez a prender la alarma despues de 3 minutos que no reciba nada de SSEM
bool BTMODE=0;
byte alarma_2=6;//variable que se va a modificar para las acciones de la alarma
byte cerrojo_2=10;//variable que se va a modificar para las acciones del cerrojo
byte l_wifi=0;                //longitud de la red
byte l_wifipsw=0;             //longitud de la contraseña
byte cambio_red=0; 
byte cwifi=0;
unsigned long aux1;//variable long para en tiempo de actividad del SSEM, si pasa los 3 minutos sin enviar datos el dispositivo prendera la alarma en automatico
const char* SSID_1 ="";       //licencia red
const char* SSID_PASSWORD="";
String wifi="";               //Almacena la red temporalmente
String wifipsw="";            //Almacena la contraseña de la red temporalmente
String DATOS="";
//STRINGS CONFIGURABLES POR EL USUARIO
String SEGURIDAD="SSEMLASYSTEM2022";
String ENDBT="OFFSSEMLA";
String DOPEN="DOOROPEN";
/*
 Es necesario que ambos dispositivos, tanto el SSEM como el SSEM LA tengan la misma red debido a que la comunicacion falla si no esta asi,
 esto debido a que se utilizan canales o Channels en la red, la red tiene un canal especifico y si no coinciden la comunicacion por ESPNOW falla.
 */
int32_t getWiFiChannel(const char *ssid) {//funcion que nos permite saber el canal de la red que esta conectado SSEM
  if (int32_t n = WiFi.scanNetworks()) {
    for (uint8_t i=0; i<n; i++) {
      if (!strcmp(ssid, WiFi.SSID(i).c_str())) {
        return WiFi.channel(i);
      }
    }
  }
  return 0;
}
//funcion que se ejecutara cuando data es recibida
void OnDataRecv(uint8_t * mac_addr, uint8_t *incomingData, uint8_t len) { //esfa funcion recibe la direccion MAC del dispositivo que le mando datos, la data, y el tamaño de esta
  char macStr[18];//char que almacenara la direccion MAC del dispositivo que esta mandando datos
  Serial.print("Datos recibidos de: ");
  snprintf(macStr, sizeof(macStr), "%02x:%02x:%02x:%02x:%02x:%02x",//funcion que se encarga de decoficar la direccion MAC
           mac_addr[0], mac_addr[1], mac_addr[2], mac_addr[3], mac_addr[4], mac_addr[5]);
  Serial.println(macStr);
  memcpy(&incomingReadings, incomingData, sizeof(incomingReadings));//funcion que decodifica los datos que se han recibido
  Serial.print("alarma: ");
  Serial.println(incomingReadings.alarma1);
  alarma_2=incomingReadings.alarma1;//alamacenamos lo que recibimos de alarma1  en alarma_2
  Serial.print("cerrojo: ");
  Serial.println(incomingReadings.cerrojo1);
  cerrojo_2=incomingReadings.cerrojo1;//alamacenamos lo que recibimos de cerrojo1  en cerrojo_2
}
SoftwareSerial miBT(4,2);//creamos objeto para simular la comunicacion serial por dos pines del microcontrolador no predefinidos para eso
void setup() {
  Serial.begin(115200);//Inicializamos la comunicacion por monitor serial(115200 baudios)
  EEPROM.begin(EEPROM_SIZE);
  miBT.begin(9600);//iniciamos la comunicacion Serial para el modulo HC-05
  pinMode(alarma_1,OUTPUT);
  pinMode(cerrojo_1,OUTPUT);
  //pinMode(señal,OUTPUT);
  pinMode(boton_cr,INPUT);
  digitalWrite(cerrojo_1,LOW);
  digitalWrite(alarma_1,LOW);
  Serial.println("INICIALIZANDO");
  delay(3000);
  if(digitalRead(boton_cr)==1){//si se presiona en un inicio entramos en modo configuracion de RED
    delay(50);
    cambio_red=1;
    for(int i=0;i<4;i++){
      delay(200);
      digitalWrite(alarma_1,HIGH);
      delay(200);
      digitalWrite(alarma_1,LOW);
    }
  }
  if(cambio_red==0){ //si no se presiona iniciamos normal
    Serial.println("Iniciando la conexion");
    READEEPROMWIFI();//leemos todos los datos que necesitamos de la EEPROM
    CONVERTER();//convertimos el String a const char*
    Serial.println("WiFi connected");
    Serial.println("Inicializando...");
    Serial.print("My direccion MAC es:");
    Serial.println(WiFi.macAddress());
    WiFi.mode(WIFI_STA);//definimos al dispositivo como Estacion
    int32_t channel = getWiFiChannel(SSID_1);//almacenamos el canal de la red donde esta conectado SSEM en channel
    WiFi.printDiag(Serial);
    wifi_promiscuous_enable(1);
    wifi_set_channel(channel);
    wifi_promiscuous_enable(0);
    WiFi.printDiag(Serial);
    WiFi.begin(SSID_1, SSID_PASSWORD);
    ///*
    while((WiFi.status()!=WL_CONNECTED)and(cwifi<100)) {
      delay(200);
      Serial.print(cwifi);
      Serial.println(".");
      cwifi++;
    }
    if(cwifi>99){
      Serial.println("Conexion fallida, inicio del sistema sin conexion");
      cambio_red=5;
      cwifi=0;
      for(int i=0;i<=5;i++){
        delay(500);
        digitalWrite(alarma_1,HIGH);
        delay(500);
        digitalWrite(alarma_1,LOW);
      }
      WiFi.printDiag(Serial);
      wifi_promiscuous_enable(1);
      wifi_set_channel(1);
      wifi_promiscuous_enable(0);
      WiFi.printDiag(Serial);
    }
    else{
        Serial.println("Conexion exitosa");
        Serial.print("Conexion exitosa tu direccion IP es: ");
        Serial.println(WiFi.localIP());
        Serial.print("Wi-Fi Channel: ");
        Serial.println(WiFi.channel());//imprimimos el canal que asigna la red(importante que ambos dispositivos tengan el mismo canal)
        cwifi=0;
        cambio_red=0;
    }
    if(esp_now_init() !=0)//verificamos que la comunicacion ESPNOW se inicie bien
    {
      Serial.println("ESP-NOW inicializacion fallida");
      return;
    }
    esp_now_register_recv_cb(OnDataRecv);//Esta funcion es llamada una vez se reciba datos
    Serial.println("Inicializado");
  }
  else if(cambio_red==1){//si se presiono el boton para el cambio de red nos mostrara el mensaje y ahora la variable vale 2
    Serial.println("Cambio de red activo porfavor inserte red");
    cambio_red=2;
  }
}

void loop() {
  DOOR_ALR();
  SYSTEM();
  BLUETOOTH();
}
void SYSTEM(){
  if((digitalRead(boton_cr)==1)and((cambio_red==3)or(cambio_red==2))){//se va a presionar el boton para que guardemos red y wifi en EEPROM
    delay(50);
    while(digitalRead(boton_cr)==1);
    if(cambio_red==3){//cuando se presiona el boton ya debimos haber enviar la red por bluetooth, de lo contrario no se guardara nada
      l_wifipsw=wifipsw.length();
      Serial.println("...");
      Serial.println("Iniciando guardado en EEPROM");
      Serial.print("la longitud de la red es ");
      Serial.println(l_wifi);
      Serial.print("La red es: ");
      Serial.println(wifi);
      Serial.print("la longitud de la contraseña de red es ");
      Serial.println(l_wifipsw);
      Serial.print("La contraseña de red es: ");
      Serial.println(wifipsw);
      Serial.println("Reiniciando dispositivo");
      CONVERTER();
      Serial.print("El valor de SSID_1 es: ");
      Serial.println(SSID_1);
      Serial.print("El valor de SSID_PASSWORD es:");
      Serial.println(SSID_PASSWORD);
      WRITEEEPROMWIFI();//escribe en EEPROM
      cambio_red=0;
      for(int i=0;i<5;i++){
        digitalWrite(alarma_1,HIGH);
        delay(500);
        digitalWrite(alarma_1,LOW);
        delay(500);
      }
      ESP.restart();
    }
    if(cambio_red==2){//cuando se presiona el boton ya debimos haber enviar la red por bluetooth, de lo contrario no se guardara nada
      l_wifi=wifi.length();
      Serial.println("...");
      Serial.println("RED WIFI Recibida");
      Serial.print("la longitud de la red es ");
      Serial.println(l_wifi);
      Serial.print("La red es: ");
      Serial.println(wifi);
      Serial.println("Reiniciando dispositivo");
      cambio_red++;
    }
  }
}
void BLUETOOTH(){//funcion dedicada al bluetooth
  while(miBT.available()){//bucle con el proposito de recibir la cadena de caracteres
    char dato;
    dato=miBT.read();
    Serial.print(dato);
    if(dato=='\r'){//si recibimos esto el while continua, donde referencia a que es una cadena de caracteres
      conexion=false;
      continue;
    }
    else if(dato=='\n'){//si se recibe esto salimos del while, la cadena de caracteres finalizo
      conexion=true;
    break;
    }
    else{
      DATOS=DATOS+dato;
    } 
  }
  if(conexion==true){
    Serial.println();
    if(cambio_red==0){
      if(DATOS==SEGURIDAD){
        Serial.println("ACTIVANDO SISTEMA POR APERTURA BLUETOOTH");
        BTMODE=1;
      }
      if((DATOS==DOPEN)and(BTMODE==1)){
        Serial.println("ABRIENDO PUERTA POR BLUETOOTH");
        cerrojo_2=5;
      }
      if((DATOS==ENDBT)and(BTMODE==1)){
        Serial.println("DESACTIVANDO SISTEMA POR APERTURA BLUETOOTH");
        BTMODE=0;
      }
    } 
    if(cambio_red==2){
      if(DATOS=="ERROR"){
        Serial.println("Señal Bluetooth falsa, reiniciando valores");
      }
      else{
        wifi=DATOS;
        Serial.println("Red WIFI recibida");
        digitalWrite(alarma_1,HIGH);
        delay(1000);
        digitalWrite(alarma_1,LOW);
      } 
    }
    if(cambio_red==3){
      wifipsw=DATOS;
      Serial.println("Contraseña de Red WIFI recibida");
      digitalWrite(alarma_1,HIGH);
      delay(1000);
      digitalWrite(alarma_1,LOW);
    }
    conexion=false;
    DATOS="";
  }
}
void DOOR_ALR(){
  if(cambio_red==0){
    if((alarma_2==1)and(ALR==0)){//si vale 1 prendemos la alarma(el dispositivo maneja logica inversa)
      digitalWrite(alarma_1,HIGH);
      ALR=1;
      alarma_2=6;
    }
    else if((alarma_2==0)and(ALR==1)){//si vale 0 apagamos la alarma
      digitalWrite(alarma_1,LOW);
      ALR=0;
      alarma_2=6;
    }
    else if(alarma_2==5){//si vale 5 es porque el dispositivo SSEM esta conectado
      aux1=millis();
      Serial.println("SSEM CONECTADO");
      alarma_2=6;
      estado=0;
    }
    if((cerrojo_2==1)and(CRJ==0)){//si vale 1 prendemos el cerrojo
      digitalWrite(cerrojo_1,HIGH);
      CRJ=1;
    }
    else if((cerrojo_2==0)and(CRJ==1)){//si vale 0 apagamos el cerrojo
      digitalWrite(cerrojo_1,LOW);
      CRJ=0;
    }
    else if(cerrojo_2==5){//si vale 5 iniciamos ciclo temporizado de apertura
      Serial.println("CERROJO TEMPORIZADO INICIADO");
      digitalWrite(cerrojo_1,HIGH);
      delay(3000);
      digitalWrite(cerrojo_1,LOW);
      cerrojo_2=6;   
    }
    if((millis()-aux1>=60000)and(estado==0)){//si no se han recibido datos en 3 minutos el dispositivo SSEM se desconecto
      digitalWrite(alarma_1,HIGH);
      estado=1;
      Serial.println("SSEM DESCONECTADO, ACTIVANDO ALARMA");
    }
  }
}
void WRITEEEPROMWIFI(){ //funcion encargada de escribir en los espacios de memoria de la EEPROM la contraseña WIFI y el nombre de la RED
    Serial.println("Escribiendo la red en EEPROM:");
    char letra;
    for(int i=limWFI;i<=l_wifi-1;i++){//este for escirbe el nombre de la red en EEPROM del ESPACIO DE MEMORIA desde el byte 1 a 49max
      EEPROM.write(i,SSID_1[i]);
      EEPROM.commit();
      letra=EEPROM.read(i);    
      Serial.print(letra);
    }
    Serial.println();
    EEPROM.write(limWifi,l_wifi);//escribimos la longitud de la RED en espacio de memoria 51
    EEPROM.commit();
    Serial.println("Escribiendo la contraseña de red en EEPROM:");
    for(int j=limPWFI;j<=limPWFI+l_wifipsw-1;j++){
      EEPROM.write(j,SSID_PASSWORD[j-limPWFI]);
      EEPROM.commit();
      letra=EEPROM.read(j);    
      Serial.print(letra);
    }
    Serial.println();
    EEPROM.write(limPwifi,l_wifipsw);//escribimos la longitud de la RED en espacio de memoria 51
    EEPROM.commit();
    
}
//funcion que convierte el string a un const char*
void CONVERTER(){
    SSID_1=wifi.c_str();//transforma el string en un const char* para la red
    SSID_PASSWORD=wifipsw.c_str();//transforma el string a un const char para la contraseña de red
}
void READEEPROMWIFI(){
  char caracter;
  l_wifi=EEPROM.read(limWifi);//leo la longitud de la red, espacio de memoria 51 
  for(int j=limWFI;j<=l_wifi-1;j++){ //for que va a almacenar la red en un String
    caracter=EEPROM.read(j);//se almacena el caracter que se leyo desde la EEPROM
    wifi+=caracter;//pone el caracter leido en el String
  }
  Serial.print("La longitud de la red es:");//nos muestra todo lo recibido desde la EEPROM
  Serial.println(l_wifi);
  Serial.print("La red es:");
  Serial.println(wifi);
  l_wifipsw=EEPROM.read(limPwifi);
  for(int j=limPWFI;j<=limPWFI+l_wifipsw-1;j++){
    caracter=EEPROM.read(j);//se almacena el caracter que se leyo desde la EEPROM
    wifipsw+=caracter;//pone el caracter leido en el String
  }
  Serial.print("la longitud de la contraseña de red es ");
  Serial.println(l_wifipsw);
  Serial.print("La contraseña de red es: ");
  Serial.println(wifipsw);
}
