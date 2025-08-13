import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertTriangle, Zap, RefreshCw, Wand2 } from "lucide-react";
import { aiService } from "@/lib/aiService";

interface SmartErrorFixerProps {
  errors: any[];
  data: any;
  onFixApplied: (fixedData: any) => void;
}

export const SmartErrorFixer = ({ errors, data, onFixApplied }: SmartErrorFixerProps) => {
  const [fixes, setFixes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [applyingFix, setApplyingFix] = useState<string | null>(null);

  useEffect(() => {
    if (errors.length > 0) {
      generateFixes();
    } else {
      setFixes([]);
    }
  }, [errors]);

  const generateFixes = async () => {
    setLoading(true);
    try {
      const generatedFixes = await aiService.generateAutoFixes(errors, data);
      setFixes(generatedFixes);
    } catch (error) {
      console.error("Error generating fixes:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFix = async (fix: any) => {
    setApplyingFix(fix.type);
    
    // Simulate applying the fix
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let updatedData = { ...data };

    try {
      switch (fix.action) {
        case "add_skill_to_worker":
          updatedData = addSkillToWorker(updatedData, fix.params);
          break;
        case "rename_entity_id":
          updatedData = renameEntityId(updatedData, fix.params);
          break;
        case "correct_field_value":
          updatedData = correctFieldValue(updatedData, fix.params);
          break;
        default:
          console.warn("Unknown fix action:", fix.action);
      }

      onFixApplied(updatedData);
      
      // Remove the applied fix from the list
      setFixes(prev => prev.filter(f => f !== fix));
    } catch (error) {
      console.error("Error applying fix:", error);
    } finally {
      setApplyingFix(null);
    }
  };

  const addSkillToWorker = (data: any, params: any) => {
    const updatedData = { ...data };
    const workerIndex = updatedData.workers.findIndex((w: any) => w.WorkerID === params.workerId);
    
    if (workerIndex !== -1) {
      const worker = { ...updatedData.workers[workerIndex] };
      const currentSkills = worker.Skills ? worker.Skills.split(",").map((s: string) => s.trim()) : [];
      
      if (!currentSkills.includes(params.skill)) {
        worker.Skills = [...currentSkills, params.skill].join(", ");
        updatedData.workers[workerIndex] = worker;
      }
    }
    
    return updatedData;
  };

  const renameEntityId = (data: any, params: any) => {
    const updatedData = { ...data };
    const { entityType, oldId, newId } = params;
    
    const entityMap: { [key: string]: string } = {
      'client': 'clients',
      'worker': 'workers',
      'task': 'tasks'
    };
    
    const arrayKey = entityMap[entityType];
    if (!arrayKey || !updatedData[arrayKey]) return updatedData;
    
    const entityIndex = updatedData[arrayKey].findIndex((item: any) => 
      item[`${entityType.charAt(0).toUpperCase() + entityType.slice(1)}ID`] === oldId
    );
    
    if (entityIndex !== -1) {
      const entity = { ...updatedData[arrayKey][entityIndex] };
      entity[`${entityType.charAt(0).toUpperCase() + entityType.slice(1)}ID`] = newId;
      updatedData[arrayKey][entityIndex] = entity;
    }
    
    return updatedData;
  };

  const correctFieldValue = (data: any, params: any) => {
    const updatedData = { ...data };
    const { entityId, field, newValue } = params;
    
    // Find the entity across all types
    ['clients', 'workers', 'tasks'].forEach(type => {
      if (updatedData[type]) {
        const entityIndex = updatedData[type].findIndex((item: any) => 
          Object.values(item).includes(entityId)
        );
        
        if (entityIndex !== -1) {
          const entity = { ...updatedData[type][entityIndex] };
          entity[field] = newValue;
          updatedData[type][entityIndex] = entity;
        }
      }
    });
    
    return updatedData;
  };

  const applyAllFixes = async () => {
    setApplyingFix("all");
    
    let updatedData = { ...data };
    
    for (const fix of fixes) {
      try {
        switch (fix.action) {
          case "add_skill_to_worker":
            updatedData = addSkillToWorker(updatedData, fix.params);
            break;
          case "rename_entity_id":
            updatedData = renameEntityId(updatedData, fix.params);
            break;
          case "correct_field_value":
            updatedData = correctFieldValue(updatedData, fix.params);
            break;
        }
      } catch (error) {
        console.error("Error applying fix:", error);
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onFixApplied(updatedData);
    setFixes([]);
    setApplyingFix(null);
  };

  const getFixIcon = (type: string) => {
    switch (type) {
      case "add_skill": return <Zap className="h-4 w-4 text-primary" />;
      case "rename_id": return <RefreshCw className="h-4 w-4 text-accent" />;
      case "correct_value": return <CheckCircle className="h-4 w-4 text-success" />;
      default: return <Wand2 className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) return "default";
    if (confidence >= 0.7) return "secondary";
    return "outline";
  };

  if (errors.length === 0) {
    return (
      <Card className="p-6 bg-success/5 border-success/20">
        <div className="text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
          <h3 className="text-lg font-semibold text-success mb-2">No Errors Found!</h3>
          <p className="text-muted-foreground">
            Your data looks great. All validations passed successfully.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Smart Error Fixes
          </h3>
          <p className="text-muted-foreground">
            AI-generated solutions for {errors.length} validation error{errors.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {fixes.length > 0 && (
          <Button 
            onClick={applyAllFixes}
            disabled={applyingFix !== null}
            className="flex items-center gap-2"
          >
            {applyingFix === "all" ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Applying All...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                Apply All Fixes
              </>
            )}
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Wand2 className="h-5 w-5 text-primary animate-pulse" />
            <span className="font-medium">Generating smart fixes...</span>
          </div>
          <Progress value={75} className="w-full" />
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>• Analyzing error patterns</div>
            <div>• Generating solutions</div>
            <div>• Calculating confidence</div>
            <div>• Preparing recommendations</div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {fixes.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-warning" />
              <p className="text-muted-foreground">No automatic fixes available for current errors.</p>
              <p className="text-sm text-muted-foreground mt-1">These errors may require manual intervention.</p>
            </div>
          ) : (
            fixes.map((fix, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getFixIcon(fix.type)}
                    <div>
                      <p className="font-medium">{fix.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getConfidenceBadge(fix.confidence)}>
                          {Math.round(fix.confidence * 100)}% confidence
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {fix.type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => applyFix(fix)}
                    disabled={applyingFix !== null}
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {applyingFix === fix.type ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Applying...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-3 w-3" />
                        Apply Fix
                      </>
                    )}
                  </Button>
                </div>

                {fix.params && (
                  <div className="bg-muted/30 p-3 rounded text-sm">
                    <p className="font-medium mb-1">Fix Details:</p>
                    <div className="space-y-1 text-muted-foreground">
                      {Object.entries(fix.params).map(([key, value]) => (
                        <div key={key}>
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}: </span>
                          <span className="font-mono">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}

          {fixes.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{fixes.length} automatic fix{fixes.length !== 1 ? 'es' : ''} available</span>
                <Button variant="ghost" size="sm" onClick={generateFixes} disabled={loading}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Regenerate Fixes
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
};