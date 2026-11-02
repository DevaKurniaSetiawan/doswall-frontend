import 'dotenv/config';
import mysql from 'mysql2';

// 1) Setup MySQL
// Development database config
const devDb = {
   user: process.env.DEV_DB_USER,
   host: process.env.DEV_DB_HOST || 'localhost',
   database: process.env.DEV_DB_DATABASE,
   password: process.env.DEV_DB_PASSWORD,
   port: process.env.DEV_DB_PORT ? parseInt(process.env.DEV_DB_PORT, 10) : 3306,
};

// Production database config
const prodDb = {
   user: process.env.MYSQLUSER || process.env.PROD_DB_USER,
   host: process.env.MYSQLHOST || process.env.PROD_DB_HOST,
   database: process.env.MYSQLDATABASE || process.env.PROD_DB_DATABASE,
   password: process.env.MYSQLPASSWORD || process.env.PROD_DB_PASSWORD,
   port: Number(process.env.MYSQLPORT || process.env.PROD_DB_PORT || 3306),
};

// Create connection using the appropriate config
const db = mysql.createConnection(
   process.env.NODE_ENV === 'production' ? prodDb : devDb
);




// 2) Connect to DB and Error Handling
db.connect((err) => {
   if (err) {
      console.error('Error connecting to MySQL database:', err);
      process.exit(-1);
   }
   console.log('Connected to MySQL database');
});

db.on('error', (err) => {
   console.error('MySQL database error:', err);
   process.exit(-1);
});



// 3) Addons Functions
export const query = (text, params) => {
   return new Promise((resolve, reject) => {
      db.query(text, params, (err, results) => {
         if (err) return reject(err);
         resolve(results);
      });
   });
};

export const close = () => {
   return new Promise((resolve, reject) => {
      db.end((err) => {
         if (err) return reject(err);
         resolve();
      });
   });
};
