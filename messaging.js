const g = document.getElementById.bind(document);

document.addEventListener('keydown', event => {
    if (event.key === 'Enter' && document.activeElement === g('messageInput')){
        sendMessage();
    };
})

function sendMessage(){
    g('messageInput').value = null;
};