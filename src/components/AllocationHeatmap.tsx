import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Activity, Users, Clock, TrendingUp, RefreshCw } from "lucide-react";
import { aiService } from "@/lib/aiService";

interface AllocationHeatmapProps {
  data: any;
  rules: any[];
  priorities: any;
}

export const AllocationHeatmap = ({ data, rules, priorities }: AllocationHeatmapProps) => {
  const [simulation, setSimulation] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    totalEfficiency: 0,
    averageWorkload: 0,
    highStressWorkers: 0,
    utilizationRate: 0
  });

  useEffect(() => {
    if (data.workers?.length > 0) {
      runSimulation();
    }
  }, [data, rules, priorities]);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const results = await aiService.simulateAllocation(data, rules, priorities);
      setSimulation(results);
      calculateMetrics(results);
    } catch (error) {
      console.error("Error running simulation:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (results: any[]) => {
    if (results.length === 0) return;

    const totalEfficiency = results.reduce((sum, r) => sum + r.efficiency, 0) / results.length;
    const averageWorkload = results.reduce((sum, r) => sum + r.workload, 0) / results.length;
    const highStressWorkers = results.filter(r => r.stress === 'high').length;
    const utilizationRate = results.reduce((sum, r) => sum + (r.workload > 0 ? 1 : 0), 0) / results.length * 100;

    setMetrics({
      totalEfficiency: Math.round(totalEfficiency),
      averageWorkload: Math.round(averageWorkload * 10) / 10,
      highStressWorkers,
      utilizationRate: Math.round(utilizationRate)
    });
  };

  const getStressColor = (stress: string) => {
    switch (stress) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const chartData = simulation.map(worker => ({
    name: worker.workerName.split(' ')[0], // First name only for space
    workload: worker.workload,
    efficiency: worker.efficiency,
    stress: worker.stress,
    fill: getStressColor(worker.stress)
  }));

  if (!data.workers?.length) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Upload worker data to see allocation preview</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Efficiency</span>
          </div>
          <div className="text-2xl font-bold text-primary">{metrics.totalEfficiency}%</div>
          <Progress value={metrics.totalEfficiency} className="mt-2" />
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">Avg Workload</span>
          </div>
          <div className="text-2xl font-bold text-accent">{metrics.averageWorkload}</div>
          <p className="text-xs text-muted-foreground mt-1">tasks per worker</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-4 w-4 text-destructive" />
            <span className="text-sm font-medium">High Stress</span>
          </div>
          <div className="text-2xl font-bold text-destructive">{metrics.highStressWorkers}</div>
          <p className="text-xs text-muted-foreground mt-1">workers at risk</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-success" />
            <span className="text-sm font-medium">Utilization</span>
          </div>
          <div className="text-2xl font-bold text-success">{metrics.utilizationRate}%</div>
          <p className="text-xs text-muted-foreground mt-1">workers active</p>
        </Card>
      </div>

      {/* Allocation Heatmap */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Worker Allocation Preview</h3>
            <p className="text-muted-foreground">Simulated workload distribution based on current rules and priorities</p>
          </div>
          <Button 
            variant="outline" 
            onClick={runSimulation} 
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Simulating...' : 'Refresh'}
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 animate-pulse text-primary" />
              <p className="text-muted-foreground">Running allocation simulation...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bar Chart */}
            <div className="h-64">
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
                            <p className="font-medium">{label}</p>
                            <p className="text-sm">Workload: {data.workload} tasks</p>
                            <p className="text-sm">Efficiency: {data.efficiency}%</p>
                            <p className="text-sm">Stress: <span className="capitalize">{data.stress}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="workload" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-success"></div>
                <span className="text-sm">Low Stress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-warning"></div>
                <span className="text-sm">Medium Stress</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-destructive"></div>
                <span className="text-sm">High Stress</span>
              </div>
            </div>

            {/* Detailed Worker List */}
            <div className="grid gap-3">
              <h4 className="font-medium">Worker Details</h4>
              {simulation.map((worker, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="font-medium">{worker.workerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {worker.assignedTasks.length} tasks assigned
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={worker.stress === 'high' ? 'destructive' : worker.stress === 'medium' ? 'default' : 'secondary'}>
                      {worker.stress} stress
                    </Badge>
                    <div className="text-right">
                      <p className="text-sm font-medium">{worker.efficiency}%</p>
                      <p className="text-xs text-muted-foreground">efficiency</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};