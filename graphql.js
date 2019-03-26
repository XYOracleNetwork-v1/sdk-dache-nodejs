const graphqlHTTP = require(`express-graphql`)
const { importSchema } = require(`graphql-import`)
const { makeExecutableSchema } = require(`graphql-tools`)
const storage = require(`./storage.js`)()

const resolvers = {
  Query: {
    events: (obj, args, context, info) => storage.getEvents(args),
    returnValues: (obj, args, context, info) => storage.findByReturnValues(args)
  }
}

module.exports = (app) => {
  const typeDefs = importSchema(`./graphql/root.graphql`)
  const schema = makeExecutableSchema({ typeDefs, resolvers })
  app.use(`/graphql`, graphqlHTTP({
    schema,
    graphiql: true
  }))
}
