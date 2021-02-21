## Local Messaging
A simple messaging app for use over local networks.

The main purpose of this app is for use on networks that have blocked social media sites, such as school WiFi. As the app hosts a server locally on the host's computer, it bypassess all restrictions on the network. The app is placed on your [system tray](#additional-features), so you can hide the app without it quitting. 

### Hosting
Press the `Host Server` button under the chatbox, and a server will be automatically created using your IP address on port 121.

Your host address will be displayed on the top of the app, which will allow other people to connect to the server if they are manually connecting.

### Connecting
You can only connect to servers that are on the same WiFi network as you.  
There are three ways to connect to a server:
* ##### Scan for open servers on the network
    This option should be used when you **do not know the IP address** of the server you are connecting to.

    Press the `Search for Servers` button, and the app will automatically scan your entire local network for open servers. Once a server or multiple servers have been found, they will pop up as buttons with the host's name and IP address. Clicking on it will connect you to the server. NOTE: This option may cause lag on your computer, and may take up to a minute or multiple minutes depending on how powerful your computer is and the size of the network.

    **Configuration options:**
    * End search when server found? - If checked, the app will stop scanning once a server has been found - this is reccommended if you are only searching for a single server.
    * Auto-join when server found? - If checked, the app will end the search when a server is found, and automatically join it.
* ##### Manually connect to an IP address
    This option should be used if you **do know the IP address** of the server you are connecting to.

    Enter the full host address of the host server, and press `Connect`. You should then be connected to the server if you have entered the address correctly, and there is an open server on the network.
* ##### Recent connections
    This option should be used if you are **reconnecting to a server** you have joined this session.

    Buttons displaying host name and IP address will be created for each server that you have recently connected to in the current session (quitting the app will end the session). Only the 5 most recent connections will be shown. NOTE: Recent connections are shown regardless of whether they are online or offline, meaning that it is possible not all connections shown are still being hosted.

### Additional Features
* **Username** - You can change your username from the default randomly generated username in the top of the screen, under Host Address, Port and Status. You will not be able to change it if you are connected to a server.
* **Connections** - A list of members in the server you are currently connected to.
* **WiFi** indicator - A WiFi symbol indicating whether you are connected to WiFi - you are required to be connected to a network for the app to work.
* **System Tray** - The app will be hidden to your tray (the list of app icons on the right of your taskbar) when you close it (press the `X`), and you can show it again by pressing the app's icon in the tray. To quit the app, right click it in the tray and press `Quit`. Additionally, the app's icon will turn blue when it receives a notification such as a new message or server found when scanning the network.