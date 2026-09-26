const mongoose = require('mongoose');

const priceOverrideSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    date: {
      type: String, // 'YYYY-MM-DD'
      required: true,
      index: true,
    },
    overridePrice: {
      type: Number,
      required: true,
    },
    originalPrice: {
      type: Number,
      required: true,
    },
    recommendedPrice: {
      type: Number,
    },
    reason: {
      type: String,
      default: 'Manual manager override',
    },
    status: {
      type: String,
      enum: ['active', 'cleared'],
      default: 'active',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

// Compound index for uniqueness per org, product and date
priceOverrideSchema.index({ organizationId: 1, productId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('PriceOverride', priceOverrideSchema);
