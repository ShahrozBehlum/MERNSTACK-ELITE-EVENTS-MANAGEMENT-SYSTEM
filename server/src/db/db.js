import mongoose from 'mongoose'
import { dbName } from '../constant.js'

const connectionDB = async () => {
    try {

        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${dbName}`)
        console.log(`DB Connected Successfully at Host: ${connectionInstance.connection.host}`);

    } catch (error) {
        console.log('DB Connection Failed', error);
        process.exit(1)
    }
}

export default connectionDB;