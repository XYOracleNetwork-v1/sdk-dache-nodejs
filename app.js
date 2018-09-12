const express = require('express');
const graphqlHTTP = require('express-graphql');
const graphql = require('./graphql.js');

const ContractLoader = require('./ContractLoader.js');

ContractLoader.loadContracts().then(contracts => {
    contracts.forEach(contract => {
        contract.listenForEvents();
        contract.sync();
    })
}).catch(error => {
    console.error(error);
    process.exit(1);
});

const app = express();
app.use('/graphql', graphqlHTTP({
    schema: graphql.schema,
    rootValue: graphql.root,
    graphiql: true,
}));
app.listen(4000, ()=> {
    console.log('Running a GraphQL API server on port 4000');
});