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
    }
  },
  {
    timestamps: true
  }
);

userJourneySchema.index({ userId: 1, journeyId: 1 }, { unique: true });

const UserJourney = mongoose.model('UserJourney', userJourneySchema);

export default UserJourney;
