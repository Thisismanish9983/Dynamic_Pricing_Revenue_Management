const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    industry: {
      type: String,
      enum: ['hotel', 'vacation_rental', 'event_venue', 'parking', 'rental_business', 'other'],
      default: 'hotel',
    },
    currency: {
      type: String,
      default: 'USD',
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
    settings: {
      autoApproveRules: { type: Boolean, default: false },
      enableAnomalyAlerts: { type: Boolean, default: true },
      defaultMinPriceMargin: { type: Number, default: 0.7 }, // 70% of base
      defaultMaxPriceMargin: { type: Number, default: 1.8 }, // 180% of base
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Organization', organizationSchema);
