const ContractLoader = require('./ContractLoader.js');


ContractLoader.loadContracts().then(contracts => {
    contracts.forEach(contract => {
        contract.listenForEvents();
        contract.sync();
    })
}).catch(error => {
    console.error(error);
    process.exit(1);
});