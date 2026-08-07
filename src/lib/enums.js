// Mapping des enums stockés en BDD vers les clés de traduction i18n.
// Les données (mock ou API) contiennent toujours le CODE (ex. 'ongoing'),
// jamais le libellé traduit — l'affichage se charge de la traduction.

export const PROJECT_STATUS = ['proposed', 'ongoing', 'completed', 'suspended'];
export const CALL_STATUS = ['open', 'closed', 'upcoming', 'closing_soon'];
export const MOBILITY_TYPE = [
  'student_outgoing', 'student_incoming', 'teaching',
  'research', 'staff', 'internship', 'summer_school',
];
export const NEWS_TYPE = ['news', 'event', 'workshop', 'meeting', 'testimonial'];
export const PARTNERSHIP_STATUS = ['active', 'pending', 'ended'];
export const DOCUMENT_CATEGORIES = [
  'institutionnel', 'template_projet', 'formulaire_financier', 'erasmus_mobilite',
  'horizon_msca', 'national', 'guide_faq', 'rapport', 'brochure', 'convention',
];

// Tonalité des badges par statut (indépendant de la langue)
export function projectStatusTone(status) {
  return { proposed: 'slate', ongoing: 'cobalt', completed: 'green', suspended: 'amber' }[status] ?? 'slate';
}
export function callStatusTone(status) {
  return { open: 'green', upcoming: 'amber', closing_soon: 'amber', closed: 'slate' }[status] ?? 'slate';
}