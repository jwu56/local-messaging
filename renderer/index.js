const http = require('http');
const WebSocketServer = require('websocket').server;
const { networkInterfaces } = require('os');

const g = document.getElementById.bind(document);
const hostBtn = g('hostBtn');

g('getIP').onclick = () => g('hostAddress').value = networkInterfaces().WiFi[1].address;

let host, port;

hostBtn.addEventListener('click', hostServer);

function hostServer(){
    let history = [];
    let clients = [];

    host = g('hostAddress').value;
    port = g('port').value;

    if (!host || !port) {
        g('error').innerHTML = 'Please enter a host and port';
        return;
    }

    const server = http.createServer((req, res) => {});
    server.on('error', () => newLocalSystemMessage('There was an error hosting the server, make sure your host (your ip address) and port (make sure there is no other traffic on this port) are correct'))
    server.listen(port, host, setupWs);

    function setupWs(){
        console.log(`Server listening at http://${host}:${port}`);
        const wss = new WebSocketServer({
            httpServer: server
        });
        wss.on('request', request => {
            const connection = request.accept(null, request.origin);
            const index = clients.push(connection) - 1;

            if (history.length > 0) {
                connection.sendUTF(JSON.stringify({ type: 'history', data: history} ));
            }

            connection.on('message', message => {
                if (message.type === 'utf8') {
                    const message = message.utf8Data;
                    history.push(JSON.parse(message));

                    for (let i = 0; i < clients.length; i++){
                        clients[i].sendUTF(message);
                    };
                };
            });
        
            connection.on('close', connection => {
                clients.splice(index, 1);
            });
        });
    }
};

function connectToServer(){
    
}
document.addEventListener('keydown', event => {
        if (event.key === 'Enter' && document.activeElement === g('messageInput')){
            sendMessage();
        };
    });

function newLocalSystemMessage(message){
    const systemMessage = document.createElement('div');
    systemMessage.innerHTML = `<em><strong>System: </strong>${message}</em>`;
    g('chatBox').appendChild(systemMessage);
};

/*
message = {
    type: '',
    time: '',
    author: '',
    content: ''
}
*/