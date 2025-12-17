import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    size: {
      type: Number,
      default: 0,
      min: 0
    },
    // AJOUT DE CE CHAMP
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Cela fait le lien avec votre collection 'users'
    }
  },
  {
    timestamps: true
  }
);

const Group = mongoose.model('Group', groupSchema);

export default Group;