const express = require(`express`)
const config = require(`config`)
const cors = require(`cors`)
const graphql = require(`./graphql.js`)

const port = config.get(`port`)

const ContractLoader = require(`./ContractLoader.js`)

const contracts = {}

ContractLoader.loadContracts().then((loadedContracts) => {
  loadedContracts.forEach((contract) => {
    contract.listenForEvents()
    contract.sync()
    contracts[contract.name] = contract
  })
}).catch((error) => {
  console.error(error)
  process.exit(1)
})

const app = express()

app.use(cors())

graphql(app)

app.get(`/balances/:contractName`, async (req, res) => {
  const balances = await contracts[req.params.contractName].getTokenBalances()
  let csv = `address,balance\r\n`
  Object.keys(balances).forEach((address) => {
    csv += `${address},${balances[address]}\r\n`
  })
  res.attachment(`balances.csv`)
  res.send(csv)
})

app.listen(port, () => {
  console.log(`Running a GraphQL API server on port ${port}`)
})
