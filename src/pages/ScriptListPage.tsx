import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getScripts, deleteScript, type Script } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, wordCountToReadTime } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import { Loader2, Search, Trash2, ExternalLink, FileText } from 'lucide-react';

const editionColors: Record<string, string> = {
  MORNING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  EVENING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  MANUAL: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

export function ScriptListPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [edition, setEdition] = useState('');
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (search) params.search = search;
      if (edition) params.edition = edition;
      const data = await getScripts(params);
      setScripts(data.scripts);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }, [page, search, edition]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await deleteScript(id);
      toast({ title: 'Script deleted' });
      load();
    } catch {
      toast({ title: 'Failed to delete script', variant: 'destructive' });
    }
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scripts</h1>
          <p className="text-muted-foreground mt-1">{total} total scripts</p>
        </div>
        <Button asChild>
          <Link to="/generate">Generate New</Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search scripts..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={edition} onValueChange={(v) => { setEdition(v === 'ALL' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All editions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All editions</SelectItem>
            <SelectItem value="MORNING">Morning</SelectItem>
            <SelectItem value="EVENING">Evening</SelectItem>
            <SelectItem value="MANUAL">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : scripts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No scripts found.</p>
            <Button className="mt-4" asChild><Link to="/generate">Generate your first script</Link></Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {scripts.map((script) => (
            <Card key={script.id} className="hover:border-primary/40 transition-colors group">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <Badge className={`${editionColors[script.editionType]} shrink-0`}>
                      {script.editionType}
                    </Badge>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{script.title}</p>
                      <div className="flex flex-wrap gap-x-3 mt-1 text-xs text-muted-foreground">
                        <span>{formatDate(script.createdAt)}</span>
                        <span>{script.wordCount.toLocaleString()} words</span>
                        <span>{wordCountToReadTime(script.wordCount)}</span>
                        <span>v{script.version}</span>
                        <span className="capitalize">{script.aiProvider}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/scripts/${script.id}`}><ExternalLink className="h-4 w-4" /></Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(script.id, script.title)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
