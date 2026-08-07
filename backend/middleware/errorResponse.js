function sendError(res, err, publicMessage = 'Une erreur est survenue, veuillez réessayer') {
  console.error('[ERREUR SERVEUR]', err);

  if (err.code === '23505') return res.status(409).json({ error: 'Cet élément existe déjà' });
  if (err.code === '23503') return res.status(409).json({ error: 'Impossible : cet élément est référencé ailleurs' });
  if (err.code === '23514' || err.code === '23502') return res.status(400).json({ error: 'Données invalides ou incomplètes' });

  res.status(500).json({ error: publicMessage });
}

module.exports = sendError;
