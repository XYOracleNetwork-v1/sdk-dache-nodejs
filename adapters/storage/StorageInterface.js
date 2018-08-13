class StorageInterface {

    saveTransactionAndEvent(contractName, event) {
        throw new Error('Not implemented');
    }

    getUnconfirmedTransactionHashes(blockNumber) {
        throw new Error('Not implemented');
    }

    confirmTransactionHashes(transactionHashes) {
        throw new Error('Not implemented');
    }

    revertTransactionHashes(transactionHashes) {
        throw new Error('Not implemented');
    }

}

module.exports = StorageInterface;