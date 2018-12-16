/**
 * Skrypt okna głównego aplikacji. Odpowiada za załadowanie zawartości okna oraz inicjalizację aplikacji
 * w electronie.
 */

//Moduły ładowane przez node.js - electron jest tym, co odpala naszą aplikację, url i path ułatwiają odnalezienie plików aplikacji
const electron = require('electron');
const url = require('url');
const path = require('path');

//App jest główną klasą aplikacji electrona, BrowserWindow to domyślne przeglądarkowe "okno główne"
const { app, BrowserWindow, Menu, Tray } = electron;

//deklarujemy zmienną dla okna głównego
let mainWindow;
let appTray;

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

    appTray = new Tray(path.join(__dirname, '/img/32x32.png'));
    const contextMenu = Menu.buildFromTemplate([
        {label: 'Item1', type: 'radio'},
        {label: 'Item2', type: 'radio'}
      ]);

      contextMenu.items[1].checked = false;
    
    appTray.setContextMenu(contextMenu);
});

function showHideVideo(){
    var videoElement = document.getElementById('videoElement');
    if (videoElement.style.visibility === 'hidden') {
        videoElement.style.visibility = 'visible';
    } else {
        videoElement.style.visibility = 'hidden';
    }
}