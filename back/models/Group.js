import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      maxlength: 500,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    groupImage: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

const Group = mongoose.model('Group', groupSchema);

export default Group;
