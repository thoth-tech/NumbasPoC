#!/bin/bash

# Start MariaDB in the background
mysqld_safe &

# Wait for MariaDB to start
for i in {1..30}; do
    if echo 'SELECT 1' | mysql -uroot &> /dev/null; then
        break
    fi
    echo "Waiting for MariaDB to start..."
    sleep 1s
done

# Explicitly set the root password using SQL
mysql -uroot -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';" || echo "Failed to set root password"
mysql -uroot -pnew_password -e "FLUSH PRIVILEGES;" || echo "Failed to flush privileges"


