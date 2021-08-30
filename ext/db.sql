CREATE TABLE IF NOT EXISTS `osu`.`user_logins` (
  `user_login_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `ip_address` VARBINARY(16) NOT NULL,
  `register` TINYINT NOT NULL,
  `geo_info` JSON NOT NULL,
  `user_login_flags` INT NOT NULL,
  PRIMARY KEY (`user_login_id`),
  UNIQUE INDEX `user_login_id_UNIQUE` (`user_login_id` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1
COLLATE = latin1_bin;