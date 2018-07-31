const fs = require('fs');
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const Contract = require('./Contract');

let load;

if (process.env.CONTRACT_SOURCE === 's3') {
    load = loadFromS3;
} else {
    load = loadFromFilesystem;
}

exports.loadContracts = async (web3) => {
    const contractJsons = await load(web3);
    const contracts = [];
    contractJsons.forEach(contractJson => {
        if (Contract.getAddressFromJson(contractJson) != null) {
            const contract = new Contract(web3, contractJson);
            if (contract.hasEvents()) {
                contracts.push(contract)
            }
        }
    });
    if (contracts.length === 0) {
        throw new Error('Found no contracts to watch');
    }
    return contracts;

};

function loadFromFilesystem(web3) {
    const contractJsons = [];
    fs.readdirSync('./contracts').forEach(fileName => contractJsons.push(require(`./contracts/${fileName}`)));
    if (contractJsons.length === 0) {
        throw new Error('Found no contracts to load')
    }
    return contractJsons;
}

const bucketName = process.env.CONTRACT_S3_BUCKET_NAME;
const keyPrefix = process.env.CONTRACT_S3_KEY_PREFIX;

async function loadFromS3(web3) {
    const params = {
        Bucket: bucketName,
        Prefix: keyPrefix,
    };
    return new Promise((resolve, reject) => {
        s3.listObjects(params, async function (err, data) {
            if (err) {
                reject(err);
            } else if (data.Contents && data.Contents.length > 0) {
                const keys = data.Contents.map(item => item.Key);
                const promises = [];
                keys.forEach(key => promises.push(getContractFromS3(key)));
                const contractObjects = await Promise.all(promises);
                const contractJsons = [];
                contractObjects.forEach(contractObject => contractJsons.push(JSON.parse(contractObject.Body.toString())));
                resolve(contractJsons);
            } else {
                reject(`Found no contracts to load from bucket ${bucketName}, prefix ${keyPrefix}`);
            }
        });
    });
}

async function getContractFromS3(key) {
    const params = {
        Bucket: bucketName,
        Key: key
    };
    return new Promise((resolve, reject) => {
        s3.getObject(params, function (err, data) {
            if (err) {
                reject(err);
            } else if (data) {
                resolve(data);
            } else {
                reject(`Could not retrieve contract ${key} from bucket ${bucketName}`);
            }
        });
    });
}