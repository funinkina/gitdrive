import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema({
    email: {
        type: String,
        unique: true,
        required: [true, 'Email is required'],
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
    },
    image: {
        type: String,
    },
    githubId: {
        type: String,
        unique: true,
        required: true,
    },
    accessToken: {
        type: String,
    },
}, { timestamps: true });

const User = models.User || model('User', UserSchema);

export default User;
