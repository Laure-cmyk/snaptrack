import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      maxlength: 1000,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

ratingSchema.index({ userId: 1, journeyId: 1 }, { unique: true });

const Rating = mongoose.model('Rating', ratingSchema);

export default Rating;