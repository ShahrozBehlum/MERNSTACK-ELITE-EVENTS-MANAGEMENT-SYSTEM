import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectionDB from '../src/db/db.js'
import authRoutes from '../src/routes/auth.routes.js'
import eventsRoutes from '../src/routes/events.routes.js'
import bookingRoutes from '../src/routes/booking.routes.js'


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use('/uploads', express.static('uploads'));


//Routes
app.use('/api/auth', authRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/bookings', bookingRoutes)

//Connect to MonoDB
connectionDB()
.then(() => {
    console.log('Connected To MongoDB');
})
.catch(() => {
    console.error('Error Connecting to MongoDB', error)
})

const port = process.env.PORT;

app.listen(port, () => {
    console.log(`Server is running at port: ${port}`);
    
})