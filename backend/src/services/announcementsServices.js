
import { v4 as uuidv4 } from 'uuid';
import { query } from "../db.js";
import { createWIBTime } from "../lib/lib.js";

export const getAnnouncements = async (body) => {
   try {
      const { _id } = await body

      const account = await query('SELECT role FROM accounts_tb WHERE user_id = ?', [_id]);

      if (!account[0] || account[0].role === 'user') {
         return {
            success: false,
            message: "Forbidden"
         };
      }
      // Fetch announcements
      const rows = await query('SELECT * FROM announcements_tb');

      // Fetch names for each announcement using user_id
      const announcementData = await Promise.all(
         rows.map(async (row) => {
            const [user] = await query('SELECT name FROM accounts_tb WHERE user_id = ?', [row.user_id]);
            return {
               ...row,
               name: user ? user.name : null
            };
         })
      );

      return {
         success: true,
         data: announcementData
      }

   } catch (error) {
      return {
         success: false,
         message: error.message
      }
   }
}


export const createAnnouncements = async (announcementData) => {

   try {
      const { title, content, _id } = announcementData;
      const announcement_id = await generate_announcementID()
      const createdAt = await createWIBTime()
      await query(
         `INSERT INTO announcements_tb (announcement_id, title, content, user_id, created_at)
         VALUES (?, ?, ?, ?, ?)`,
         [announcement_id, title.toUpperCase(), content, _id, createdAt]
      );
      return {
         success: true,
         announcement_id: announcement_id
      }
   } catch (error) {
      return {
         success: false,
         message: error.message
      }
   }
};

export const deleteAnnouncements = async (announcementId) => {
   try {
      const announcementExist = await query(
         `SELECT * FROM announcements_tb WHERE announcement_id = ?`,
         [announcementId]
      )

      if (!announcementExist[0]) {
         return {
            success: false,
            message: "Announcement not found"
         }
      }
      const results = await query(
         `DELETE FROM announcements_tb WHERE announcement_id = ?`,
         [announcementId]
      );

      const existInQueue = await query(
         `SELECT * FROM announcements_queue WHERE announcement_id = ?`,
         [announcementId]
      )
      if (existInQueue[0]) {
         await query(
            `DELETE FROM announcements_queue WHERE announcement_id = ?`,
            [announcementId]
         );
      }
      return {
         success: true,
         message: "Announcement deleted successfully"
      }
   } catch (error) {
      return {
         success: false,
         message: error.message
      }
   }
};

export const updateAnnouncements = async (announcementData, announcementId) => {
   try {
      const { title, content, _id } = announcementData;
      const createdAt = createWIBTime()

      const announcementExist = await query(
         `SELECT * FROM announcements_tb WHERE announcement_id = ?`,
         [announcementId]
      )

      if (!announcementExist[0]) {
         return {
            success: false,
            message: "Announcement not found"
         }
      }

      const isAdmin = await query(
         `SELECT role FROM accounts_tb WHERE user_id = ?`,
         [_id]
      )
      if (isAdmin[0].role !== 'user') {
         await query(
            `UPDATE announcements_tb SET title = ?, content = ?, created_at = ? WHERE announcement_id = ?`,
            [title.toUpperCase(), content, createdAt, announcementId]
         );

         return {
            success: true,
            message: "Announcement updated successfully",
         }
      }
      const isAnnouncementOwner = await query(
         `SELECT * FROM announcements_tb WHERE announcement_id = ? AND user_id = ?`,
         [announcementId, _id]
      )

      if (!isAnnouncementOwner[0]) {
         return {
            success: false,
            message: "You are not the owner of this announcement"
         }
      }

      await query(
         `UPDATE announcements_tb SET title = ?, content = ?, created_at = ? WHERE announcement_id = ?`,
         [title.toUpperCase(), content, createdAt, announcementId]
      )

      return {
         success: true,
         message: "Announcement updated successfully",
      }
   } catch (error) {
      return {
         success: false,
         message: error.message
      }
   }
};



