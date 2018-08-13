const StorageInterface = require('./StorageInterface.js');
const config = require('config');

const {Pool} = require('pg');

const pool = new Pool({
    user: config.get('storage.user'),
    host: config.get('storage.host'),
    database: config.get('storage.database'),
    password: config.get('storage.password'),
    port: config.get('storage.port'),
});

class PostgresStorage extends StorageInterface {

    async saveTransactionAndEvent(contractName, event) {
        const transactionValues = [
            event.transactionHash,
            event.blockNumber
        ];
        const eventName = event.event;
        const eventValues = [
            contractName,
            eventName,
            event.logIndex,
            event,
            event.removed == null ? false : event.removed,
            event.transactionHash,
            event.returnValues
        ];
        const client = await pool.connect();
        await client.query('BEGIN');
        try {
            const insertTransaction = await client.query(`INSERT INTO blockchain_transactions (transaction_hash, block_number)
                            VALUES($1, $2)
                            ON CONFLICT ON CONSTRAINT blockchain_transactions_transaction_hash_pk DO UPDATE
                            SET block_number = $2, updated_at = current_timestamp`, transactionValues);
            const insertEvent = await client.query(`INSERT INTO blockchain_events (contract_name, event_name, log_index, event, removed, transaction_hash, metadata)
                            VALUES($1, $2, $3, $4, $5, $6, $7)
                            ON CONFLICT ON CONSTRAINT blockchain_events_transaction_hash_log_index_pk DO UPDATE
                            SET removed = $5, updated_at = current_timestamp WHERE blockchain_events.removed IS NOT TRUE`, eventValues);
            await client.query('COMMIT')
        } catch (error) {
            await client.query('ROLLBACK');
            throw error
        } finally {
            client.release()
        }
    }

    async getUnconfirmedTransactionHashes(blockNumber) {
        const result = await pool.query(`SELECT transaction_hash FROM blockchain_transactions
                                   WHERE status = 'unconfirmed' AND block_number <= $1`, [blockNumber]);
        return result.rows.map(row => row.transaction_hash);
    }

    async confirmTransactionHashes(transactionHashes) {
        const result = await pool.query(`UPDATE blockchain_transactions
                                   SET status = 'confirmed'
                                   WHERE transaction_hash = ANY ($1)`, [transactionHashes]);
    }

    async revertTransactionHashes(transactionHashes) {
        const result = await pool.query(`UPDATE blockchain_transactions
                                   SET status = 'reverted'
                                   WHERE transaction_hash = ANY ($1)`, [transactionHashes]);
    }

}

module.exports = PostgresStorage;