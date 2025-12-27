export function getDeleteLabel(item, defaultLabel = 'Refuser') {
  if (item.type === 'friend') return 'Supprimer';
  if (item.type === 'group') return 'Quitter';
  return defaultLabel;
}

export function getDeleteResult(item) {
  if (item.type === 'friend') return 'removed';
  if (item.type === 'group') return 'left';
  return 'declined';
}
