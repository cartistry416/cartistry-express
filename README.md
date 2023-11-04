## How to Start Local MongoDB instance in WSL ##

`mongod --bind_ip_all`
`ip addr | grep eth0`
The connection URI is `mongodb://{YOUR_IP_ADDRESS}:27017`


To start the server run `npm run build && npm run start`

To run unit tests run `npm run build && npm test`