import express from 'express'
import { protect, admin } from '../middleware/auth.middleware.js'
import { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent } from '../controllers/event.controller.js'
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router()

router.route('/')
    .get(getAllEvents)
    .post(protect, upload.single('eventImage') ,createEvent)

//Create event (Admin Only)
router.route('/:id')
    .get(getEventById)
    .put(protect, admin, updateEvent)
    .delete(protect, admin, deleteEvent)

export default router;
