/**
 * Skrypt zawierający logikę streamowania obrazu.
 */

//inicjalizacja obiektu desktopCapturer odpowiedzialnego za przechwycenie
const {desktopCapturer} = require('electron');

// W tej funkcji odbywa się określenie źródła obrazu, więcej info w API
desktopCapturer.getSources({ 
    //w tablicy uzupełniamy źródła z których będzie pobierany obraz
    types: ['window', 'screen'] 
    //funkcja z parametrami, error pojawia się w przypadku prawdopodobnych problemów I/O
    //sources - lista/tablica źródeł streamu
}, (error, sources) => {
    if (error) throw error;
    //przeszukujemy listę w poszukiwaniu dostępnych źródeł - w tym przypadku będą to wszystkie otwarte
    //okna oraz cały pulpit
    for (let i = 0; i < sources.length; i++) {
        let name = sources[i].name;
        //wypisałem na konsolę nazwy wszystkich źródeł -> w aplikacji używamy skrótu Ctrl + Shift + I
        //przechodzimy do console i powinny tam być wypisanie po kolei źródła obrazu
        console.log(name);
        //Entire screen jest domyślnie całym dostępnym pulpitem
        if (name == 'Entire screen') {
            //określenie rozmiarów obrazu oraz przechwycenie wybranego źródła
            navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                    mandatory: {
                        chromeMediaSource: 'desktop',
                        chromeMediaSourceId: sources[i].id,
                        minWidth: 1280,
                        maxWidth: 1280,
                        minHeight: 720,
                        maxHeight: 720
                    }
                }
            })
                //Po próbie przechwycenia obrazu możemy przejść do przesyłania go do odbiornika
                .then((stream) => handleStream(stream))
                //obsługa w przypadku błędu
                .catch((e) => handleError(e))
            //kończymy imprezę
            return;
        }
    }
});

//podstawowa obsługa streamowania
function handleStream(stream) {
    //znajdujemy element odpowiedzialny za wyświetlenie obrazu w aplikacji,
    //znacznik 'video' z okna głównego
    const video = document.querySelector('video');
    //określamy obiekt źródłowy dla playera
    video.srcObject = stream;
    //jeżeli zostały dostarczone metadane, to jedziemy z odtwarzaniem
    video.onloadedmetadata = (e) => video.play();
}

//podstawowa obsługa błędu, wypisze go tylko na konsolę
function handleError(e) {
    console.log(e);
}