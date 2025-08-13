import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Brain, Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Zap } from "lucide-react";
import { aiService } from "@/lib/aiService";

interface AIInsightsPanelProps {
  data: any;
  onRuleRecommendation: (rule: any) => void;
  onOptimizationSuggestion: (optimization: any) => void;
}

export const AIInsightsPanel = ({ data, onRuleRecommendation, onOptimizationSuggestion }: AIInsightsPanelProps) => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  useEffect(() => {
    if (data.clients.length > 0 || data.workers.length > 0 || data.tasks.length > 0) {
      analyzeData();
    }
  }, [data]);

  const analyzeData = async () => {
    setLoading(true);
    setAnalysisProgress(0);
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => Math.min(prev + 10, 90));
    }, 100);

    try {
      const result = await aiService.analyzeDataPatterns(data);
      setInsights(result);
      setAnalysisProgress(100);
    } catch (error) {
      console.error("Error analyzing data:", error);
    } finally {
      clearInterval(progressInterval);
      setLoading(false);
    }
  };

  if (!insights && !loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <h3 className="text-lg font-semibold mb-2">AI Insights Ready</h3>
          <p className="text-muted-foreground mb-4">
            Upload some data to get AI-powered insights and recommendations
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">AI Insights & Recommendations</h2>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          Live Analysis
        </Badge>
      </div>

      {loading && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-primary animate-pulse" />
            <span className="font-medium">Analyzing data patterns...</span>
          </div>
          <Progress value={analysisProgress} className="w-full" />
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>• Checking worker capacity</div>
            <div>• Analyzing skill coverage</div>
            <div>• Finding optimization opportunities</div>
            <div>• Generating rule suggestions</div>
          </div>
        </div>
      )}

      {insights && (
        <div className="space-y-6">
          {/* Key Insights */}
          {insights.insights.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-warning" />
                Key Insights
              </h3>
              <div className="space-y-2">
                {insights.insights.map((insight: string, index: number) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-card rounded-lg border">
                    <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{insight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {insights.recommendations.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Recommendations
              </h3>
              <div className="space-y-3">
                {insights.recommendations.map((rec: any, index: number) => (
                  <div key={index} className="p-4 bg-card rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={rec.severity === 'high' ? 'destructive' : rec.severity === 'medium' ? 'default' : 'secondary'}>
                        {rec.severity} priority
                      </Badge>
                      <Button variant="outline" size="sm">
                        Apply Fix
                      </Button>
                    </div>
                    <p className="text-sm">{rec.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rule Suggestions */}
          {insights.rulesSuggestions.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-accent" />
                Suggested Rules
              </h3>
              <div className="space-y-3">
                {insights.rulesSuggestions.map((rule: any, index: number) => (
                  <div key={index} className="p-4 bg-card rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{rule.type}</Badge>
                        <span className="text-sm font-medium">
                          {Math.round(rule.confidence * 100)}% confidence
                        </span>
                      </div>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => onRuleRecommendation(rule)}
                      >
                        Add Rule
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{rule.reason}</p>
                    {rule.tasks && (
                      <div className="flex gap-1">
                        {rule.tasks.map((taskId: string) => (
                          <Badge key={taskId} variant="secondary" className="text-xs">
                            {taskId}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optimizations */}
          {insights.optimizations.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                Optimization Opportunities
              </h3>
              <div className="space-y-3">
                {insights.optimizations.map((opt: any, index: number) => (
                  <div key={index} className="p-4 bg-card rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={opt.impact === 'high' ? 'default' : 'secondary'}>
                        {opt.impact} impact
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onOptimizationSuggestion(opt)}
                      >
                        Apply
                      </Button>
                    </div>
                    <p className="text-sm">{opt.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Analysis completed • {insights.insights.length + insights.recommendations.length + insights.rulesSuggestions.length + insights.optimizations.length} suggestions found
            </div>
            <Button variant="outline" onClick={analyzeData} disabled={loading}>
              Refresh Analysis
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};