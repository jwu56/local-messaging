const http = require('http');
const WebSocket = require('ws');

const { networkInterfaces } = require('os');

const g = document.getElementById.bind(document);
const hostBtn = g('hostBtn');
const connectBtn = g('connectBtn');
const chatBox = g('chatBox');
const config = g('config');

function getIp(){
    const networks = networkInterfaces().WiFi;
    return networks.filter(network => network.family === "IPv4")[0].address;
};

g('getIP').onclick = () => g('hostAddress').value = getIp();

let host, port, wss, server;

hostBtn.addEventListener('click', hostServer);
connectBtn.addEventListener('click', () => connectToServer(false))

function hostServer(){
    if (!g('username').value) {
        configError('Please enter a username');
        return;
    };

    host = g('hostAddress').value;
    port = g('port').value;

    if (!host || !port ) {
        configError('Please enter a host and port');
        return;
    }

    let history = [];

    server = http.createServer((req, res) => {});
    server.on('error', () => {
        server.close(); 
        parseMessage(JSON.parse(newMessage('system', 'Local System', 'There was an error hosting the server, make sure your host (your ip address) and port (make sure there is no other traffic on this port) are correct')));
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
                    const msg = newMessage('system', 'Global System', `${reason} has left`);
                    history.push(msg);
                    sendToAll(msg);
                };
            });

            function sendToAll(message){
                wss.clients.forEach(ws => ws.send(message))
            };
        });
        
        connectToServer(true, {host: host, port: port})
    }
};

function connectToServer(hoster, options){
    if (hoster){
        host = options.host;
        port = options.port;
    } else {
        if (!g('username').value) {
            configError('Please enter a username');
            return;
        };

        host = g('hostAddress').value;
        port = g('port').value;

        if (!host || !port) {
            configError('Please enter a host and port');
            return;
        }
        chatBox.innerHTML += '<div>=========================</div>'
    };
    parseMessage(JSON.parse(newMessage('system', 'Local System', `Connected to http://${host}:${port}`)));

    g('username').readOnly = 'true';
    g('infoHost').innerHTML = host;
    g('infoPort').innerHTML = port;

    const ws = new WebSocket(`http://${host}:${port}`);

    ws.on('open', () => { //send join message
        ws.send(newMessage('system', 'Global System', `${g('username').value} has joined`));
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
        parseMessage(JSON.parse(newMessage('system', 'Local System', 'Connection closed')));
        g('hostBtn').style.display = 'inline-block';
        g('connectBtn').style.display = 'inline-block';
        g('disconnectBtn').style.display = 'none';

        g('username').readOnly = 'false';
        g('infoHost').innerHTML = '';
        g('infoPort').innerHTML = '';
        document.removeEventListener('keydown', sendMessage);
    });

    document.addEventListener('keydown', sendMessage);
    function sendMessage(event){
        if (event.key === 'Enter' && document.activeElement === g('messageInput')){
            ws.send(newMessage('message', g('username').value || 'Guest', g('messageInput').value));
            g('messageInput').value = '';
        };
    };

    g('hostBtn').style.display = 'none';
    g('connectBtn').style.display = 'none';
    g('disconnectBtn').style.display = 'inline-block';

    g('disconnectBtn').onclick = disconnectAll;

    function disconnectAll(){
        if (wss) wss.close(); //close all things
        if (server) server.close();
        ws.close(1000, g('username').value);
    
        g('hostBtn').style.display = 'inline-block';
        g('connectBtn').style.display = 'inline-block';
        g('disconnectBtn').style.display = 'none';

        g('username').readOnly = 'false';
        g('infoHost').innerHTML = '';
        g('infoPort').innerHTML = '';
    };
};

function parseMessage(data){
    console.log(data);
    const message = document.createElement('div');
    message.innerHTML = `${data.type === 'system' ? '<em>' : ''}<em>${data.time} </em><strong>${data.username}: </strong>${data.data}${data.type === 'system' ? '</em>' : ''}`;
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
    g('error').innerHTML = error;
    setTimeout(() => g('error').innerHTML = '', 3000);
};

function scrollDown(){
    //const isScrolledToBottom = chatBox.scrollHeight - chatBox.clientHeight <= chatBox.scrollTop + 1;
    /* if(isScrolledToBottom) */ chatBox.scrollTop = chatBox.scrollHeight - chatBox.clientHeight;
}

function toggleConfig(){
    config.style.display = config.style.display === 'none' ? 'block' : 'none';
};