export const getAnnouncementsByUserId = async (userId) => {
   try {
      const rows = await query(
         `SELECT * FROM announcements_tb WHERE user_id = ?`,
         [userId]
      );
      return {
         success: true,
         data: rows || []
      }
   } catch (error) {
      return {
         success: false,
         message: error.message
      }
   }
};

export const getAnnouncementsByAnnouncementId = async (announcementId) => {
   try {
      const rows = await query(
         `SELECT * FROM announcements_tb WHERE announcement_id = ?`,
         [announcementId]
      );
      return {
         success: true,
         data: rows[0]
      }
   } catch (error) {
      return {
         success: false,
         message: error.message
      }
   }
}


export const getQueueAnnouncements = async () => {
   try {
      const rows = await query(`
      SELECT a.*, q.order, q.duration
      FROM announcements_tb a
      JOIN announcements_queue q ON a.announcement_id = q.announcement_id
      ORDER BY q.order ASC
   `);
      return {
         success: true,
         data: rows || []
      }
   } catch (error) {
      return {
         success: false,
         message: error.message
      }
   }
};



export const createQueueAnnouncements = async (announcementData) => {
   try {
      const { announcement_id, order = 0, duration = "" } = announcementData;

      const announcementExist = await query(
         `SELECT * FROM announcements_tb WHERE announcement_id = ?`,
         [announcement_id]
      )

      if (!announcementExist[0]) {
         return {
            success: false,
            message: "Announcement not found"
         }
      }

      // ✅ Cek apakah order udah dipake
      const [existingOrder] = await query(
         `SELECT * FROM announcements_queue WHERE \`order\` = ?`,
         [order]
      );

      if (existingOrder) {
         return {
            success: false,
            message: "Order already in use"
         }
      }

      await query(
         `INSERT INTO announcements_queue (announcement_id, \`order\`, duration)
      VALUES (?, ?, ?)`,
         [announcement_id, order, duration]
      );

      return {
         success: true,
         message: "Announcement added to queue successfully",
      }
   } catch (error) {
      return {
         success: false,
         message: error.message
      }
   }
};



export const updateQueueAnnouncements = async (data, announcementId) => {

   try {
      const { order = 0, duration = "" } = data;

      const exist = await query(
         `SELECT * FROM announcements_queue WHERE announcement_id = ? AND \`order\` = ?`,
         [announcementId, order]
      );
      if (!exist[0]) {
         return {
            success: false,
            message: "Announcement not found"
         }
      }
      await query(
         `UPDATE announcements_queue SET  \`order\` = ?, duration = ? WHERE announcement_id = ?`,
         [order, duration, announcementId]
      );
      return {
         success: true,
         message: "Announcement updated successfully",
      }
   } catch (error) {
      return {
         success: false,
         message: error.message
      }
   }
};

export const deleteQueueAnnouncements = async (announcementId, announcementOrder) => {
   try {
      const exist = await query(
         `SELECT * FROM announcements_queue WHERE announcement_id = ? AND \`order\` = ?`,
         [announcementId, announcementOrder]
      )

      if (!exist[0]) {
         return {
            success: false,
            message: "Announcement not found"
         }
      }
      await query(
         `DELETE FROM announcements_queue WHERE announcement_id = ? AND \`order\` = ?`,
         [announcementId, announcementOrder]
      );
      return {
         success: true,
         message: "Announcement deleted successfully"
      }
   }
   catch (error) {
      return {
         success: false,
         message: error.message
      }
   }
};



//ADDONS HOOKS


const generate_announcementID = async () => {
   let announcement_id;
   let isUnique = false;
   while (!isUnique) {
      announcement_id = uuidv4();
      const [existingId] = await query('SELECT 1 FROM announcements_tb WHERE announcement_id = ? LIMIT 1', [announcement_id]);
      if (!existingId) {
         isUnique = true;
      }
   }
   return announcement_id;
}
