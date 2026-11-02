import * as clientService from '../services/clientServices.js';

export const getClientsByUserId = async (req, res) => {
   try {
      const userId = req.params.id;
      const result = await clientService.getClientsByUserId(userId);
      if (result.success) {
         res.status(200).json(result);
      }
      else {
         res.status(400).json(result);
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
}

export const updateClients = async (req, res) => {
   try {
      const clientId = req.body._id;
      const result = await clientService.updateClients(req.body, clientId);

      if (result.success) {
         res.status(200).json(result);
      } else {
         res.status(404).json(result); // 404 if not found
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
};


export const getLocationLists = async (req, res) => {
   try {
      const { lat, long } = req.body;

      if (!lat || !long) {
         return res.status(400).json({
            success: false,
            error: 'Latitude and longitude are required'
         });
      }


      const result = await clientService.getLocationLists({ lat, long });
      if (!result.success) {
         return res.status(400).json(result);
      }
      res.status(200).json(result);
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
};
