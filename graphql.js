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
    events: {
      type: new graphql.GraphQLList(EventType),
      args: {
        contractName: { type: graphql.GraphQLString },
        eventName: { type: graphql.GraphQLString },
        limit: { type: graphql.GraphQLInt},
        order: { type: graphql.GraphQLInt, defaultValue: -1 }
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
        kittyId: { type: graphql.GraphQLString }
      }
    }
  }
})

module.exports.schema = new graphql.GraphQLSchema({
  query: queryType
})

module.exports.root = {
  events: args => storage.getEvents(args),
  returnValues: args => storage.findByReturnValues(args),
  kittyHistory: args => storage.getKittyHistory(args.kittyId)
}
