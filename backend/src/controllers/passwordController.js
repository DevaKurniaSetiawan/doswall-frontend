import * as passwordService from '../services/passwordServices.js';


export const mailPW = async (req, res) => {
   const { email, appkey } = req.body;
   try {
      const result = await passwordService.mailPW(email, appkey);
      if (result.success) {
         res.status(200).json(result);
      } else {
         res.status(400).json(result)
      }
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};


export const updatePasswordLocal = async (req, res) => {
   try {
      const { _id } = req.body
      const result = await passwordService.updatePasswordLocal(req.body, _id);
      if (result.success) {
         res.status(200).json(result);
      } else {
         res.status(400).json(result)
      }
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
}


export const verifyAndUpdatePassword = async (req, res) => {
   try {
      const { id } = req.params;
      const { pin, password, appkey } = req.body;
      const result = await passwordService.verifyAndUpdatePassword(id, pin, password, appkey);
      if (result.success) {
         res.status(200).json(result);
      } else {
         res.status(400).json(result)
      }
   } catch (error) {
      res.status(500).json({ success: false, message: error.message });
   }
};

export const passwordPage = async (req, res) => {
   res.status(200).json({
      msg: "under maintenance mas"
   })
}