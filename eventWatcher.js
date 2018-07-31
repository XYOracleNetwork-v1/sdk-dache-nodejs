const ContractLoader = require('./ContractLoader.js');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.WebsocketProvider(process.env.WEB3_WS_PROVIDER_URL));

ContractLoader.loadContracts(web3).then(contracts => {
    contracts.forEach(contract => contract.listenForEvents())
}).catch(error => {
    console.error(error);
    process.exit(1);
});