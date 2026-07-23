import { useState } from "react";
import { Link } from "wouter";
import {
  Users, Activity, ShieldAlert, CreditCard, Search, RefreshCw,
  Plus, CheckCircle2, TrendingUp, Cpu, Settings, FileText, Send, Sparkles, Filter
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { PageMeta } from "@/components/page-meta";

interface LogEntry {
  id: string;
  user: string;
  action: string;
  module: string;
  timestamp: string;
  status: "success" | "warning" | "error";
  ip: string;
}

const INITIAL_LOGS: LogEntry[] = [
  { id: "LOG-1092", user: "jobseeker.path@gmail.com", action: "Completed Mock Interview", module: "Interview Ace", timestamp: "2 mins ago", status: "success", ip: "103.22.14.88" },
  { id: "LOG-1091", user: "priya.sharma@example.com", action: "Generated ATS Resume Analysis", module: "Resume Intelligence", timestamp: "12 mins ago", status: "success", ip: "49.37.112.19" },
  { id: "LOG-1090", user: "rahul.verma@example.com", action: "AI Practice Session (English Guru)", module: "Fluency Suite", timestamp: "25 mins ago", status: "success", ip: "157.33.91.201" },
  { id: "LOG-1089", user: "admin@nexo.ai", action: "Updated System Prompt Config", module: "Admin Settings", timestamp: "1 hour ago", status: "warning", ip: "127.0.0.1" },
  { id: "LOG-1088", user: "vikram.singh@example.com", action: "Credits Package Purchase (₹499)", module: "Payments", timestamp: "2 hours ago", status: "success", ip: "117.201.3.42" },
  { id: "LOG-1087", user: "ananya.patel@example.com", action: "Failed Login Attempt (Invalid OTP)", module: "Authentication", timestamp: "3 hours ago", status: "error", ip: "223.187.21.10" },
];

export default function AdminDashboard() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);

  // Form State for System Config / Credit Granting
  const [recipientEmail, setRecipientEmail] = useState("");
  const [creditAmount, setCreditAmount] = useState("100");
  const [grantReason, setGrantReason] = useState("Welcome Bonus / Support Grant");

  // Announcement Form State
  const [announcementText, setAnnouncementText] = useState("Welcome to Nexo! Check out our new AI Interview Ace features.");
  const [isBannerActive, setIsBannerActive] = useState(true);

  const handleGrantCredits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail) {
      toast({ title: "Error", description: "Please enter a valid user email address.", variant: "destructive" });
      return;
    }
    toast({
      title: "Credits Granted Successfully!",
      description: `Granted ${creditAmount} credits to ${recipientEmail}.`,
    });
    // Add to audit log
    const newLog: LogEntry = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      user: "admin@nexo.ai",
      action: `Granted ${creditAmount} credits to ${recipientEmail}`,
      module: "Credit Management",
      timestamp: "Just now",
      status: "success",
      ip: "127.0.0.1",
    };
    setLogs([newLog, ...logs]);
    setRecipientEmail("");
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Announcement Saved",
      description: "Platform banner broadcast has been updated across all active sessions.",
    });
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.module.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <PageMeta title="Admin Dashboard" description="Nexo Platform Administration & Control Center" />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold">
                Nexo Command Center
              </Badge>
              <span className="text-xs text-muted-foreground">• Admin Access Level 1</span>
            </div>
            <h1 className="text-3xl font-display font-extrabold text-secondary tracking-tight">
              Platform Administration
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitor active users, query logs, system performance, and access management.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({ title: "Refreshed Data", description: "Latest system logs and metrics synchronized." });
              }}
              className="gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync Data
            </Button>
            <Link href="/admin-payments">
              <Button variant="default" size="sm" className="gap-1.5 font-bold">
                <CreditCard className="w-3.5 h-3.5" />
                Payments &amp; Grants
              </Button>
            </Link>
          </div>
        </div>

        {/* ── Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Total Users
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-secondary">24,850</div>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +14.2% from last week
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                AI Sessions Today
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-secondary">3,412</div>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3 h-3" /> 99.8% AI response rate
              </p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Active B2B Hiring Campaigns
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-secondary">142</div>
              <p className="text-xs text-muted-foreground mt-1">1,890 candidate evaluations</p>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Platform Health
              </CardTitle>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-extrabold text-emerald-600 flex items-center gap-1">
                Optimal
              </div>
              <p className="text-xs text-muted-foreground mt-1">Response Latency ~210ms</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Main Content Grid: Forms & Tables ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column (2 cols): User Activity & Audit Table */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border shadow-sm">
              <CardHeader className="border-b bg-muted/20 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg font-bold text-secondary">User Activity &amp; Audit Logs</CardTitle>
                    <CardDescription className="text-xs">Real-time system events and user actions</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-full sm:w-48">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                      <Input
                        placeholder="Search logs..."
                        className="pl-8 h-8 text-xs bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <select
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium focus:outline-none"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                    </select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/40 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="py-3 px-4">Log ID</th>
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Action</th>
                        <th className="py-3 px-4">Module</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-xs">
                      {filteredLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground text-xs">
                            No log records found matching your filters.
                          </td>
                        </tr>
                      ) : (
                        filteredLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground font-semibold">
                              {log.id}
                            </td>
                            <td className="py-3 px-4 font-semibold text-secondary">
                              {log.user}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {log.action}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-secondary">
                                {log.module}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {log.status === "success" && (
                                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-[10px] font-bold">
                                  Success
                                </Badge>
                              )}
                              {log.status === "warning" && (
                                <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200 text-[10px] font-bold">
                                  Warning
                                </Badge>
                              )}
                              {log.status === "error" && (
                                <Badge className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200 text-[10px] font-bold">
                                  Failed
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right text-muted-foreground font-mono text-[11px]">
                              {log.timestamp}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column (1 col): Form Interfaces */}
          <div className="space-y-6">
            
            {/* Form 1: Grant Credits */}
            <Card className="border shadow-sm">
              <CardHeader className="bg-muted/20 border-b pb-3">
                <CardTitle className="text-base font-bold text-secondary flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Grant User Credits
                </CardTitle>
                <CardDescription className="text-xs">
                  Manually issue usage credits to a registered user or organization.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleGrantCredits} className="space-y-4">
                  <div>
                    <Label className="text-xs font-semibold mb-1 block">User Email Address</Label>
                    <Input
                      type="email"
                      placeholder="e.g. candidate@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      required
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-semibold mb-1 block">Credits Amount</Label>
                      <Input
                        type="number"
                        min="1"
                        value={creditAmount}
                        onChange={(e) => setCreditAmount(e.target.value)}
                        required
                        className="text-xs h-9"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold mb-1 block">Type</Label>
                      <select className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs font-medium">
                        <option value="bonus">Bonus Grant</option>
                        <option value="support">Support Resolution</option>
                        <option value="promo">Promotional Code</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold mb-1 block">Reason / Note</Label>
                    <Input
                      type="text"
                      value={grantReason}
                      onChange={(e) => setGrantReason(e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>

                  <Button type="submit" className="w-full font-bold h-9 text-xs">
                    <Plus className="w-3.5 h-3.5 mr-1" /> Grant Credits
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Form 2: Platform Announcement Banner */}
            <Card className="border shadow-sm">
              <CardHeader className="bg-muted/20 border-b pb-3">
                <CardTitle className="text-base font-bold text-secondary flex items-center gap-2">
                  <Send className="w-4 h-4 text-violet-600" />
                  Global Broadcast Banner
                </CardTitle>
                <CardDescription className="text-xs">
                  Update active header notification across the Nexo platform.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleSaveBanner} className="space-y-4">
                  <div>
                    <Label className="text-xs font-semibold mb-1 block">Banner Message</Label>
                    <Input
                      type="text"
                      value={announcementText}
                      onChange={(e) => setAnnouncementText(e.target.value)}
                      required
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Label className="text-xs font-semibold">Enable Live Banner</Label>
                    <input
                      type="checkbox"
                      checked={isBannerActive}
                      onChange={(e) => setIsBannerActive(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                    />
                  </div>

                  <Button type="submit" variant="outline" className="w-full font-bold h-9 text-xs">
                    Save &amp; Broadcast
                  </Button>
                </form>
              </CardContent>
            </Card>

          </div>

        </div>

      </div>
    </>
  );
}
