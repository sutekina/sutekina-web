CREATE TABLE IF NOT EXISTS `user_logins` (
  `user_login_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `ip_address` VARBINARY(16) NOT NULL,
  `register` TINYINT NOT NULL,
  `geo_info` JSON NOT NULL,
  `user_login_flags` INT NOT NULL,
  `datetime` DATETIME NOT NULL COMMENT 'These are saved with UTC_TIMESTAMP().',
  PRIMARY KEY (`user_login_id`),
  UNIQUE INDEX `user_login_id_UNIQUE` (`user_login_id` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1
COLLATE = latin1_bin;

CREATE TABLE IF NOT EXISTS `user_details` (
  `user_id` INT NOT NULL,
  `about` TEXT COLLATE latin1_bin,
  `socials` JSON DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `user_id_UNIQUE` (`user_id`)) 
ENGINE=InnoDB 
DEFAULT CHARSET=latin1 
COLLATE=latin1_bin;

DROP PROCEDURE IF EXISTS AddUserDetails;

DELIMITER //
CREATE PROCEDURE AddUserDetails()
BEGIN
	DECLARE n INT;
  DECLARE i INT;
  -- the * 2 is not necessary and technically just there incase you are dumb like i am and you delete a row on accident, better off not having any accidental issues.
  -- the extra loops aren't much less efficient either since it only inserts if the row doesn't already exist, i don't know how this'll be in a bigger sample size but i'll see then ^_^
  SELECT (COUNT(*) * 2) FROM users INTO n;

	SET i = 0;

	WHILE i < n DO
    INSERT INTO user_details (user_id) SELECT i FROM DUAL WHERE
      EXISTS(SELECT * FROM users WHERE id = i)
        AND
		  NOT EXISTS(SELECT * FROM user_details WHERE user_id = i LIMIT 1);

    SET  i = i + 1;
  END WHILE;
END //

DELIMITER ;

CALL AddUserDetails();

CREATE TABLE IF NOT EXISTS `user_history` (
  `user_history_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `modmode` TINYINT NOT NULL COMMENT 'These are mod + mode. e.g: std+vn = 0.',
  `global_rank` INT NOT NULL,
  `pp` INT NOT NULL,
  `rscore` BIGINT(21) NOT NULL,
  `datetime` DATETIME NOT NULL COMMENT 'These are saved with UTC_TIMESTAMP().',
  PRIMARY KEY (`user_history_id`),
  UNIQUE INDEX `user_history_id_UNIQUE` (`user_history_id` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1
COLLATE = latin1_bin;

DROP PROCEDURE IF EXISTS AddUserHistory;

DELIMITER //
CREATE PROCEDURE AddUserHistory()
BEGIN
	DECLARE n INT;
  DECLARE i INT;
  DECLARE modmodes INT;
  DECLARE modmodesI INT;

  SELECT COUNT(*) FROM users WHERE u.priv >> 0 INTO n;

	SET i = 0;
  SET modmodes = 7;

  -- this is kinda shitty its O(n*modmodes) but it's okay since it'll be happening as a separate process in the background and won't be blocking.
  -- this whole daily stats thing is somewhat questionable since it'll scale really badly storage wise since each user is worth 8 rows (user * 8 modmodes)
	WHILE i < n DO
    SET modmodesI = 0;
    WHILE modmodesI <= modmodes DO
      INSERT INTO `user_history` (`user_id`,`modmode`,`global_rank`,`pp`,`rscore`,`datetime`)
        SELECT i, modmodesI, 
        (SELECT (SELECT COUNT(*)+1 FROM stats ss JOIN users uu USING(id) WHERE ss.pp > s.pp AND ss.mode = s.mode AND uu.priv >> 0) FROM stats s WHERE id = i AND mode = modmodesI),
        (SELECT pp FROM stats WHERE id = i AND mode = modmodesI),
        (SELECT rscore FROM stats WHERE id = i AND mode = modmodesI),
        utc_timestamp() FROM DUAL WHERE EXISTS(SELECT * FROM users WHERE id = i AND priv >> 0);

      SET modmodesI = modmodesI + 1;
    END WHILE;
    
    SET  i = i + 1;
  END WHILE;
END //

DELIMITER ;

CREATE EVENT IF NOT EXISTS `AddUserHistory`
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(NOW() + INTERVAL 1 MINUTE) 
DO CALL AddUserHistory();
CREATE EVENT IF NOT EXISTS `ClearUserHistory`
ON SCHEDULE EVERY 90 DAY
STARTS TIMESTAMP(NOW() + INTERVAL 1 MINUTE) 
DO TRUNCATE TABLE user_history;
