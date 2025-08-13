import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { MessageSquare, Sparkles, CheckCircle, AlertTriangle, Brain } from "lucide-react";
import { aiService } from "@/lib/aiService";

interface NaturalLanguageRuleCreatorProps {
  data: any;
  onRuleCreated: (rule: any) => void;
}

export const NaturalLanguageRuleCreator = ({ data, onRuleCreated }: NaturalLanguageRuleCreatorProps) => {
  const [input, setInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [examples] = useState([
    "Task T001 and Task T002 should always run together",
    "Limit sales team workers to maximum 3 tasks per phase",
    "Task T005 can only run in phase 2 or phase 3",
    "Workers in group A should not work more than 4 slots",
    "High priority clients should get their tasks assigned first"
  ]);

  const processNaturalLanguage = async () => {
    if (!input.trim()) return;

    setProcessing(true);
    setResult(null);

    try {
      const rule = await aiService.convertNaturalLanguageToRule(input, data);
      setResult(rule);
    } catch (error) {
      console.error("Error processing natural language:", error);
      setResult({
        type: "error",
        message: "Failed to process the rule. Please try again.",
        confidence: 0
      });
    } finally {
      setProcessing(false);
    }
  };

  const applyRule = () => {
    if (result && result.confidence > 0.5) {
      onRuleCreated(result);
      setInput("");
      setResult(null);
    }
  };

  const useExample = (example: string) => {
    setInput(example);
    setResult(null);
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-success";
    if (confidence >= 0.6) return "text-warning";
    return "text-destructive";
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return "default";
    if (confidence >= 0.6) return "secondary";
    return "destructive";
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Natural Language Rule Creator</h3>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
          AI Powered
        </Badge>
      </div>

      <p className="text-muted-foreground mb-6">
        Describe your business rule in plain English, and AI will convert it to a structured rule.
      </p>

      {/* Examples */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Try these examples:</h4>
        <div className="grid gap-2">
          {examples.map((example, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => useExample(example)}
              className="justify-start text-left h-auto p-3 text-sm text-muted-foreground hover:text-foreground"
            >
              <Sparkles className="h-3 w-3 mr-2 flex-shrink-0" />
              {example}
            </Button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Describe your rule:</label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g., Task A and Task B should always run together..."
            className="min-h-[100px]"
          />
        </div>

        <Button 
          onClick={processNaturalLanguage}
          disabled={!input.trim() || processing}
          className="w-full"
        >
          {processing ? (
            <>
              <Brain className="h-4 w-4 mr-2 animate-pulse" />
              Processing with AI...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Convert to Rule
            </>
          )}
        </Button>
      </div>

      {/* Processing Progress */}
      {processing && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Brain className="h-4 w-4 animate-pulse" />
            Analyzing natural language input...
          </div>
          <Progress value={75} className="w-full" />
        </div>
      )}

      {/* Result */}
      {result && (
        <Card className="mt-6 p-4 bg-muted/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">AI Interpretation Result</h4>
            {result.confidence > 0 && (
              <Badge variant={getConfidenceBadge(result.confidence)}>
                {Math.round(result.confidence * 100)}% confidence
              </Badge>
            )}
          </div>

          {result.type === "unknown" || result.confidence === 0 ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">Could not parse rule</p>
                  <p className="text-sm text-muted-foreground">{result.suggestion}</p>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p className="font-medium mb-1">Try being more specific about:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>Task IDs (e.g., "Task T001" instead of just "first task")</li>
                  <li>Worker groups (e.g., "sales team" or "group A")</li>
                  <li>Phase numbers (e.g., "phase 2" instead of "later")</li>
                  <li>Specific limits (e.g., "maximum 3 tasks" instead of "few tasks")</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-success mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Rule successfully parsed!</p>
                  <p className="text-sm text-muted-foreground">{result.description}</p>
                </div>
              </div>

              {/* Rule Details */}
              <div className="bg-card p-3 rounded border">
                <div className="text-xs font-mono text-muted-foreground mb-2">Generated Rule:</div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{result.type}</Badge>
                    <span className="text-sm">Type</span>
                  </div>
                  {result.tasks && (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {result.tasks.map((taskId: string) => (
                          <Badge key={taskId} variant="secondary" className="text-xs">
                            {taskId}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">Tasks</span>
                    </div>
                  )}
                  {result.group && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{result.group}</Badge>
                      <span className="text-sm text-muted-foreground">Group</span>
                    </div>
                  )}
                  {result.maxLoad && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">{result.maxLoad}</Badge>
                      <span className="text-sm text-muted-foreground">Max Load</span>
                    </div>
                  )}
                  {result.allowedPhases && (
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {result.allowedPhases.map((phase: number) => (
                          <Badge key={phase} variant="secondary" className="text-xs">
                            Phase {phase}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-sm text-muted-foreground">Allowed Phases</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={applyRule}
                  disabled={result.confidence < 0.5}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setResult(null)}
                  className="flex-1"
                >
                  Try Again
                </Button>
              </div>

              {result.confidence < 0.8 && (
                <div className="text-xs text-warning bg-warning/10 p-2 rounded">
                  <p className="font-medium">Lower confidence detected</p>
                  <p>The AI isn't completely sure about this interpretation. Please review carefully before adding.</p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}
    </Card>
  );
};