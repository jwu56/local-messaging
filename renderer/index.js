const http = require('http');
const WebSocket = require('ws');

const { networkInterfaces } = require('os');

const g = document.getElementById.bind(document);
const hostBtn = g('hostBtn'),
    chatBox = g('chatBox'),
    infoStatus = g('infoStatus'),
    errorDisplay = g('errorDisplay'),
    searchServersBtn = g('searchServersBtn'),
    searchStatus = g('searchStatus'),
    disconnectBtn = g('disconnectBtn'),
    username = g('username'),
    infoHost = g('infoHost'),
    infoPort = g('infoPort'),
    searchProgress = g('searchProgress'),
    searchBox = g('searchBox'),
    cancelSearchBtn = g('cancelSearchBtn');

let host, wss, server, searchId;
const port = 42069;
const stopSearchEvent = new Event('stopSearch');

hostBtn.addEventListener('click', hostServer);
searchServersBtn.addEventListener('click', runSearches);

cancelSearchBtn.addEventListener('click', () => {
    document.dispatchEvent(stopSearchEvent);
    clearTimeout(searchId);
    setSearchStatus('Cancelling scan...');

    setTimeout(() => {
        setSearchStatus('');
        searchProgress.style.display = 'none';
        searchServersBtn.style.display = 'inline';
        cancelSearchBtn.style.display = 'none';
        hostBtn.style.display = 'inline';
    }, 3000);
});

function hostServer(){
    if (!username.value) {
        configError('Please enter a username');
        return;
    };

    host = getIp();

    infoStatus.innerHTML = 'Hosting';

    let history = [];

    server = http.createServer((req, res) => {});
    server.on('error', error => {
        server.close(); 
        parseMessage(JSON.parse(newMessage('system error', 'Local System', `There was an error hosting the server: ${error}`)));
        infoStatus.innerHTML = 'Disconnected';
    });
    server.listen(port, host, setupWs);

    function setupWs(){
        chatBox.innerHTML += '<div>=========================</div>';
        parseMessage(JSON.parse(newMessage('system', 'Local System', `Server hosted at http://${host}:${port}`)));
        wss = new WebSocket.Server({
            server: server,
            clientTracking: true
        });
        wss.on('connection', (ws, request) => {

            if (history.length > 0) {
                ws.send(newMessage('history', null, history));
            };

            ws.on('message', message => {
                history.push(message);
                sendToAll(message);
            });
            ws.on('close', (code, reason) => {
                if (reason) {
                    const msg = newMessage('system leave', 'Global System', `${reason} has left`);
                    history.push(msg);
                    sendToAll(msg);
                };
            });

            function sendToAll(message){
                wss.clients.forEach(ws => ws.send(message))
            };
        });
        connectToServer(true)
    }
};

function connectToServer(hoster, ip){
    searchBox.style.display = 'none';
    searchBox.innerHTML = '';
    infoStatus.innerHTML = 'Connecting';
    if (!hoster){
        if (!username.value) {
            configError('Please enter a username');
            infoStatus.innerHTML = 'Disconnected';
            return;
        };
        host = ip;
        chatBox.innerHTML += '<div>=========================</div>';
    };

    username.readOnly = 'true';
    infoHost.innerHTML = host;
    infoPort.innerHTML = port;

    const ws = new WebSocket(`http://${host}:${port}`);

    let timeout = setTimeout(() => {
        disconnectAll();
    }, 10000);

    ws.on('error', error => {
        parseMessage(JSON.parse(newMessage('system error', 'Local System', `There was an error connecting to the server: ${error}`)));
        hostBtn.style.display = 'inline-block';
        searchServersBtn.style.display = 'inline-block';
        disconnectBtn.style.display = 'none';

        username.removeAttribute('readonly');
        infoHost.innerHTML = '';
        infoPort.innerHTML = '';
        document.removeEventListener('keydown', sendMessage);
        infoStatus.innerHTML = 'Disconnected';
    })

    ws.on('open', () => { //succesful join
        clearTimeout(timeout);
        infoStatus.innerHTML = 'Connected';
        parseMessage(JSON.parse(newMessage('system', 'Local System', `Connected to http://${host}:${port}`)));
        ws.send(newMessage('system join', 'Global System', `${username.value} has joined`));
    });

    ws.on('message', message => {
        message = JSON.parse(message);
        if (message.type === 'history') {
            message.data.forEach(data => {
                data = JSON.parse(data);
                parseMessage(data);
            })
        } else {
            parseMessage(message);
        };
    });

    ws.on('close', () => {
        parseMessage(JSON.parse(newMessage('system leave', 'Local System', 'Connection closed')));
        hostBtn.style.display = 'inline-block';
        searchServersBtn.style.display = 'inline-block';
        disconnectBtn.style.display = 'none';

        username.removeAttribute('readonly');
        infoHost.innerHTML = '';
        infoPort.innerHTML = '';
        document.removeEventListener('keydown', sendMessage);
        infoStatus.innerHTML = 'Disconnected';
    });

    document.addEventListener('keydown', sendMessage);
    function sendMessage(event){
        if (event.key === 'Enter' && document.activeElement === g('messageInput')){
            ws.send(newMessage('message', username.value || 'Guest', g('messageInput').value));
            g('messageInput').value = '';
        };
    };

    hostBtn.style.display = 'none';
    searchServersBtn.style.display = 'none';
    disconnectBtn.style.display = 'inline-block';

    disconnectBtn.onclick = disconnectAll;

    function disconnectAll(){
        if (wss) wss.close();
        if (server) server.close();
        ws.close(1000, username.value);
    
        hostBtn.style.display = 'inline-block';
        searchServersBtn.style.display = 'inline-block';
        disconnectBtn.style.display = 'none';

        username.removeAttribute('readonly');
        infoHost.innerHTML = '';
        infoPort.innerHTML = '';

        infoStatus.innerHTML = 'Disconnected';
    };
};

