// backend/models/RiderDetails.js
// Mongoose schema for storing details specific to a ride rider.

const mongoose = require('mongoose');

const RiderDetailsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, // Link to the User model
        ref: 'User',
        required: true,
        unique: true // Each user can only have one rider details entry
    },
    aadharNumber: { type: String, required: true, unique: true }, // Collected here for rider context
    mobileNumber: { type: String, required: true, unique: true }, // Ensure consistency, though already in User
    // Storing image URLs (or paths)
    aadharPhotoUrl: { type: String },
    // New: live selfie photo
    livePhotoUrl: { type: String },

    // Verification status fields
    aadharVerified: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update `updatedAt` field on save
RiderDetailsSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('RiderDetails', RiderDetailsSchema);
