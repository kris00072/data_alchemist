import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, CheckCircle, AlertTriangle, RefreshCw, Zap, Wrench } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ValidationResult {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  details: string;
  entityType: 'clients' | 'workers' | 'tasks';
  entityId: string;
  field?: string;
  suggestion?: string;
  canAutoFix?: boolean;
}

interface ValidationPanelProps {
  data: {
    clients: any[];
    workers: any[];
    tasks: any[];
  };
  onValidationResults: (results: ValidationResult[]) => void;
  onDataChange: (data: any) => void;
}

export const ValidationPanel = ({ data, onValidationResults, onDataChange }: ValidationPanelProps) => {
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Core validation functions
  const validateMissingColumns = (entityType: 'clients' | 'workers' | 'tasks', items: any[]): ValidationResult[] => {
    const results: ValidationResult[] = [];
    
    const requiredFields = {
      clients: ['ClientID', 'ClientName', 'PriorityLevel'],
      workers: ['WorkerID', 'WorkerName', 'Skills', 'AvailableSlots'],
      tasks: ['TaskID', 'TaskName', 'Duration', 'RequiredSkills']
    };

    const required = requiredFields[entityType];
    
    if (items.length === 0) return results;
    
    const headers = Object.keys(items[0]);
    const missing = required.filter(field => !headers.includes(field));
    
    missing.forEach(field => {
      results.push({
        id: `missing-${entityType}-${field}`,
        type: 'error',
        category: 'Missing Required Column',
        message: `Missing required column: ${field}`,
        details: `The ${entityType} data is missing the required ${field} column.`,
        entityType,
        entityId: 'structure',
        field,
        suggestion: `Add a ${field} column to your ${entityType} data`,
        canAutoFix: false
      });
    });
    
    return results;
  };

  const validateDuplicateIDs = (entityType: 'clients' | 'workers' | 'tasks', items: any[]): ValidationResult[] => {
    const results: ValidationResult[] = [];
    const idField = entityType === 'clients' ? 'ClientID' : entityType === 'workers' ? 'WorkerID' : 'TaskID';
    
    const ids = new Map<string, number[]>();
    
    items.forEach((item, index) => {
      const id = item[idField];
      if (id) {
        if (!ids.has(id)) {
          ids.set(id, []);
        }
        ids.get(id)!.push(index);
      }
    });
    
    ids.forEach((indices, id) => {
      if (indices.length > 1) {
        results.push({
          id: `duplicate-${entityType}-${id}`,
          type: 'error',
          category: 'Duplicate ID',
          message: `Duplicate ${idField}: ${id}`,
          details: `Found ${indices.length} records with the same ${idField}: ${id}`,
          entityType,
          entityId: id,
          field: idField,
          suggestion: `Ensure each ${idField} is unique across all ${entityType}`,
          canAutoFix: true
        });
      }
    });
    
    return results;
  };

  const validateDataTypes = (entityType: 'clients' | 'workers' | 'tasks', items: any[]): ValidationResult[] => {
    const results: ValidationResult[] = [];
    
    items.forEach((item, index) => {
      // Validate numeric fields
      if (entityType === 'clients' && item.PriorityLevel) {
        const priority = parseInt(item.PriorityLevel);
        if (isNaN(priority) || priority < 1 || priority > 5) {
          results.push({
            id: `invalid-priority-${entityType}-${index}`,
            type: 'error',
            category: 'Out-of-range Value',
            message: `Invalid PriorityLevel: ${item.PriorityLevel}`,
            details: `PriorityLevel must be a number between 1 and 5`,
            entityType,
            entityId: item.ClientID || `row-${index}`,
            field: 'PriorityLevel',
            suggestion: 'Set PriorityLevel to a value between 1-5',
            canAutoFix: true
          });
        }
      }
      
      if (entityType === 'tasks' && item.Duration) {
        const duration = parseInt(item.Duration);
        if (isNaN(duration) || duration < 1) {
          results.push({
            id: `invalid-duration-${entityType}-${index}`,
            type: 'error',
            category: 'Out-of-range Value',
            message: `Invalid Duration: ${item.Duration}`,
            details: `Duration must be a positive number (≥1)`,
            entityType,
            entityId: item.TaskID || `row-${index}`,
            field: 'Duration',
            suggestion: 'Set Duration to a positive number',
            canAutoFix: true
          });
        }
      }
      
      if (entityType === 'workers' && item.MaxLoadPerPhase) {
        const maxLoad = parseInt(item.MaxLoadPerPhase);
        if (isNaN(maxLoad) || maxLoad < 1) {
          results.push({
            id: `invalid-maxload-${entityType}-${index}`,
            type: 'error',
            category: 'Out-of-range Value',
            message: `Invalid MaxLoadPerPhase: ${item.MaxLoadPerPhase}`,
            details: `MaxLoadPerPhase must be a positive number`,
            entityType,
            entityId: item.WorkerID || `row-${index}`,
            field: 'MaxLoadPerPhase',
            suggestion: 'Set MaxLoadPerPhase to a positive number',
            canAutoFix: true
          });
        }
      }
      
      // Validate JSON fields
      if (item.AttributesJSON) {
        try {
          JSON.parse(item.AttributesJSON);
        } catch {
          results.push({
            id: `invalid-json-${entityType}-${index}`,
            type: 'error',
            category: 'Broken JSON',
            message: `Invalid JSON in AttributesJSON`,
            details: `The AttributesJSON field contains malformed JSON`,
            entityType,
            entityId: item.ClientID || item.WorkerID || item.TaskID || `row-${index}`,
            field: 'AttributesJSON',
            suggestion: 'Fix the JSON syntax or clear the field',
            canAutoFix: true
          });
        }
      }
    });
    
    return results;
  };

  const validateReferences = (): ValidationResult[] => {
    const results: ValidationResult[] = [];
    const taskIDs = new Set(data.tasks.map(t => t.TaskID).filter(Boolean));
    
    // Validate client requested tasks
    data.clients.forEach((client, index) => {
      if (client.RequestedTaskIDs) {
        const requestedTasks = client.RequestedTaskIDs.split(',').map((id: string) => id.trim());
        const invalidTasks = requestedTasks.filter((taskId: string) => taskId && !taskIDs.has(taskId));
        
        invalidTasks.forEach((taskId: string) => {
          results.push({
            id: `invalid-task-ref-${client.ClientID}-${taskId}`,
            type: 'error',
            category: 'Unknown Reference',
            message: `Unknown TaskID: ${taskId}`,
            details: `Client ${client.ClientName || client.ClientID} requests TaskID ${taskId} which doesn't exist`,
            entityType: 'clients',
            entityId: client.ClientID || `row-${index}`,
            field: 'RequestedTaskIDs',
            suggestion: `Remove ${taskId} or add a task with this ID`,
            canAutoFix: true
          });
        });
      }
    });
    
    return results;
  };

  const validateSkillCoverage = (): ValidationResult[] => {
    const results: ValidationResult[] = [];
    const workerSkills = new Set<string>();
    
    // Collect all worker skills
    data.workers.forEach((worker: any) => {
      if (worker.Skills) {
        const skills = worker.Skills.split(',').map((s: string) => s.trim().toLowerCase());
        skills.forEach((skill: string) => workerSkills.add(skill));
      }
    });
    
    // Check if all required skills are covered
    data.tasks.forEach((task: any, index: number) => {
      if (task.RequiredSkills) {
        const requiredSkills = task.RequiredSkills.split(',').map((s: string) => s.trim().toLowerCase());
        const uncoveredSkills = requiredSkills.filter((skill: string) => skill && !workerSkills.has(skill));
        
        uncoveredSkills.forEach((skill: string) => {
          results.push({
            id: `uncovered-skill-${task.TaskID}-${skill}`,
            type: 'warning',
            category: 'Skill Coverage',
            message: `No worker has skill: ${skill}`,
            details: `Task ${task.TaskName || task.TaskID} requires ${skill} but no worker has this skill`,
            entityType: 'tasks',
            entityId: task.TaskID || `row-${index}`,
            field: 'RequiredSkills',
            suggestion: `Add a worker with ${skill} skill or modify task requirements`,
            canAutoFix: false
          });
        });
      }
    });
    
    return results;
  };

  // AI-powered validation suggestions
  const generateAISuggestions = (): ValidationResult[] => {
    const results: ValidationResult[] = [];
    
    // Analyze patterns and suggest optimizations
    const highPriorityClients = data.clients.filter(c => parseInt(c.PriorityLevel) >= 4);
    const lowSkillWorkers = data.workers.filter(w => !w.Skills || w.Skills.split(',').length <= 2);
    
    if (highPriorityClients.length > data.workers.length * 0.5) {
      results.push({
        id: 'ai-too-many-high-priority',
        type: 'info',
        category: 'AI Insight',
        message: 'High ratio of high-priority clients',
        details: `${highPriorityClients.length} clients have priority 4-5, but only ${data.workers.length} workers available`,
        entityType: 'clients',
        entityId: 'analysis',
        suggestion: 'Consider balancing priority levels or adding more workers',
        canAutoFix: false
      });
    }
    
    if (lowSkillWorkers.length > data.workers.length * 0.3) {
      results.push({
        id: 'ai-skill-diversity',
        type: 'info',
        category: 'AI Insight',
        message: 'Low skill diversity among workers',
        details: `${lowSkillWorkers.length} workers have limited skills (≤2)`,
        entityType: 'workers',
        entityId: 'analysis',
        suggestion: 'Consider cross-training workers to increase skill coverage',
        canAutoFix: false
      });
    }
    
    return results;
  };

  const runValidation = async () => {
    setIsValidating(true);
    setProgress(0);
    
    const allResults: ValidationResult[] = [];
    const totalSteps = 7;
    let currentStep = 0;
    
    // Step 1: Missing columns
    currentStep++;
    setProgress((currentStep / totalSteps) * 100);
    allResults.push(...validateMissingColumns('clients', data.clients));
    allResults.push(...validateMissingColumns('workers', data.workers));
    allResults.push(...validateMissingColumns('tasks', data.tasks));
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Step 2: Duplicate IDs
    currentStep++;
    setProgress((currentStep / totalSteps) * 100);
    allResults.push(...validateDuplicateIDs('clients', data.clients));
    allResults.push(...validateDuplicateIDs('workers', data.workers));
    allResults.push(...validateDuplicateIDs('tasks', data.tasks));
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Step 3: Data types and ranges
    currentStep++;
    setProgress((currentStep / totalSteps) * 100);
    allResults.push(...validateDataTypes('clients', data.clients));
    allResults.push(...validateDataTypes('workers', data.workers));
    allResults.push(...validateDataTypes('tasks', data.tasks));
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Step 4: References
    currentStep++;
    setProgress((currentStep / totalSteps) * 100);
    allResults.push(...validateReferences());
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Step 5: Skill coverage
    currentStep++;
    setProgress((currentStep / totalSteps) * 100);
    allResults.push(...validateSkillCoverage());
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Step 6: AI insights
    currentStep++;
    setProgress((currentStep / totalSteps) * 100);
    allResults.push(...generateAISuggestions());
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Step 7: Complete
    currentStep++;
    setProgress(100);
    
    setValidationResults(allResults);
    onValidationResults(allResults);
    setIsValidating(false);
    
    const errorCount = allResults.filter(r => r.type === 'error').length;
    const warningCount = allResults.filter(r => r.type === 'warning').length;
    
    toast({
      title: "Validation complete",
      description: `Found ${errorCount} errors, ${warningCount} warnings`,
      variant: errorCount > 0 ? "destructive" : "default"
    });
  };

  const autoFixIssue = (result: ValidationResult) => {
    if (!result.canAutoFix) return;
    
    const newData = { ...data };
    
    // Auto-fix logic based on issue type
    if (result.category === 'Duplicate ID') {
      // Generate new unique IDs for duplicates
      const entityArray = newData[result.entityType];
      const idField = result.entityType === 'clients' ? 'ClientID' : 
                     result.entityType === 'workers' ? 'WorkerID' : 'TaskID';
      
      entityArray.forEach((item: any, index: number) => {
        if (item[idField] === result.entityId) {
          item[idField] = `${result.entityId}_${index + 1}`;
        }
      });
    } else if (result.category === 'Out-of-range Value') {
      // Fix out of range values
      const entityArray = newData[result.entityType];
      const item = entityArray.find((item: any) => 
        (item.ClientID || item.WorkerID || item.TaskID) === result.entityId
      );
      
      if (item && result.field) {
        if (result.field === 'PriorityLevel') {
          item[result.field] = Math.max(1, Math.min(5, parseInt(item[result.field]) || 3));
        } else if (result.field === 'Duration' || result.field === 'MaxLoadPerPhase') {
          item[result.field] = Math.max(1, parseInt(item[result.field]) || 1);
        }
      }
    } else if (result.category === 'Broken JSON') {
      // Clear broken JSON
      const entityArray = newData[result.entityType];
      const item = entityArray.find((item: any) => 
        (item.ClientID || item.WorkerID || item.TaskID) === result.entityId
      );
      
      if (item && result.field) {
        item[result.field] = '{}';
      }
    }
    
    onDataChange(newData);
    
    // Re-run validation to update results
    setTimeout(runValidation, 100);
    
    toast({
      title: "Issue fixed",
      description: `Auto-fixed: ${result.message}`,
    });
  };

  // Run validation on data change
  useEffect(() => {
    if (data.clients.length > 0 || data.workers.length > 0 || data.tasks.length > 0) {
      runValidation();
    }
  }, [data]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />;
      case 'info': return <Zap className="h-4 w-4 text-primary" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'secondary';
    }
  };

  const errorCount = validationResults.filter(r => r.type === 'error').length;
  const warningCount = validationResults.filter(r => r.type === 'warning').length;
  const infoCount = validationResults.filter(r => r.type === 'info').length;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Data Validation</h2>
          <Button 
            onClick={runValidation} 
            disabled={isValidating}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isValidating ? 'animate-spin' : ''}`} />
            {isValidating ? 'Validating...' : 'Run Validation'}
          </Button>
        </div>
        
        {isValidating && (
          <div className="mb-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              Running AI-powered validation checks...
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <span className="text-2xl font-bold text-destructive">{errorCount}</span>
            </div>
            <p className="text-sm text-muted-foreground">Errors</p>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <span className="text-2xl font-bold text-warning">{warningCount}</span>
            </div>
            <p className="text-sm text-muted-foreground">Warnings</p>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold text-primary">{infoCount}</span>
            </div>
            <p className="text-sm text-muted-foreground">AI Insights</p>
          </Card>
        </div>
        
        {validationResults.length === 0 && !isValidating ? (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
            <p className="text-lg font-medium text-success">All validations passed!</p>
            <p className="text-muted-foreground">Your data is ready for rule configuration.</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {validationResults.map((result) => (
                <Card key={result.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getIcon(result.type)}
                      <span className="font-medium">{result.message}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getBadgeVariant(result.type)}>
                        {result.category}
                      </Badge>
                      {result.canAutoFix && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => autoFixIssue(result)}
                          className="flex items-center gap-1"
                        >
                          <Wrench className="h-3 w-3" />
                          Auto Fix
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {result.details}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {result.entityType} • {result.entityId}
                      {result.field && ` • ${result.field}`}
                    </span>
                    {result.suggestion && (
                      <span className="text-primary font-medium">
                        💡 {result.suggestion}
                      </span>
                    )}
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