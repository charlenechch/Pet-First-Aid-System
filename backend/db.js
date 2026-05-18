const mysql = require("mysql2/promise");
require("dotenv").config();

let pool;

if (process.env.MYSQL_PUBLIC_URL) {
  // For local testing using Railway public MySQL URL
  pool = mysql.createPool(process.env.MYSQL_PUBLIC_URL);
} else {
  // For Railway deployment using internal MySQL variables
  pool = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

module.exports = pool;