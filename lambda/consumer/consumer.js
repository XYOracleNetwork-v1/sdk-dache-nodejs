const persistence = require('./persistence');

exports.consume = (contractName, eventJson) => {
    return persistence.saveTransactionAndEvent(contractName, eventJson);
};