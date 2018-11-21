const express = require(`express`)
const graphqlHTTP = require(`express-graphql`)
const graphql = require(`./graphql.js`)

const ContractLoader = require(`./ContractLoader.js`)

const contracts = {}

ContractLoader.loadContracts().then((loadedContracts) => {
  loadedContracts.forEach((contract) => {
    // contract.listenForEvents()
    contract.sync()
    contracts[contract.name] = contract
  })
}).catch((error) => {
  console.error(error)
  process.exit(1)
})

const app = express()
app.use(`/graphql`, graphqlHTTP({
  schema: graphql.schema,
  rootValue: graphql.root,
  graphiql: true
}))

app.get(`/balances/:contractName`, async (req, res) => {
  const balances = await contracts[req.params.contractName].getTokenBalances()
  let csv = `address,balance\r\n`
  Object.keys(balances).forEach((address) => {
    csv += `${address},${balances[address]}\r\n`
  })
  res.attachment(`balances.csv`)
  res.send(csv)
})

app.listen(4000, () => {
  console.log(`Running a GraphQL API server on port 4000`)
})
