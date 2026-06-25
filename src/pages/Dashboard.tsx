import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getScripts, getJobs, type Script, type Job } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, wordCountToReadTime } from '@/lib/utils';
import { FileText, Zap, Clock, CheckCircle, AlertCircle, Loader2, Sun, Moon } from 'lucide-react';

const editionColors: Record<string, string> = {
  MORNING: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  EVENING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  MANUAL: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const jobStatusIcon: Record<string, React.ReactNode> = {
  COMPLETED: <CheckCircle className="h-4 w-4 text-green-400" />,
  FAILED: <AlertCircle className="h-4 w-4 text-red-400" />,
  RUNNING: <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />,
  PENDING: <Clock className="h-4 w-4 text-muted-foreground" />,
};

export function Dashboard() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getScripts({ limit: '5' }), getJobs()])
      .then(([s, j]) => { setScripts(s.scripts); setJobs(j.slice(0, 8)); })
      .finally(() => setLoading(false));
  }, []);

  const totalScripts = scripts.length;
  const todayScripts = scripts.filter(
    (s) => new Date(s.createdAt).toDateString() === new Date().toDateString(),
  ).length;
  const recentJob = jobs[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">World Cup 2026 — News Script Generator</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Scripts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '—' : totalScripts}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Scripts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{loading ? '—' : todayScripts}</div>
            <p className="text-xs text-muted-foreground mt-1">Generated today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Last Job</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {recentJob ? jobStatusIcon[recentJob.status] : <Clock className="h-4 w-4 text-muted-foreground" />}
              <span className="font-medium">{recentJob?.status || 'No jobs yet'}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {recentJob ? formatDate(recentJob.createdAt) : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Schedule info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-yellow-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sun className="h-5 w-5 text-yellow-400" />
              Morning Edition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Generation</span><span>07:00 UK</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Publishing</span><span>10:00 UK</span></div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Moon className="h-5 w-5 text-blue-400" />
              Evening Edition
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Generation</span><span>20:00 UK</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Publishing</span><span>23:00 UK</span></div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3">
        <Button asChild>
          <Link to="/generate"><Zap className="h-4 w-4" />Generate Now</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/scripts"><FileText className="h-4 w-4" />View All Scripts</Link>
        </Button>
      </div>

      {/* Recent scripts */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Scripts</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : scripts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No scripts yet. <Link to="/generate" className="text-primary underline">Generate your first one</Link>.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {scripts.map((script) => (
              <Card key={script.id} className="hover:border-primary/40 transition-colors">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge className={editionColors[script.editionType]}>
                      {script.editionType === 'MORNING' ? '☀️' : script.editionType === 'EVENING' ? '🌙' : '⚡'} {script.editionType}
                    </Badge>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{script.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(script.createdAt)} &bull; {script.wordCount.toLocaleString()} words &bull; {wordCountToReadTime(script.wordCount)}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/scripts/${script.id}`}>Open</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Recent jobs */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Jobs</h2>
        <div className="space-y-2">
          {jobs.slice(0, 5).map((job) => (
            <div key={job.id} className="flex items-center justify-between px-4 py-3 rounded-lg border border-border bg-card text-sm">
              <div className="flex items-center gap-3">
                {jobStatusIcon[job.status]}
                <span className="font-medium">{job.jobType.replace(/_/g, ' ')}</span>
              </div>
              <span className="text-muted-foreground">{formatDate(job.createdAt)}</span>
            </div>
          ))}
          {jobs.length === 0 && (
            <p className="text-muted-foreground text-sm py-4 text-center">No jobs have run yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
