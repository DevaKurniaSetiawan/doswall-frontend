import { query } from "../db.js";
import { createWIBTime, getLocations } from "../lib/lib.js";





// LOCATION SERVICES
export const getLocationLists = async (data) => {
   try {
      if (!data.lat || !data.long) {
         throw new Error("Latitude and longitude are required");
      }
      const locationLists = await getLocations(data.lat, data.long);
      return {
         success: true,
         data: locationLists
      };
   } catch (error) {
      return {
         success: false,
         error: error.message || "Failed to get locations"
      };
   }
};


// USER MANAGEMENT

export const getClientsByUserId = async (clientId) => {
   try {

      const results = await query(
         'SELECT user_id, name, email, geotag, status, role, notes FROM accounts_tb WHERE user_id= ?',
         [clientId]
      );

      if (results.length === 0) {
         return {
            success: false,
            message: 'User not found'
         }
      }

      return {
         success: true,
         data: results[0]
      };
   }
   catch (error) {
      return {
         success: false,
         message: error.message
      };
   }
}



export const updateClients = async (clientData, clientId) => {
   try {

      const lastUpdated = createWIBTime()
      const { status, notes = "", geotag = "" } = clientData;
      if (status === 0) {
         await query(
            `UPDATE accounts_tb SET status = ?, notes = ? , geotag = "", last_update = ? WHERE user_id= ?`,
            [status, notes, lastUpdated, clientId]
         );
      }
      else {
         await query(
            `UPDATE accounts_tb SET status = ?, notes = ?, geotag = ?, last_update = ? WHERE user_id= ?`,
            [status, notes, geotag.toUpperCase(), lastUpdated, clientId]
         );
      }

      const [updatedUser] = await query(
         'SELECT user_id, name, email, geotag, status, role, notes, last_update FROM accounts_tb WHERE user_id= ? LIMIT 1',
         [clientId]
      );

      if (!updatedUser) {
         return {
            success: false,
            message: "User not found"
         }
      }

      return {
         success: true,
         data: updatedUser
      };
   } catch (error) {
      return {
         success: false,
         message: error.message
      };
   }
};
