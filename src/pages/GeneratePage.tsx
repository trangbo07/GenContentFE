import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateScript } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';
import { Sun, Moon, Zap, Loader2, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Edition = 'MORNING' | 'EVENING' | 'MANUAL';

const editions: { type: Edition; label: string; description: string; icon: React.ReactNode; schedule: string; accent: string }[] = [
  {
    type: 'MORNING',
    label: 'Morning Edition',
    description: 'Covers overnight results, morning news, and upcoming matches for the day.',
    icon: <Sun className="h-8 w-8 text-yellow-400" />,
    schedule: 'Auto-scheduled: 07:00 UK — Publishes 10:00 UK',
    accent: 'border-yellow-500/30 hover:border-yellow-500/60',
  },
  {
    type: 'EVENING',
    label: 'Evening Edition',
    description: 'Full-day recap, all results, match of the day analysis, and tomorrow\'s fixtures.',
    icon: <Moon className="h-8 w-8 text-blue-400" />,
    schedule: 'Auto-scheduled: 20:00 UK — Publishes 23:00 UK',
    accent: 'border-blue-500/30 hover:border-blue-500/60',
  },
  {
    type: 'MANUAL',
    label: 'Manual / Special Report',
    description: 'Generate a script any time using the latest available data.',
    icon: <Zap className="h-8 w-8 text-purple-400" />,
    schedule: 'Generate immediately on demand',
    accent: 'border-purple-500/30 hover:border-purple-500/60',
  },
];

export function GeneratePage() {
  const [selected, setSelected] = useState<Edition>('MANUAL');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  async function handleGenerate() {
    setLoading(true);
    setDone(false);
    try {
      const script = await generateScript(selected);
      setDone(true);
      toast({ title: 'Script generated!', description: script.title });
      setTimeout(() => navigate(`/scripts/${script.id}`), 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Generation failed';
      toast({ title: 'Generation failed', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Generate Script</h1>
        <p className="text-muted-foreground mt-1">
          Fetch the latest data and generate a broadcast-ready news script with Claude AI.
        </p>
      </div>

      {/* Edition selector */}
      <div className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Select Edition</h2>
        {editions.map((ed) => (
          <Card
            key={ed.type}
            className={cn(
              'cursor-pointer transition-all',
              ed.accent,
              selected === ed.type && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
            )}
            onClick={() => setSelected(ed.type)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                {ed.icon}
                <div>
                  <CardTitle className="text-base">{ed.label}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">{ed.schedule}</CardDescription>
                </div>
                {selected === ed.type && <CheckCircle className="h-5 w-5 text-primary ml-auto" />}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{ed.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pipeline steps */}
      <Card className="bg-card/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground font-normal">What happens when you generate</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2 text-sm">
            {[
              'Fetch today\'s match results from API-Football',
              'Collect World Cup news from RSS feeds',
              'Score each news item with the Hot Score Engine (0–100)',
              'Fetch upcoming fixtures and group standings',
              'Build a structured prompt with all collected data',
              'Send to Claude AI to generate a 1,500–2,500 word script',
              'Save the script and redirect you to view it',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Generate button */}
      <Button
        size="lg"
        className="w-full text-base h-12"
        onClick={handleGenerate}
        disabled={loading || done}
      >
        {loading ? (
          <><Loader2 className="h-5 w-5 animate-spin" />Generating — this may take 30–60 seconds...</>
        ) : done ? (
          <><CheckCircle className="h-5 w-5" />Done! Redirecting...</>
        ) : (
          <><Zap className="h-5 w-5" />Generate {editions.find((e) => e.type === selected)?.label}</>
        )}
      </Button>

      {loading && (
        <p className="text-center text-sm text-muted-foreground">
          Claude is writing your script. This typically takes 30–90 seconds depending on data availability.
        </p>
      )}
    </div>
  );
}
