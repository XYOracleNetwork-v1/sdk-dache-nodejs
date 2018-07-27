const db = require('./db');

exports.saveTransactionAndEvent = async (contractName, event) => {
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
    const client = await db.getClient();
    await client.query('BEGIN');
    try {
        const insertTransaction = await client.query(`INSERT INTO blockchain_transactions (transaction_hash, block_number)
                            VALUES($1, $2)
                            ON CONFLICT ON CONSTRAINT blockchain_transactions_transaction_hash_pk DO UPDATE
                            SET block_number = $2, updated_at = current_timestamp`, transactionValues);
        const insertEvent = await client.query(`INSERT INTO
        log_index, event, removed, transaction_hash, metadata)
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
};

exports.getUnconfirmedTransactionHashes = async (blockNumber) => {
    const result = await db.query(`SELECT transaction_hash FROM blockchain_transactions
                                   WHERE status = 'unconfirmed' AND block_number <= $1 LIMIT 1`, [blockNumber]);
    return result.rows.map(row => row.transaction_hash);
};

exports.confirmTransactionHashes = async (transactionHashes) => {
    const result = await db.query(`UPDATE blockchain_transactions
                                   SET status = 'confirmed'
                                   WHERE transaction_hash = ANY ($1)`, [transactionHashes]);
};

exports.revertTransactionHashes = async (transactionHashes) => {
    const result = await db.query(`UPDATE blockchain_transactions
                                   SET status = 'reverted'
                                   WHERE transaction_hash = ANY ($1)`, [transactionHashes]);
};