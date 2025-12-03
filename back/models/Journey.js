import mongoose from 'mongoose';

const journeySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    image: {
      type: String,
      default: null
    },
    town: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000
    }
  },
  {
    timestamps: true
  }
);

const Journey = mongoose.model('Journey', journeySchema);

export default Journey;