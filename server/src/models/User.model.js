import mongoose, { Schema } from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    isVerified: {
        type: Boolean,
        default: false
    }

}, {timestamps: true})

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next

    this.password = await bcrypt.hash(this.password, 10)
    next
})

const User = mongoose.model('User', userSchema)
export default User;