export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
// Formate une taille de fichier en octets vers un libellé lisible (Ko/Mo).
export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return '0 Ko';
  const ko = bytes / 1024;
  if (ko < 1024) return `${ko.toFixed(0)} Ko`;
  return `${(ko / 1024).toFixed(1)} Mo`;
}