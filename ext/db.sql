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