const mongoose = require('mongoose');

const pricingRuleSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Rule name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    ruleType: {
      type: String,
      enum: ['occupancy', 'weekend', 'seasonal', 'custom'],
      default: 'occupancy',
      required: true,
    },
    conditions: {
      occupancyThreshold: {
        type: Number,
        default: 80,
      },
      occupancyOperator: {
        type: String,
        enum: ['>=', '>', '<=', '<'],
        default: '>=',
      },
      daysOfWeek: {
        type: [String],
        default: ['Friday', 'Saturday', 'Sunday'],
      },
      seasonStart: {
        type: Date,
      },
      seasonEnd: {
        type: Date,
      },
    },
    action: {
      adjustmentType: {
        type: String,
        enum: ['percentage_increase', 'percentage_decrease', 'fixed_increase', 'fixed_decrease'],
        default: 'percentage_increase',
        required: true,
      },
      adjustmentValue: {
        type: Number,
        required: true,
        default: 15,
      },
    },
    targetScope: {
      applyToAll: {
        type: Boolean,
        default: true,
      },
      categories: {
        type: [String],
        default: [],
      },
      productIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
      ],
    },
    priority: {
      type: Number,
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    enforceClamping: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('PricingRule', pricingRuleSchema);
