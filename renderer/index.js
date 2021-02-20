//#region setup
const http = require('http');
const WebSocket = require('ws');

const { networkInterfaces } = require('os');
const { ipcRenderer} = require('electron');

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
    cancelSearchBtn = g('cancelSearchBtn'),
    endWhenFound = g('endWhenFound'),
    manualConnect = g('manualConnect'),
    manualConnectBtn = g('manualConnectBtn'),
    manualHost = g('manualHost'),
    messageInput = g('messageInput'),
    memberList = g('memberList'),
    joinWhenFound = g('joinWhenFound'),
    wifi = g('wifi');

let host, wss, server;
let halt = false;
const port = 42069;

hostBtn.addEventListener('click', hostServer);
searchServersBtn.addEventListener('click', runSearches);
cancelSearchBtn.addEventListener('click', endSearch);
manualConnectBtn.addEventListener('click', () => {
    if (!manualHost.value){
        configError('Please enter a host');
        return;
    };
    connectToServer(false, manualHost.value);
});

username.value = `Guest_${generateid(5)}`;

function generateid(length) {
    let result = '';
    const characters = '0123456789'; //ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz
    for ( var i = 0; i < length; i++ ) {
       result += characters.charAt(Math.floor(Math.random() * characters.length));
    };
    return result;
};

joinWhenFound.addEventListener('input', () => {
    if (joinWhenFound.checked) {
        endWhenFound.checked = true;
        endWhenFound.disabled = true;
    } else {
        endWhenFound.disabled = false;
    };
});

updateConnection();
window.addEventListener('online', updateConnection);
window.addEventListener('offline', updateConnection);
function updateConnection(){
    if (navigator.onLine){
        wifi.src = '../imgs/wifiConnected.png';
    } else {
        wifi.src = '../imgs/wifiDisconnected.png';
    };
};

//#endregion

function endSearch(ip){
    halt = true;
    setSearchStatus('Ended scan');
    toggleSearchBtns(true);

    setTimeout(() => {
        document.onclick = () => {
            setSearchStatus('');
            document.onclick = null;
        };
    }, 100);

    if (ip) connectToServer(false, ip);
};

function hostServer(){
    if (!username.value) {
        configError('Please enter a username');
        return;
    };

    host = getIp();

    infoStatus.innerHTML = 'Hosting';

    let history = [];
    let wsId = 1;

    server = http.createServer((req, res) => {res.end(username.value)});
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
            ws.id = wsId++;
            ws.send(newMessage('data', null, ws.id));

            ws.on('message', message => {
                if (JSON.parse(message).type === 'data'){
                    const data = JSON.parse(JSON.parse(message).data);

                    ws.username = data.username;
                    ws.host = data.host;

                    const msg = newMessage('system join', 'Global System', `${ws.username}${ws.host ? ' (host)' : ''} has joined`);
                    history.push(msg);
                    sendToAll(msg);

                    sendMemberList(); 
                } else{
                    history.push(message);
                    sendToAll(message);
                };
                history = history.slice(-100);
            });

            ws.on('close', (code, reason) => {
                if (reason) {
                    const msg = newMessage('system leave', 'Global System', `${reason} has left`);
                    history.push(msg);
                    sendToAll(msg);
                } else {
                    const msg = newMessage('system leave', 'Global System', `${ws.username} disconnected`);
                    history.push(msg);
                    sendToAll(msg);
                };
                sendMemberList();
            });

            function sendToAll(message){
                wss.clients.forEach(ws => ws.send(message))
            };
            function sendMemberList(){
                let members = [];
                wss.clients.forEach(ws => {
                    members.push({username: ws.username, host: ws.host, id: ws.id})
                });
                sendToAll(newMessage('memberList', null, members));
            };
        });
        connectToServer(true);
    };
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

    username.setAttribute('readonly', true);
    infoHost.innerHTML = host;
    infoPort.innerHTML = port;

    const ws = new WebSocket(`http://${host}:${port}`);

    let timeout = setTimeout(disconnectAll, 10000);

    ws.on('error', error => {
        parseMessage(JSON.parse(newMessage('system error', 'Local System', `There was an error connecting to the server: ${error}`)));
    });

    ws.on('open', () => {
        clearTimeout(timeout);
        infoStatus.innerHTML = 'Connected';

        parseMessage(JSON.parse(newMessage('system', 'Local System', `Connected to http://${host}:${port}`)));

        ws.send(newMessage('data', null, JSON.stringify({username: username.value, host: hoster ? true : false})));
    });

    ws.on('message', message => {
        message = JSON.parse(message);

        switch (message.type) {
            case 'history':
                message.data.forEach(data => {
                    data = JSON.parse(data);
                    parseMessage(data);
                });
                break;

            case 'memberList':
                memberList.innerHTML = '';

                message.data.forEach(member => {
                    const usernameSpan = document.createElement('span');
                    usernameSpan.setAttribute('class', 'connectionName');
                    usernameSpan.textContent = member.username;

                    const mainDiv = document.createElement('div');
                    mainDiv.appendChild(usernameSpan);
                    mainDiv.innerHTML += `${member.host ? ' (host)' : ''}${member.id === ws.id ? ' (you)' : ''}`;

                    memberList.appendChild(mainDiv);
                });
                break;

            case 'data':
                ws.id = message.data;
                break;

            default: 
                parseMessage(message);
        };
    });

    ws.on('close', () => {
        parseMessage(JSON.parse(newMessage('system leave', 'Local System', 'Connection closed')));
        toggleConnectionBtns(true);
    });

    document.onkeydown = sendMessage;

    function sendMessage(event){
        if (event.key === 'Enter' && document.activeElement === messageInput && messageInput.value.trim().length > 0){
            ws.send(newMessage('message', username.value || 'Guest', messageInput.value.trim()));
            messageInput.value = '';
        };
    };

    toggleConnectionBtns(false);
    disconnectBtn.onclick = disconnectAll;

    function disconnectAll(){
        if (wss) wss.close();
        if (server) server.close();
        ws.close(1000, username.value);
    };
};

