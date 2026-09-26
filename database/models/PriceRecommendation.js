const mongoose = require('mongoose');

const priceRecommendationSchema = new mongoose.Schema(
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
    targetDate: {
      type: String, // 'YYYY-MM-DD'
      required: true,
      index: true,
    },
    basePrice: {
      type: Number,
      required: true,
    },
    currentPrice: {
      type: Number,
      required: true,
    },
    recommendedPrice: {
      type: Number,
      required: true,
    },
    demandMultiplier: {
      type: Number,
      default: 1.0,
    },
    occupancyRate: {
      type: Number,
      default: 0,
    },
    triggerReason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'overridden'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewNote: {
      type: String,
      default: '',
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PriceRecommendation', priceRecommendationSchema);
