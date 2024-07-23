#include <Wire.h> //libreria para poder tener comunicacion I2C con los dispositivos
#include <ESP8266WiFi.h>
#include <ThingerESP8266.h>
//#include <LCD.h>//libreria para el bus de datos de la pantalla LCD para su correcto funcionamiento
#include <LiquidCrystal_I2C.h>//libreria que se encarga de poder comunicarSE con el expansor I2C de la pantalla LCD
#include <Keypad_I2C.h>//libreria que se encarga de poder comunicarse con el expansor I2C de el teclado 4x3
//#include <Keypad.h>//libreria que nos permite saber que tecla se ha presiona y definir los pines como entradas
#include <espnow.h>//libreria que nos permitira la comunicacion I2C con el dispositivo SSEM LA
#include <SoftwareSerial.h>//libreria que hace que dos GPIO´s funcionen como RX y TX respectivamente para poder manejar comunicacion serial
#include <MFRC522_I2C.h>
#define EEPROM_I2C_ADDRESS 0x50//definimos la direccion de EEPROM I2C
#define BOARD_ID 2
#define boton_cr 0//boton que nos permitira entrar a la configuracion de red
#define RST_PIN 14 // D5 Pin on NodeMCU
#define senal 12//para el led indicativo en la PCB que nos indicara: 1.Que se entro a configuracion de red 2. que se envio datos por ESPNOW correctamente
#define boton_dr 2
#define USERNAME "SSEM_SYSTEM"  //Nombre que tiene la cuenta en thinger.io
#define DEVICE_ID "SSEMSYSTEM"  //Nombre del dispositivo que tendra en la plataforma thinger.io
#define DEVICE_CREDENTIAL "R@g+J50yW8eSWf?W"//credencia para que el dispositivo sea identificado en nuestra cuenta thinger.io
#define RSTLECTURE 17//lugar de memoria donde se lee si vamos a regresar a valores de fabrica o no
#define limPos 28//numero de tarjetas maximas que se pueden registrar
#define limTag 160//espacio de memoria donde empieza a leer o escribir los digitos de la tarjeta
#define limPass 20//espacio de memoria que escribe la longitud de la contraseña habitual
#define limPSW 0//espacio de memoria que escruve la contraseña 0-15
#define limWifi 81//espacio de memoria donde escribe la longitud del nombre de la red
#define limWFI 30//espacio del 30 al 80 donde escribe el nombre de la red
#define limPwifi 82//espacio de memoria donde escribimos la longitud de la contraseña de red
#define limPWFI 90//espacio del 90 al 139 donde escribe la contraseña de red
#define limPcon 140//espacio que escrube la longutud de la contraseña de confirmacion
#define limPWC 141//espacio que escribe la contraseña de confimacion 141_146
#define limName 400//espacio de momeria donde empieza  escribir los nombre de las tarjeta 400-999
bool sta_buzzer;//encargada de activar la alarma
bool Mostrar_PSW;//variable modificada en thingerque iniciara el proceso para mostrar la contraseña o no
bool Mostrar_PSW2; 
bool oc_electroiman; //variable modificada en thinger que iniciara el proceso para activar a desactivar el electroiman
bool c_password;//Variable encargada en thinger para activar el cambio de contraseña
bool c_password2;
bool Reset;//encargada en thinger de reiniciar el sistema desde la aplicacion
bool visor=true;//variable encargada de decirme si la conexion a sido exitosa
bool conexion=false;//variable que se ocupa en bluetooth para poder salir del bucle while y poder mostrar mensajes una vez
bool Ralarma=0;//variable que me ayuda auxiliarmente a entrar a un if en un bucle while explusivamente una vez dependiendo de su estado
bool RFIDCNAME;
bool RFIDCCARD;
bool LED;
//bool RSTMODE=0;
uint8_t receiverAddress[] = {0x98, 0xCD, 0xAC, 0x32, 0x2D, 0xBB};// IMPORTANTE, SE TIENE QUE PONER LA DIRECCION MAC DEL DISPOSITIVO QUE DESEAMOS ENVIARLE DATOS 7C:87:CE:9C:65:13
String wifi="";//variable auxiliar que almacenara el nombre de la red
String wifipsw="";//variable auxiliar que almacenara la contraseña de la red
String NAME="";
String DATOS="";
String RFIDNUMBRERS="";
String mensaje="12345678910111213141516171819202122232425262728293031323334353637383940";
const byte lcdlong=16;
const char* SSID_PASSWORD="";//puntero const char* para crear el objeto de thinger.io(tendra la contraseña de red)
const char* SSID_1="";//puntero const char* para crear el objeto de thinger.io(tendra el nombre de red)
char password[lcdlong];//arreglo que almacenara contraseña que tiene el dispositivo
char password2[lcdlong];
char longitud[lcdlong];//arreglo que almacenara las teclas que vamos presionando
const byte ROWS = 4;// Indicamos cuantas lineas/filas tiene el teclado
const byte COLS = 3;// Indicamos cuantas columnas tiene el teclado
byte rowPins[ROWS] = {5,0,1,3};  // declaramos los pines para las filas
byte colPins[COLS] = {4,6,2};  // declaramos los pines para las columnas
const char KEYS[ROWS][COLS] = {// declaramos una matriz con las teclas del teclado para saber a que corresponden
{'1','2','3'},
{'4','5','6'},
{'7','8','9'},
{'*','0','#'}
}; 
byte limite=0;//variable que nos permite mover las posiciones de los arreglos y almacenas caracteres en este
byte t_password=0;//variable que almacenara la longitud de la contraseña
byte t_passwordconfirm=0;//variable que almacenara la longitud de la contraseña de confirmacion
byte l_wifi=0;//variable que almacenara la longitud de la red
byte l_wifipsw=0;//variable que almacenara la longitud de la contraseña de red
byte alarma_2;//variable que se modificara gracias a thinger.io para poder enviar por ESPNOW para activar o desactivar la alarma
byte cerrojo_2;//variable que se modificara gracias a thinger.io para poder enviar por ESPNOW para activar o desactivar el electroiman
byte change_password=0;//variable que dependiendo de su valor estaremos en el modo de operacion normal o en el modo de configuracion de contraseña
byte cambio_red;//variable que dependiendo de su valor estaremos en conectividad normal de red, o en etapas para el modo de configuracion de red 
byte bloqueo=0;//variable que se incrementara cada que se tenga la contraseña incorrecta
//byte cwifi=0;
byte espnow=0;
byte id_usuario[limPos][4];//variable que va a leer de la EEPROM el ID de las tarjetas
byte fila=0;
byte NAMEB;
byte retraso_bloqueo=0;//variable que aumentara para el retraso, dependiendo de el numero de intentos erroneos seguidos que tengamos esta aumentara
byte RFIDNUMBRER=0; 
unsigned long aux1;//variable auxiliar para poder hacer el truco de retrasos sin detener el programa 1
unsigned long aux2;//variable auxiliar para poder hacer el truco de retrasos sin detener el programa 2
unsigned long aux3;//variable auxiliar para poder hacer el truco de retrasos sin detener el programa 3
//long aux4;
//unsigned long aux5;
typedef struct struct_message {//Debe coincidir con la estructura del receptor
  int alarma1;
  int cerrojo1;
} struct_message;
struct_message myData;//Crear una estructura para mensaje
LiquidCrystal_I2C lcd(0x27,2,1,0,4,5,6,7); // indicamos la direccion y cuantos caracteres y lineas tiene nuestro lcd
LiquidCrystal_I2C lcd0(0x26,2,1,0,4,5,6,7);
Keypad_I2C teclado = Keypad_I2C( makeKeymap(KEYS), rowPins, colPins, ROWS, COLS, 0x20 ); // llamamos a la libreria del keypad y le pasamos los parámetros, creamos un objeto
ThingerESP8266 thing(USERNAME, DEVICE_ID, DEVICE_CREDENTIAL);//CREO OBJETO DE THINGER.IO donde le pasamos el nombre de usuario en thinger, el nombre del dispositivo y la credencia previamente definidas
SoftwareSerial miBT(13,15);//creamos objeto para simular la comunicacion serial por dos pines del microcontrolador no predefinidos para eso
MFRC522 mfrc522(0x28, RST_PIN);   // Create MFRC522 instance.
void setup() {
  Wire.begin();//iniciamos sistema para poder comunicarnos de manera serial
  Serial.begin(115200);//inicializo el monitor serial
   miBT.begin(9600);//iniciamos la comunicacion Serial para el modulo HC-05
  lcd.begin(0,lcdlong);
  lcd0.begin(0,lcdlong);
  mfrc522.PCD_Init();             // Init MFRC522
  teclado.begin();//inicializo el teclado I2C
  ShowReaderDetails();            // Show details of PCD - MFRC522 Card Reader details
  Serial.println(F("Scan PICC to see UID, type, and data blocks..."));
  lcd.setBacklightPin(3,POSITIVE);//prendo la luz de la pantalla
  lcd.setBacklight(HIGH);//prendo la luz de la pantalla
  lcd0.setBacklightPin(3,POSITIVE);//prendo la luz de la pantalla
  lcd0.setBacklight(HIGH);//prendo la luz de la pantalla
  pinMode(senal,OUTPUT);//defino el led azul de la PCB como salida
  pinMode(boton_dr,INPUT_PULLUP);//defino el led azul de la PCB como salida
  pinMode(boton_cr,INPUT_PULLUP);//defino el boton pulsador WIFI como INPUT_PULLUP para poder usar resistencias internas del microcontrolador
  //writeEEPROM(RSTLECTURE,1, EEPROM_I2C_ADDRESS);//DESCOMENTAR PARA RESTABLECER EL DISPOSITIVO
  READEEPROMSSEM();//leemos todos los datos que necesitamos de la EEPROM
  CONVERTER();//convettimos los string a const char*
  thing.add_wifi(SSID_1, SSID_PASSWORD);//ponemos los parametros de la red y contraseña de red para iniciar thinger
  Serial.print("Mi direccion MAC es: ");//imprimo mensaje en monitor serial
  Serial.println(WiFi.macAddress());//imprimo la direccion MAC del dispositivo
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("    WELCOME     ");
  lcd0.clear();
  lcd0.setCursor(0,0);
  lcd0.print("    WELCOME     ");
  cambio_red=0;
  delay(1500);
  if(digitalRead(boton_cr)==0){//si se presiona entramos en modo configuracion de RED
    delay(50);
    cambio_red=1;//cambio la variable a 1 para que no se conecte a red luego del void setup()
    change_password=250;//cambio a 2 por seguridad para que no se pueda usar el teclado en lo que estamos en este modo
    for(int i=0;i<=2;i++){
    delay(500);
    digitalWrite(senal,HIGH);
    delay(500);
    digitalWrite(senal,LOW);
    }
  }
  if(cambio_red==0){ //si no se presiona iniciamos el modo de operacion normal
    byte cwifi=0;
    change_password=0;//igualamos a 0 para que el teclado este en modo de operacion normal
    lcd.clear();
    lcd.setCursor(0,0);
    lcd.print(SSID_1);
    lcd.setCursor(0,1);
    lcd.print("  CONECTING...  ");
    digitalWrite(senal,HIGH);//prendo led azul de PCB como señalizacion para el inicio de conexion wifi
    Serial.println("Iniciando conexion a internet");
    WiFi.mode(WIFI_AP_STA);//ponemos al ESP8266 como punto de acceso y estacion(necesario para tener correcta comunicacion con ESP NOW)
    WiFi.begin(SSID_1, SSID_PASSWORD);
    while((WiFi.status()!=WL_CONNECTED)and(cwifi<100)) {
      delay(200);
      Serial.print(cwifi);
      Serial.println(".");
      cwifi++;
    }
    if(cwifi>99){
      Serial.println("Conexion fallida, inicio del sistema sin conexion");
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("   CONNECTION   ");
      lcd.setCursor(0,1);
      lcd.print("     FAILED     ");
      cambio_red=5;
      cwifi=0;
      for(int i=0;i<=5;i++){
        delay(500);
        digitalWrite(senal,HIGH);
        delay(500);
        digitalWrite(senal,LOW);
      }
    }
    else{
        lcd.clear();
        lcd.setCursor(0,0);
        lcd.print("   IP ADDRESS   ");
        lcd.setCursor(0,1);
        lcd.print(WiFi.localIP());//imprimimos la direccion IP por pantalla
        Serial.println("Conexion exitosa");
        Serial.print("Conexion exitosa tu direccion IP es: ");
        Serial.println(WiFi.localIP());
        Serial.print("Wi-Fi Channel: ");
        Serial.println(WiFi.channel());//imprimimos el canal que asigna la red(importante que ambos dispositivos tengan el mismo canal)
        cwifi=0;
        cambio_red=0;
    }
  }
  else if(cambio_red==1){// si se presiono el boton entramos en el modo de configuracion de red
    Serial.println("Cambio de Red activado");//imprimimos mensaje en monitor serial
    SYSTEM(32);//funcion que modificara variables y imprimira los mensajes necesarios en la pantalla como señalizacion
    cambio_red=2;//incrementamos la variable para que valga 2 y sea util para la configuracion de red
  }
  if(esp_now_init() != 0){//funcion encargada de inicializar el ESP NOW
    Serial.println("ESP-NOW inicializacion fallida");//imprimimos mensaje en monitor serial
    return;//retorna para no iniciar el programa por error
  }
  esp_now_set_self_role(ESP_NOW_ROLE_CONTROLLER);//le Asignamos el rol de controlador(el que envia)
  esp_now_register_send_cb(OnDataSent); //esta funcion siempre sera llamada cada que se envie el dato(sea correcto o erroneo el envio del dato)
  esp_now_add_peer(receiverAddress, ESP_NOW_ROLE_SLAVE, 1, NULL, 0);//le decimos a que dispositivos le queremos mandar el dato, el rol del otro dispositivo y el canal por el que se va a enviar
  Serial.println("Inicializado");
  thing["Ingreso"] >> outputValue("SSEM en servicio");//enviamos texto a thinger.io
  thing["Alarma"] << inputValue(sta_buzzer, {//recibe datos de thinger para activar la alarma, como es un boton recibimos o 1 o 0 y se guarda en la variable sta_buzzer
    //todo lo que esta adentro de estas llaves se ejecutara una vez despues de que se recibio el dato de thinger.io
    lcd.backlight();
    lcd.display();
    lcd0.backlight();
    lcd0.display();
    aux2=millis();//almacenamos millis en aux para iniciar ciclo de incatividad del dispositivo, si pasa 1 minuto inactivo la pantalla se apagara para ahorrar energia
    if(sta_buzzer==1){//si vale 1 iniciamos ciclo para prender alarma
      Serial.println("Se ha activado la alarma");
      SYSTEM(25);//funcion que modificara variables y imprimira los mensajes necesarios en la pantalla como señalizacion
      alarma_2=1;
    }
    else if(sta_buzzer==0){//si vale 0 iniciamos ciclo para apagar la alarma
      Serial.println("Se ha desactivado la alarma");
      SYSTEM(26);
      alarma_2=0;
    }
  });
  thing["Contraseña"] << inputValue(Mostrar_PSW, {//me permite visualizar la contraseña del dispositivo, 0 y 1 almacenado en Mostrar PSW
    String PASSW="";
    lcd.backlight();
    lcd.display();
    lcd0.backlight();
    lcd0.display();
    aux2=millis();
    if(Mostrar_PSW==1){// Si vale 1 mostramos la contraseña que tiene el dispositivo
      Serial.println("Se ha activado la opcion de mostrar contraseña");
      Serial.println("Mostrar contraseña al usuario");
      SYSTEM(23);
      for(int i=0;i<=t_password-1;i++){
        PASSW+=password[i];
        Serial.print(password[i]);
      }
      mensaje="La contraseña del dispositivo es "+PASSW;
      thing["Ingreso"] >> outputValue(mensaje);//enviamos texto a thinger.io
      Serial.println(mensaje);
    }
    else if(Mostrar_PSW==0){//si vale 0 no mostramos contraseña
      Serial.println("Se ha desactivado la opcion de mostrar contraseña");
      SYSTEM(29);
    }
  });
  thing["Contraseña de confirmacion"] << inputValue(Mostrar_PSW2, {//me permite visualizar la contraseña del dispositivo, 0 y 1 almacenado en Mostrar PSW
    String PASSW2="";
    lcd.backlight();
    lcd.display();
    lcd0.backlight();
    lcd0.display();
    aux2=millis();
    if(Mostrar_PSW2==1){// Si vale 1 mostramos la contraseña que tiene el dispositivo
      Serial.println("Se ha activado la opcion de mostrar contraseña de confirmacion");
      Serial.println("Mostrar contraseña de confirmacion al usuario");
      SYSTEM(61);
      for(int i=0;i<=t_passwordconfirm-1;i++){
        PASSW2+=password2[i];
        Serial.print(password2[i]);
      }
      mensaje="La contraseña de confirmacion del dispositivo es "+PASSW2;
      thing["Ingreso"] >> outputValue(mensaje);//enviamos texto a thinger.io
      Serial.println(mensaje);
    }
    else if(Mostrar_PSW2==0){//si vale 0 no mostramos contraseña
      Serial.println("Se ha desactivado la opcion de mostrar contraseña de confirmacion");
      SYSTEM(29);
    }
  });
  thing["Cerrojo"] << inputValue(oc_electroiman, {//me permite abrir la puerta sin necesidad de contraseña, 0 y 1 se almacena en oc_electroiman
    lcd.backlight();
    lcd.display();
    lcd0.backlight();
    lcd0.display();
    aux2=millis();
    if(oc_electroiman==1){//si vale 1 iniciamos ciclo para prender electroiman
      Serial.println("El cerrojo se abre");
      SYSTEM(30);
      cerrojo_2=1;
    }
    else if(oc_electroiman==0){//si vale 0 iniciamos ciclo para apagara electroiman
      Serial.println("El cerrojo se cierra");
      SYSTEM(31);
      cerrojo_2=0;
    }
  });
  thing["Nombre de Tarjeta"] << inputValue(RFIDCNAME, {//me permite cambiar el nombre del
    lcd.backlight();
    lcd.display();
    lcd0.backlight();
    lcd0.display();
    aux2=millis();
    if(RFIDCNAME==1){//si vale 1 iniciamos ciclo para prender electroiman
      Serial.println("Cambio de nombre de tarjeta activado");
      change_password=2;
      SYSTEM(40);
      NAME="";
    }
    else if(RFIDCNAME==0){
      Serial.println("Cambio de nombre de tarjeta desactivado nombres sin cambios");
      SYSTEM(48);
      RFIDNUMBRERS="";
      change_password=0;
      NAME="";
      RFIDNUMBRER=0;
      RFIDCNAME=0;
    }
  });
  thing["Nueva Tarjeta"] << inputValue(RFIDCCARD, {//me permite agregar una nueva tarjeta *agregar que se necesita una contraseña de verificacion
    lcd.backlight();
    lcd.display();
    lcd0.backlight();
    lcd0.display();
    aux2=millis();
    if(RFIDCCARD==1){//si vale 1 iniciamos
      Serial.println("Agregar nueva tarjeta activado");
      Serial.println("Insertar contraseña de confirmacion");
      change_password=4;//si vale cuatro es para que insertemos la contraseña de confirmacion de operacion
      SYSTEM(49);
      NAME="";
    }
    else if(RFIDCCARD==0){//si vale 0 cancelamos la operacion
      Serial.println("Agregar nueva tarjeta desactivado,sin cambios");
      SYSTEM(50);
      RFIDNUMBRERS="";
      change_password=0;//regresamos a la operacion habitual del teclado
      NAME="";
      RFIDNUMBRER=0;
      RFIDCCARD=0;
    }
  });
  thing["Cambiar Contraseña"] << inputValue(c_password, {//me permite iniciar el modo de configuracion de contraseña,0 y 1 se almacena en c_password
    lcd.backlight();
    lcd.display();
    aux2=millis();
    if(c_password==1){//si vale 1 iniciamos ciclo de cambio de contraseña,primero insertar contraseña de confirmacion para hacer la accion
      Serial.println("Se ha activado el cambio de contraseña");
      Serial.println("Insertar la contraseña de confirmacion para poder continuar con la operacion");
      change_password=4;
      limite=0;
      Serial.println(change_password);
      SYSTEM(22);
    }
    else if(c_password==0){
      Serial.println("Se han anulado los cambios");
      limite=0;
      change_password=0;
      SYSTEM(62);
    }
  });
  thing["Cambiar Contraseña de Confirmacion"] << inputValue(c_password2, {//me permite iniciar el modo de configuracion de contraseña,0 y 1 se almacena en c_password
    lcd.backlight();
    lcd.display();
    aux2=millis();
    if(c_password2==1){//si vale 1 iniciamos ciclo de cambio de contraseña
      Serial.println("Se ha activado el cambio de contraseña de confirmacion");
      Serial.println("Insertar la contraseña de confirmacion para poder continuar con la operacion");
      change_password=4;
      limite=0;
      Serial.println(change_password);
      SYSTEM(57);
    }
    else if(c_password2==0){
      Serial.println("Se han anulado los cambios");
      limite=0;
      change_password=0;
      SYSTEM(63);
    }
  });
  thing["Reiniciar"] << inputValue(Reset, {//me permite reiniciar el dispositivo desde thinger 0 y 1 se almacenan en Reset
    if(Reset==1){//si vale uno resetamos el ESP8266
      ESP.restart();
    }
  });
  aux2=millis();//iniciamos ciclo de inactividad del dispositivo
  aux3=millis();//iniciamos ciclo para enviar datos a SSEM LA, como sistema de seguridad cada 2 minutos se enviaran datos a 
                //SSEM LA como seguridad, si no se envia un dato en cierto tiempo, en este caso 3 minutos sonara la alarma automaticamente
  //aux4=millis();
}
void loop(){//ciclo infinito
  SSEMSYSTEM();//funcion encargada de la conexion a thinger y del modo de configuracion de red
  BLUETOOTH();//funcion encargada de recibir los datos del bluetooth
  RFID();
  ESP_NOW_CONTROLL();
}
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
//funcion encargada de la conexion normal a thinger y una parte del modo de configuracion de red
void SSEMSYSTEM()
{
  char tecla= teclado.getKey(); //leemos la tecla que se pulsa ( si se pulsa alguna )
  if(tecla){ //entra a este if si se crea la variable tipo char key(solo se crea si se presiono la tecla){
    MODE_KEYPAD(tecla);
  }
  if(cambio_red==0){//si vale 0 iniciamos normal para conectar a thinger
    thing.handle(); //funcion que se encarga de todo en thinger
    if(visor==true){ //si la conexion fue exitosa avanzara a este if, si no estara en un bucle y iniciara incorrectamente
      SYSTEM(29);
      Serial.print("Conexion exitosa tu direccion IP es: ");
      Serial.println(WiFi.localIP());
      Serial.print("Wi-Fi Channel: ");
      Serial.println(WiFi.channel());//imprimimos el canal que asigna la red(importante que ambos dispositivos tengan el mismo canal)
      digitalWrite(senal,LOW);
      lcd.backlight();
      lcd.display();
      lcd0.backlight();
      lcd0.display();
      aux2=millis();
      visor=false;//cambiamos a 0 para que no entremos otra vez a este if, como esta en el bucle infinito es por seguridad y solo entre 1 vez a este if
    }
  }
  if(digitalRead(boton_dr)==0){
    delay(50);
    while(digitalRead(boton_dr)==0);
    lcd.backlight();
    lcd.display();
    lcd0.backlight();
    lcd0.display();
    aux2=millis();
    Serial.println("Puerta abierta por boton");  
    limite=0;
    bloqueo=0;
    retraso_bloqueo=0;
    SYSTEM(60);
    alarma_2=0;
    cerrojo_2=4;
  }
  /*
  if((digitalRead(boton_cr)==0)and(cambio_red==0)){
    Serial.println("Boton presionado para entrar a restablecer el dispositivo activado");
    delay(50);//retraso del programar para antirrebote
    digitalWrite(senal,HIGH);
    while(digitalRead(boton_cr)==0);//while , hasta que se deje de presionar ejecutara lo que sigue del programa
    cwifi++;
    aux3=millis();
    Serial.print("El valor de RSTBT es:");
    Serial.println(cwifi);
    digitalWrite(senal,LOW);
  }
  */
  if((digitalRead(boton_cr)==0)and(cambio_red!=0)){//si se ha presionado el boton
                                                   ///y cambio_red es diferente de 0 entramos al if, cambio_red la unica manera 
                                                   //de cambiar su valor es directamente en el void setup dejando presionado el boton para que valga 2
    delay(50);//retraso del programar para antirrebote
    while(digitalRead(boton_cr)==0);//while , hasta que se deje de presionar ejecutara lo que sigue del programa
    lcd.backlight();
    lcd.display();
    aux2=millis();
    if(cambio_red==3){//si vale 3 es porque ya adicionamos la red wifi y la contraseña de esta(colocamos primero el valor de 3 porque en la otra funcion lo incrementa)
      Serial.println();
      Serial.println("Red y contraseña guardadas");
      CONVERTER();//convertimos string a const char*
      if((l_wifi<=50)and(l_wifipsw<=50)){//SI ES MENOR DE 50 CARACTERES TANTO EL WIFI COMO LA CONTRASEÑA WIFI LO ESCRIBIREMOS EN EEPROM
        WRITEEEPROMWIFI();//funcion encargada de escribir todos los datos en la memoria EEPROM(espacios ocupados 0-130)
        SYSTEM(34);
        cambio_red=0;//reiniciamos variable que se modificaron al entrar en el modo de configuracion de red
        change_password=0;//reiniciamos variable que se modificaron al entrar en el modo de configuracion de red
        for(int i=0;i<=5;i++){
        digitalWrite(senal,LOW);
        delay(200);
        digitalWrite(senal,HIGH);
        delay(200);
        }  
        ESP.restart();//reiniciamos el dispositivo 
      }
      else{
        Serial.println("No se puede escribir red y contraseña en EEPROM,nombre de red y contraseña demasiado largos");
        SYSTEM(39);
      } 
    }
    else if(cambio_red==2){//si vale 2 es porque ya registramos la red wifi
      Serial.println();
      Serial.println("RED WIFI GUARDADA");
      Serial.println("Insertar ahora la contraseña");
      SYSTEM(33);
      cambio_red=3;//incrementamos para que valga 3 y ya no entre a este if y entre al de arriba

    }
  }
  if((millis()-aux1>=1000)and(LED==1)){//si han pasado 1 segundo despues de almacenar millis en aux1 entra a este if
    digitalWrite(senal,LOW);
    LED=0;
  }
  if(millis()-aux2>=60000){// si han pasado 60 segundos despues de almacenar millis en aux2 entra a este if(apaga la pantalla)
    lcd.noDisplay();
    lcd.noBacklight();
    lcd0.noDisplay();
    lcd0.noBacklight();
    aux2=millis();
  }
  if((millis()-aux3>=30000)and(Ralarma==0)){// si han pasado 120 segundos despues de almacenar millis en aux3 entra a este if
    Ralarma=1;//Variable de seguridad para mostrar datos una sola vez
    alarma_2=5;//cambiamos a 5 para que iniciamos ciclo de envio a SSEM LA el dato 5
  }
  /*
  if((millis()-aux3>=10000)and(RSTMODE==0)and(cwifi!=0)){
    if(cwifi==5){
      Serial.println("Iniciando modo de reinicio del dispositivo, regresando a los valores de fabrica");
      Serial.println("Insertar la contraseña de confirmacion para poder continuar con la operacion");
      change_password=4;
      limite=0;
      SYSTEM(67);
      RSTMODE=1;
    }
    else{
      Serial.println("Sin cambios");
    }
    cwifi=0;
  }
   if((millis()-aux3>=10000)and(RSTMODE==1)and(cwifi!=0)){
    if(cwifi==8){
      Serial.println("Reseteo de fabrica deshabilitado");
      Serial.println("Reinicio del dispositivo desactivado");
      limite=0;
      change_password=0;
      RSTMODE=0;
      SYSTEM(68);
    }
    else{
      Serial.println("Sin cambios");
    }
    cwifi=0;
  } 
  */
}
//funcion encargada de recopilar lo que se recibe por bluetooth
void BLUETOOTH()
{
  char dato;
  while(miBT.available()>0){//si es mayor a 0 significa que estamos recibiendo datos por serial, lo hacemos en un bucle while 
                           //porque lo que recibimos es una cadena de caracteres no unicamente es un caracter
    dato=miBT.read();//almacenamos lo que leyo por el puerto serial y lo almacenamos en el char dato
    Serial.print(dato);//imprimimos variable por monitor serial
    if(dato=='\r'){//si despues del caracter recibido aparece \r significa que todavia faltan caracteres por lo que seguira en el bucle while
      conexion=false;
      continue;//continua con el bucle while
    }
    else if(dato=='\n'){//si despues del caracter recibido aparece \n significa que se ha terminado de enviar la cadena de caracteres
      conexion=true;//cambiamos variable a true para que no se encuentren confunciones y se haga una confesion inecesaria
    break;//salimos del bucle while
    }
    else{
      if((cambio_red!=0)or(change_password==3)){//si cambio_red es diferente de 0 estamos en el modo de configuracion de red (este if es por seguridad en caso de que no estemos en este modo de configuracion no se almacenaran datos en el String DATOS)
        DATOS+=dato;//vamos haciendo un string adicionandole caracter por caracter hasta formar una palabra
      }
    } 
  }
  if((cambio_red!=0)and(conexion==true)and(DATOS!="ERROR")){
    lcd.backlight();
    lcd.display();
    aux2=millis();
    if(cambio_red==2){//si apenas vamos a enviarle la red wifi entrara en este if una vez para que imprimamos mensaje por la pantalla
      wifi=DATOS;//igualamos el string wifi con DATOS para guardar la red wifi que se recibio por bluetooth
      l_wifi=wifi.length();//optenemos el tama;o de la red wifi
      Serial.println("Red WIFI recibida");
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("  WiFi NETWORK  ");
      lcd.setCursor(0,1);
      lcd.print("    RECEIVED    ");//imprimimos que la RED WIFI ha sido recibida
      delay(750);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("  WiFi NETWORK  ");
      lcd.setCursor(0,1);
      lcd.print(wifi);//imprimimos la red wifi
    }
    if(cambio_red==3){//si ya le enviamos la contraseña de red wifi entrara a este if para que imprimamos mensaje por pantalla
      wifipsw=DATOS;//igualamos el string que almacenara la contraseña de red temporalmente a el otro string DATOS que recibio la cadena de caracteres por bluetooth
      l_wifipsw=wifipsw.length();//vemos de que longitud es el string
      Serial.println("Contraseña WIFI recibida");
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("  WiFi PASSWORD ");
      lcd.setCursor(0,1);
      lcd.print("    RECEIVED    ");//imprimimos por pantalla que ha sido recibido la contraseña
      delay(750);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("  WiFi PASSWORD ");
      lcd.setCursor(0,1);
      lcd.print(wifipsw);//imprimimos la contraseña de red wifi
    }
    DATOS="";//reiniciamos el string auxiliar para el bluetooth
    conexion=false;//cambiamos a 1 para que no entre a este if otra vez
    digitalWrite(senal,HIGH);//prendemos el led azul de la PCB
  }
  if((change_password==3)and(conexion==true)){//mostrara el nuevo nombre que deseamos ponerle a alguna tarjeta
      NAME=DATOS;
      SYSTEM(42);
      DATOS="";
      conexion=false;
      digitalWrite(senal,HIGH);//prendemos el led azul de la PCB
  }
}
//funcion que lee los datos necesario de la memoria EEPROM para que el sistema funcione correctamente
void READEEPROMSSEM(){
  bool RSTACTIVE;
  RSTACTIVE=readEEPROM(RSTLECTURE, EEPROM_I2C_ADDRESS);
  if(RSTACTIVE==0){
    Serial.println("Iniciando Lectura normal de datos");
    t_password=readEEPROM(limPass, EEPROM_I2C_ADDRESS);//leemos la longitud de contraseña y lo almacenamos en t_password
    l_wifi=readEEPROM(limWifi, EEPROM_I2C_ADDRESS);//leemos la longitud de red wifi y lo almacenamos en l_wifi
    l_wifipsw=readEEPROM(limPwifi, EEPROM_I2C_ADDRESS);//leemos la longitud de la contraseña wifi y la almacenamos en l_wifipsw
    t_passwordconfirm=readEEPROM(limPcon,EEPROM_I2C_ADDRESS);//leemos la longitud de la contraseña de confirmacion
    //(ESTAS PRIMERAS LECTURAS SON IMPORTANTES PARA QUE EN LOS CICLOS FOR DE ABAJO LEA UNICAMENTE LO QUE NECESITA)
    Serial.print("la longitud de tu contraseña es:");
    Serial.println(t_password);
    Serial.println("Tu contraseña guardada es:");
    for(int i=limPSW;i<=t_password-1;i++){ //for que me va a mostrar la contraseña y la va a almacenar en password[]
      char caracter=readEEPROM(i, EEPROM_I2C_ADDRESS);//se almacena el caracter que se leyo desde la EEPROM
      password[i]=caracter;//pone el caracter leido en una posicion de la variable password
      Serial.print(password[i]);//nos muestra la contraseña
    }
    Serial.println();
    Serial.print("la longitud de tu contraseña de confirmacion es:");
    Serial.println(t_passwordconfirm);
    Serial.println("La contraseña de confirmacion es:");
    for(int w=limPWC;w<=limPWC+t_passwordconfirm-1;w++){
      char lectura=readEEPROM(w,EEPROM_I2C_ADDRESS);
      password2[w-limPWC]=lectura;
      Serial.print(password2[w-limPWC]);
    }
    Serial.println();
    Serial.print("la longitud de la red es:");
    Serial.println(l_wifi);
    Serial.print("Tu red es:");
    for(int j=limWFI;j<=limWFI+l_wifi-1;j++){ //for que va almacenar la RED en el String wifi
      char caracter=readEEPROM(j, EEPROM_I2C_ADDRESS);//se almacena el caracter que se leyo desde la EEPROM
      wifi+=caracter;//pone caracter por caracter en el string para formar una palabra
      Serial.print(caracter);//nos muestra en el monitor serial la red wifi que se esta leyendo
    }
    Serial.println();
    Serial.print("la longitud de la contraseña de red es:");
    Serial.println(l_wifipsw);
    Serial.print("La contraseña de red es:");
    for(int z=limPWFI;z<=limPWFI+l_wifipsw-1;z++){//for que me va almacenar la contraseña de red en el String wifipsw
      char caracter=readEEPROM(z, EEPROM_I2C_ADDRESS);//se almacena el caracter que se leyo desde la EEPROM
      wifipsw+=caracter;//pone caracter por caracter en el string para formar una palabra
      Serial.print(caracter);//nos muestra en el monitor serial la contraseña de red que se esta leyendo
    }
    Serial.println();
    Serial.println("Iniciando modo de lectura de tarjetas");
    for(int t=0;t<=limPos;t++){
      Serial.print("Digitos de la tarjeta numero ");
      Serial.println(t);
      int j;
      int z;
      j=limTag+(t*4);
      z=j+3;
      for(j;j<=z;j++){
        id_usuario[t][(j-z)+3]=readEEPROM(j,EEPROM_I2C_ADDRESS);
        Serial.print(id_usuario[t][(j-z)+3]);
        Serial.print(" ");
      }
      Serial.println();
    }
  }
  if(RSTACTIVE==1){
    Serial.println("Reiniciando a valores de fabrica");
    int posicion_lectura;
    int tamaño_nombre;
    char NAMEUSER[8]={'U','S','E','R','N','A','M','E'};
    char PSWRST[6]={'1','1','1','1','1','1'};
    byte TAG[4]={0,0,0,0};
    wifi="SSEMWifi";
    wifipsw="ssem2022";
    Serial.println("Iniciando escrituras de nombres en EEPROM");
    for(int i=0;i<=limPos;i++){
      posicion_lectura=limName+(i*20);
      writeEEPROM(posicion_lectura+16,8,EEPROM_I2C_ADDRESS);
      tamaño_nombre=8;
      Serial.print("Se esta escribiendo nombre desde el espacio de memoria ");
      Serial.print(posicion_lectura);
      Serial.print("hasta el espacio");
      Serial.println(posicion_lectura+19);
      Serial.print("El tamaño del nombre es de ");
      Serial.println(tamaño_nombre);
      Serial.print("El nombre que se esta escribiendo es: ");
      for(int j=posicion_lectura;j<=posicion_lectura+tamaño_nombre-1;j++){
        writeEEPROM(j,NAMEUSER[j-posicion_lectura],EEPROM_I2C_ADDRESS);
        char lectura=char(readEEPROM(j, EEPROM_I2C_ADDRESS));
        Serial.print(lectura);
      }
    Serial.println();
    }   
    Serial.println("Iniciando escritura de contraseñas"); 
    writeEEPROM(limPass,6,EEPROM_I2C_ADDRESS);
    writeEEPROM(limPcon,6,EEPROM_I2C_ADDRESS);
    t_password=6;//leemos la longitud de contraseña y lo almacenamos en t_password
    t_passwordconfirm=6;//leemos la longitud de la contraseña de confirmacion
    Serial.println("Tu contraseña por defecto es:");
    for(int i=limPSW;i<=t_password-1;i++){ //for que me va a mostrar la contraseña y la va a almacenar en password[]
      writeEEPROM(i,PSWRST[i-limPSW],EEPROM_I2C_ADDRESS);
      char caracter=readEEPROM(i, EEPROM_I2C_ADDRESS);//se almacena el caracter que se leyo desde la EEPROM
      password[i]=caracter;//pone el caracter leido en una posicion de la variable password
      Serial.print(password[i]);//nos muestra la contraseña
    }
    Serial.println();
    Serial.println("La contraseña de confirmacion por defecto es:");
    for(int w=limPWC;w<=limPWC+t_passwordconfirm-1;w++){
      writeEEPROM(w,PSWRST[w-limPWC],EEPROM_I2C_ADDRESS);
      char lectura=readEEPROM(w,EEPROM_I2C_ADDRESS);
      password2[w-limPWC]=lectura;
      Serial.print(password2[w-limPWC]);
    }
    Serial.println();
    Serial.println("Iniciando la escritura de la red y contraseña de red");
    writeEEPROM(limWifi,8,EEPROM_I2C_ADDRESS);
    writeEEPROM(limPwifi,8,EEPROM_I2C_ADDRESS);
    l_wifi=8;//leemos la longitud de red wifi y lo almacenamos en l_wifi
    l_wifipsw=8;//leemos la longitud de la contraseña wifi y la almacenamos en l_wifipsw
    CONVERTER();
    Serial.print("La red por defecto se esta escribiendo en EEPROM:");
    for(int i=limWFI;i<=limWFI+l_wifi-1;i++){//este for escirbe el nombre de la red en EEPROM del ESPACIO DE MEMORIA 30-79max
      writeEEPROM(i,SSID_1[i-limWFI], EEPROM_I2C_ADDRESS);//escribimos en EEPROM cada caracter de SSID_1
      char letra=readEEPROM(i, EEPROM_I2C_ADDRESS);//leemos lo que se escribio en EEPROM para verificar y lo almacenamos en el char letra
      Serial.print(letra);//imprimimos lo que se esta escribiendo en EEPROM
    }
    Serial.println();
    Serial.print("La contraseña de red por defecto se esta escribiendo en EEPROM:");
    for(int j=limPWFI;j<=limPWFI+l_wifipsw-1;j++){//este for escribe la contraseña de la red en EEPROM del ESPACIO DE MEMORIA 90-139max
      writeEEPROM(j,SSID_PASSWORD[j-limPWFI], EEPROM_I2C_ADDRESS);//escribimos en EEPROM cada caracter de SSID_PASSWORD
      char letra=readEEPROM(j, EEPROM_I2C_ADDRESS);//leemos lo que se escribio en EEPROM para verificar y lo almacenamos en el char letra
      Serial.print(letra);//imprimimos lo que se esta escribiendo en EEPROM
    }
    Serial.println();
    Serial.println("Borrando las tarjetas registradas en el sistema");
    for(int t=0;t<=limPos;t++){
      Serial.print("Digitos de la tarjeta numero ");
      Serial.println(t);
      int j;
      int z;
      j=limTag+(t*4);
      z=j+3;
      for(j;j<=z;j++){
        writeEEPROM(j,TAG[(j-z)+3], EEPROM_I2C_ADDRESS);
        id_usuario[t][(j-z)+3]=readEEPROM(j,EEPROM_I2C_ADDRESS);
        Serial.print(id_usuario[t][(j-z)+3]);
        Serial.print(" ");
      }
      Serial.println();
    }
    writeEEPROM(RSTLECTURE,0,EEPROM_I2C_ADDRESS);
    Serial.println("Finalizacion de datos, sistema reiniciado a valores de fabrica");
  } 
}
//funcion encargada de escribir en los espacios de memoria de la EEPROM la contraseña WIFI y el nombre de la RED
void WRITEEEPROMWIFI(){ 
    Serial.print("La red se esta escribiendo en EEPROM:");
    for(int i=limWFI;i<=limWFI+l_wifi-1;i++){//este for escirbe el nombre de la red en EEPROM del ESPACIO DE MEMORIA 30-79max
      writeEEPROM(i,SSID_1[i-limWFI], EEPROM_I2C_ADDRESS);//escribimos en EEPROM cada caracter de SSID_1
      char letra=readEEPROM(i, EEPROM_I2C_ADDRESS);//leemos lo que se escribio en EEPROM para verificar y lo almacenamos en el char letra
      Serial.print(letra);//imprimimos lo que se esta escribiendo en EEPROM
    }
    Serial.println();
    writeEEPROM(limWifi,l_wifi,EEPROM_I2C_ADDRESS);//escribimos la longitud de la RED en espacio de memoria 81
    Serial.print("la contraseña de red se esta escribiendo en EEPROM:");
    for(int j=limPWFI;j<=limPWFI+l_wifipsw-1;j++){//este for escribe la contraseña de la red en EEPROM del ESPACIO DE MEMORIA 90-139max
      writeEEPROM(j,SSID_PASSWORD[j-limPWFI], EEPROM_I2C_ADDRESS);//escribimos en EEPROM cada caracter de SSID_PASSWORD
      char letra=readEEPROM(j, EEPROM_I2C_ADDRESS);//leemos lo que se escribio en EEPROM para verificar y lo almacenamos en el char letra
      Serial.print(letra);//imprimimos lo que se esta escribiendo en EEPROM
    }
    Serial.println();
    writeEEPROM(limPwifi,l_wifipsw,EEPROM_I2C_ADDRESS);//escribimos la longitud de la contraseña de la red en espacio de memoria 82  
}
//funcion que convierte el string wifi y wifipsw a una variable const char*(necesario que sea variable const char* para las licencias)
void CONVERTER(){
    SSID_1=wifi.c_str();//transforma el string en un const char* para la red
    SSID_PASSWORD=wifipsw.c_str();//transforma el string en un const char para la contraseña de red
}
//funcion encargada de enviar datos a el otro microcontrolador(SSSEM LA) por ESPNOW
void ESP_NOW_CONTROLL(){
  if(((cambio_red==0)or(cambio_red==5))and((alarma_2!=3)or(cerrojo_2!=3))){
    if(alarma_2==0){//Si vale cero le enviara que apague la alarma
      if(oc_electroiman==1){//si vale 1 le enviara que siga prendia el cerrojo y que apague la alarma
        myData.alarma1 = 0;
        myData.cerrojo1 = 1;
        esp_now_send(receiverAddress, (uint8_t *) &myData, sizeof(myData));//funcion que se encarga de enviar el dato al otro microcontrolador
        //necesitamos poner la direccion MAC del dispositivo, el tamaño de los datos que se estan enviando(en este caso 8 bits) y el tamaño de esta data
      }
      else if(oc_electroiman==0){//si vale 1 le enviara que siga apagado el cerrojo y que apague la alarma
        myData.alarma1 = 0;
        myData.cerrojo1 = 0;
        esp_now_send(receiverAddress, (uint8_t *) &myData, sizeof(myData));
      }
    }
    else if(alarma_2==1){//Si vale uno le enviara que prenda la alarma
      if(oc_electroiman==1){
        myData.alarma1 = 1;
        myData.cerrojo1 = 1;
        esp_now_send(receiverAddress, (uint8_t *) &myData, sizeof(myData));
      }
      else if(oc_electroiman==0){
        myData.alarma1 = 1;
        myData.cerrojo1 = 0;
        esp_now_send(receiverAddress, (uint8_t *) &myData, sizeof(myData));
      }   
    }
    else if(alarma_2==5){//si vale 5 han pasado dos minutos de actividad del dispositivo y le enviara un 5 a la variable alarma1 para que sepa que esta prendido
      if(oc_electroiman==1){
        myData.alarma1 = 5;
        myData.cerrojo1 = 1;
        esp_now_send(receiverAddress, (uint8_t *) &myData, sizeof(myData));
      }
      else if(oc_electroiman==0){
        myData.alarma1 = 5;
        myData.cerrojo1 = 0;
        esp_now_send(receiverAddress, (uint8_t *) &myData, sizeof(myData));
      }   
    }
    if(cerrojo_2==0){//si vale cero le enviara que apague el cerrojo
      if(sta_buzzer==1){
        myData.alarma1 = 1;
        myData.cerrojo1 = 0;
        esp_now_send(receiverAddress, (uint8_t *) &myData, sizeof(myData));
      }
      else if(sta_buzzer==0){
        myData.alarma1 = 0;
        myData.cerrojo1 = 0;
        esp_now_send(receiverAddress, (uint8_t *) &myData, sizeof(myData));
      }   
    }
    else if(cerrojo_2==1){//si vale uno le enviara que prenda el cerrojo
      if(sta_buzzer==1){
        myData.alarma1 = 1;
        myData.cerrojo1 = 1;
        esp_now_send(receiverAddress, (uint8_t *) &myData, sizeof(myData));
      }
      else if(sta_buzzer==0){
        myData.alarma1 = 0;
        myData.cerrojo1 = 1;
        esp_now_send(receiverAddress, (uint8_t *) &myData, sizeof(myData));
      }
    }  
    else if(cerrojo_2==4){//si vale 4 le enviara que inicie el ciclo tempprizado de apertura(3 segundos permanece abierto)
      if(sta_buzzer==1){
        myData.alarma1 = 1;
        myData.cerrojo1 = 5;
        esp_now_send(receiverAddress, (uint8_t *) &myData, sizeof(myData));
      }
      else if(sta_buzzer==0){
        myData.alarma1 = 0;
        myData.cerrojo1 = 5;
        esp_now_send(receiverAddress, (uint8_t *) &myData, sizeof(myData));
      }
    }
  }
}
//funcion encargada de informar si se ha enviado exitosamente la informacion por ESPNOW
void OnDataSent(uint8_t *mac_addr, uint8_t sendStatus) {
  //dado a que se envian diferentes datos se hacen if para modificar diferentes cosas o mostrar diferentes mensajes
  if(sendStatus == 0){
    Serial.println("Data enviada exitosamente");
    digitalWrite(senal,HIGH);
    aux1=millis();
    espnow=0;
    LED=1;
    if((alarma_2==0)or(alarma_2==1)){
      alarma_2=3;
      Ralarma=0;
    }
    if((cerrojo_2==0)or(cerrojo_2==1)){
      cerrojo_2=3;
    }
    if(cerrojo_2==4){
      SYSTEM(29);
      cerrojo_2=3;
    }
    if(alarma_2==5){
      Serial.println("SSEM ENVIO A SSEM LA QUE ESTA CONECTADO");
      alarma_2=3;
      Ralarma=0;
      aux3=millis();
    }
  }  
  else{
    Serial.println("Error en transmision");
    espnow++;
    if(espnow>100){
      Serial.println("Demasiados intentos de transmision, SSEM LA DESCONECTADO");
      thing["Ingreso"] >> outputValue("SSEM LA DESCONECTADO");//enviamos texto a thinger.io
      espnow=0;
      alarma_2=3;
      cerrojo_2=3;
      Ralarma=0;
      aux3=millis();
      SYSTEM(66);
    }
  }
}
// Funcion para escribir en EEPROM, necesitamos el valor de la direccion, el valor que desemos escribir y la direccion I2C de la EEPROM
void writeEEPROM(int address, byte val, int i2c_address){
  Wire.beginTransmission(i2c_address); // Iniciamos la transmision I2C EEPROM
  //Enviar dirección de memoria como 16 bits o 2 bytes
  Wire.write((int)(address >> 8));   // MSB
  Wire.write((int)(address & 0xFF)); // LSB
  Wire.write(val); // Enviar datos para ser almacenados
  Wire.endTransmission(); // Fin de la transmision
  delay(10); //pequeño delay que necesita la EEPROM para escribir
}
// Funcion para leer la EEPROM, esta funcion devuelve datos, necesitamos la direccion y la direccion I2C de la EEPROM
byte readEEPROM(int address, int i2c_address){
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
//funcion encargada de la verificacion de la contraseña
void VERIFYPASSWORD(){
  aux2=millis();
  byte PSW=0;
  if(change_password==0){//si vale 0 estamos en la operacion normal, verifica la contraseña para que habra la puerta
    for(int i=0;i<=t_password-1;i++){//funcion que se cicla cierto tiempo para la verificacion de contraseña(como la contraseña esta en un arreglo tenemos que verificar cada espacio)
      if(limite==t_password){ //solo la va a verificar de verdad si cumple con el tamaño de la contraseña
        if(password[i]==longitud[i]){ //evalua las posiciones de los dos arreglos para ver si coinciden y aumenta una variable
          PSW++;
        }
        else{//si no coincide con los espacios resta la variable
          PSW--;
        }
      }
    }
    if(PSW==t_password){//si la variable es del mismo tamaño que la contraseña significa que todos los digitos coincidieron
      Serial.println("Contraseña correcta");
      alarma_2=0;
      PSW=0;
      limite=0;
      bloqueo=0;
      retraso_bloqueo=0;
      aux2=millis();
      SYSTEM(18);
      cerrojo_2=4;
    }
    else{
      Serial.println("Contraseña incorrecta");
      PSW=0;
      limite=0;
      bloqueo++;//incrementamos variable para que cuando llegue a 5 intentos fallidos se bloque el sistema por cierto tiempo
      SYSTEM(19);
      aux2=millis();
    }
    if(bloqueo>=3){//si ya se tuvieron 5 intentos fallidos o mas entrara a este if para bloquear el sistema
      alarma_2=1;
    }
    if(bloqueo>=5)
    {
      retraso_bloqueo=retraso_bloqueo+60000;
      SYSTEM(35);
    }
  }
  else if(change_password==4){//para verificar la contraseña de confirmacion**************PERNDIENTE EN TERMINAR Y MODIFICAR PARA CONTRASEÑA DE CONFIRMACION INDEPENDIENTE A LA HABITUAL
    for(int i=0;i<=t_passwordconfirm-1;i++){//funcion que verificara la contraseña de confirmacion
      if(limite==t_passwordconfirm){ //solo la va a verificar de verdad si cumple con el tamaño de la contraseña *cambiar la variable t_password por t_passwordconfirm
        if(password2[i]==longitud[i]){ //evalua las posiciones de los dos arreglos para ver si coinciden y aumenta una variable
          PSW++;
        }
        else{//si no coincide con los espacios resta la variable
          PSW--;
        }
      }
    }
    if(PSW==t_passwordconfirm){//si la variable es del mismo tamaño que la contraseña significa que todos los digitos coincidieron *cambiar la variable t_password por t_passwordconfirm
      Serial.println("Contraseña de confirmacion correcta");
      thing["Ingreso"] >> outputValue("Contraseña de confirmacion correcta");
      PSW=0;
      limite=0;
      bloqueo=0;
      if(RFIDCCARD==1){
        Serial.println("Seleccionar la tarjeta que deseamos cambiar");
        change_password=5;//si vale 5 seleccionaremos el nombre de la tarjeta que deseamos cambiarle la tarjeta
        SYSTEM(51);
      }
      if(c_password==1){ 
        Serial.println("Insertar contraseña nueva");
        change_password=1;
        SYSTEM(64);
      }
      if(c_password2==1){ 
        Serial.println("Insertar contraseña de confirmacion nueva nueva");
        change_password=6;
        SYSTEM(65);
      }
      /*
      if(RSTMODE==1){
        Serial.println("Restableciendo a valores de fabrica");
        Serial.println("Regresando a valores de fabrica");
        writeEEPROM(RSTLECTURE,1,EEPROM_I2C_ADDRESS);
        SYSTEM(69);
        for(int i=0;i<=3;i++){
          digitalWrite(senal,HIGH);
          delay(200);
          digitalWrite(senal,LOW);
          delay(200);
        }
        ESP.restart();
      } 
      */
    }
    else{
      Serial.println("Contraseña de confirmacion incorrecta");
      PSW=0;
      limite=0;
      bloqueo++;//incrementamos variable para que cuando llegue a 2 intentos fallidos la operacion se cancele
      SYSTEM(52);
      thing["Ingreso"] >> outputValue("Contraseña de confirmacion incorrecta");
    }
    if(bloqueo>=3){//si ya se tuvieron 3 intentos fallidos o mas entrara a este if para bloquear el sistema
      change_password=0;
      SYSTEM(53);
      thing["Ingreso"] >> outputValue("Operacion invalida, regresando al modo normal");
      if(RFIDCCARD==1){
        RFIDNUMBRERS="";
        NAME="";
        RFIDNUMBRER=0;
        RFIDCCARD=0;
      }
      if((c_password==1)or(c_password2==1)){ 
        limite=0;
        change_password=0;
      }
    }
  }
}
//funcion encargada del chequeo de contraseña, el borrado de digitos,la verificacion(llevandonos a la funcion VERIFYPASSWORD) y el modo de cambio de contraseña
void MODE_KEYPAD(char key){
    lcd.backlight();
    lcd.display();
    lcd0.backlight();
    lcd0.display();
    aux2=millis();
    if(change_password==0){ //si es 0 esta en el modo normal, es decir para intentar una contraseña y verificar
      if(key=='*'){ //si se presiona * verifica la contraseña
        Serial.println();
        Serial.println("Contraseña en verificacion");
        VERIFYPASSWORD();//nos vamos a la funcion que verifica la contraseña
      }
      else if(key=='#'){ //si se presiona # borra un caracter de la contraseña que se estaba tratando
        if(limite>0){//siempre y cuando exista un caracter en la pantalla borrara el caracter
          Serial.println("Digito borrado");
          limite=limite-1;
          lcd.setCursor(limite,1);  
          lcd.print(" ");
          lcd0.setCursor(limite,1);  
          lcd0.print(" ");
        }
      }
      else{ //almacena las teclas que se vayan presionando(0-15)
        longitud[limite]=key;//almacena el caracter presionado en el arreglo longitud(arreglo que se comparara con la contraseña)
        Serial.print(longitud[limite]);
        limite++;
        SYSTEM(limite);
        thing["Ingreso"] >> outputValue("Se esta intentando una contraseña");
      }
      if(limite==16){//limite de digitos para la contraseña
        delay(150);
        VERIFYPASSWORD();
        limite=0; 
      }
    }
    else if(change_password==1){//si es 1 esta en el modo de configuracion de contraseña
      //CAMBIAR PARA QUE HASTA EL ULTIMO SE GUARDE ES password[] y se guarde en EEPROM
      if(key=='*'){//guarda la contraseña nueva
        thing["Ingreso"] >> outputValue("Contraseña registrada");
        t_password=limite;
        SYSTEM(20);
        Serial.println();
        Serial.println("Tu nueva contraseña es ");
        writeEEPROM(limPass,t_password, EEPROM_I2C_ADDRESS);//escribimos en EEPROM en el espacio 20 la longitud de la nueva contraseña
        for(int i=0;i<=t_password-1;i++){//escribimos en EEPROM la contraseña 0-15max
          password[i]=longitud[i];
          writeEEPROM(i,password[i], EEPROM_I2C_ADDRESS);
          Serial.print(password[i]);
        }
        limite=0;
        change_password=0;
        Serial.println();
      }
      else if(key=='#'){//borra un caracter de la nueva contraseña que se esta escribiendo
        if(limite>0){
          Serial.println("Digito borrado");
          limite=limite-1;
          lcd.setCursor(limite,1);  
          lcd.print(" ");
        }
      }
      else{//almacenas las teclas de la nueva contraseña en el arreglo password[]
        thing["Ingreso"] >> outputValue("Cambio de contraseña activo");
        longitud[limite]=key;
        Serial.print(longitud[limite]);
        SYSTEM(21);
        limite++;        
      }
      if(limite==16){// si tiene 16 digitos la contraseña la guarda para no hacer una contraseña mas larga
        delay(150);
        thing["Ingreso"] >> outputValue("Contraseña registrada");
        t_password=limite;
        SYSTEM(20);
        Serial.println("Tu nueva contraseña es ");
        writeEEPROM(limPass,t_password, EEPROM_I2C_ADDRESS);//escribimos en EEPROM en el espacio 20 la longitud de la nueva contraseña
        for(int i=limPSW;i<=t_password-1;i++){//escribimos en EEPROM la contraseña 0-15max
          password[i]=longitud[i];
          writeEEPROM(i,password[i], EEPROM_I2C_ADDRESS);
          Serial.print(password[i]);
        }
        change_password=0;
        limite=0;
        Serial.println();
      }
    }
    else if(change_password==2){ //si es 2 esta en el modo para seleccionar tarjeta, aqui se seleccionara y se confirmara la tarjeta que estamos buscando
      if(key=='*'){ //si se presiona * verifica la contraseña
        Serial.println();
        RFIDNUMBRER=RFIDNUMBRERS.toInt();
        if(RFIDNUMBRER<=limPos){
          Serial.print("Mostrar tarjeta numero:");
          Serial.println(RFIDNUMBRER);
          RFIDNAMEEEPROM(RFIDNUMBRER,0);
          SYSTEM(42);//me mostrara el nombre de la tarjeta y su numero
          RFIDNUMBRERS="";
          NAME="";
        }
        else{
          Serial.println("Numero de tarjeta invalido intentelo una vez mas");
          RFIDNUMBRERS="";
          NAME="";
          SYSTEM(44);
        }
        //si vale mayor a 29 mostrar mensaje que es numero invalido y que lo intente de nuevo
      }
      else if(key=='#'){ //si se presiona # borra un caracter de la contraseña que se estaba tratando
        if(RFIDNUMBRER<=limPos){
          Serial.print("Se ha seleccionado la tarjeta porfavor insertar el nombre por bluetooth");
          thing["Ingreso"] >> outputValue("Cambiando nombre de la tarjeta"); 
          change_password=3;
          RFIDNUMBRERS="";
          SYSTEM(43);//Poner el nombre de la tarjeta actual para que posteriormente lo cambie al otro, mostrarlo en el bluetooth
          NAME="";
        }
        else{
          Serial.println("Numero de tarjeta invalido intente una vez mas");
          RFIDNUMBRERS="";
          SYSTEM(44);
        }
      }
      else{ //almacenamos el caracter que se puso en un string
        RFIDNUMBRERS+=key;
        thing["Ingreso"] >> outputValue("Se esta seleccionando una tarjeta");
        SYSTEM(41);//me mostrara el digito de la tarjeta que deseo que se me muestre
      }
    }
    else if(change_password==3){ //si es 3 es para verificar el nombre bluetooth que mandamos
      if(key=='#'){ //si se presiona # verifica el nombre y verificara si cumple los requisitos para guardarla en la EEPROM
        Serial.println();
        NAMEB=NAME.length();
        Serial.print("El tamaño del nuevo nombre es de:");
        Serial.println(NAMEB);
        if(NAMEB<=lcdlong){
          Serial.print("GUARDANDO nombre en EEPROM en el espacio de memoria ");
          Serial.println(RFIDNUMBRER);
          RFIDNAMEEEPROM(RFIDNUMBRER,1);
          SYSTEM(45);//me mostrara el nombre de la tarjeta y su numero
          mensaje="El nuevo nombre registrado es:"+NAME;
          thing["Ingreso"] >> outputValue(mensaje);
          mensaje="";
          RFIDNUMBRERS="";
          change_password=0;
          NAME="";
          RFIDNUMBRER=0;
          RFIDCNAME=0;
        }
        else{
          Serial.println("Nombre de tarjeta invalido intentelo una vez mas");
          SYSTEM(46);
          NAME="";
        }
      }
    }
    else if(change_password==4){ //si es 4 estamos para verificar la contraseña de confirmacion
      //PONER LOS DIFERENTES IF INTERNOS PARA QUE PODAMOS VERIFICARLA DEPENDIENDO DE LAS SITUACIONES en VERIFYPASSWORD
      if(key=='*'){ //si se presiona * verifica la contraseña
        Serial.println();
        Serial.println("Contraseña de confirmacion en verificacion");
        VERIFYPASSWORD();//nos vamos a la funcion que verifica la contraseña
      }
      else if(key=='#'){ //si se presiona # borra un caracter de la contraseña que se estaba tratando
        if(limite>0){//siempre y cuando exista un caracter en la pantalla borrara el caracter
          Serial.println("Digito borrado");
          limite=limite-1;
          lcd.setCursor(limite,1);  
          lcd.print(" ");
          lcd0.setCursor(limite,1);  
          lcd0.print(" ");
        }
      }
      else{ //almacena las teclas que se vayan presionando(0-15)
        longitud[limite]=key;//almacena el caracter presionado en el arreglo longitud(arreglo que se comparara con la contraseña)
        Serial.print(longitud[limite]);
        limite++;
        SYSTEM(limite);
        thing["Ingreso"] >> outputValue("Se esta intentando la contraseña de confirmacion");
      }
      if(limite==16){//limite de digitos para la contraseña
        delay(150);
        VERIFYPASSWORD();
        limite=0; 
      }
    }
    else if(change_password==5){ //si es 5 estamos en el modo de seleccionar tarjeta para cambiar tarjeta, se mostraran los nombres de las tarjetas que tenemos disponibles
      if(key=='*'){ //si se presiona * nos mostrara la tarjeta guardada
        Serial.println();
        RFIDNUMBRER=RFIDNUMBRERS.toInt();
        if(RFIDNUMBRER<=limPos){
          Serial.print("Mostrar tarjeta numero:");
          Serial.println(RFIDNUMBRER);
          RFIDNAMEEEPROM(RFIDNUMBRER,0);
          SYSTEM(42);//me mostrara el nombre de la tarjeta y su numero
          RFIDNUMBRERS="";
          NAME="";
        }
        else{
          Serial.println("Numero de tarjeta invalido intentelo una vez mas");
          RFIDNUMBRERS="";
          NAME="";
          SYSTEM(44);
        }
        //si vale mayor a 4 mostrar mensaje que es numero invalido y que lo intente de nuevo
      }
      else if(key=='#'){ //si se presiona # borra un caracter de la contraseña que se estaba tratando
        if(RFIDNUMBRER<=limPos){
          Serial.print("Se ha seleccionado la tarjeta porfavor apoye la nueva tarjeta que se desea registrar");
          thing["Ingreso"] >> outputValue("Cambiando tarjeta"); 
          change_password=7;
          RFIDNUMBRERS="";
          SYSTEM(54);//nos dira que apoyemos la nueva tarjeta
        }
        else{
          Serial.println("Numero de tarjeta invalido intente una vez mas");
          RFIDNUMBRERS="";
          SYSTEM(44);
        }
        
      }
      else{ //almacenamos el caracter que se puso en un string
        RFIDNUMBRERS+=key;
        thing["Ingreso"] >> outputValue("Se esta seleccionando la posicion de la tarjeta para insertar una nueva");
        SYSTEM(41);//me mostrara el digito de la tarjeta que deseo que se me muestre
      }
    }
    else if(change_password==6){//si es 6 esta en el modo de configuracion de contraseña de confirmacion
    //CAMBIAR PARA QUE HASTA EL ULTIMO SE GUARDE ES password2[] y se guarde en EEPROM
      if(key=='*'){//guarda la contraseña nueva
        t_passwordconfirm=limite;
        SYSTEM(58);
        Serial.println();
        Serial.println("Tu nueva contraseña de confirmacion es ");
        writeEEPROM(limPcon,t_passwordconfirm, EEPROM_I2C_ADDRESS);//escribimos en EEPROM en el espacio 20 la longitud de la nueva contraseña
        for(int i=limPWC;i<=limPWC+t_passwordconfirm-1;i++){//escribimos en EEPROM la contraseña 0-15max
          password2[i-limPWC]=longitud[i-limPWC];
          writeEEPROM(i,password2[i-limPWC], EEPROM_I2C_ADDRESS);
          Serial.print(password2[i-limPWC]);
        }
        thing["Ingreso"] >> outputValue("Contraseña de confirmacion registrada");
        limite=0;
        change_password=0;
        Serial.println();
      }
      else if(key=='#'){//borra un caracter de la nueva contraseña que se esta escribiendo
        if(limite>0){
          Serial.println("Digito borrado");
          limite=limite-1;
          lcd.setCursor(limite,1);  
          lcd.print(" ");
        }
      }
      else{//almacenas las teclas de la nueva contraseña en el arreglo password[]
        thing["Ingreso"] >> outputValue("Cambio de contraseña de confirmacion activo");
        longitud[limite]=key;
        Serial.print(longitud[limite]);
        SYSTEM(59);
        limite++;        
      }
      if(limite==16){// si tiene 16 digitos la contraseña la guarda para no hacer una contraseña mas larga
        delay(150);
        t_passwordconfirm=limite;
        SYSTEM(58);
        Serial.println();
        Serial.println("Tu nueva contraseña de confirmacion es ");
        writeEEPROM(limPcon,t_passwordconfirm, EEPROM_I2C_ADDRESS);//escribimos en EEPROM en el espacio 20 la longitud de la nueva contraseña
        for(int i=limPWC;i<=limPWC+t_passwordconfirm-1;i++){//escribimos en EEPROM la contraseña 0-15max
          password2[i-limPWC]=longitud[i-limPWC];
          writeEEPROM(i,password2[i-limPWC], EEPROM_I2C_ADDRESS);
          Serial.print(password2[i-limPWC]);
        }
        thing["Ingreso"] >> outputValue("Contraseña de confirmacion registrada");
        limite=0;
        change_password=0;
        Serial.println();
      }
    }
}
void RFID(){
  if(mfrc522.PICC_IsNewCardPresent()||mfrc522.PICC_ReadCardSerial())
  {
    lcd.backlight();
    lcd.display();
    lcd0.backlight();
    lcd0.display();
    Serial.println("Tarjeta detectada");
    SYSTEM(36);
    aux2=millis();
    if((chequeo_tarjeta()==1)and(change_password==0)){
      Serial.println("Acceso Aceptado");
      RFIDNAMEEEPROM(fila,0);
      mensaje="Ha entrado"+NAME;
      thing["Ingreso"] >> outputValue(mensaje);
      SYSTEM(38);
      NAME="";
      cerrojo_2=4;
    }
    if((chequeo_tarjeta()==0)and(change_password==0)){
      Serial.println("Acceso Denegado");
      SYSTEM(37);
      SYSTEM(29);
    }
    if((chequeo_tarjeta()==1)and(change_password==7)){//SI VALE 1 ES UNA TARJETA EXISTENTE
      Serial.println("La TARJETA QUE USTED APOYO YA ESTA REGISTRADA ");
      SYSTEM(56);
    }
    if((chequeo_tarjeta()==0)and(change_password==7)){//SI VALE 0 ES UNA NUEVA
      Serial.println("La nueva tarjeta se esta registrando y guardando en EEPROM");//*todavia falta hacer lo del guardado en la memoria EEPROMN
      delay(100);
          for (byte z = 0; z < 4; z++){
          id_usuario[RFIDNUMBRER][z]=mfrc522.uid.uidByte[z];
          Serial.print(id_usuario[RFIDNUMBRER][z]);
          Serial.print(" ");
          }
          Serial.println();
      RFIDNAMEEEPROM(RFIDNUMBRER,3);//Si vale 3 guardamos la tarjeta en EEPROM
      SYSTEM(55);
      mensaje="Se ha guardado la nueva tarjeta en el nombre "+NAME;
      thing["Ingreso"] >> outputValue(mensaje);
      Serial.println("La nueva tarjeta se ha guardado en EEPROM");
      mensaje="";
      RFIDNUMBRERS="";
      change_password=0;//regresamos a la operacion habitual del teclado
      NAME="";
      RFIDNUMBRER=0;
      RFIDCCARD=0;
    }
    Serial.println();
    Serial.println("Reseteando los valores almacenados por la tarjeta");
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      mfrc522.uid.uidByte[i]=255;
      Serial.print(mfrc522.uid.uidByte[i]);
    }
    Serial.println(); 
  }
}
void RFIDNAMEEEPROM(byte posicion,byte modo){//me permite escribir y leer los datos de la EEPROM para el RFID, el primer parametro es para la posicion y la segunda para el modo lectura o escritura
    int posicion_lectura;
    int tamaño_nombre;
    posicion_lectura=limName+(posicion*20);
    Serial.print("El valor de posicion_lectura es:");
    Serial.println(posicion_lectura);
    if(modo==0){//leemos nombre de EEPROM
        tamaño_nombre=readEEPROM(posicion_lectura+16, EEPROM_I2C_ADDRESS);
        Serial.print("Iniciando lectura de nombre en EEPROM en posicion numero ");
        Serial.println(posicion);
        Serial.println("El valor de tamaño_nombre es:");
        Serial.println(tamaño_nombre);
        for(int i=posicion_lectura;i<=posicion_lectura+tamaño_nombre-1;i++){
            char letra=readEEPROM(i, EEPROM_I2C_ADDRESS);
            NAME+=letra;
        }
        Serial.print("El nombre que se encontro es ");
        Serial.println(NAME);   
    }
    if(modo==1){//Escribimos nuevo nombre en memoria EEPROM
        int longitud_name=NAME.length()+1;
        char NAMECHAR[longitud_name];
        NAME.toCharArray(NAMECHAR,longitud_name);
        writeEEPROM(posicion_lectura+16,NAMEB,EEPROM_I2C_ADDRESS);
        tamaño_nombre=readEEPROM(posicion_lectura+16, EEPROM_I2C_ADDRESS);
        Serial.print("Iniciando modo escritura de nombre en EEPROM en posicion numero ");
        Serial.println(posicion);
        Serial.print("El nombre que se va a escribir es:");
        for(int i=0;i<=tamaño_nombre-1;i++){
          Serial.print(NAMECHAR[i]);
        }
        Serial.println();
        Serial.print("El tamaño del nombre que se va a escribir es:");
        Serial.println(tamaño_nombre);
        //transformar el string a arreglo char y guardar cada posicion en la memoria EEPROM
        Serial.println("El nombre que se esta escribiendo en EEPROM es:");
        for(int j=posicion_lectura;j<=posicion_lectura+tamaño_nombre-1;j++){
            writeEEPROM(j,NAMECHAR[j-posicion_lectura],EEPROM_I2C_ADDRESS);
            char lectura=char(readEEPROM(j, EEPROM_I2C_ADDRESS));
            Serial.print(lectura);
        }
        Serial.println();
    }
    if(modo==3){//Escribimos tarjeta en EEPROM
      Serial.print("Iniciando escritura de tarjeta en posicion numero ");
      Serial.println(posicion);
      int j;
      int z;
      j=limTag+(posicion*4);
      z=j+3;
      for(j;j<=z;j++){
        writeEEPROM(j,id_usuario[posicion][(j-z)+3],EEPROM_I2C_ADDRESS);
        int lectura=readEEPROM(j,EEPROM_I2C_ADDRESS);
        Serial.print(lectura);
        Serial.print(" ");
      }
      Serial.println();
    }
}
bool chequeo_tarjeta(){
  mfrc522.PICC_ReadCardSerial();
  if((RFIDCCARD==0)and(change_password==0)){//MODO HABITUAL DE OPERACION
    fila=0;
    Serial.print(F("Card UID:"));
    for (byte i = 0; i < 4; i++) {
      Serial.print(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " ");
      Serial.print(mfrc522.uid.uidByte[i]);
    } 
    for (byte j = 0; j < 4; j++) {
      if(mfrc522.uid.uidByte[j]!=id_usuario[fila][j]){
        fila++;
        j=0;
        if(fila>limPos){
        return 0;//SI VALE 0 NO COINCIDE CON NINGUNA QUE TENGAMOS
        }
      }
    }
    return 1; //SI VALE 1 COINCIDE CON ALGUNA
  }
  if((RFIDCCARD==1)and(change_password==6)){//SI ENTRA A ESTE IF ESTAMOS AGREGANDO UNA TARJETA NUEVA
    fila=0;
    Serial.println("Se ha apoyado una tarjeta, verificando si es una tarjeta existente o es una nueva");
    Serial.print(F("Card UID:"));
    for (byte i = 0; i < 4; i++) {
      Serial.print(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " ");
      Serial.print(mfrc522.uid.uidByte[i]);
    } 
    for (byte j = 0; j < 4; j++) {
      if(mfrc522.uid.uidByte[j]!=id_usuario[fila][j]){
        fila++;
        j=0;
        if(fila>limPos){
          return 0;//si regresa 0 es que la tarjeta que apoyamos ES NUEVA
        }
      }
    }
    return 1;//si vale 1 significa que la tarjeta que apoyamos YA ESTA REGISTRADA
  }
}
//Funcion encargada de juntar todos los perifericos y mostrar al usuario que es lo que esta pasando
void SYSTEM(byte aux){ 
  switch(aux){
    case 1://muestra si lleva 1 digito nuestra contraseña
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd.setCursor(0,1);
      lcd.print("*");
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
      lcd0.setCursor(0,1);
      lcd0.print("*");
    break;
    case 2://muestra si lleva 2 digitos nuestra contraseña
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd.setCursor(0,1);
      lcd.print("**");
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
      lcd0.setCursor(0,1);
      lcd0.print("**");
    break;
    case 3://muestra si lleva 3 digitos nuestra contraseña
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd.setCursor(0,1);
      lcd.print("***");
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
      lcd0.setCursor(0,1);
      lcd0.print("***");
    break;
    case 4://muestra si lleva 4 digitos nuestra contraseña
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd.setCursor(0,1);
      lcd.print("****");
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
      lcd0.setCursor(0,1);
      lcd0.print("****");
    break;
    case 5://muestra si lleva 5 digitos nuestra contraseña
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd.setCursor(0,1);
      lcd.print("*****");
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
      lcd0.setCursor(0,1);
      lcd0.print("*****");
    break;
    case 6://muestra si lleva 6 digitos nuestra contraseña
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd.setCursor(0,1);
      lcd.print("******");
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
      lcd0.setCursor(0,1);
      lcd0.print("******");
    break;
    case 7://muestra si lleva 7 digitos nuestra contraseña
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd.setCursor(0,1);
      lcd.print("*******");
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
      lcd0.setCursor(0,1);
      lcd0.print("*******");
    break;
    case 8://muestra si lleva 8 digitos nuestra contraseña
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd.setCursor(0,1);
      lcd.print("********");
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
      lcd0.setCursor(0,1);
      lcd0.print("********");
    break;
    case 9://muestra si lleva 9 digitos nuestra contraseña
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd.setCursor(0,1);
      lcd.print("*********");
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
      lcd0.setCursor(0,1);
      lcd0.print("*********");
    break;
    case 10://muestra si lleva 10 digitos nuestra contraseña
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd.setCursor(0,1);
      lcd.print("**********");
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
      lcd0.setCursor(0,1);
      lcd0.print("**********");
    break;
    case 11://muestra si lleva 11 digitos nuestra contraseña
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd.setCursor(0,1);
      lcd.print("***********");
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
      lcd0.setCursor(0,1);
      lcd0.print("***********");
    break;
    case 12://muestra si lleva 12 digitos nuestra contraseña
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd.setCursor(0,1);
      lcd.print("************");
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
      lcd0.setCursor(0,1);
      lcd0.print("************");
    break;
    case 13://muestra si lleva 13 digitos nuestra contraseña
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd.setCursor(0,1);
      lcd.print("*************");
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
      lcd0.setCursor(0,1);
      lcd0.print("*************");
    break;
    case 14://muestra si lleva 14 digitos nuestra contraseña
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd.setCursor(0,1);
      lcd.print("**************");
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
      lcd0.setCursor(0,1);
      lcd0.print("**************");
    break;
    case 15://muestra si lleva 15 digitos nuestra contraseña
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd.setCursor(0,1);
      lcd.print("***************");
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
      lcd0.setCursor(0,1);
      lcd0.print("***************");
    break;
    case 16://muestra si lleva 16 digitos nuestra contraseña
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd.setCursor(0,1);
      lcd.print("****************");
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
      lcd0.setCursor(0,1);
      lcd0.print("****************");
    break;
    case 17://muestra si la contraseña se ha reseteado(funcion que ya no se utiliza en el codigo)
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd.setCursor(0,1);
      lcd.print("     RESET      ");
      delay(1500);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
    break;
    case 18://muestra si la contraseña a sido correcta
      thing["Ingreso"] >> outputValue("Acceso Aceptado");
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd.setCursor(0,1);
      lcd.print("    CORRECT     ");
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
      lcd0.setCursor(0,1);
      lcd0.print("    CORRECT     ");
      delay(1000);
    break;
    case 19://muestra si la contraseña a sido incorrecta
      thing["Ingreso"] >> outputValue("Acceso Denegado");
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd.setCursor(0,1);
      lcd.print("   INCORRECT    ");
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
      lcd0.setCursor(0,1);
      lcd0.print("   INCORRECT    ");
      delay(1500);
      lcd.setCursor(0,0);
      lcd.print("   PLEASE TRY   ");
      lcd.setCursor(0,1);
      lcd.print("     AGAIN      ");
      lcd0.setCursor(0,0);
      lcd0.print("   PLEASE TRY   ");
      lcd0.setCursor(0,1);
      lcd0.print("     AGAIN      ");
      delay(1000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd0.clear();
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
    break;
    case 20://muestra que la contraseña a sido guardada(en caso de cambio de contraseña)
      thing["Ingreso"] >> outputValue("Tu nueva constraseña ya esta registrada");
      delay(500);
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd.setCursor(0,1);
      lcd.print("     SAVED      ");
      delay(1000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
    break;
    case 21://nos muestra la nueva contraseña que estamos registrando
      lcd.setCursor(0,0);
      lcd.print("   PASSWORD 1   ");
      lcd.setCursor(limite,1);
      lcd.print(longitud[limite]);
    break;
    case 22://nos muestra que hemos entrado al modo configuracion de contraseña
      lcd.setCursor(0,0);
      lcd.print("   CHANGE PSW   ");
      lcd.setCursor(0,1);
      lcd.print("    ENABLED     ");
      delay(1500);
      lcd.setCursor(0,0);
      lcd.print("  PLEASE FIRST  ");
      lcd.setCursor(0,1);
      lcd.print("  INSERT PSW 2  ");
      delay(1500);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd0.clear();
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
    break;
    case 23://nos muestra nuestra contraseña
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("  PSW SENT TO  ");
      lcd.setCursor(0,1);
      lcd.print("  THINGER.IO   ");
      lcd0.clear();
      lcd0.setCursor(0,0);
      lcd0.print("  PSW SENT TO  ");
      lcd0.setCursor(0,1);
      lcd0.print("  THINGER.IO   ");
      delay(1000);
    break;
    case 24://nos borra la contraseña que se estaba escribiendo en modo de aconfiguracion de contraseña(caso ya no utilizado en el codigo)
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("     DELETE     ");
      lcd.setCursor(0,1);
      lcd.print("    PASSWORD    ");
      delay(2000);
      Serial.println("Contraseña borrada...");
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
    break;
    case 25://muestra que se ha prendido la alarma
      lcd.clear(); 
      lcd.setCursor(0,0);  
      lcd.print("    ALARM ON    "); 
      lcd0.clear(); 
      lcd0.setCursor(0,0);  
      lcd0.print("    ALARM ON    ");
    break;
    case 26://muestra que se ha desactivado la alarma
      lcd.clear(); 
      lcd.setCursor(0,0);  
      lcd.print("   ALARM OFF    ");
      lcd0.clear(); 
      lcd0.setCursor(0,0);  
      lcd0.print("   ALARM OFF    "); 
    break;
    case 29://limpia la pantalla
      Serial.println("LIMPIAR PANTALLA");
      lcd.clear(); 
      lcd.setCursor(0,0); 
      lcd.print("    PASSWORD    ");
      lcd0.clear(); 
      lcd0.setCursor(0,0); 
      lcd0.print("    PASSWORD    ");
    break;
    case 30://muestra que se ha apagado el cerrojo
      lcd.clear(); 
      lcd.setCursor(0,0);  
      lcd.print("   DOOR OPEN    ");
      lcd0.clear(); 
      lcd0.setCursor(0,0);  
      lcd0.print("   DOOR OPEN    "); 
    break;
    case 31://muestra que se ha prendido el cerrojo
      lcd.clear(); 
      lcd.setCursor(0,0);  
      lcd.print("   DOOR CLOSE   ");
      lcd0.clear(); 
      lcd0.setCursor(0,0);  
      lcd0.print("   DOOR CLOSE   ");
    break; 
    case 32://muestra que hemos iniciado el modo configuracion de contraseña 
      lcd.setCursor(0,0);  
      lcd.print("  CHANGE Wi-Fi  ");
      lcd.setCursor(0,1); 
      lcd.print("    ENABLED     ");
      delay(2000);
      lcd.setCursor(0,0);  
      lcd.print("  PLEASE FIRST  ");
      lcd.setCursor(0,1); 
      lcd.print("INSERT Wi-Fi NET");
      lcd0.clear();
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
    break; 
    case 33://muestra que la red se ha registrado 
      lcd.setCursor(0,0);  
      lcd.print("  Wi-Fi NETWORK ");
      lcd.setCursor(0,1); 
      lcd.print("      SAVED     ");
      delay(2000); 
      lcd.setCursor(0,0);  
      lcd.print(" PLEASE INSERT  ");
      lcd.setCursor(0,1); 
      lcd.print(" Wi-Fi PASSWORD ");
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);  
      lcd.print(wifi);
      digitalWrite(senal,LOW);
    break;
    case 34://muestra que nos el modo configuracion de red ha finalizado
      lcd.setCursor(0,0);  
      lcd.print("  Wi-Fi NETWORK ");
      lcd.setCursor(0,1); 
      lcd.print("      SAVED     ");
      delay(1500); 
      lcd.setCursor(0,0);  
      lcd.print(" Wi-Fi PASSWORD ");
      lcd.setCursor(0,1); 
      lcd.print("      SAVED     ");
      delay(1500);
      lcd.clear();
      lcd.setCursor(0,0);  
      lcd.print(SSID_1);//nos muestra la red wifi registrada
      lcd.setCursor(0,1);  
      lcd.print(SSID_PASSWORD);//mos muestra la contraseña de red registrada
    break;
    case 35://muestra que se ha bloqueado el dispositivo
      lcd.clear(); 
      lcd.setCursor(0,0);  
      lcd.print("  SYSTEM LOCK   ");
      lcd0.clear(); 
      lcd0.setCursor(0,0);  
      lcd0.print("  SYSTEM LOCK   ");
      delay(1000);
      lcd.clear();
      lcd.setCursor(0,0); 
      lcd.print("  PLEASE WAIT   ");
      lcd.setCursor(0,1);
      lcd.print("     "); 
      lcd.print((retraso_bloqueo/1000)/60);
      lcd.print(" MIN");
      lcd0.clear();
      lcd0.setCursor(0,0); 
      lcd0.print("  PLEASE WAIT   ");
      lcd0.setCursor(0,1);
      lcd0.print("     "); 
      lcd0.print((retraso_bloqueo/1000)/60);
      lcd0.print(" MIN");
      delay(retraso_bloqueo);
      lcd.clear();
      lcd.setCursor(0,0); 
      lcd.print("    PASSWORD    ");
      lcd0.clear();
      lcd0.setCursor(0,0); 
      lcd0.print("    PASSWORD    ");
      aux2=millis();//iniciamos ciclo de inactividad del dispositivo
    break;
    case 36://Nos dice que la tarjeta ha sido detectada
      lcd.clear(); 
      lcd.setCursor(0,0);  
      lcd.print("  CARD DETECTED ");
      lcd0.clear(); 
      lcd0.setCursor(0,0);  
      lcd0.print("  CARD DETECTED "); 
      delay(1000);
    break;
    case 37://Nos dice que no se ha permitido el acceso por la tarjeta
      delay(1000);
      lcd.clear(); 
      lcd.setCursor(0,0);  
      lcd.print("  ACCESS DENIED ");
      lcd0.clear(); 
      lcd0.setCursor(0,0);  
      lcd0.print(" ACCESS DENIED ");  
    break;
    case 38://Nos dice si el acceso ha sido permitido por la tarjeta
      delay(1500);
      lcd.clear(); 
      lcd.setCursor(0,0);  
      lcd.print(" ACCESS ACCEPTED");
      lcd0.clear(); 
      lcd0.setCursor(0,0);  
      lcd0.print(" ACCESS ACCEPTED");
      delay(1500);
      lcd.clear(); 
      lcd.setCursor(0,0);  
      lcd.print("    WELCOME    ");
      lcd.setCursor(14,0);
      lcd.print(fila);
      lcd.setCursor(0,1);
      lcd.print(NAME);
      lcd0.clear(); 
      lcd0.setCursor(0,0);  
      lcd0.print("    WELCOME   ");
      lcd0.setCursor(14,0);
      lcd0.print(fila);
      lcd0.setCursor(0,1);
      lcd0.print(NAME); 
      delay(1000);  
    break;   
    case 39://En caso de ser mas grande la contraseña y la red wifi de lo especificado
    break;
    case 40://Informa que el modo de cambio de nombre de tarjeta a sido activado
      lcd.setCursor(0,0);
      lcd.print("CARD NAME CHANGE");
      lcd.setCursor(0,1);
      lcd.print("    ENABLED     ");
      delay(2000);
      lcd.setCursor(0,0);
      lcd.print("  PLEASE FIRST  ");
      lcd.setCursor(0,1);
      lcd.print("     SELECT     ");
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("   CARD NUMBER  ");
      lcd0.clear();
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
    break;
    case 41://Inserta el numero de la tarjeta y el nombre/se va a ocupar para el nombre que tiene ahora y el que tiene despues en bluetooth
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("   CARD NUMBER  ");
      lcd.setCursor(7,1);
      lcd.print(RFIDNUMBRERS);
    break;
    case 42://Inserta el numero de la tarjeta y el nombre/se va a ocupar para el nombre que tiene ahora y el que tiene despues en bluetooth
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("   CARD NAME   ");
      lcd.setCursor(14,0);
      lcd.print(RFIDNUMBRER);
      lcd.setCursor(0,1);
      lcd.print(NAME);
    break;
    case 43://Informa que el modo de cambio de nombre de tarjeta a sido activado
      lcd.setCursor(0,0);
      lcd.print("   CARD NAME    ");
      lcd.setCursor(0,1);
      lcd.print("    SELECTED    ");
      delay(2000);
      lcd.setCursor(0,0);
      lcd.print("  PLEASE INSERT ");
      lcd.setCursor(0,1);
      lcd.print("  NEW CARD NAME ");
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    CARD NAME   ");
      lcd.setCursor(14,0);
      lcd.print(RFIDNUMBRER);
      lcd.setCursor(0,1);
      lcd.print(NAME);
    break;
    case 44://Informa que el modo de cambio de nombre de tarjeta a sido activado
      lcd.setCursor(0,0);
      lcd.print("   CARD NUMBER  ");
      lcd.setCursor(0,1);
      lcd.print("     INVALID    ");
      delay(2000);
      lcd.setCursor(0,0);
      lcd.print("  PLEASE INSERT ");
      lcd.setCursor(0,1);
      lcd.print(" NEW CARD NUMBER");
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("   CARD NUMBER  ");
    break;
    case 45://Informa que el modo de cambio de nombre de tarjeta a sido activado
      lcd.setCursor(0,0);
      lcd.print("   NAME SAVED   ");
      lcd.setCursor(0,1);
      lcd.print("IN CARD NUMBER ");
      lcd.setCursor(14,1);
      lcd.print(RFIDNUMBRER);
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print(NAME);
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
    break;
    case 46://Informa que el modo de cambio de nombre de tarjeta a sido activado
      lcd.setCursor(0,0);
      lcd.print("  INVALID NAME  ");
      lcd.setCursor(0,1);
      lcd.print(NAME);
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("   INSERT NEW   ");
      lcd.setCursor(0,1);
      lcd.print("    CARD NAME   ");
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    CARD NAME   ");
    break;
    case 47://Informa que el modo de cambio de nombre de tarjeta a sido activado
      lcd.setCursor(0,0);
      lcd.print("  NAME DELETED  ");
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("   INSERT NEW   ");
      lcd.setCursor(0,1);
      lcd.print("      NAME      ");
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    CARD NAME   ");
    break;
    case 48:
      lcd.setCursor(0,0);
      lcd.print("  ADD NAME CARD ");
      lcd.setCursor(0,1);
      lcd.print("    DISABLED    ");
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
    break;
    case 49:
      lcd.setCursor(0,0);
      lcd.print("    ADD CARD    ");
      lcd.setCursor(0,1);
      lcd.print("    ENABLED     ");
      delay(2000);
      lcd.setCursor(0,0);
      lcd.print("  PLEASE FIRST  ");
      lcd.setCursor(0,1);
      lcd.print("  INSERT PSW 2  ");
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
      lcd0.clear();
      lcd0.setCursor(0,0);
      lcd0.print("    PASSWORD    ");
    break;
    case 50:
      lcd.setCursor(0,0);
      lcd.print("    ADD CARD    ");
      lcd.setCursor(0,1);
      lcd.print("    DISABLED    ");
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
    break;
    case 51:
      lcd.setCursor(0,0);
      lcd.print("   PASSWORD 2   ");
      lcd.setCursor(0,1);
      lcd.print("    CORRECT     ");
      delay(2000);
      lcd.setCursor(0,0);
      lcd.print("  PLEASE SELECT ");
      lcd.setCursor(0,1);
      lcd.print("  THE POSITION  ");
      delay(2000);
      lcd.setCursor(0,0);
      lcd.print("  FOR THE NEW   ");
      lcd.setCursor(0,1);
      lcd.print("      CARD      ");
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("   CARD NUMBER  ");
    break;
    case 52:
      lcd.setCursor(0,0);
      lcd.print("   PASSWORD 2   ");
      lcd.setCursor(0,1);
      lcd.print("   INCORRECT    ");
      delay(2000);
      lcd.setCursor(0,0);
      lcd.print("   YOU HAVE ");
      lcd.print(3-bloqueo);
      lcd.setCursor(0,1);
      lcd.print("    ATTEMPTS    ");
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
    break;
    case 53:
      lcd.setCursor(0,0);
      lcd.print(" ATTEMPTS ENDED ");
      lcd.setCursor(0,1);
      lcd.print("                ");
      delay(2000);
      lcd.setCursor(0,0);
      lcd.print("  RETURNING TO  ");
      lcd.setCursor(0,1);
      lcd.print("  NORMAL MODE   ");
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
    break;
    case 54:
      lcd.setCursor(0,0);
      lcd.print("  CARD POSITION ");
      lcd.setCursor(0,1);
      lcd.print("  SELECT PLEASE ");
      delay(2000);
      lcd.setCursor(0,0);
      lcd.print("  RECHARGE NEW  ");
      lcd.setCursor(0,1);
      lcd.print("      CARD      ");
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    NEW CARD    ");
    break;
    case 55:
      delay(1000);
      lcd.setCursor(0,0);
      lcd.print(" CARD RECHARGED ");
      lcd.setCursor(0,1);
      lcd.print("     SAVED      ");
      delay(2000);
      lcd.setCursor(0,0);
      lcd.print(" CARD SAVED IN  ");
      lcd.setCursor(0,1);
      lcd.print(" THE POSITION ");
      lcd.print(RFIDNUMBRER);
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
    break;
    case 56:
      delay(1000);
      lcd.setCursor(0,0);
      lcd.print(" CARD RECHARGED ");
      lcd.setCursor(0,1);
      lcd.print("    EXISTENT    ");
      delay(2000);
      lcd.clear(); 
      lcd.setCursor(0,0);
      lcd.print(" CARD NUMBER ");
      lcd.print(fila);
      delay(2000);
      lcd.setCursor(0,0);
      lcd.print("  RECHARGE NEW  ");
      lcd.setCursor(0,1);
      lcd.print("      CARD      ");
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    NEW CARD    ");
    break;
    case 57:
      lcd.setCursor(0,0);
      lcd.print("  CHANGE PSW 2  ");
      lcd.setCursor(0,1);
      lcd.print("    ENABLED     ");
      delay(1500);
      lcd.setCursor(0,0);
      lcd.print("  PLEASE FIRST  ");
      lcd.setCursor(0,1);
      lcd.print("  INSERT PSW 2  ");
      delay(1500);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
    break;
    case 58:
      lcd.setCursor(0,0);
      lcd.print("   PASSWORD 2   ");
      lcd.setCursor(0,1);
      lcd.print("      SAVED     ");
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
    break;
    case 59:
      lcd.setCursor(0,0);
      lcd.print("   PASSWORD 2   ");
      lcd.setCursor(limite,1);
      lcd.print(longitud[limite]);
    break;
    case 60://muestra que se ha apagado el cerrojo
      lcd.clear(); 
      lcd.setCursor(0,0);  
      lcd.print("   DOOR OPEN    ");
      lcd0.clear(); 
      lcd0.setCursor(0,0);  
      lcd0.print("   DOOR OPEN    ");    
    break;
    case 61://nos muestra nuestra contraseña
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print(" PSW2 SENT TO  ");
      lcd.setCursor(0,1);
      lcd.print("  THINGER.IO   ");
      lcd0.clear();
      lcd0.setCursor(0,0);
      lcd0.print(" PSW 2 SENT TO ");
      lcd0.setCursor(0,1);
      lcd0.print("  THINGER.IO   ");
    break;
    case 62:
      lcd.setCursor(0,0);
      lcd.print("  CHANGE PSW 1  ");
      lcd.setCursor(0,1);
      lcd.print("    DISABLED    ");
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
    break;
    case 63:
      lcd.setCursor(0,0);
      lcd.print("  CHANGE PSW 2  ");
      lcd.setCursor(0,1);
      lcd.print("    DISABLED    ");
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
    break;
    case 64:
      lcd.setCursor(0,0);
      lcd.print("   PASSWORD 2   ");
      lcd.setCursor(0,1);
      lcd.print("    CORRECT     ");
      delay(2000);
      lcd.setCursor(0,0);
      lcd.print("   INSERT NEW   ");
      lcd.setCursor(0,1);
      lcd.print("   PASSWORD 1   ");
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("   PASSWORD 1   ");
    break;
    case 65:
      lcd.setCursor(0,0);
      lcd.print("   PASSWORD 2   ");
      lcd.setCursor(0,1);
      lcd.print("    CORRECT     ");
      delay(2000);
      lcd.setCursor(0,0);
      lcd.print("   INSERT NEW   ");
      lcd.setCursor(0,1);
      lcd.print("   PASSWORD 2   ");
      delay(2000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("   PASSWORD 2   ");
    break;
    case 66:
      lcd.setCursor(0,0);
      lcd.print("  TRANSMISSION  ");
      lcd.setCursor(0,1);
      lcd.print("ERROR IN SSEM LA");
    break;
    case 67:
      lcd.setCursor(0,0);
      lcd.print(" RST TO FACTORY ");
      lcd.setCursor(0,1);
      lcd.print("DEFAULTS ENABLED");
      delay(1500);
      lcd.setCursor(0,0);
      lcd.print("  PLEASE FIRST  ");
      lcd.setCursor(0,1);
      lcd.print("  INSERT PSW 2  ");
      delay(1500);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
    break;
    case 68:
      lcd.setCursor(0,0);
      lcd.print(" RST TO FACTORY ");
      lcd.setCursor(0,1);
      lcd.print("    DEFAULTS    ");
      delay(1000);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    DISABLED    ");
      delay(1500);
      lcd.clear();
      lcd.setCursor(0,0);
      lcd.print("    PASSWORD    ");
    break;
    case 69:
      lcd.setCursor(0,0);
      lcd.print("   PASSWORD 2   ");
      lcd.setCursor(0,1);
      lcd.print("    CORRECT     ");
      delay(2000);
      lcd.setCursor(0,0);
      lcd.print("  RESETTING TO  ");
      lcd.setCursor(0,1);
      lcd.print("FACTORY DEFAULTS");
    break;
  }
}
