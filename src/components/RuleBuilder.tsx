import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, Sparkles, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface Rule {
  id: string;
  type: 'coRun' | 'slotRestriction' | 'loadLimit' | 'phaseWindow' | 'patternMatch' | 'precedenceOverride' | 'custom';
  name: string;
  description: string;
  parameters: any;
  priority: number;
}

interface RuleBuilderProps {
  data: {
    clients: any[];
    workers: any[];
    tasks: any[];
  };
  rules: Rule[];
  onRulesChange: (rules: Rule[]) => void;
}

export const RuleBuilder = ({ data, rules, onRulesChange }: RuleBuilderProps) => {
  const [selectedRuleType, setSelectedRuleType] = useState<string>('');
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [isProcessingNL, setIsProcessingNL] = useState(false);
  const { toast } = useToast();

  const ruleTypes = [
    { value: 'coRun', label: 'Co-run Tasks', description: 'Tasks that must run together' },
    { value: 'slotRestriction', label: 'Slot Restriction', description: 'Minimum common slots for groups' },
    { value: 'loadLimit', label: 'Load Limit', description: 'Maximum load per phase for workers' },
    { value: 'phaseWindow', label: 'Phase Window', description: 'Allowed phases for specific tasks' },
    { value: 'patternMatch', label: 'Pattern Match', description: 'Regex-based rule matching' },
    { value: 'precedenceOverride', label: 'Precedence Override', description: 'Priority ordering for rules' }
  ];

  const addRule = (ruleType: string, parameters: any = {}) => {
    const newRule: Rule = {
      id: `rule_${Date.now()}`,
      type: ruleType as any,
      name: `${ruleType} Rule ${rules.length + 1}`,
      description: '',
      parameters,
      priority: rules.length + 1
    };

    onRulesChange([...rules, newRule]);
    toast({
      title: "Rule added",
      description: `Added new ${ruleType} rule`,
    });
  };

  const removeRule = (ruleId: string) => {
    onRulesChange(rules.filter(rule => rule.id !== ruleId));
    toast({
      title: "Rule removed",
      description: "Rule has been deleted",
    });
  };

  const updateRule = (ruleId: string, updates: Partial<Rule>) => {
    onRulesChange(rules.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  };

  // AI-powered natural language to rule conversion
  const processNaturalLanguage = async () => {
    if (!naturalLanguageInput.trim()) return;
    
    setIsProcessingNL(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const input = naturalLanguageInput.toLowerCase();
    let ruleType = '';
    let parameters = {};
    let name = '';
    let description = '';
    
    // Pattern matching for common rule types
    if (input.includes('run together') || input.includes('co-run') || input.includes('same time')) {
      ruleType = 'coRun';
      
      // Extract task IDs or names
      const taskMatches = input.match(/task[s]?\s+([t\d\s,and]+)/i);
      if (taskMatches) {
        const taskRefs = taskMatches[1].split(/[,\s]+and\s+|[,\s]+/).filter(Boolean);
        const taskIds = taskRefs.map(ref => {
          // Try to find matching task IDs
          const found = data.tasks.find(t => 
            t.TaskID?.toLowerCase().includes(ref.toLowerCase()) ||
            t.TaskName?.toLowerCase().includes(ref.toLowerCase())
          );
          return found?.TaskID || ref;
        });
        
        parameters = { tasks: taskIds };
        name = `Co-run: ${taskIds.join(', ')}`;
        description = `Tasks ${taskIds.join(' and ')} must run together`;
      }
    } else if (input.includes('load limit') || input.includes('maximum load') || input.includes('max load')) {
      ruleType = 'loadLimit';
      
      const numberMatch = input.match(/(\d+)/);
      const maxLoad = numberMatch ? parseInt(numberMatch[1]) : 3;
      
      // Extract worker group if mentioned
      let workerGroup = 'all';
      const groupMatch = input.match(/group\s+(\w+)/i);
      if (groupMatch) {
        workerGroup = groupMatch[1];
      }
      
      parameters = { workerGroup, maxSlotsPerPhase: maxLoad };
      name = `Load Limit: ${workerGroup} (${maxLoad})`;
      description = `Limit ${workerGroup} workers to maximum ${maxLoad} slots per phase`;
    } else if (input.includes('phase') && (input.includes('only') || input.includes('restrict') || input.includes('window'))) {
      ruleType = 'phaseWindow';
      
      const phaseMatches = input.match(/phase[s]?\s+(\d+(?:-\d+)?|\d+(?:,\s*\d+)*)/i);
      const taskMatch = input.match(/task\s+(\w+)/i);
      
      if (phaseMatches && taskMatch) {
        const phases = phaseMatches[1];
        const taskId = taskMatch[1];
        
        parameters = { taskId, allowedPhases: phases };
        name = `Phase Window: ${taskId}`;
        description = `Task ${taskId} can only run in phases ${phases}`;
      }
    } else if (input.includes('priority') || input.includes('precedence') || input.includes('order')) {
      ruleType = 'precedenceOverride';
      
      const priorityMatch = input.match(/priority\s+(\d+)/i);
      const priority = priorityMatch ? parseInt(priorityMatch[1]) : 1;
      
      parameters = { globalPriority: priority };
      name = `Precedence: Priority ${priority}`;
      description = `Set global precedence priority to ${priority}`;
    } else if (input.includes('slot') && input.includes('common')) {
      ruleType = 'slotRestriction';
      
      const numberMatch = input.match(/(\d+)/);
      const minSlots = numberMatch ? parseInt(numberMatch[1]) : 2;
      
      parameters = { minCommonSlots: minSlots };
      name = `Slot Restriction: ${minSlots} common slots`;
      description = `Require at least ${minSlots} common available slots`;
    } else {
      // Custom rule for unrecognized patterns
      ruleType = 'custom';
      parameters = { naturalLanguageRule: naturalLanguageInput };
      name = `Custom Rule: ${naturalLanguageInput.slice(0, 30)}...`;
      description = `AI-interpreted rule: ${naturalLanguageInput}`;
    }
    
    if (ruleType) {
      const newRule: Rule = {
        id: `rule_nl_${Date.now()}`,
        type: ruleType as any,
        name,
        description,
        parameters,
        priority: rules.length + 1
      };
      
      onRulesChange([...rules, newRule]);
      toast({
        title: "AI rule created",
        description: `Created ${ruleType} rule from natural language`,
      });
      setNaturalLanguageInput('');
    } else {
      toast({
        title: "Could not parse rule",
        description: "Try being more specific about the rule type",
        variant: "destructive"
      });
    }
    
    setIsProcessingNL(false);
  };

  const generateRulesConfig = () => {
    const config = {
      rules: rules.map(rule => ({
        id: rule.id,
        type: rule.type,
        name: rule.name,
        description: rule.description,
        parameters: rule.parameters,
        priority: rule.priority
      })),
      metadata: {
        generatedAt: new Date().toISOString(),
        totalRules: rules.length,
        version: "1.0"
      }
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rules.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Rules exported",
      description: "rules.json file has been downloaded",
    });
  };

  const getRuleIcon = (type: string) => {
    const icons: Record<string, string> = {
      coRun: '🔗',
      slotRestriction: '⏰',
      loadLimit: '⚖️',
      phaseWindow: '📅',
      patternMatch: '🔍',
      precedenceOverride: '🏆',
      custom: '🤖'
    };
    return icons[type] || '📋';
  };

  return (
    <div className="space-y-6">
      {/* AI Natural Language Rule Input */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">AI Rule Creator</h2>
        </div>
        
        <p className="text-muted-foreground mb-4">
          Describe your business rule in plain English. Our AI will convert it into a structured rule.
        </p>
        
        <div className="space-y-4">
          <Textarea
            placeholder="e.g., Tasks T12 and T14 should run together, or Limit sales workers to maximum 3 slots per phase"
            value={naturalLanguageInput}
            onChange={(e) => setNaturalLanguageInput(e.target.value)}
            className="min-h-[100px]"
          />
          
          <Button 
            onClick={processNaturalLanguage}
            disabled={!naturalLanguageInput.trim() || isProcessingNL}
            className="flex items-center gap-2"
          >
            {isProcessingNL ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Create Rule with AI
              </>
            )}
          </Button>
        </div>
        
        <div className="mt-4 p-3 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Examples:</strong><br />
            • "Tasks T1 and T2 should run together"<br />
            • "Limit engineering workers to maximum 2 slots per phase"<br />
            • "Task T5 can only run in phases 1-3"<br />
            • "Set priority 1 for all client rules"
          </p>
        </div>
      </Card>

      {/* Traditional Rule Builder */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Traditional Rule Builder</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {ruleTypes.map(type => (
            <Card 
              key={type.value}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
              onClick={() => addRule(type.value)}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getRuleIcon(type.value)}</span>
                <h3 className="font-medium">{type.label}</h3>
              </div>
              <p className="text-sm text-muted-foreground">{type.description}</p>
              <Button size="sm" className="w-full mt-3">
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </Card>
          ))}
        </div>
      </Card>

      {/* Current Rules */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Current Rules ({rules.length})</h2>
          {rules.length > 0 && (
            <Button onClick={generateRulesConfig} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Rules Config
            </Button>
          )}
        </div>
        
        {rules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No rules configured yet.</p>
            <p className="text-sm mt-1">Add rules using AI or the traditional builder above.</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {rules.map((rule, index) => (
                <Card key={rule.id} className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getRuleIcon(rule.type)}</span>
                      <div>
                        <Input
                          value={rule.name}
                          onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                          className="font-medium mb-1 h-8"
                        />
                        <Badge variant="outline">{rule.type}</Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Priority:</Label>
                      <Input
                        type="number"
                        value={rule.priority}
                        onChange={(e) => updateRule(rule.id, { priority: parseInt(e.target.value) })}
                        className="w-16 h-8"
                        min="1"
                      />
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => removeRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <Textarea
                    placeholder="Rule description..."
                    value={rule.description}
                    onChange={(e) => updateRule(rule.id, { description: e.target.value })}
                    className="mb-3 min-h-[60px]"
                  />
                  
                  <div className="bg-muted/30 p-3 rounded">
                    <p className="text-sm font-medium mb-2">Parameters:</p>
                    <pre className="text-xs text-muted-foreground">
                      {JSON.stringify(rule.parameters, null, 2)}
                    </pre>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
};