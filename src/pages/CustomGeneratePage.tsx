import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNews, refreshNews, generateCustomScript, NewsItem, SelectedNewsItem } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/useToast';
import {
  Loader2, RefreshCw, CheckCircle, Zap, ChevronRight, ChevronLeft,
  Newspaper, Trophy, Star, Users, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4;

const STEP_LABELS: Record<Step, string> = {
  1: 'Headlines (S1 & S2)',
  2: 'Match Results (S3)',
  3: 'Match of the Day (S4)',
  4: 'Players Spotlight (S5) & Generate',
};

function categoryColor(cat: string | null): string {
  switch (cat) {
    case 'match':         return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'injury':        return 'bg-red-500/20 text-red-300 border-red-500/30';
    case 'suspension':    return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
    case 'record':        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
    case 'squad':         return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'human-interest':return 'bg-green-500/20 text-green-300 border-green-500/30';
    default:              return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
  }
}

function langBadge(lang: string) {
  return lang === 'vi'
    ? <span className="ml-1 text-[10px] font-bold bg-red-600/30 text-red-300 border border-red-500/30 px-1 rounded">VN</span>
    : <span className="ml-1 text-[10px] font-bold bg-blue-600/30 text-blue-300 border border-blue-500/30 px-1 rounded">EN</span>;
}

function NewsCard({
  item,
  selected,
  onToggle,
  selectionType = 'checkbox',
  disabled = false,
}: {
  item: NewsItem;
  selected: boolean;
  onToggle: () => void;
  selectionType?: 'checkbox' | 'radio';
  disabled?: boolean;
}) {
  return (
    <div
      onClick={!disabled ? onToggle : undefined}
      className={cn(
        'relative cursor-pointer rounded-lg border p-4 transition-all',
        selected
          ? 'border-primary bg-primary/10 ring-1 ring-primary'
          : 'border-border hover:border-primary/40 hover:bg-accent/30',
        disabled && !selected && 'opacity-40 cursor-not-allowed',
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'mt-0.5 flex-shrink-0 w-4 h-4 rounded-full border-2 transition-colors flex items-center justify-center',
          selected ? 'border-primary bg-primary' : 'border-muted-foreground',
          selectionType === 'checkbox' && selected && 'rounded',
          selectionType === 'checkbox' && !selected && 'rounded',
        )}>
          {selected && <CheckCircle className="w-3 h-3 text-primary-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="text-xs text-muted-foreground">{item.source}</span>
            {langBadge(item.lang || 'en')}
            <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4', categoryColor(item.category))}>
              {item.category || 'general'}
            </Badge>
            <span className="ml-auto text-xs text-yellow-400 font-medium">★ {item.hotScore}</span>
          </div>
          <p className="text-sm font-medium leading-snug line-clamp-2">{item.title}</p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.content}</p>
        </div>
      </div>
    </div>
  );
}

export function CustomGeneratePage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Selections
  const [headlines, setHeadlines] = useState<Set<string>>(new Set());
  const [matchResults, setMatchResults] = useState<Set<string>>(new Set());
  const [matchOfDay, setMatchOfDay] = useState<string | null>(null);
  const [includeSection5, setIncludeSection5] = useState(true);

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    setLoading(true);
    try {
      const data = await getNews({ limit: '60' });
      setNews(data);
    } catch {
      toast({ title: 'Failed to load news', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const result = await refreshNews();
      toast({ title: `Refreshed ${result.refreshed} articles`, description: 'Latest news loaded from all sources' });
      await loadNews();
    } catch {
      toast({ title: 'Refresh failed', variant: 'destructive' });
    } finally {
      setRefreshing(false);
    }
  }

  function toggleHeadline(id: string) {
    setHeadlines((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); return next; }
      if (next.size >= 4) {
        toast({ title: 'Max 4 headlines for Sections 1 & 2', variant: 'destructive' });
        return prev;
      }
      next.add(id);
      return next;
    });
  }

  function toggleMatchResult(id: string) {
    setMatchResults((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toSelectedItem(item: NewsItem): SelectedNewsItem {
    return { id: item.id, title: item.title, content: item.content, source: item.source, lang: item.lang };
  }

  async function handleGenerate() {
    if (headlines.size < 1) { toast({ title: 'Select at least 1 headline', variant: 'destructive' }); return; }
    if (!matchOfDay) { toast({ title: 'Select a Match of the Day', variant: 'destructive' }); return; }

    const headlineItems = news.filter((n) => headlines.has(n.id)).map(toSelectedItem);
    const matchResultItems = news.filter((n) => matchResults.has(n.id)).map(toSelectedItem);
    const motdItem = news.find((n) => n.id === matchOfDay);
    if (!motdItem) return;

    setGenerating(true);
    try {
      const script = await generateCustomScript({
        editionType: 'MANUAL',
        headlines: headlineItems,
        matchResults: matchResultItems,
        matchOfDay: toSelectedItem(motdItem),
        includeSection5,
      });
      toast({ title: 'Script generated!', description: script.title });
      setTimeout(() => navigate(`/scripts/${script.id}`), 600);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      toast({ title: 'Generation failed', description: msg, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }

  // Filter pools
  const matchCatNews = news.filter((n) => n.category === 'match');
  const generalNews = news.filter((n) => n.category !== 'match');

  // Step validation
  const step1Valid = headlines.size >= 1;
  const step3Valid = !!matchOfDay;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading news from Vietnamese & international sources...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Custom Script Builder</h1>
          <p className="text-muted-foreground mt-1">
            Select news from Vietnamese & international sources for each section. Output: English, 1,200–1,300 words.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')} />
          Refresh News
        </Button>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {([1, 2, 3, 4] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <button
              onClick={() => {
                if (s < step) setStep(s);
                if (s === 2 && step1Valid) setStep(s);
                if (s === 3) setStep(s);
                if (s === 4) setStep(s);
              }}
              className={cn(
                'flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-lg transition-colors flex-1',
                step === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border',
                step === s ? 'border-primary-foreground bg-primary-foreground/20' : 'border-muted-foreground',
              )}>{s}</span>
              <span className="hidden sm:block">{STEP_LABELS[s]}</span>
            </button>
            {i < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
          </div>
        ))}
      </div>

      {/* Step 1: Headlines for S1 & S2 */}
      {step === 1 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-yellow-400" />
                <CardTitle>Sections 1 & 2 — Top Headlines</CardTitle>
              </div>
              <CardDescription>
                Select 1–4 articles. These will be teased in the Opening and expanded in Top Headlines.
                {headlines.size > 0 && <span className="text-primary ml-2 font-medium">{headlines.size} selected</span>}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {news.map((item) => (
                <NewsCard
                  key={item.id}
                  item={item}
                  selected={headlines.has(item.id)}
                  onToggle={() => toggleHeadline(item.id)}
                  selectionType="checkbox"
                  disabled={!headlines.has(item.id) && headlines.size >= 4}
                />
              ))}
              {news.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No news loaded. Click "Refresh News" to fetch latest articles.</p>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!step1Valid}>
              Next: Match Results <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Match Results for S3 */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-blue-400" />
                <CardTitle>Section 3 — Match Results</CardTitle>
              </div>
              <CardDescription>
                Select any number of match result articles. These appear in the Results rundown.
                {matchResults.size > 0 && <span className="text-primary ml-2 font-medium">{matchResults.size} selected</span>}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {matchCatNews.length > 0 ? (
                matchCatNews.map((item) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    selected={matchResults.has(item.id)}
                    onToggle={() => toggleMatchResult(item.id)}
                    selectionType="checkbox"
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No match-category news found. You can skip this section or select from all news below.</p>
              )}
              {matchCatNews.length === 0 && generalNews.slice(0, 10).map((item) => (
                <NewsCard
                  key={item.id}
                  item={item}
                  selected={matchResults.has(item.id)}
                  onToggle={() => toggleMatchResult(item.id)}
                  selectionType="checkbox"
                />
              ))}
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={() => setStep(3)}>
              Next: Match of the Day <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Match of the Day for S4 */}
      {step === 3 && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                <CardTitle>Section 4 — Match of the Day</CardTitle>
              </div>
              <CardDescription>
                Select exactly 1 article for the deep-dive segment (~290 words).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {news.map((item) => (
                <NewsCard
                  key={item.id}
                  item={item}
                  selected={matchOfDay === item.id}
                  onToggle={() => setMatchOfDay(matchOfDay === item.id ? null : item.id)}
                  selectionType="radio"
                />
              ))}
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button onClick={() => setStep(4)} disabled={!step3Valid}>
              Next: Section 5 & Generate <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Section 5 toggle + Generate */}
      {step === 4 && (
        <div className="space-y-4">
          {/* Section 5 toggle */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" />
                <CardTitle>Section 5 — Teams & Players Spotlight</CardTitle>
              </div>
              <CardDescription>
                Optional. When enabled, AI picks 1–2 player/team stories from your selected headlines (~170 words).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <button
                onClick={() => setIncludeSection5((v) => !v)}
                className={cn(
                  'flex items-center gap-3 w-full p-4 rounded-lg border transition-all',
                  includeSection5
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/40',
                )}
              >
                {includeSection5
                  ? <ToggleRight className="h-7 w-7 text-primary" />
                  : <ToggleLeft className="h-7 w-7 text-muted-foreground" />}
                <div className="text-left">
                  <p className="font-medium">{includeSection5 ? 'Enabled' : 'Disabled'}</p>
                  <p className="text-xs text-muted-foreground">
                    {includeSection5
                      ? 'Section 5 will be included in the script'
                      : 'Section 5 will be skipped — script will be tighter at ~1,200 words'}
                  </p>
                </div>
              </button>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card className="bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">Script Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Headlines (S1 & S2)</span>
                <span className="font-medium">{headlines.size} article{headlines.size !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Match Results (S3)</span>
                <span className="font-medium">{matchResults.size} article{matchResults.size !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Match of the Day (S4)</span>
                <span className="font-medium">{matchOfDay ? '1 selected' : 'Not selected'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Players Spotlight (S5)</span>
                <span className={cn('font-medium', includeSection5 ? 'text-green-400' : 'text-muted-foreground')}>
                  {includeSection5 ? 'Included' : 'Skipped'}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span className="text-muted-foreground">Target word count</span>
                <span className="font-bold text-primary">1,200–1,300 words (English)</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <Button
              size="lg"
              className="text-base h-12 px-8"
              onClick={handleGenerate}
              disabled={generating || !step3Valid}
            >
              {generating ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" />Generating — 30–60 seconds...</>
              ) : (
                <><Zap className="h-5 w-5 mr-2" />Generate Script</>
              )}
            </Button>
          </div>

          {generating && (
            <p className="text-center text-sm text-muted-foreground">
              Claude is writing your English script from Vietnamese & international sources...
            </p>
          )}
        </div>
      )}
    </div>
  );
}
