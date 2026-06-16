import Event from '../models/Event.model.js'
import mongoose from 'mongoose';
import uploadOnCloudinary from '../utils/cloudinary.js';
import fs from 'fs'

export const getAllEvents = async (req, res) => {
    try {

        const filters = {};
        if (req.query.category) {
            filters.category = req.query.category
        }

        if (req.query.location) {
            filters.location = req.query.location
        }

        if (req.query.search) {
            filters.title = { $regex: req.query.search, $options: 'i' };
        }

        const events = await Event.find(filters).populate('createdBy', 'name email');
        if (events.length === 0) {
            return res.status(404).json({ message: 'No any event Found' })
        }

        res.status(200).json({
            message: 'Events Fetched Successfully',
            events
        })

    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch events', error: error.message })
    }
}

export const getEventById = async (req, res) => {
    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: 'Invalid event ID'
        })
    }

    try {

        const event = await Event.findById(id)
        if (!event) {
            return res.status(404).json({ message: 'No any event Found' })
        }

        res.status(200).json({
            message: 'Event Fetched Successfully',
            event
        })

    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch event by id', error: error.message })
    }
};

export const createEvent = async (req, res) => {
    const { title, description, date, location, category, totalSeats, ticketPrice } = req.body;

    try {

        if (!title || !description || !date || !location || !category || !totalSeats || !ticketPrice) {
            return res.status(400).json({ message: 'Fields are Required' })
        }

        const eventImageLocalPath = req.file?.path;

        if (!eventImageLocalPath) {
            return res.status(400).json({
                message: "EventImage file required"
            })
        }

        const stats = fs.statSync(eventImageLocalPath);
        console.log("FILE SIZE:", stats.size);

        const eventImage = await uploadOnCloudinary(eventImageLocalPath)
        console.log("UPLOAD RESULT:", eventImage);
        console.log("ENV CHECK:", {
            cloud: !!process.env.CLOUDINARY_CLOUD_NAME,
            key: !!process.env.CLOUDINARY_API_KEY,
            secret: !!process.env.CLOUDINARY_API_SECRET,
        });

        if (!eventImage) {
            return res.status(400).json({
                message: "Image upload failed"
            })
        }

        const event = await new Event({
            title,
            description,
            date,
            location,
            category,
            totalSeats,
            availableSeats: Number(totalSeats),
            ticketPrice,
            image: eventImage.url,
            createdBy: req.user?._id
        });

        await event.save();

        res.status(201).json({
            message: 'Event Created Successfully',
            event
        })

    } catch (error) {
        res.status(500).json({ message: 'Failed to creation event', error: error.message })
    }
}

export const updateEvent = async (req, res) => {

    const { title, description, date, location, category, totalSeats, ticketPrice, image } = req.body;

    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: 'Invalid event ID'
        })
    }

    try {

        const event = await Event.findByIdAndUpdate(id, {
            title,
            description,
            date,
            location,
            category,
            totalSeats,
            availableSeats: Number(totalSeats),
            ticketPrice,
            image,
            createdBy: req.user?._id
        }, { new: true });

        if (!event) {
            return res.status(404).json({ message: 'Event not found' })
        }

        res.status(200).json({
            message: 'Event Updated Successfully',
            event
        })

    } catch (error) {
        res.status(500).json({ message: 'Failed to update event', error: error.message })
    }
}

export const deleteEvent = async (req, res) => {

    const { id } = req.params

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            message: 'Invalid event ID'
        })
    }

    try {

        const event = await Event.findByIdAndDelete(id)

        if (!event) {
            return res.status(404).json({ message: 'Event not found' })
        }

        res.status(200).json({
            message: 'Event Deleted Successfully',
            deletedEvent: event
        })

    } catch (error) {
        res.status(500).json({ message: 'Failed to delete event', error: error.message })
    }

}