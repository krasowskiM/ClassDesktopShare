/**
 * Skrypt zawierający logikę streamowania obrazu.
 */

//inicjalizacja obiektu desktopCapturer odpowiedzialnego za przechwycenie
const { desktopCapturer } = require('electron');
const WebSocket = require('websocket').client;
const config = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302?transport=udp' },
    { urls: 'turn:numb.viagenie.ca:3478?transport=udp', username: 'macris120@gmail.com', credential: 'admin1' }]
};
document.querySelector('#start').addEventListener('click', startStreaming);
document.querySelector('#stop').addEventListener('click', stop);
let socketClient = new WebSocket();
socketClient.connect('wss://stream-support.herokuapp.com/webRTCHandler');
let sockCon = undefined;
let peerConnection = new webkitRTCPeerConnection(config);
let streamSource = undefined;
let incomingSdp = undefined;
let streamOn = false;
let isNegotiating = false;

socketClient.on('connect', function (connection) {
    sockCon = connection;
    let presenterMessage = { helloMessage: 'presenter' };
    sockCon.send(JSON.stringify(presenterMessage));
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
            let signal = JSON.parse(message.utf8Data);
            if (signal.sdp) {
                console.log('SDP received. Setting remote...');
                peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                incomingSdp = signal.sdp;
                console.log('done');
            } else if (signal.helloMessage && streamOn) {
                console.log('viewer has come!');
                peerConnection.createOffer(gotDescription, createOfferError);
                console.log('offer message sent!');
            }
        }
    });
});

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
    streamSource = stream;
}

//podstawowa obsługa błędu, wypisze go tylko na konsolę
function handleError(e) {
    console.log(e);
}

function startStreaming() {
    start(true, streamSource);
}

function start(isCaller, stream) {
    peerConnection.addStream(stream);
    peerConnection.createOffer(gotDescription, createOfferError);
    streamOn = isCaller;
}

function stop() {
    peerConnection.close();
}

function gotDescription(description) {
    peerConnection.setLocalDescription(description, function () {
        sockCon.send(JSON.stringify({ 'sdp': description }));
    }, function () { console.log('set description error') });
    console.log('got description');
}

function gotIceCandidate(event) {
    if (event.candidate != null) {
        console.log('ice candidate received');
        peerConnection.addIceCandidate(event.candidate);
        let ice = JSON.stringify({ 'ice': event.candidate });
        console.log(ice);
        sockCon.send(ice);
    }
}

function createOfferError(error) {
    console.log(error);
}

peerConnection.onicecandidate = gotIceCandidate;
socketClient.on('connectFailed', function (error) {
    console.log('Connect Error: ' + error.toString());
});

peerConnection.onnegotiationneeded = async e => {
    if (isNegotiating) {
        console.log("SKIP nested negotiations");
        return;
    }
    isNegotiating = true;
    try {
        await peerConnection.setLocalDescription(await peerConnection.createOffer(gotDescription, createOfferError));
        await peerConnection.setRemoteDescription(incomingSdp);
    } catch (e) {
        console.log(e);
    }
}

peerConnection.onsignalingstatechange = (e) => {  // Workaround for Chrome: skip nested negotiations
    isNegotiating = (peerConnection.signalingState != "stable");
}

setInterval(function () {
    sockCon.send(JSON.stringify({ 'beatMessage': 'check!' }));
}, 4000);