# ether-cache

To set up, first rename `config/default.example.json` to `default.json` and fill out applicable values.

Options for `ethereum.network`:
-  mainnet
-  ropsten
-  rinkeby
-  kovan

We have included the CryptoKittiesCore contract that you can watch live on mainnet.


To use S3 to load contracts instead of a local directory, change the source in the config to:

```
"contractSource": {
    "type": "s3",
    "bucketName": "mybucket",
    "keyPrefix": "abi/mainnet/"
}
```

## Watcher

This component watches loaded contracts for all events and enqueues to an AWS SQS FIFO queue.

To start: `npm run-script start-watcher`

## Consumer

This component consumes from the queue and persists transaction/events to a database.

To start: `npm run-script start-consumer`

## Confirmer

This component confirms transactions that were consumed after a configured amount of blocks have passed.

To start: `npm run-script start-confimer`

