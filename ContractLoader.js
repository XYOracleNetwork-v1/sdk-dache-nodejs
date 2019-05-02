const fs = require(`fs`)
const AWS = require(`aws-sdk`)
const config = require(`config`)

const s3 = new AWS.S3()
const Contract = require(`./Contract`)
const IpfsAPI = require(`ipfs-api`)

const Web3 = require(`web3`)

const web3 = {
  http: new Web3(new Web3.providers.HttpProvider(config.get(`ethereum.web3HttpUrl`))),
  websocket: new Web3(new Web3.providers.WebsocketProvider(config.get(`ethereum.web3WebsocketUrl`)))
}

let load

switch (config.get(`contractSource.type`)) {
  case `ipfs`:
    load = loadFromIpfs
    break
  case `s3`:
    load = loadFromS3
    break
  default:
    load = loadFromFilesystem
}

exports.loadContracts = async () => {
  const contractJsons = await load()
  const contracts = []
  let onlyLoadContracts
  if (config.has(`contractSource.contracts`)) {
    onlyLoadContracts = config.get(`contractSource.contracts`)
  }
  contractJsons.forEach((contractJson) => {
    if (Contract.getAddressFromJson(contractJson) != null &&
      Contract.getTransactionHashFromJson(contractJson) != null) {
      const contract = new Contract(web3, contractJson)
      if (contract.hasEvents() && (!onlyLoadContracts || onlyLoadContracts.includes(contract.name))) {
        contracts.push(contract)
        console.log(`Loaded ${contract.name}`)
      }
    }
  })
  if (contracts.length === 0) {
    throw new Error(`Found no contracts to watch`)
  }
  return contracts
}

async function loadFromIpfs () {
  const directoryHash = config.get(`contractSource.directoryHash`)
  const ipfs = new IpfsAPI({
    host: config.get(`contractSource.host`),
    port: config.get(`contractSource.port`),
    protocol: config.get(`contractSource.protocol`)
  })
  return new Promise((resolve, reject) => {
    const contractJsons = []
    ipfs.get(directoryHash, (err, files) => {
      if (err) {
        return reject(err)
      }
      files.forEach((file) => {
        if (file.content) {
          contractJsons.push(JSON.parse(String(file.content)))
        }
      })
      return resolve(contractJsons)
    })
  })
}

function loadFromFilesystem () {
  const localDirectory = config.get(`contractSource.directory`)

  const contractJsons = []
  fs.readdirSync(localDirectory)
    .forEach(fileName => contractJsons.push(JSON.parse(fs.readFileSync(`${localDirectory}/${fileName}`)
      .toString())))
  if (contractJsons.length === 0) {
    throw new Error(`Found no contracts to load`)
  }
  return contractJsons
}

async function loadFromS3 () {
  const accessKeyId = config.get(`aws.accessKeyId`)
  const secretAccessKey = config.get(`aws.secretAccessKey`)
  const region = config.get(`aws.region`)
  AWS.config.update(
    {
      accessKeyId,
      secretAccessKey,
      region
    }
  )
  const bucketName = config.get(`contractSource.bucketName`)
  const keyPrefix = config.get(`contractSource.keyPrefix`)
  const params = {
    Bucket: bucketName,
    Prefix: keyPrefix
  }
  return new Promise((resolve, reject) => {
    s3.listObjects(params, async (err, data) => {
      if (err) {
        reject(err)
      } else if (data.Contents && data.Contents.length > 0) {
        const keys = data.Contents.map(item => item.Key)
        const promises = []
        keys.forEach(key => promises.push(getContractFromS3(bucketName, key)))
        const contractObjects = await Promise.all(promises)
        const contractJsons = []
        contractObjects.forEach(contractObject => contractJsons.push(JSON.parse(contractObject.Body.toString())))
        resolve(contractJsons)
      } else {
        reject(new Error(`Found no contracts to load from bucket ${bucketName}, prefix ${keyPrefix}`))
      }
    })
  })
}

async function getContractFromS3 (bucketName, key) {
  const params = {
    Bucket: bucketName,
    Key: key
  }
  return new Promise((resolve, reject) => {
    s3.getObject(params, (err, data) => {
      if (err) {
        reject(err)
      } else if (data) {
        resolve(data)
      } else {
        reject(new Error(`Could not retrieve contract ${key} from bucket ${bucketName}`))
      }
    })
  })
}
