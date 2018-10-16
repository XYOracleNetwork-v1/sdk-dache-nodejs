const Datastore = require(`nedb`)
const StorageInterface = require(`./StorageInterface.js`)

class NeDBStorage extends StorageInterface {
  constructor () {
    super()
    this.eventsCollection = new Datastore()
    this.eventsCollection.ensureIndex({ fieldName: `transactionHash` })
  }

  save (contractName, events, deleteExisting = false) {
    if (deleteExisting) {
      const transactionHashes = events.map(event => event.transactionHash)
      this.eventsCollection.remove({ transactionHash: { $in: transactionHashes } }, { multi: true })
    }
    events.forEach((event) => {
      event.contractName = contractName
      event.eventName = event.event
      delete event.raw
    })
    this.eventsCollection.insert(events)
  }

  getKittyHistory (kittyId) {
    const kittyIdString = kittyId.toString()
    const query = {
      $or: [
        { 'returnValues.kittyId': kittyIdString },
        { 'returnValues.matronId': kittyIdString },
        { 'returnValues.sireId': kittyIdString },
        { 'returnValues.tokenId': kittyIdString }
      ]
    }
    const find = this.eventsCollection.find(query).sort({ blockNumber: 1 })
    return NeDBStorage.executeQuery(find)
  }

  getLatestEvents (args) {
    let find = this.eventsCollection.find().sort({ blockNumber: -1 })
    if (args.limit) {
      find = find.limit(args.limit)
    }
    return NeDBStorage.executeQuery(find)
  }

  static executeQuery (query) {
    return new Promise((resolve, reject) => {
      query.exec((err, docs) => {
        if (err) {
          reject(err)
        } else {
          resolve(docs)
        }
      })
    })
  }
}

module.exports = NeDBStorage