function runSearches(){
    halt = false;
    toggleSearchBtns(false);

    searchBox.style.display = 'block';
    searchBox.innerHTML = '';

    let ip = getIp().split('.');
    ip.splice(-2, 2);
    ip = ip.join('.');

    searchProgress.value = 0;
    search(1, 25);

    function search(min, max){
        if (halt) return;

        setSearchStatus(`Scanning ${ip}.${min}.0 to ${ip}.${max}.255`);
        searchServers(min, max)
        .then(array => {
            if (min < 251) {
                if (!halt) searchProgress.value += 0.1;
                search(min + 25, max + 25);
            } else {
                ipcRenderer.send('ping', true);
                setSearchStatus('Finished Scan');
                toggleSearchBtns(true);

                setTimeout(() => {
                    document.onclick = () => {
                        setSearchStatus('');
                        document.onclick = null;
                    };
                }, 100);
            };

            if (array.length < 1) return;

            array.forEach(ip => {
                const ipBtn = document.createElement('button');
                searchBox.appendChild(ipBtn);
                ipBtn.onclick = () => connectToServer(false, ip);

                const req = http.request({hostname: ip, port: port, method: 'GET'}, res => {
                    res.on('data', data => {
                        ipBtn.innerHTML = `${data.toString()} (${ip})`;
                    });
                });
                req.on('error', error => {
                    console.error(error)
                });
                req.end();
            });
    
        })
        .catch(error => {
            console.error(error);
        });
    };

    function searchServers(minI, maxI){
        const net = require('net');
        const Socket = net.Socket;

        let addresses = [];
        let socketNum = 0;
      
        const promise = new Promise((resolve, reject) => {
            for (let i = minI; i <= maxI && !halt; i++){
                for (let j = 1; j <= 255 && !halt; j++){

                    let status = null;
                    const socket = new Socket();

                    ++socketNum;
        
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
                        --socketNum;
                        if (status == "open"){
                            addresses.push(`${ip}.${i}.${j}`);

                            if (endWhenFound.checked){
                                endSearch(joinWhenFound.checked ? addresses[0] : false);
                                resolve(addresses);
                                return;
                            };
                        };
                        if (socketNum === 0) {
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

function setSearchStatus(message){searchStatus.innerHTML = message;};

function parseMessage(data){
    const message = document.createElement('div');
    message.setAttribute('class', data.type);
    message.innerHTML = `<em>${data.time} </em><strong>${data.username}: </strong>${data.data}`;
    chatBox.appendChild(message);
    scrollDown();

    ipcRenderer.send('ping', true);
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

function scrollDown(){chatBox.scrollTop = chatBox.scrollHeight - chatBox.clientHeight;};

function getIp(){
    const networks = networkInterfaces().WiFi;
    return networks.filter(network => network.family === "IPv4")[0].address;
};

function toggleSearchBtns(normal){
    searchProgress.style.display = normal ? 'none' : 'block';
    searchServersBtn.style.display = normal ? 'inline' : 'none';
    cancelSearchBtn.style.display = normal ? 'none': 'inline';
    hostBtn.style.display = normal ? 'inline' : 'none';
    manualConnect.style.display = normal ? 'block' : 'none';
};

function toggleConnectionBtns(normal){
    hostBtn.style.display = normal ? 'inline-block' : 'none';
    searchServersBtn.style.display = normal ? 'inline-block' : 'none';
    disconnectBtn.style.display = normal ? 'none' : 'inline-block';
    manualConnect.style.display = normal ? 'block' : 'none';
    if (normal) {
        username.removeAttribute('readonly');
        infoHost.innerHTML = '';
        infoPort.innerHTML = '';
        infoStatus.innerHTML = 'Disconnected';
        memberList.innerHTML = '';
    };
};