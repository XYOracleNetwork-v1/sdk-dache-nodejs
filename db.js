const config = require('config');
const {Pool} = require('pg');

const pool = new Pool({
    user: config.get('db.user'),
    host: config.get('db.host'),
    database: config.get('db.database'),
    password: config.get('db.password'),
    port: config.get('db.port'),
});

module.exports.query = (text, params, callback) => {
    return pool.query(text, params, callback)
};

module.exports.getClient = async () => {
    return await pool.connect()
};