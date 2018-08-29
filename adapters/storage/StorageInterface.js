class StorageInterface {

    saveTransactionsAndEvents(contractName, events, deleteExisting = false) {
        throw new Error('Not implemented');
    }

}

module.exports = StorageInterface;