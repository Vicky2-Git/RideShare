// backend/models/ProviderDetails.js
// Mongoose schema for storing details specific to a ride provider.

const mongoose = require('mongoose');

const ProviderDetailsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, // Link to the User model
        ref: 'User',
        required: true,
        unique: true // Each user can only have one provider details entry
    },
    vehicleCategory: { type: String, enum: ['Car', 'Bike'], required: true }, // ADDED: New field for Car/Bike
    vehicleNumber: { type: String, required: true, unique: true },
    rcNumber: { type: String, required: true, unique: true },
    insuranceNumber: { type: String, required: true, unique: true }, // MODIFIED: Made required: true, removed sparse: true
    licenseNumber: { type: String, required: true, unique: true },
    aadharNumber: { type: String, required: true, unique: true },
    vehicleType: { type: String }, // Made optional as it's only for cars
    // Storing image URLs (or paths)
    vehiclePhotoUrl: { type: String },
    rcPhotoUrl: { type: String },
    insurancePhotoUrl: { type: String },
    licensePhotoUrl: { type: String },
    aadharPhotoUrl: { type: String },

    // Verification status fields
    rcVerified: { type: Boolean, default: false },
    insuranceVerified: { type: Boolean, default: false },
    licenseVerified: { type: Boolean, default: false },
    aadharVerified: { type: Boolean, default: false },

    // Driver License OCR extracted details (simulated)
    ocrExtractedName: { type: String },
    ocrExtractedLicenseNumber: { type: String },
    ocrExtractedDob: { type: String },
    ocrExtractedValidity: { type: String },

    // Flag for previously used vehicle (for auto-fill simulation)
    isPreviouslyUsedVehicle: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update `updatedAt` field on save
ProviderDetailsSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});


module.exports = mongoose.model('ProviderDetails', ProviderDetailsSchema);