function runSearches(){
    let halt = false;
    hostBtn.style.display = 'none';
    searchServersBtn.style.display = 'none';
    cancelSearchBtn.style.display = 'inline';

    searchBox.style.display = 'block';
    searchBox.innerHTML = '';
    let a = 1;

    let ip = getIp().split('.');
    ip.splice(-2, 2);
    ip = ip.join('.');

    setSearchStatus(`Scanning ${ip}.${a}.0 - ${ip}.${a + 24}.255`);
    searchProgress.value = 0;
    searchProgress.style.display = 'block';

    searchId = setTimeout(function search(){
        searchServers(a, a + 24)
        .then(array => {
            if (!halt){
                searchProgress.value += 0.1;
                setSearchStatus(`Scanning ${ip}.${a + 24}.0 - ${ip}.${a + 48}.255`);
            };
            if (a === 251) {
                setSearchStatus('Finished Scan');
                setTimeout(() => {
                    setSearchStatus('');
                    searchProgress.style.display = 'none';
                }, 3000);

                searchServersBtn.style.display = 'inline';
                hostBtn.style.display = 'inline';
                cancelSearchBtn.style.display = 'none';
            };
            if (array.length < 1) return;

            array.forEach(ip => {
                const ipBtn = document.createElement('button');
                ipBtn.innerHTML = ip;
                searchBox.appendChild(ipBtn);
                ipBtn.onclick = () => connectToServer(false, ip);
            });

        })
        .catch (error => {
            console.error(error);
        });

        a += 25;
        if (a + 24 <= 255){
            searchId = setTimeout(search, 2000);
        }
    }, 2000);

    function searchServers(minI, maxI){
        const net = require('net');
        const Socket = net.Socket;

        let addresses = [];
      
        const promise = new Promise((resolve, reject) => {
            for (let i = minI; i <= maxI && !halt; i++){
                for (let j = 1; j <= 255 && !halt; j++){
        
                    const socket = new Socket();
                    let status = null;

                    document.addEventListener('stopSearch', function stop() {
                        halt = true;
                        socket.destroy();
                        document.removeEventListener('stopSearch', stop);
                    });
        
                    socket.on('connect', () => {
                        status = 'open';
                        socket.end();
                    });
                    socket.setTimeout(1500);
                    socket.on('timeout', () => {
                        status = 'closed';
                        socket.destroy();
                    });
                    socket.on('error', () => status = 'closed');
                    socket.on('close', () => {
                        if (status == "open"){
                        addresses.push(`${ip}.${i}.${j}`);
                        };
                        if (i === maxI && j === 255) {
                            resolve(addresses);
                        };
                    });
                    socket.connect(port, `${ip}.${i}.${j}`);
                };
            };
        });
        return promise;
    };
};
function setSearchStatus(message){
    searchStatus.innerHTML = message;
};
function parseMessage(data){
    const message = document.createElement('div');
    message.setAttribute('class', data.type);
    message.innerHTML = `<em>${data.time} </em><strong>${data.username}: </strong>${data.data}`;
    chatBox.appendChild(message);
    scrollDown();
};

function newMessage(type, username, data){
    const date = new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const message = {
        type, 
        time: `${hours.toString().length < 2 ? '0' : ''}${hours}:${minutes.toString().length < 2 ? '0' : ''}${minutes}`,
        username,
        data
    };
    return JSON.stringify(message);
};

function configError(error){
    errorDisplay.innerHTML = error;
    setTimeout(() => errorDisplay.innerHTML = '', 3000);
};

function scrollDown(){
    chatBox.scrollTop = chatBox.scrollHeight - chatBox.clientHeight;
}

function getIp(){
    const networks = networkInterfaces().WiFi;
    return networks.filter(network => network.family === "IPv4")[0].address;
};