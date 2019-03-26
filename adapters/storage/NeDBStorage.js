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
      this.eventsCollection.remove({ contractName, transactionHash: { $in: transactionHashes } }, { multi: true })
    }
    events.forEach((event) => {
      event.contractName = contractName
      event.eventName = event.event
      delete event.raw
    })
    this.eventsCollection.insert(events)
  }

  static async getPaginationFromQuery (collection, query, page, perPage) {
    const skip = page * perPage
    const count = await NeDBStorage.count(collection, query)
    const numPages = Math.ceil(count / perPage)
    return { skip, numPages, count }
  }

  async getEvents (args) {
    const {
      contractName, eventName, page, perPage, order, returnValuesKey, returnValuesValue
    } = args
    const query = {}
    if (contractName) {
      query.contractName = contractName
    }
    if (eventName) {
      query.eventName = eventName
    }
    if (returnValuesKey && returnValuesValue) {
      query[`returnValues.${returnValuesKey}`] = returnValuesValue
    }
    const { skip, numPages, count } = await NeDBStorage.getPaginationFromQuery(this.eventsCollection, query, page, perPage)
    const find = this.eventsCollection.find(query).sort({ blockNumber: order }).skip(skip).limit(perPage)
    return {
      items: await NeDBStorage.executeQuery(find),
      pagination: NeDBStorage.getPagination(page, numPages, count)
    }
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

  static count (collection, query) {
    return new Promise((resolve, reject) => {
      collection.count(query, (err, count) => {
        if (err) {
          reject(err)
        } else {
          resolve(count)
        }
      })
    })
  }
}

module.exports = NeDBStorage
