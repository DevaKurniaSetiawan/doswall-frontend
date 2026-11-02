import * as authService from '../services/authServices.js';

export const login = async (req, res) => {
   try {
      const { email, password, appkey } = req.body;
      const result = await authService.login(email, password, appkey);

      if (result.success) {
         res.status(200).json(result);
      } else {
         res.status(400).json(result)
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
};

export const getSessionToken = async (req, res) => {
   try {
      const result = await authService.getSessionToken(req.body);

      if (result.success) {
         res.status(200).json(result);
      } else {
         res.status(400).json(result);
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
};

export const checkTokenStatus = async (req, res) => {
   try {
      const result = await authService.checkTokenStatus(req.body);
      if (result.success) {
         res.status(200).json(result);
      } else {
         res.status(400).json(result);
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
};
