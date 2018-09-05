# dAche

An ethereum smart contract event cache. Pull in historic events, watch for live events and query your smart contract events in ways that you can't do directly on the blockchain. A helpful development tool or a helpful addition to your production Dapp.

## Setup

First copy `config/default.example.json` and rename to `default.json`.

You will need a local or remote instance of postgres running.  Create the tables defined in `database/postgres-tables.sql`.

Fill out the storage section of the config file with your database info:
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

We have included the CryptoKittiesCore contract that you can watch live on the mainnet. 

To start dAche, `npm install` then `npm start`.

After a few minutes, check out some of the most recent events coming out of the CryptoKittiesCore contract !

```
SELECT t.block_number, e.event_name, e.metadata
FROM blockchain_transactions t, blockchain_events e
WHERE t.transaction_hash = e.transaction_hash
ORDER BY t.block_number DESC LIMIT 10
```

The metadata field is where all the return values of the events are. 

## Historic Events

By default, you will see `rebase.enabled` is turned off in the config file. If you enable this option, dAche will historically scan all events since contract creation and import them in. 

Would not recommend enabling this for the CryptoKittiesCore contract unless you have a big database ;)

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