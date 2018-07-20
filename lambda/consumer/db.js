const {Pool} = require('pg');

const pool = new Pool();

module.exports.query = (text, params, callback) => {
    return pool.query(text, params, callback)
};

module.exports.getClient = async () => {
    return await pool.connect()
};