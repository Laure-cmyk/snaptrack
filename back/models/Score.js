import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema(
  {
    participationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participation',
      required: true,
      unique: true
    },
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Journey',
      required: true
    },
    score: {
      type: Number,
      default: 0,
      min: 0
    },
    time: {
      type: Number,
      default: 0
    },
    distance: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

const Score = mongoose.model('Score', scoreSchema);

export default Score;