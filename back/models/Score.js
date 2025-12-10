import mongoose from 'mongoose';

const scoreSchema = new mongoose.Schema(
  {
    // AJOUT: On remplace ou on ajoute userId pour que le .populate('userId') fonctionne
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // MODIFICATION: Je passe participationId en optionnel (required: false)
    // car votre route POST n'envoie pas de participationId pour l'instant.
    participationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Participation',
      required: false 
    },
    journeyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Journey', // Vérifiez que le modèle s'appelle bien 'Journey' (avec majuscule)
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