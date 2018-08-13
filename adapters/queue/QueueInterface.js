class QueueInterface {

    enqueueItem(contract, event) {
        throw new Error('Not implemented');
    }

    getItems() {
        throw new Error('Not implemented');
    }

    dequeueItem(item) {
        throw new Error('Not implemented');
    }

}

module.exports = QueueInterface;