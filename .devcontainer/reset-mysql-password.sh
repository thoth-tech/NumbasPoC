#!/bin/bash

# Stop the MySQL service
sudo service mariadb stop

# Start MySQL without password
sudo mysqld_safe --skip-grant-tables &

# Wait for MySQL to start up
sleep 5

# Reset the password
sudo mysql -uroot <<EOF
USE mysql;
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
EOF

# Shutdown MySQL
sudo mysqladmin -uroot -pnew_password shutdown

# Start the MySQL service
sudo service mariadb start
