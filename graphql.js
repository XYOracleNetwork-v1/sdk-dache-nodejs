const graphql = require(`graphql`)
const storage = require(`./storage.js`)()
const GraphQLJSON = require(`graphql-type-json`)

const EventType = new graphql.GraphQLObjectType({
  name: `Event`,
  fields: {
    transactionHash: { type: graphql.GraphQLString },
    contractName: { type: graphql.GraphQLString },
    eventName: { type: graphql.GraphQLString },
    blockNumber: { type: graphql.GraphQLInt },
    returnValues: { type: GraphQLJSON }
  }
})

const queryType = new graphql.GraphQLObjectType({
  name: `Query`,
  fields: {
    latestEvents: {
      type: new graphql.GraphQLList(EventType),
      args: {
        limit: { type: graphql.GraphQLInt, defaultValue: 25 }
      }
    },
    returnValues: {
      type: new graphql.GraphQLList(EventType),
      args: {
        key: { type: graphql.GraphQLString },
        value: { type: graphql.GraphQLString }
      }
    },
    kittyHistory: {
      type: new graphql.GraphQLList(EventType),
      args: {
        kittyId: { type: graphql.GraphQLInt }
      }
    }
  }
})

module.exports.schema = new graphql.GraphQLSchema({
  query: queryType
})

module.exports.root = {
  latestEvents: args => storage.getLatestEvents(args),
  returnValues: args => storage.findByReturnValues(args),
  kittyHistory: args => storage.getKittyHistory(args.kittyId)
}
