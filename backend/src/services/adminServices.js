import dotenv from 'dotenv';
import { v4 as uuidv4 } from "uuid";
import { query } from '../db.js';
import { encryptPW, validateEmail } from "../lib/lib.js";

dotenv.config()

export const getAdmin = async (data) => {
   const account = await query('SELECT role FROM accounts_tb WHERE user_id = ?', [data._id]);

   if (!account[0] || account[0].role === 'user') {
      return {
         success: false,
         message: "Forbidden"
      }
   }

   const results = await query('SELECT * FROM accounts_tb');
   return {
      success: true,
      data: results
   }
};
export const updateAdmin = async (adminData, clientId) => {
   const { name, email, password, geotag, status, role, notes, _id } = adminData;


   const account = await query('SELECT role FROM accounts_tb WHERE user_id = ?', [_id]);

   if (!account[0] || account[0].role === 'user') {
      return {
         success: false,
         message: "Forbidden"
      }
   }

   const userExist = await query('SELECT * FROM accounts_tb WHERE user_id= ?  LIMIT 1', [clientId]);
   if (userExist.length === 0) {
      return {
         success: false,
         message: "User not found"
      }
   }

   const emailExist = await query(
      'SELECT * FROM accounts_tb WHERE email = ? AND user_id != ? LIMIT 1',
      [email, clientId]
   );

   if (emailExist.length > 0) {
      return {
         success: false,
         message: "Email already exists"
      };
   }

   let finalPassword = password.trim() ? encryptPW(password) : userExist[0].password;



   await query(
      `UPDATE accounts_tb SET name = ?, email = ?, password = ?, geotag = ?, status = ?, role = ?, notes = ?
      WHERE user_id = ?`,
      [name.toUpperCase(), email, finalPassword, geotag.toUpperCase(), status, role, notes, clientId]
   );

   return {
      success: true,
      message: "User updated successfully"
   }
};


export const createClients = async (adminData) => {
   try {
      const { name, password, email, _id } = adminData;

      if (!name || !password || !email) {
         return {
            success: false,
            message: "Bad Request"
         }
      }

      if (!validateEmail(email)) {
         return {
            success: false,
            message: "Invalid email format"
         }
      }
      const account = await query('SELECT role FROM accounts_tb WHERE user_id = ?', [_id]);

      if (!account[0] || account[0].role === 'user') {
         return {
            success: false,
            message: "Forbidden"
         }
      }

      const existingUser = await query('SELECT 1 FROM accounts_tb WHERE email = ? LIMIT 1', [email]);
      if (existingUser.length > 0) {
         return {
            success: false,
            message: "User with the same email already exists"
         }
      }


      const user_id = await generate_UserID()
      const status = adminData.status || 0;
      const geotag = adminData.geotag ? adminData.geotag.toUpperCase() : "";
      const role = adminData.role || "user";
      const notes = adminData.notes || "";
      const token = await generate_UserToken()


      await query(
         `INSERT INTO accounts_tb (user_id, name, password, email, geotag, status, role, notes, token)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
         [user_id, name.toUpperCase(), encryptPW(password), email, geotag, status, role, notes, token]
      );

      const [newUser] = await query(
         'SELECT user_id, name, email, geotag, status, role, notes FROM accounts_tb WHERE user_id= ? LIMIT 1',
         [user_id]
      );

      return {
         success: true,
         message: 'User created Successfully',
         data: {
            user_id: newUser.user_id,
            name: newUser.name,
            email: newUser.email,
         }
      };
   } catch (error) {
      return {
         success: false,
         message: error.message
      };
   }
};


export const deleteClients = async (clientId, _id) => {
   try {
      if (!clientId) {
         return {
            success: false,
            message: "Bad Request"
         };
      }

      const account = await query('SELECT role FROM accounts_tb WHERE user_id = ?', [_id]);

      if (!account[0] || account[0].role === 'user') {
         return {
            success: false,
            message: "Forbidden"
         };
      }

      const result = await query('DELETE FROM accounts_tb WHERE user_id= ?', [clientId]);

      if (result.affectedRows === 0) {
         return {
            success: false,
            message: "User not found"
         };
      }

      return {
         success: true,
         message: "User deleted successfully"
      };
   } catch (error) {
      return {
         success: false,
         message: error.message
      };
   }
};


export const getRestrict = async (user_id) => {
   try {

      const account = await query('SELECT role FROM accounts_tb WHERE user_id = ?', [user_id]);

      if (!account[0] || account[0].role === 'user') {
         return {
            success: false,
            message: "Forbidden"
         };
      }

      // delete all in restrict_display_tb that user_id didnt exist in accounts_tb which means user deleted
      await query('DELETE FROM restrict_display_tb WHERE user_id NOT IN (SELECT user_id FROM accounts_tb)');

      const results = await query('SELECT * FROM restrict_display_tb');
      return {
         success: true,
         data: results
      }
   } catch (error) {
      return {
         success: false,
         message: error.message
      };
   }
}

export const editRestrict = async (_id, user_id, email) => {
   try {

      // check not user role
      const account = await query('SELECT role FROM accounts_tb WHERE user_id = ?', [_id]);

      if (!account[0] || account[0].role === 'user') {
         return {
            success: false,
            message: "Forbidden"
         };
      }

      // if exist in restrict_display_tb then delete else insert
      const existing = await query('SELECT 1 FROM restrict_display_tb WHERE user_id = ? LIMIT 1', [user_id]);
      if (existing.length > 0) {
         // delete
         await query('DELETE FROM restrict_display_tb WHERE user_id = ?', [user_id]);
         return {
            success: true,
            message: "Email removed from restrict list"
         };
      } else {
         // insert
         await query('INSERT INTO restrict_display_tb (user_id, email) VALUES (?, ?)', [user_id, email]);
         return {
            success: true,
            message: "Email added to restrict list"
         };
      }
   } catch (error) {
      return {
         success: false,
         message: error.message
      };
   }
}

// ADDONS HOOKS

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
