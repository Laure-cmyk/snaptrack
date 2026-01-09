import mongoose from 'mongoose';

const participationSchema = new mongoose.Schema(
  {
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Journey',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['open', 'running', 'completed'],
      default: 'open'
    }
  },
  {
    timestamps: true
  }
);

participationSchema.index({ journeyId: 1, userId: 1 }, { unique: true });

const Participation = mongoose.model('Participation', participationSchema);

export default Participation;
