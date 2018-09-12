# dAche

An ethereum smart contract event cache. Query your smart contract events in ways that you can't do directly on the blockchain. A helpful development tool or a helpful addition to your production Dapp.

There are three components that dAche uses to track events:

- __Rebase__ starts from the block the contract was created and imports events from then until the block that the dAche was started at. This is disabled by default since the included contract has a lot of events !
- __Watch__ listens live for events on the contracts and immediately pulls them in
- __Scan__ runs at a defined offset from the newest block on chain, and re-imports events from this range. This is to compensate for any missed live events, which can happen.

## Setup

First copy `config/default.example.json` and rename to `default.json`.

By default, dAche will run with an in-memory database (NeDB) to get you up and running quick.

Postgres is also supported, so if you prefer that fill out the storage section of the config file with your database info:
```
"storage": {
    "type": "postgres",
    "database": "mydb",
    "host": "mydb.db.com",
    "password": "password",
    "user": "admin",
    "port": 5432
}
```

We have included the CryptoKittiesCore contract that you can watch live on the mainnet!

To start dAche, `npm install` then `npm start`.

## Querying

There is a simple GraphQL layer for the dAche API implemented.

Visit http://localhost:4000/graphql to view the built-in GrapgQL query interface.

To see the latest events (ordered by newest blocks):
```
{
  latestEvents {
    eventName
    blockNumber
    returnValues
  }
}
```

We have implemented an example query to show how you can query the events in a way you can't directly on the blockchain.
To see a history (birth, any transfers and any instance where it is a parent) for a given kittyId:
```
{
  kittyHistory(kittyId: 998570) {
    eventName
    blockNumber
    returnValues
  }
}
```

## Historic Events

By default, you will see `rebase.enabled` is turned off in the config file. If you enable this option, dAche will historically scan all events since contract creation and import them in. 

Would not recommend enabling this for the CryptoKittiesCore contract unless you have a big database ;)

`rebase.blockScanIncrement` is the page size for scanning blocks for events to import. You can adjust this for performance reasons if needed.

## Other options

Options for `ethereum.network`:
-  mainnet
-  ropsten
-  rinkeby
-  kovan


To use S3 to load contracts instead of a local directory, update the config to have the following entries:
```
"aws": {
    "accessKeyId": "123",
    "secretAccessKey": "456",
    "region": "us-east-1"
},
"contractSource": {
    "type": "s3",
    "bucketName": "mybucket",
    "keyPrefix": "abi/mainnet/"
}
```

For the Scan component, you can adjust `sync.blockScanOffset`. This is how many blocks you want to wait before reimporting events that were picked up live.

For the  