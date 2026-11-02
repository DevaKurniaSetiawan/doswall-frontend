import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'fs';
import cron from 'node-cron-tz';
import { v4 as uuidv4 } from "uuid";
import { query } from './src/db.js';
import { createWIBTime } from './src/lib/lib.js';
import router_appKey from './src/routes/router_appKey.js';
import router_secured from './src/routes/router_secured.js';

// Initialize Express app
const app = express();
dotenv.config();

// Security Middlewares
const allowedOrigins = (process.env.CORS_ORIGINS || '')
   .split(',')
   .map((origin) => origin.trim())
   .filter(Boolean);

app.use(cors({
   origin: process.env.NODE_ENV === 'production' ? allowedOrigins : true
}));
app.use(express.json());



// DAILY RESET
cron.schedule('0 0 * * *', async () => {
   try {
      const logFile = './cron-log.txt';
      fs.appendFileSync(logFile, `[${new Date().toISOString()}] Running daily reset task...\n`);

      // Reset status, notes, and geotag
      const resetResult = await query(
         'UPDATE accounts_tb SET status = ?, notes = ?, geotag = ?',
         [0, '', '']
      );
      fs.appendFileSync(logFile, `[${new Date().toISOString()}] Reset task completed. Rows affected: ${resetResult.affectedRows}\n`);

      // Fetch all user IDs to generate new tokens
      const users = await query('SELECT user_id FROM accounts_tb');
      for (const user of users) {
         const newToken = await generate_UserToken();
         await query('UPDATE accounts_tb SET token = ? WHERE user_id = ?', [newToken, user.user_id]);
      }
      fs.appendFileSync(logFile, `[${new Date().toISOString()}] Token generation completed for all users.\n`);
   } catch (error) {
      fs.appendFileSync('./cron-log.txt', `[${new Date().toISOString()}] Error: ${error.message}\n`);
   }
}, {
   timezone: 'Asia/Jakarta'
});

const generate_UserToken = async () => {
   let token;
   let isUnique = false;

   while (!isUnique) {
      token = uuidv4()
      const [existingToken] = await query('SELECT 1 FROM accounts_tb WHERE token = ? LIMIT 1', [token]);
      if (!existingToken) {
         isUnique = true;
      }
   }

   return token;
};

// Token verification middleware
const verifyToken = async (req, res, next) => {
   const { token, appkey, _id } = req.body;

   if (!token || !appkey || !_id) {
      return res.status(401).json({
         success: false,
         error: 'Unauthorized'
      });
   }

   // Verify app key
   if (appkey !== process.env.APP_KEY) {
      return res.status(401).json({
         success: false,
         error: 'Unauthorized'
      });
   }

   try {
      // Verify token belongs to user with _id
      const result = await query(
         'SELECT * FROM accounts_tb WHERE token = ? AND user_id = ?',
         [token, _id]
      );

      if (result.length === 0) {
         return res.status(401).json({
            success: false,
            error: 'Unauthorized'
         });
      }

      // Attach user to request for downstream use
      req.user = result[0];
      next();
   } catch (error) {
      console.error('Token verification error:', error);
      return res.status(500).json({
         success: false,
         error: 'Internal server error during authentication'
      });
   }
};


// Route handlers
app.use('/api', verifyToken, router_secured);
app.use(router_appKey);

// Health check endpoint
app.get('/health', (req, res) => {
   res.status(200).json({
      success: true,
      server_status: 'healthy',
      timestamp: createWIBTime()
   });
});

// function to manual reset ALL
app.post('/manual-reset', async (req, res) => {
   if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({
         success: false,
         error: 'Route not found'
      });
   }

   try {
      // Reset status, notes, and geotag
      const resetResult = await query(
         'UPDATE accounts_tb SET status = ?, notes = ?, geotag = ?',
         [0, '', '']
      );


      // Fetch all user IDs to generate new tokens
      const users = await query('SELECT user_id FROM accounts_tb');
      for (const user of users) {
         const newToken = await generate_UserToken();
         await query('UPDATE accounts_tb SET token = ? WHERE user_id = ?', [newToken, user.user_id]);
      }
      res.status(200).json({
         success: true,
         message: 'Reset task completed. Rows affected: ' + resetResult.affectedRows,
         timestamp: createWIBTime()
      });

   } catch (error) {
      res.status(500).json({ error: error.message });
   }
})



app.get('/login-and-redirect/:email/:token', async (req, res) => {
   const { email, token } = req.params;

   if (!email || !token) {
      return res.status(400).send('Email and token are required');
   }


   const [user] = await query('SELECT * FROM accounts_tb WHERE email = ? AND token = ?', [email, token]);

   if (user.length === 0) {
      return res.status(401).send('Unauthorized');
   }

   const password = user.password;

   if (password === null) {
      return res.status(401).send('Unauthorized');
   }

   const frontendUrl = process.env.FRONTEND_URL; // Ganti sesuai project lu
   const redirectUrl = `${frontendUrl}/?email=${encodeURIComponent(email)}&encrypted_pw=${encodeURIComponent(password)}`;

   console.log('Redirecting to:', redirectUrl);

   res.redirect(redirectUrl);
});

// 404 handler
app.use((req, res) => {
   res.status(404).json({
      success: false,
      error: 'Route not found'
   });
});

// Global error handler
app.use((err, req, res, next) => {
   console.error('Global error handler:', err);
   res.status(500).json({
      success: false,
      error: 'Internal server error'
   });
});


const PORT = process.env.PORT || process.env.PROD_PORT || process.env.DEV_PORT || 3001;
// Server initialization
app.listen(PORT, () => {
   console.log(`Server running in (PORT:${PORT}) ...`);
});