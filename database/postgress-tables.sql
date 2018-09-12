create table blockchain_transactions
(
	transaction_hash char(66) not null
		constraint blockchain_transactions_transaction_hash_pk
			primary key,
	block_number bigint not null
)
;

create table blockchain_events
(
	transaction_hash char(66) not null
		constraint blockchain_events_blockchain_transactions_transaction_hash_fk
			references blockchain_transactions
				on delete cascade,
	log_index integer not null,
	contract_name varchar(255) not null,
	event_name varchar(255) not null,
	event json not null,
	return_values json not null,
	constraint blockchain_events_transaction_hash_log_index_pk
		primary key (transaction_hash, log_index)
)
;
