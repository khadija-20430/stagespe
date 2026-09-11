import { Eye, Download } from 'lucide-react';
import { getFileUrl } from '../../services/api.js';

const getFileName = (path) => {
  if (!path) return 'document';
  try {
    const cleanPath = String(path).split('?')[0];
    return cleanPath.split('/').pop() || 'document';
  } catch {
    return 'document';
  }
};

const downloadFile = async (path, fallbackName = 'document') => {
  try {
    const url = getFileUrl(path);
    if (!url) throw new Error('Aucun fichier disponible');
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Impossible de télécharger (${response.status})`);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fallbackName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Erreur téléchargement:', error);
    alert(error.message || 'Erreur lors du téléchargement');
  }
};

export default function DocumentsCell({ documents, emptyLabel = '—' }) {
  if (!Array.isArray(documents) || documents.length === 0) {
    return <span className="text-slate-400">{emptyLabel}</span>;
  }

  return (
    <div className="flex flex-col gap-1">
      {documents.map((doc) => {
        const filePath = doc.fichier_url;
        if (!filePath) return null;
        const fileUrl = getFileUrl(filePath);
        const fileName = getFileName(filePath);
        const label = doc.titre || fileName;

        return (
          <div key={doc.id} className="flex items-center gap-2 text-xs">
            <span className="truncate max-w-[140px]" title={label}>
              {label}
            </span>
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-cobalt hover:text-blue-700 transition"
              title="Voir le document"
            >
              <Eye size={14} />
            </a>
            <button
              type="button"
              onClick={() => downloadFile(filePath, fileName)}
              className="text-green-600 hover:text-green-700 transition"
              title="Télécharger"
            >
              <Download size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}