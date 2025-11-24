import mongoose from 'mongoose';

const userJourneySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Journey',
      required: true
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'abandoned'],
      default: 'not_started'
    },
    startedAt: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    totalDistance: {
      type: Number,
      default: 0
    },
    totalTime: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

userJourneySchema.index({ userId: 1, journeyId: 1 }, { unique: true });

const UserJourney = mongoose.model('UserJourney', userJourneySchema);

export default UserJourney;