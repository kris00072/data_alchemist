import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, TrendingDown, ArrowRight, Zap, CheckCircle } from "lucide-react";
import { aiService } from "@/lib/aiService";

interface BeforeAfterComparisonProps {
  data: any;
  optimizationCriteria: string;
  onOptimizationAccept: (optimizedData: any) => void;
}

export const BeforeAfterComparison = ({ data, optimizationCriteria, onOptimizationAccept }: BeforeAfterComparisonProps) => {
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runOptimization = async () => {
    setLoading(true);
    try {
      const result = await aiService.optimizeAllocation(data, optimizationCriteria);
      setComparison(result);
    } catch (error) {
      console.error("Error running optimization:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (results: any[]) => {
    if (!results.length) return { efficiency: 0, avgWorkload: 0, highStress: 0 };
    
    const efficiency = results.reduce((sum, r) => sum + r.efficiency, 0) / results.length;
    const avgWorkload = results.reduce((sum, r) => sum + r.workload, 0) / results.length;
    const highStress = results.filter(r => r.stress === 'high').length;
    
    return { efficiency, avgWorkload, highStress };
  };

  const getImprovementIcon = (before: number, after: number) => {
    if (after > before) return <TrendingUp className="h-4 w-4 text-success" />;
    if (after < before) return <TrendingDown className="h-4 w-4 text-destructive" />;
    return null;
  };

  const getStressColor = (stress: string) => {
    switch (stress) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const prepareChartData = (beforeData: any[], afterData: any[]) => {
    return beforeData.map((worker, index) => ({
      name: worker.workerName.split(' ')[0],
      beforeWorkload: worker.workload,
      afterWorkload: afterData[index]?.workload || 0,
      beforeEfficiency: worker.efficiency,
      afterEfficiency: afterData[index]?.efficiency || 0,
      beforeStress: worker.stress,
      afterStress: afterData[index]?.stress || 'low'
    }));
  };

  if (loading) {
    return (
      <Card className="p-8">
        <div className="text-center">
          <Zap className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <h3 className="text-lg font-semibold mb-2">Optimizing Allocation</h3>
          <p className="text-muted-foreground mb-4">
            AI is analyzing your data and applying optimization criteria: "{optimizationCriteria}"
          </p>
          <Progress value={75} className="w-full max-w-md mx-auto" />
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-muted-foreground max-w-md mx-auto">
            <div>• Balancing workloads</div>
            <div>• Optimizing efficiency</div>
            <div>• Reducing stress levels</div>
            <div>• Applying constraints</div>
          </div>
        </div>
      </Card>
    );
  }

  if (!comparison) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">AI Optimization Engine</h3>
          <p className="text-muted-foreground mb-4">
            Run optimization to see before/after comparison
          </p>
          <Button onClick={runOptimization} className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Optimize: {optimizationCriteria}
          </Button>
        </div>
      </Card>
    );
  }

  const beforeMetrics = calculateMetrics(comparison.before);
  const afterMetrics = calculateMetrics(comparison.after);
  const chartData = prepareChartData(comparison.before, comparison.after);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">Optimization Results</h3>
            <p className="text-muted-foreground">
              Optimization criteria: <span className="font-medium">{optimizationCriteria}</span>
            </p>
          </div>
          <Button 
            onClick={() => onOptimizationAccept(comparison.after)}
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Apply Optimization
          </Button>
        </div>
      </Card>

      {/* Metrics Comparison */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl font-bold">{Math.round(beforeMetrics.efficiency)}%</span>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold text-primary">{Math.round(afterMetrics.efficiency)}%</span>
              {getImprovementIcon(beforeMetrics.efficiency, afterMetrics.efficiency)}
            </div>
            <h4 className="font-semibold">Average Efficiency</h4>
            <p className="text-sm text-muted-foreground">
              {Math.round(afterMetrics.efficiency - beforeMetrics.efficiency)}% improvement
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl font-bold">{Math.round(beforeMetrics.avgWorkload * 10) / 10}</span>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold text-accent">{Math.round(afterMetrics.avgWorkload * 10) / 10}</span>
              {getImprovementIcon(afterMetrics.avgWorkload, beforeMetrics.avgWorkload)}
            </div>
            <h4 className="font-semibold">Average Workload</h4>
            <p className="text-sm text-muted-foreground">
              {Math.round((beforeMetrics.avgWorkload - afterMetrics.avgWorkload) * 10) / 10} tasks reduced
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-2xl font-bold">{beforeMetrics.highStress}</span>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold text-success">{afterMetrics.highStress}</span>
              {getImprovementIcon(afterMetrics.highStress, beforeMetrics.highStress)}
            </div>
            <h4 className="font-semibold">High Stress Workers</h4>
            <p className="text-sm text-muted-foreground">
              {beforeMetrics.highStress - afterMetrics.highStress} workers improved
            </p>
          </div>
        </Card>
      </div>

      {/* Before/After Chart */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Workload Distribution Comparison</h4>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-card border rounded-lg p-3 shadow-lg">
                        <p className="font-medium mb-2">{label}</p>
                        <div className="space-y-1 text-sm">
                          <p>Before: {data.beforeWorkload} tasks ({data.beforeEfficiency}% efficiency)</p>
                          <p>After: {data.afterWorkload} tasks ({data.afterEfficiency}% efficiency)</p>
                          <p>Stress: <span className="capitalize">{data.beforeStress}</span> → <span className="capitalize">{data.afterStress}</span></p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="beforeWorkload" fill="#94a3b8" name="Before" />
              <Bar dataKey="afterWorkload" fill="#3b82f6" name="After" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Improvements List */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Key Improvements</h4>
        <div className="grid md:grid-cols-2 gap-4">
          {comparison.improvements.map((improvement: string, index: number) => (
            <div key={index} className="flex items-start gap-2 p-3 bg-success/10 rounded-lg border border-success/20">
              <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
              <span className="text-sm">{improvement}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Worker Details */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4">Individual Worker Changes</h4>
        <div className="space-y-3">
          {comparison.before.map((beforeWorker: any, index: number) => {
            const afterWorker = comparison.after[index];
            if (!afterWorker) return null;

            const workloadChange = afterWorker.workload - beforeWorker.workload;
            const efficiencyChange = afterWorker.efficiency - beforeWorker.efficiency;

            return (
              <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div>
                  <p className="font-medium">{beforeWorker.workerName}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Workload: {beforeWorker.workload} → {afterWorker.workload}</span>
                    <span>Efficiency: {beforeWorker.efficiency}% → {afterWorker.efficiency}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={beforeWorker.stress === 'high' ? 'destructive' : beforeWorker.stress === 'medium' ? 'default' : 'secondary'}>
                    {beforeWorker.stress}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <Badge variant={afterWorker.stress === 'high' ? 'destructive' : afterWorker.stress === 'medium' ? 'default' : 'secondary'}>
                    {afterWorker.stress}
                  </Badge>
                  {(workloadChange < 0 || efficiencyChange > 0) && (
                    <Badge variant="outline" className="text-success border-success">
                      Improved
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};