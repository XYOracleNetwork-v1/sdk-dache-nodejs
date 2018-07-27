const Contract = require('./Contract.js');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.WEB3_WS_PROVIDER_URL));

Contract.loadAndStartListening(web3);