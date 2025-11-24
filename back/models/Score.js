import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema(
  {
    userJourneyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserJourney',
      required: true,
      unique: true
    },
    points: {
      type: Number,
      default: 0,
      min: 0
    },
    timeBonus: {
      type: Number,
      default: 0
    },
    accuracyBonus: {
      type: Number,
      default: 0
    },
    completionBonus: {
      type: Number,
      default: 0
    },
    totalScore: {
      type: Number,
      default: 0
    },
    rank: {
      type: Number,
      default: null
    }
  },
  {
    timestamps: true
  }
);

scoreSchema.pre('save', function (next) {
  this.totalScore = this.points + this.timeBonus + this.accuracyBonus + this.completionBonus;
  next();
});

const Score = mongoose.model('Score', scoreSchema);

export default Score;