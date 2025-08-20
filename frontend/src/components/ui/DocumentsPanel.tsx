import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
// @ts-ignore - types may not be present
import mermaid from 'mermaid';
import { docgenApi } from '../../services/docgen';
import { SummaryResponse, PlanResponse, DesignResponse, FullResponse, Diagram } from '../../schemas/docgen';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

type GeneratedDoc = SummaryResponse | PlanResponse | DesignResponse | FullResponse | null;

interface DocumentsPanelProps {
  doc: GeneratedDoc;
  isLoading: boolean;
  error: string | null;
  showDiagrams?: boolean;
}

const MermaidDiagram: React.FC<{ diagram: Diagram }> = ({ diagram }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'dark' });
    if (ref.current && diagram.code) {
      mermaid.render(`mermaid-${diagram.id}`, diagram.code)
        .then((result: any) => setSvg(result.svg))
        .catch((err: any) => console.error('Mermaid render error:', err));
    }
  }, [diagram]);

  return (
    <div className="my-4 p-4 bg-gray-900 rounded-lg overflow-x-auto">
      {svg ? (
        <div dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <pre className="text-white text-sm">{diagram.code}</pre>
      )}
    </div>
  );
};

const DocumentsPanel: React.FC<DocumentsPanelProps> = ({ doc, isLoading, error, showDiagrams = true }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [downloadLinks, setDownloadLinks] = useState<{ id: string, files: string[] } | null>(null);

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <LoadingSpinner />
        <p className="mt-2 text-sm text-gray-600">Generating document...</p>
      </div>
    );
  }

  if (error) {
    return <ErrorMessage title="Document Generation Failed" error={error} />;
  }

  if (!doc) {
    return null; // Don't render anything if there's no document yet
  }

  const handleExport = async (format: 'zip' | 'pdf') => {
    setIsExporting(true);
    setExportError(null);
    setDownloadLinks(null);

    const result = await docgenApi.exportDocument({ bundle: doc, format });
    if (result.success) {
      setDownloadLinks({ id: result.data.artifact_id, files: result.data.filenames });
    } else {
      setExportError(result.error);
    }
    setIsExporting(false);
  };

  const getMarkdownContent = (): string => {
    if ('summary_md' in doc) return doc.summary_md;
    if ('plan_md' in doc) return doc.plan_md;
    if ('design_md' in doc) return doc.design_md;
    // For FullResponse, we can combine them or just show summary for now
    if ('api_md' in doc) return doc.summary_md;
    return '';
  };

  const getDiagrams = (): Diagram[] => {
    if ('diagrams' in doc && doc.diagrams) {
      return doc.diagrams;
    }
    return [];
  };

  return (
    <div className="p-6 border-t border-b border-gray-200 bg-gray-50">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Generated Document</h3>

      <div className="prose prose-sm max-w-none">
        <ReactMarkdown rehypePlugins={[rehypeRaw]}>
          {getMarkdownContent()}
        </ReactMarkdown>
      </div>

  {/* Diagrams will be rendered if present; UI toggle exists in ChatInterface */}
  {showDiagrams && getDiagrams().map(diag => <MermaidDiagram key={diag.id} diagram={diag} />)}

      <div className="mt-6">
        <h4 className="font-medium text-gray-800 mb-2">Export</h4>
        <div className="flex gap-4">
          <button onClick={() => handleExport('zip')} disabled={isExporting} className="btn-primary">
            {isExporting ? <LoadingSpinner size="sm" /> : 'Export as ZIP'}
          </button>
          <button onClick={() => handleExport('pdf')} disabled={isExporting} className="btn-secondary">
            {isExporting ? <LoadingSpinner size="sm" /> : 'Export as PDF'}
          </button>
        </div>
        {exportError && <ErrorMessage title="Export Failed" error={exportError} />}
        {downloadLinks && (
          <div className="mt-4">
            <h5 className="font-medium text-gray-800">Download Links:</h5>
            <ul className="list-disc list-inside">
              {downloadLinks.files.map(file => (
                <li key={file}>
                  <a
                    href={`/api/docgen/download/${downloadLinks.id}/${file}`}
                    className="text-sih-blue hover:underline"
                    download
                  >
                    {file}
                  </a>
                </li>
              ))}
            </ul>
            <p className="text-xs text-gray-500 mt-2">Links expire in 15 minutes.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPanel;
