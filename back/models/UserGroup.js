import mongoose from 'mongoose';

const userGroupSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'moderator'],
      default: 'member'
    }
  },
  {
    timestamps: true
  }
);

userGroupSchema.index({ userId: 1, groupId: 1 }, { unique: true });

const UserGroup = mongoose.model('UserGroup', userGroupSchema);

export default UserGroup;