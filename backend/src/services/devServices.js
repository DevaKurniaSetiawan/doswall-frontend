import { v4 as uuidv4 } from "uuid";
import { query } from "../db.js";
import { encryptPW } from "../lib/lib.js";

export const createMockUsers = async () => {
   try {
      const mockUsers = [
         { name: "user", email: "user@gmail.com", role: "user" },
         { name: "admin", email: "admin@gmail.com", role: "admin" },
         { name: "superadmin", email: "superadmin@gmail.com", role: "superadmin" }
      ];

      const results = [];

      for (const { name, email, role } of mockUsers) {
         // Check if user already exists
         const existing = await query(
            'SELECT 1 FROM accounts_tb WHERE email = ? LIMIT 1',
            [email]
         );

         if (existing.length > 0) {
            results.push({ name, status: 'skipped', reason: 'already exists' });
            continue;
         }

         // Generate user ID and token
         const user_id = await generate_UserID();
         const token = await generate_UserToken();
         const status = 1;
         const geotag = "";
         const notes = "";
         const encryptedPassword = encryptPW('password'); // fixed password

         // Insert user
         await query(
            `INSERT INTO accounts_tb (user_id, name, password, email, geotag, status, role, notes, token)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
               user_id,
               name.toUpperCase(),
               encryptedPassword,
               email,
               geotag,
               status,
               role,
               notes,
               token
            ]
         );

         results.push({ name, status: 'created' });
      }

      const createdCount = results.filter(r => r.status === 'created').length;

      return {
         success: true,
         message: `Mock users creation completed. ${createdCount} created, ${mockUsers.length - createdCount} skipped.`,
         data: results
      };

   } catch (error) {
      return {
         success: false,
         message: "Failed to create mock users: " + error.message
      };
   }
};
export const resetDatabase = async () => {
   try {
      // Delete all records from announcements_tb , accounts_tb, announcements_queue, password_reset_pins
      await query('DELETE FROM announcements_tb');
      await query('DELETE FROM accounts_tb');
      await query('DELETE FROM announcements_queue');
      await query('DELETE FROM password_reset_pins');
      await query('DELETE FROM restrict_display_tb');

      // Optionally, reset auto-increment counters if needed
      await query('ALTER TABLE announcements_tb AUTO_INCREMENT = 1');
      await query('ALTER TABLE accounts_tb AUTO_INCREMENT = 1');
      await query('ALTER TABLE announcements_queue AUTO_INCREMENT = 1');
      await query('ALTER TABLE password_reset_pins AUTO_INCREMENT = 1');
      await query('ALTER TABLE restrict_display_tb AUTO_INCREMENT = 1');

      return {
         success: true,
         message: "Database has been reset successfully"
      };
   } catch (error) {
      return {
         success: false,
         message: error.message
      };
   }
}




// ADD ONS
const generate_UserID = async () => {
   let userId;
   let isUnique = false;

   while (!isUnique) {
      userId = uuidv4();
      const [existingId] = await query('SELECT 1 FROM accounts_tb WHERE user_id= ? LIMIT 1', [userId]);
      if (!existingId) {
         isUnique = true;
      }
   }

   return userId;
};

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