const config = require(`config`)
const StorageInterface = require(`./StorageInterface.js`)

const pgOptions = {
  capSQL: true,
  receive: (data, result, e) => {
    camelizeColumns(data)
  }
}

const pgp = require(`pg-promise`)(pgOptions)

const camelizeColumns = (data) => {
  const template = data[0]
  if (!template) {
    return
  }
  Object.keys(template).forEach((prop) => {
    const camel = pgp.utils.camelize(prop)
    if (!(camel in template)) {
      for (let i = 0; i < data.length; i++) {
        const d = data[i]
        d[camel] = d[prop]
        delete d[prop]
      }
    }
  })
}

const transactionColumnSet = new pgp.helpers.ColumnSet([
  {
    name: `transaction_hash`,
    prop: `transactionHash`
  },
  {
    name: `block_number`,
    prop: `blockNumber`
  }], { table: `blockchain_transactions` })

const eventColumnSet = new pgp.helpers.ColumnSet([
  {
    name: `contract_name`,
    prop: `contractName`
  },
  {
    name: `event_name`,
    prop: `eventName`
  },
  {
    name: `log_index`,
    prop: `logIndex`
  },
  {
    name: `transaction_hash`,
    prop: `transactionHash`
  },
  {
    name: `return_values`,
    prop: `returnValues`
  }], { table: `blockchain_events` })

class PostgresStorage extends StorageInterface {
  constructor () {
    super()
    this.db = pgp({
      user: config.get(`storage.user`),
      host: config.get(`storage.host`),
      database: config.get(`storage.database`),
      password: config.get(`storage.password`),
      port: config.get(`storage.port`)
    })
  }

  async save (contractName, events, deleteExisting = false) {
    events.forEach((event) => {
      event.contractName = contractName
      event.eventName = event.event
    })
    return this.db.tx((t) => {
      const transactionQuery = `${pgp.helpers.insert(events, transactionColumnSet)} ON CONFLICT ON CONSTRAINT blockchain_transactions_transaction_hash_pk DO NOTHING`
      const eventQuery = `${pgp.helpers.insert(events, eventColumnSet)} ON CONFLICT ON CONSTRAINT blockchain_events_transaction_hash_log_index_pk DO NOTHING`

      let deleteEvents
      if (deleteExisting) {
        const transactionHashes = events.map(event => event.transactionHash)
        deleteEvents = t.none(`DELETE FROM blockchain_events WHERE transaction_hash = ANY($1)`, [transactionHashes])
      }

      const insertTransactions = t.none(transactionQuery)
      const insertEvents = t.none(eventQuery)

      const queries = []
      if (deleteEvents) {
        queries.push(deleteEvents)
      }
      queries.push(insertTransactions)
      queries.push(insertEvents)

      return t.batch(queries)
    })
  }

  async getEvents (args) {
    const {
      contractName, eventName, page, perPage, order, returnValuesKey, returnValuesValue
    } = args
    let query = `WHERE t.transaction_hash = e.transaction_hash`
    if (contractName) {
      query += ` AND contract_name = $(contractName)`
    }
    if (eventName) {
      query += ` AND event_name = $(eventName)`
    }
    if (returnValuesKey && returnValuesValue) {
      query += ` AND e.return_values->>$(returnValuesKey) = $(returnValuesValue)`
    }
    const tables = `blockchain_transactions t, blockchain_events e`
    const { skip, numPages, count } = await this.getPaginationFromQuery(tables, query, page, perPage, args)
    const orderLimit = ` ORDER BY t.block_number ${order === -1 ? `DESC` : `ASC`} OFFSET $(skip) LIMIT ${perPage}`
    const queryParams = { skip }
    Object.assign(queryParams, args)
    return {
      items: await this.db.any(`SELECT * FROM ${tables} ${query} ${orderLimit}`, queryParams),
      pagination: PostgresStorage.getPagination(page, numPages, count)
    }
  }

  async getPaginationFromQuery (table, query, page, perPage, queryParams) {
    const skip = page * perPage
    const countResult = await this.db.one(`SELECT count(*) as count FROM ${table} ${query}`, queryParams)
    const { count } = countResult
    const numPages = Math.ceil(count / perPage)
    return {
      skip,
      numPages,
      count
    }
  }
}

module.exports = PostgresStorage
