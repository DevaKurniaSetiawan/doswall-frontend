import express from 'express';
import * as adminController from '../controllers/adminController.js';
import * as announcementsController from '../controllers/announcementsController.js';
import * as clientController from '../controllers/clientController.js';
import * as passwordController from '../controllers/passwordController.js';
const router_secured = express.Router();

router_secured.post('/admin/getclients', adminController.getAdmin)
router_secured.put('/admin/updateclients/:id', adminController.updateAdmin)
router_secured.post('/admin/delete/:id', adminController.deleteClients)
router_secured.post('/admin/create', adminController.createClients)
router_secured.post('/admin/getrestrict', adminController.getRestrict)
router_secured.post('/admin/editrestrict', adminController.editRestrict)

router_secured.post('/clients/get/:id', clientController.getClientsByUserId)
router_secured.put('/clients/update', clientController.updateClients)
router_secured.post('/clients/getlocationlists', clientController.getLocationLists)


router_secured.post('/announcements/get', announcementsController.getAnnouncements)
router_secured.post('/announcements/getbyuser', announcementsController.getAnnouncementsByUserId)
router_secured.post('/announcements/getbyannouncement/:id', announcementsController.getAnnouncementsByAnnouncementId)
router_secured.put('/announcements/update/:id', announcementsController.updateAnnouncements)
router_secured.post('/announcements/add', announcementsController.createAnnouncements)
router_secured.post('/announcements/delete/:id', announcementsController.deleteAnnouncements)

router_secured.post('/announcements/getqueue', announcementsController.getQueueAnnouncements)
router_secured.post('/announcements/createqueue', announcementsController.createQueueAnnouncements)
router_secured.post('/announcements/updatequeue/:id', announcementsController.updateQueueAnnouncements)
router_secured.post('/announcements/deletequeue/:id', announcementsController.deleteQueueAnnouncements)

router_secured.put('/password/update', passwordController.updatePasswordLocal)




export default router_secured
