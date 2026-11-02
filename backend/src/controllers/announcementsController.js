import * as announcementsService from '../services/announcementsServices.js'

export const getAnnouncements = async (req, res) => {
   try {
      const result = await announcementsService.getAnnouncements(req.body)
      if (result.success) {
         res.status(200).json(result)
      } else {
         res.status(400).json(result)
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
}

export const createAnnouncements = async (req, res) => {
   try {
      const data = req.body
      const result = await announcementsService.createAnnouncements(data)
      if (result.success) {
         res.status(200).json(result)
      } else {
         res.status(400).json(result)
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
}

export const updateAnnouncements = async (req, res) => {
   try {
      const announcementsId = req.params.id
      const announcementsData = req.body
      const result = await announcementsService.updateAnnouncements(announcementsData, announcementsId)
      if (result.success) {
         res.status(200).json(result)
      } else {
         res.status(400).json(result)
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
}

export const getAnnouncementsByUserId = async (req, res) => {

   try {
      const { _id } = req.body
      const result = await announcementsService.getAnnouncementsByUserId(_id)
      if (result.success) {
         res.status(200).json(result)
      } else {
         res.status(400).json(result)
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
}
export const getAnnouncementsByAnnouncementId = async (req, res) => {
   try {
      const announcementId = req.params.id
      const result = await announcementsService.getAnnouncementsByAnnouncementId(announcementId)
      if (result.success) {
         res.status(200).json(result)
      } else {
         res.status(400).json(result)
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
}

export const deleteAnnouncements = async (req, res) => {
   try {
      const announcementsId = req.params.id
      const result = await announcementsService.deleteAnnouncements(announcementsId)
      if (result.success) {
         res.status(200).json(result)
      } else {
         res.status(400).json(result)
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
}


export const getQueueAnnouncements = async (req, res) => {
   try {
      const result = await announcementsService.getQueueAnnouncements()
      if (result.success) {
         res.status(200).json(result)
      } else {
         res.status(400).json(result)
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
}

export const createQueueAnnouncements = async (req, res) => {
   try {
      const data = req.body
      const result = await announcementsService.createQueueAnnouncements(data)
      if (result.success) {
         res.status(200).json(result)
      } else {
         res.status(400).json(result)
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
}

export const updateQueueAnnouncements = async (req, res) => {
   try {
      const announcementsId = req.params.id
      const announcementData = req.body
      const result = await announcementsService.updateQueueAnnouncements(announcementData, announcementsId)
      if (result.success) {
         res.status(200).json(result)
      } else {
         res.status(400).json(result)
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
}

export const deleteQueueAnnouncements = async (req, res) => {
   try {
      const announcementsId = req.params.id
      const { order } = req.body
      const result = await announcementsService.deleteQueueAnnouncements(announcementsId, order)
      if (result.success) {
         res.status(200).json(result)
      } else {
         res.status(400).json(result)
      }
   } catch (error) {
      res.status(500).json({ error: "Internal server error" });
   }
}
