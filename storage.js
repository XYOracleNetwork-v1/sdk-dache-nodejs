const config = require(`config`)
const NeDBStorage = require(`./adapters/storage/NeDBStorage.js`)
const PostgresStorage = require(`./adapters/storage/PostgresStorage.js`)

let storage

module.exports = () => {
  const storageType = config.get(`storage.type`)
  switch (storageType) {
    case `nedb`:
      if (!storage) {
        storage = new NeDBStorage()
      }
      break
    case `postgres`:
      if (!storage) {
        storage = new PostgresStorage()
      }
      break
    default:
      throw new Error(`Unknown storage type: ${storageType}`)
  }
  return storage
}
