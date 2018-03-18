/**
 * Skrypt okna głównego aplikacji. Odpowiada za załadowanie zawartości okna oraz inicjalizację aplikacji
 * w electronie.
 */

//Moduły ładowane przez node.js - electron jest tym, co odpala naszą aplikację, url i path ułatwiają odnalezienie plików aplikacji
const electron = require('electron');
const url = require('url');
const path = require('path');
const WebSocket = require('websocket').client;

//App jest główną klasą aplikacji electrona, BrowserWindow to domyślne przeglądarkowe "okno główne"
const { app, BrowserWindow } = electron;

//deklarujemy zmienną dla okna głównego
let mainWindow;

//odpalamy aplikację
app.on('ready', function () {

    //Inicjalizujemy okno główne
    mainWindow = new BrowserWindow({});
    //ładujemy zawartość okna z pliku html, w ten sposób dzieli się też aplikację
    //na dodatkowe okna np window1, window2 itd...
    mainWindow.loadURL(url.format({
        //Tutaj załączamy ścieżkę do pliku, w naszym przypadku plik .html ekranu głównego znajduje się
        //w tym samym folderze. Zmienna path ułatwia odnalezienie relatywnej ścieżki, w razie gdybyśmy opublikowali
        //pliki na serwerze, __dirname oznacza po prostu zmienną dla aktualnego folderu
        pathname: path.join(__dirname, 'main.html'),
        //protokół za pomocą którego będziemy odczytywać plik
        protocol: 'file:',
        //wartość wyznacza, czy slashe '//' po protokole wyżej są wymagane
        slashes: true
    }));
    let socketClient = new WebSocket();

    socketClient.on('connectFailed', function (error) {
        console.log('Connect Error: ' + error.toString());
    });

    socketClient.on('connect', function (connection) {
        console.log('WebSocket Client Connected');
        connection.on('error', function (error) {
            console.log("Connection Error: " + error.toString());
        });
        connection.on('close', function () {
            console.log('echo-protocol Connection Closed');
            connection.close();
        });
        connection.on('message', function (message) {
            if (message.type === 'utf8') {
                console.log("Received: '" + message.utf8Data + "'");
            }
        });

        function sendPing() {
            if (connection.connected) {
                connection.ping();
                setTimeout(sendPing, 1000);
                console.log('ping sent!');
            }
        }
        sendPing();
        // function sendNumber() {
        //     if (connection.connected) {
        //         var number = Math.round(Math.random() * 0xFFFFFF);
        //         connection.send('Message');
        //         setTimeout(sendNumber, 1000);
        //         requestCount++;
        //     }
        // }
        // sendNumber();
    });

    socketClient.connect('ws://localhost:8080/enableSocketConnection');
});