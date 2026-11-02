import * as devService from '../services/devServices.js';

export const createMockUsers = async (req, res) => {
   try {
      if (process.env.NODE_ENV !== 'development') {
         return res.status(403).json({ success: false, message: "Forbidden" });
      }
      const results = await devService.createMockUsers();
      if (results.success) {
         res.status(200).json(results);
      } else {
         res.status(400).json(results);
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
}

export const resetDatabase = async (req, res) => {
   try {
      if (process.env.NODE_ENV !== 'development') {
         return res.status(403).json({ success: false, message: "Forbidden" });
      }
      const { resetKey } = req.body;
      if (resetKey !== process.env.RESET_KEY) {
         return res.status(403).json({ success: false, message: "Forbidden" });
      }
      const results = await devService.resetDatabase(resetKey);
      if (results.success) {
         res.status(200).json(results);
      } else {
         res.status(400).json(results);
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
}
