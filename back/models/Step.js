import mongoose from 'mongoose';

const stepSchema = new mongoose.Schema(
  {
    userJourneyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserJourney',
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
        required: true
      }
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
    },
    photo: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

stepSchema.index({ location: '2dsphere' });
stepSchema.index({ userJourneyId: 1, timestamp: 1 });

const Step = mongoose.model('Step', stepSchema);

export default Step;