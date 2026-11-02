import { query } from "../db.js";
import { checkAppKey, decryptPW, encryptPW, generatePin, sendEmail } from "../lib/lib.js";

export const mailPW = async (clientEmail, appkey) => {
   const isValid = await checkAppKey(appkey);
   if (!isValid) {
      return {
         success: false,
         message: 'Unauthorized'
      }
   }
   try {
      const selected = await query(
         `SELECT * FROM accounts_tb WHERE email = ?`,
         [clientEmail]
      );
      if (selected) {
         const clientId = selected[0].user_id;

         const newPin = generatePin()
         const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
         await query(
            'INSERT INTO password_reset_pins (user_id, pin, expires_at) VALUES (?, ?, ?)',
            [clientId, newPin, expiresAt]
         );

         const res = await sendEmail(clientEmail, clientId, newPin);
         if (!res) {
            return {
               success: false,
               message: "Failed to send email"
            }
         }
         return { success: true, message: 'Email sent.' };
      } else {
         return {
            success: false,
            message: "User with corresponding email not found"
         }
      }
   } catch (error) {
      return {
         success: false,
         message: error.message
      }
   }
};


export const updatePasswordLocal = async (data, user_id) => {
   try {
      const [selectedUser] = await query(`SELECT password FROM accounts_tb WHERE user_id = ?`, [user_id]);
      if (!selectedUser) {
         return {
            success: false,
            message: 'User not found'
         }
      }
      const isOldPasswordValid = data.oldPW === decryptPW(selectedUser.password);
      if (!isOldPasswordValid) {
         return {
            success: false,
            message: 'Invalid Credentials'
         }
      }
      await query(`UPDATE accounts_tb SET password = ? WHERE user_id = ?`, [encryptPW(data.newPW), user_id]);
      return { success: true, message: 'Password updated successfully.' };
   } catch (error) {
      return {
         success: false,
         message: error.message
      }
   }
};

export const verifyAndUpdatePassword = async (id, pin, password, appkey) => {
   const isValid = await checkAppKey(appkey);
   if (!isValid) {
      return {
         success: false,
         message: 'Unauthorized'
      }
   }
   try {
      const rows = await query(
         'SELECT * FROM password_reset_pins WHERE user_id = ? AND pin = ? AND expires_at > NOW()',
         [id, pin]
      );

      if (rows.length === 0) {
         return {
            success: false,
            message: 'Failed resetting password'
         }
      }

      await query('UPDATE accounts_tb SET password = ? WHERE user_id = ?', [encryptPW(password), id]);
      await query('DELETE FROM password_reset_pins WHERE user_id = ?', [id]);

      return {
         success: true,
         message: 'Password updated successfully'
      }
   } catch (error) {
      throw new Error('An error occurred while processing your request verifying and updating password.');
   }
};