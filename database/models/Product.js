const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Product/service name is required'],
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true, // e.g. "Deluxe Room", "Conference Hall", "SUV Rental", "VIP Suite"
    },
    description: {
      type: String,
      default: '',
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: 0,
    },
    minPrice: {
      type: Number,
      required: [true, 'Minimum price limit is required'],
      min: 0,
    },
    maxPrice: {
      type: Number,
      required: [true, 'Maximum price limit is required'],
      min: 0,
    },
    currentPrice: {
      type: Number,
      default: function () {
        return this.basePrice;
      },
    },
    capacity: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    availableUnits: {
      type: Number,
      required: true,
      default: 1,
      min: 0,
    },
    occupiedUnits: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    location: {
      type: String,
      default: 'Main Facility',
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
    },
    pricingConfig: {
      demandMultiplier: { type: Number, default: 1.0 },
      isDynamicPricingEnabled: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual property for occupancy rate
productSchema.virtual('occupancyRate').get(function () {
  if (!this.capacity || this.capacity === 0) return 0;
  return Math.round((this.occupiedUnits / this.capacity) * 100);
});

module.exports = mongoose.model('Product', productSchema);
