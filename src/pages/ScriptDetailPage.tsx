import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getScript, deleteScript, regenerateScript, updateScript, translateScript, findImages, downloadImagesZip, type Script, type SectionImages } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { formatDate, wordCountToReadTime } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import {
  ArrowLeft, Copy, RefreshCw, Trash2, Loader2,
  FileDown, Pencil, Check, X, Languages, Images, Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const editionColors: Record<string, string> = {
  MORNING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  EVENING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  MANUAL:  'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

function renderScript(content: string) {
  return content.split('\n').map((line, i) => {
    if (/^##\s*SECTION\s*\d+/i.test(line.trim())) {
      return (
        <h2 key={i} className="text-primary font-bold text-base mt-8 mb-3 border-b border-border pb-2 uppercase tracking-wide">
          {line.replace(/^##\s*/i, '')}
        </h2>
      );
    }
    if (line.trim() === '' || line.trim() === '---') return <div key={i} className="h-3" />;
    return <p key={i} className="mb-3 leading-[1.85] text-foreground/90">{line}</p>;
  });
}

export function ScriptDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [script, setScript] = useState<Script | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [contentVi, setContentVi] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [showBilingual, setShowBilingual] = useState(false);

  // Image finder state
  const [imageResult, setImageResult] = useState<SectionImages[] | null>(null);
  const [findingImages, setFindingImages] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!id) return;
    getScript(id)
      .then((s) => {
        setScript(s);
        setEditTitle(s.title);
        setEditContent(s.content || '');
      })
      .catch(() => toast({ title: 'Script not found', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, [id, toast]);

  // Auto-resize textarea
  useEffect(() => {
    if (editMode && textareaRef.current) {
      const ta = textareaRef.current;
      ta.style.height = 'auto';
      ta.style.height = `${ta.scrollHeight}px`;
    }
  }, [editMode, editContent]);

  function enterEditMode() {
    setEditTitle(script?.title || '');
    setEditContent(script?.content || '');
    setEditMode(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function cancelEdit() {
    setEditMode(false);
    setEditTitle(script?.title || '');
    setEditContent(script?.content || '');
  }

  async function handleSave() {
    if (!script) return;
    setSaving(true);
    try {
      const updated = await updateScript(script.id, {
        title: editTitle !== script.title ? editTitle : undefined,
        content: editContent !== script.content ? editContent : undefined,
      });
      setScript(updated);
      setEditMode(false);
      toast({ title: 'Script saved' });
    } catch {
      toast({ title: 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    const text = editMode ? editContent : (script?.content || '');
    await navigator.clipboard.writeText(text);
    toast({ title: 'Copied to clipboard' });
  }

  function handleExport(format: 'docx' | 'pdf') {
    if (!script) return;
    window.open(`/api/scripts/${script.id}/export?format=${format}`, '_blank');
  }

  async function handleRegenerate() {
    if (!script) return;
    setRegenerating(true);
    try {
      const newScript = await regenerateScript(script.id);
      toast({ title: 'Script regenerated' });
      navigate(`/scripts/${newScript.id}`);
    } catch {
      toast({ title: 'Regeneration failed', variant: 'destructive' });
    } finally {
      setRegenerating(false);
    }
  }

  async function handleTranslate() {
    if (!script) return;
    if (contentVi) { setShowBilingual((v) => !v); return; }
    setTranslating(true);
    try {
      const vi = await translateScript(script.id);
      setContentVi(vi);
      setShowBilingual(true);
    } catch {
      toast({ title: 'Translation failed', variant: 'destructive' });
    } finally {
      setTranslating(false);
    }
  }

  async function handleFindImages() {
    if (!script) return;
    setFindingImages(true);
    setImageResult(null);
    try {
      const result = await findImages(script.id);
      setImageResult(result.sections);
      toast({ title: `Tìm được ${result.total} ảnh` });
    } catch {
      toast({ title: 'Không tìm được ảnh — kiểm tra PEXELS_API_KEY', variant: 'destructive' });
    } finally {
      setFindingImages(false);
    }
  }

  async function handleDownloadImages() {
    if (!imageResult || !script) return;
    setDownloading(true);
    try {
      await downloadImagesZip(script.id, imageResult);
    } catch {
      toast({ title: 'Download thất bại', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  }

  async function handleDelete() {
    if (!script) return;
    if (!confirm(`Delete "${script.title}"?`)) return;
    try {
      await deleteScript(script.id);
      toast({ title: 'Script deleted' });
      navigate('/scripts');
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  }

  // Live word count while editing
  const liveWordCount = editMode
    ? editContent.split(/\s+/).filter(Boolean).length
    : (script?.wordCount ?? 0);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!script) {
    return (
      <div className="text-center py-24">
        <p className="text-muted-foreground">Script not found.</p>
        <Button className="mt-4" asChild><Link to="/scripts">Back to Scripts</Link></Button>
      </div>
    );
  }

  const meta = script.metadata as Record<string, unknown> | undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/scripts"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge className={editionColors[script.editionType]}>{script.editionType}</Badge>
              <Badge variant="outline">v{script.version}</Badge>
              {editMode && (
                <Badge variant="outline" className="text-yellow-400 border-yellow-500/40">
                  Editing
                </Badge>
              )}
            </div>

            {/* Editable title */}
            {editMode ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="text-base font-bold h-8 px-2 bg-secondary border-primary/50"
              />
            ) : (
              <h1 className="text-xl font-bold leading-tight">{script.title}</h1>
            )}

            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(script.createdAt)}
              &nbsp;&bull;&nbsp;
              <span className={cn(editMode && liveWordCount < 1500 && 'text-yellow-400',
                                  editMode && liveWordCount > 2500 && 'text-red-400')}>
                {liveWordCount.toLocaleString()} words
              </span>
              &nbsp;&bull;&nbsp;{wordCountToReadTime(liveWordCount)}
              &nbsp;&bull;&nbsp;{script.aiProvider}
            </p>
          </div>
        </div>

        {/* Action toolbar */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {editMode ? (
            <>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Save
              </Button>
              <Button variant="outline" size="sm" onClick={cancelEdit} disabled={saving}>
                <X className="h-4 w-4" />Cancel
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4" />Copy
              </Button>
              <Button variant="outline" size="sm" onClick={enterEditMode}>
                <Pencil className="h-4 w-4" />Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('docx')}>
                <FileDown className="h-4 w-4" />DOCX
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                <FileDown className="h-4 w-4" />PDF
              </Button>
              <Button
                variant={showBilingual ? 'default' : 'outline'}
                size="sm"
                onClick={handleTranslate}
                disabled={translating}
              >
                {translating
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Languages className="h-4 w-4" />}
                VI
              </Button>
              <Button
                variant={imageResult ? 'default' : 'outline'}
                size="sm"
                onClick={handleFindImages}
                disabled={findingImages}
              >
                {findingImages
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Images className="h-4 w-4" />}
                Tìm Ảnh
              </Button>
              <Button variant="outline" size="sm" onClick={handleRegenerate} disabled={regenerating}>
                {regenerating
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <RefreshCw className="h-4 w-4" />}
                Regenerate
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── METADATA ── */}
      {meta && !editMode && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Input Tokens',  value: meta.inputTokens },
            { label: 'Output Tokens', value: meta.outputTokens },
            { label: 'Matches Used',  value: meta.matchCount },
            { label: 'News Items',    value: meta.newsCount },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardHeader className="p-3 pb-1">
                <CardTitle className="text-xs text-muted-foreground font-normal">{label}</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <span className="text-lg font-semibold">{String(value ?? '—')}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── CONTENT ── */}
      {editMode ? (
        <Card className="ring-1 ring-primary/40">
          <CardContent className="p-6 sm:p-8">
            <p className="text-xs text-muted-foreground mb-3">
              Edit the script below. Section headers (<code className="bg-muted px-1 rounded">## SECTION X:</code>) are kept for structure — they won't appear in exported files.
            </p>
            <textarea
              ref={textareaRef}
              value={editContent}
              onChange={(e) => {
                setEditContent(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              className="w-full min-h-[60vh] bg-transparent text-sm text-foreground/90 leading-[1.85] resize-none outline-none font-mono border-0 focus:ring-0"
              spellCheck
            />
          </CardContent>
        </Card>
      ) : showBilingual && contentVi ? (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal uppercase tracking-wide">English</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="prose prose-invert max-w-none">
                {renderScript(script.content || '')}
              </div>
            </CardContent>
          </Card>
          <Card className="border-primary/30">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-xs text-muted-foreground font-normal uppercase tracking-wide">Tiếng Việt</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="prose prose-invert max-w-none">
                {renderScript(contentVi)}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 sm:p-8">
            <div className="prose prose-invert max-w-none">
              {renderScript(script.content || '')}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── IMAGE PANEL ── */}
      {findingImages && (
        <Card>
          <CardContent className="p-8 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Đang tìm ảnh cho từng câu… có thể mất 20–40 giây</p>
          </CardContent>
        </Card>
      )}

      {imageResult && !findingImages && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">
              Ảnh cho bản tin —{' '}
              <span className="text-primary">
                {imageResult.reduce((n, s) => n + s.items.filter((i) => i.imageUrl).length, 0)} ảnh
              </span>
            </h2>
            <Button size="sm" onClick={handleDownloadImages} disabled={downloading}>
              {downloading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Download className="h-4 w-4" />}
              {downloading ? 'Đang tạo ZIP…' : 'Tải xuống tất cả (ZIP)'}
            </Button>
          </div>

          {imageResult.map((section, sIdx) => (
            <Card key={sIdx}>
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-primary uppercase tracking-wide">
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                {section.items.map((item, iIdx) => (
                  <div key={iIdx} className="flex gap-3 items-start border-b border-border/40 pb-3 last:border-0 last:pb-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2">{item.sentence}</p>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">{item.keywords}</p>
                    </div>
                    {item.thumbnail ? (
                      <div className="shrink-0">
                        <img
                          src={item.thumbnail}
                          alt={item.imageAlt}
                          className="w-36 h-24 object-cover rounded border border-border"
                        />
                      </div>
                    ) : (
                      <div className="w-36 h-24 shrink-0 rounded border border-border/30 bg-muted/30 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Không tìm thấy</span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <div className="flex justify-end">
            <Button size="sm" onClick={handleDownloadImages} disabled={downloading}>
              {downloading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Download className="h-4 w-4" />}
              {downloading ? 'Đang tạo ZIP…' : 'Tải xuống tất cả (ZIP)'}
            </Button>
          </div>
        </div>
      )}

      {/* Word count bar while editing */}
      {editMode && (
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Target: 1,800–2,500 words</span>
          <span className={cn(
            'font-medium',
            liveWordCount < 1500 && 'text-yellow-400',
            liveWordCount >= 1800 && liveWordCount <= 2500 && 'text-green-400',
            liveWordCount > 2500 && 'text-red-400',
          )}>
            {liveWordCount.toLocaleString()} / 2,500
          </span>
        </div>
      )}
    </div>
  );
}
