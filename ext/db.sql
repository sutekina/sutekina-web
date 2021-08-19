CREATE TABLE IF NOT EXISTS `osu`.`user_logins` (
  `user_logins_id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `ip_address` VARBINARY(16) NOT NULL,
  `register` TINYINT NOT NULL,
  `geo_info` JSON NOT NULL,
  PRIMARY KEY (`user_logins_id`),
  UNIQUE INDEX `user_logins_id_UNIQUE` (`user_logins_id` ASC))
ENGINE = InnoDB
DEFAULT CHARACTER SET = latin1
COLLATE = latin1_bin;