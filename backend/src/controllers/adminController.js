import * as adminService from '../services/adminServices.js';

export const getAdmin = async (req, res) => {
   try {
      const clientData = req.body
      const results = await adminService.getAdmin(clientData)
      if (results.success) {
         res.status(200).json(results)
      } else {
         res.status(400).json(results)
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
}

export const updateAdmin = async (req, res) => {
   try {
      const clientId = req.params.id
      const clientData = req.body

      const results = await adminService.updateAdmin(clientData, clientId)
      if (results.success) {
         res.status(200).json(results)
      } else {
         res.status(400).json(results)
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
}



export const createClients = async (req, res) => {
   try {
      const result = await adminService.createClients(req.body);

      if (result.success) {
         res.status(200).json(result);
      } else {
         res.status(400).json(result);
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
};

export const deleteClients = async (req, res) => {
   try {
      const clientId = req.params.id;
      const adminId = req.body._id;
      const results = await adminService.deleteClients(clientId, adminId);

      if (results.success) {
         res.status(200).json(results);
      } else {
         res.status(400).json(results);
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
};

export const getRestrict = async (req, res) => {
   try {
      const { user_id } = req.body
      const result = await adminService.getRestrict(user_id);
      if (result.success) {
         res.status(200).json(result);
      } else {
         res.status(400).json(result);
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
}

export const editRestrict = async (req, res) => {
   try {
      const { _id, user_id, email } = req.body;

      if (!_id || !user_id || !email) {
         return res.status(400).json({
            success: false,
            error: 'Bad Request'
         });
      }
      const result = await adminService.editRestrict(_id, user_id, email);
      if (!result.success) {
         return res.status(400).json(result);
      }
      res.status(200).json(result);
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
}