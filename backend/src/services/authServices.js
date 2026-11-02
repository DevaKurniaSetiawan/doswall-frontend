
import { query } from "../db.js";
import { checkAppKey, createWIBTime, decryptPW, encryptPW, validateEmail } from "../lib/lib.js";



export const login = async (email, password, appkey) => {
   const isValid = await checkAppKey(appkey);
   if (!isValid) {
      return {
         success: false,
         message: 'Invalid Credentials'
      }
   }

   if (!validateEmail(email)) {
      return {
         success: false,
         message: 'Invalid email format'
      }
   }

   const results = await query(`SELECT * FROM accounts_tb WHERE email = ?`, [email]);
   if (results.length === 0) {
      return {
         success: false,
         message: 'Invalid email or password'
      }
   }

   const user = results[0];
   const isPasswordValid = password === decryptPW(user.password)

   if (!isPasswordValid) {
      return {
         success: false,
         message: 'Invalid email or password'
      }
   }

   let finalToken = user.token;

   return {
      success: true,
      data: {
         user_id: user.user_id,
         name: user.name,
         email: user.email,
         role: user.role,
         status: user.status,
         geotag: user.geotag,
         notes: user.notes,
         token: finalToken
      }
   };
};
export const getSessionToken = async (data) => {
   const isValid = await checkAppKey(data.appkey);
   if (!isValid) {
      return {
         success: false,
         message: "Unauthorized"
      }
   }

   const results = await query(`SELECT token FROM accounts_tb WHERE user_id= ?`, [data.user_id]);
   if (results.length === 0) {
      return {
         success: false,
         error: 'User not found'
      }
   }

   return {
      success: true,
      data: { token: results[0].token }
   }
};




export const checkTokenStatus = async (data) => {
   const isValid = await checkAppKey(data.appkey);
   if (!isValid) {
      return {
         success: false,
         message: "Unauthorized"
      }
   }

   try {
      if (!data.token || !data.user_id) {
         return {
            success: false,
            message: "Bad Request"
         }
      }
      const userExist = await query('SELECT * FROM accounts_tb WHERE user_id= ? LIMIT 1', [data.user_id]);
      if (userExist.length === 0) {
         return {
            success: false,
            message: "User not found"
         }
      }

      const user = await query('SELECT * FROM accounts_tb WHERE user_id= ? AND token= ? LIMIT 1', [data.user_id, data.token]);

      if (user.length === 0) {
         return {
            success: true,
            data: { tokenStatus: false }
         }
      }
      else {
         return {
            success: true,
            data: { tokenStatus: true }
         }
      }

   } catch (error) {
      return {
         success: false,
         message: error.message
      };
   }
};
