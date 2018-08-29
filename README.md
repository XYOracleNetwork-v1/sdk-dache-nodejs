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
