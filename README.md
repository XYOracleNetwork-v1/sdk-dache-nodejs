[logo]: https://cdn.xy.company/img/brand/XYO_full_colored.png

[![logo]](https://xyo.network)

# dAche

![](https://github.com/XYOracleNetwork/sdk-dache-nodejs/workflows/CI/badge.svg?branch=develop) [![Codacy Badge](https://api.codacy.com/project/badge/Grade/1f31c7fa87694b8eab91a2d71f74b697)](https://www.codacy.com/app/arietrouw/sdk-dache-nodejs?utm_source=github.com&utm_medium=referral&utm_content=XYOracleNetwork/sdk-dache-nodejs&utm_campaign=Badge_Grade) [![Maintainability](https://api.codeclimate.com/v1/badges/f3dd4f4d35e1bd9eeabc/maintainability)](https://codeclimate.com/github/XYOracleNetwork/sdk-dache-nodejs/maintainability) [![BCH compliance](https://bettercodehub.com/edge/badge/XYOracleNetwork/sdk-dache-nodejs?branch=master)](https://bettercodehub.com/)
[![Known Vulnerabilities](https://snyk.io/test/github/XYOracleNetwork/sdk-dache-nodejs/badge.svg?targetFile=package.json)](https://snyk.io/test/github/XYOracleNetwork/sdk-dache-nodejs?targetFile=package.json)

## Table of Contents

-   [Title](#dAche)
-   [Description](#description)
-   [dAche event tracking](#dache-event-tracking)
-   [Setup](#setup)
-   [Maintainers](#maintainers)
-   [License](#license)
-   [Credits](#credits)

## Description

An ethereum smart contract event cache. Query your smart contract events in ways that you can't do directly on the blockchain. A helpful development tool or a helpful addition to your production Dapp.

## dAche Event Tracking

There are three components that dAche uses to track events:

-   **Rebase** starts from the block the contract was created and imports events from then until the block that the dAche was started at. This is disabled by default since the included contract has a lot of events !
-   **Watch** listens live for events on the contracts and immediately pulls them in
-   **Scan** runs at a defined offset from the newest block on chain, and re-imports events from this range. This is to compensate for any missed live events, which can happen.

## Setup

First copy `config/default.example.json` and rename to `default.json`.

By default, dAche will run with an in-memory database (NeDB) to get you up and running quick.

Postgres is also supported, so if you prefer that fill out the storage section of the config file with your database info:

    "storage": {
        "type": "postgres",
        "database": "mydb",
        "host": "mydb.db.com",
        "password": "password",
        "user": "admin",
        "port": 5432
    }

To start dAche, `npm install` then `npm start`.

## Example 1: Querying CryptoKittiesCore

There is a simple GraphQL layer for the dAche API implemented.

Visit <http://localhost:4000/graphql> to view the built-in GrapgQL query interface.

To see the latest events (ordered by newest blocks by default (order: -1):

    {
      events {
        items {
          contractName
          eventName
          blockNumber
          returnValues
        }
      }
    }

We have implemented example queries to show how you can query the events in a way you can't directly on the blockchain.
To query all events by a given return value key/value:

    {
      events (
        returnValuesKey: "kittyId", 
        returnValuesValue: "5436") {
        items {
          contractName
          eventName
          blockNumber
          returnValues
        }
      }
    }

## Example 2: Generating a token holder balances report

This is an example of a non-grapql use of the Dache. This is a GET endpoint that will return all current token holders of a token contract (a csv of address, balance). We have included the XYO Token contract as an example.

Stop the dAche. Update the contractSource.contracts, replace CryptoKittiesCore with XYO. Change rebase.enabled to true. Start the dAche.

Visit <http://localhost:4000/balances/XYO> and 

## Historic Events (Rebase)

By default, you will see `rebase.enabled` is turned off in the config file. If you enable this option, dAche will historically scan all events since contract creation and import them in. 

Would not recommend enabling this for the CryptoKittiesCore contract unless you have a big database ;)

`rebase.blockScanIncrement` is the page size for scanning blocks for events to import. You can adjust this for performance reasons if needed.

## Other options

Options for `ethereum.network`:

-   mainnet
-   ropsten
-   rinkeby
-   kovan

To us IPFS to load contracts, update the config to have the following entries:

    "contractSource": {
        "type": "ipfs",
        "directoryHash": "QmWA8zB1zkEMGmKnD8PNHrJuQPW5hfV5NrYjYMvB6jB1Ac",
        "host": "ipfs.xyo.network",
        "protocol": "https",
        "port": 5002
    }

To use S3 to load contracts instead of a local directory, update the config to have the following entries:

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

To only load specific contract(s) from a source, include the "contracts" key as noted below

      "contractSource": {
        "type": "local",
        "directory": "./examples/contracts",
        "contracts": [
          "CryptoKittiesCore"
        ]
      }

For the Scan component, you can adjust `sync.blockScanOffset`. This is how many blocks you want to wait before reimporting events that were picked up live.

## Maintainers

- Arie Trouw

## License

See the [LICENSE](LICENSE) file for license details.

## Credits

Made with 🔥and ❄️ by [XYO](https://www.xyo.network)

