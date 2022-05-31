-- 1.0.1
ALTER TABLE user_history MODIFY rscore bigint unsigned default 0 not null;
ALTER TABLE user_history MODIFY modmode tinyint(1) not null;
ALTER TABLE user_history MODIFY global_rank int unsigned default 0 not null;
ALTER TABLE user_history MODIFY pp int unsigned default 0 not null;
