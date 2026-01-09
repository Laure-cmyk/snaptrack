import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema(
  {
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Journey',
      required: true
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0]
      }
    },
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    },
    image: {
      type: String,
      default: null
    },
    riddle: {
      type: String,
      maxlength: 500,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true
    },
    accuracy: {
      type: Number,
      default: null
    },
    altitude: {
      type: Number,
      default: null
    },
    speed: {
      type: Number,
      default: null
    },
    note: {
      type: String,
      maxlength: 500,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

stepSchema.index({ location: '2dsphere' });
stepSchema.index({ journeyId: 1, timestamp: 1 });

const Step = mongoose.model('Step', stepSchema);

export default Step;
