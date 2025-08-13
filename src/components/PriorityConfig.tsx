import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, RotateCcw, Target } from "lucide-react";

interface PriorityConfigProps {
  priorities: any;
  onPrioritiesChange: (priorities: any) => void;
}

export const PriorityConfig = ({ priorities, onPrioritiesChange }: PriorityConfigProps) => {
  const [activePreset, setActivePreset] = useState<string>('');

  const criteriaItems = [
    { id: 'priority_level', name: 'Client Priority Level', description: 'Weight given to client priority ratings (1-5)' },
    { id: 'task_fulfillment', name: 'Task Fulfillment', description: 'Importance of completing requested tasks' },
    { id: 'worker_fairness', name: 'Worker Load Fairness', description: 'Ensuring even distribution of work' },
    { id: 'skill_matching', name: 'Skill-Task Matching', description: 'Quality of worker-task skill alignment' },
    { id: 'phase_efficiency', name: 'Phase Efficiency', description: 'Optimal use of available time phases' },
    { id: 'resource_utilization', name: 'Resource Utilization', description: 'Maximum use of available worker capacity' },
    { id: 'deadline_compliance', name: 'Deadline Compliance', description: 'Meeting task completion deadlines' },
    { id: 'cost_optimization', name: 'Cost Optimization', description: 'Minimizing operational costs' }
  ];

  const presets = {
    maximize_fulfillment: {
      name: 'Maximize Fulfillment',
      description: 'Focus on completing as many requested tasks as possible',
      weights: {
        priority_level: 95,
        task_fulfillment: 100,
        worker_fairness: 60,
        skill_matching: 80,
        phase_efficiency: 70,
        resource_utilization: 85,
        deadline_compliance: 90,
        cost_optimization: 50
      }
    },
    fair_distribution: {
      name: 'Fair Distribution',
      description: 'Emphasize equal workload distribution among workers',
      weights: {
        priority_level: 70,
        task_fulfillment: 75,
        worker_fairness: 100,
        skill_matching: 85,
        phase_efficiency: 80,
        resource_utilization: 75,
        deadline_compliance: 80,
        cost_optimization: 60
      }
    },
    minimize_workload: {
      name: 'Minimize Workload',
      description: 'Reduce overall worker stress and overtime',
      weights: {
        priority_level: 80,
        task_fulfillment: 70,
        worker_fairness: 90,
        skill_matching: 75,
        phase_efficiency: 85,
        resource_utilization: 60,
        deadline_compliance: 85,
        cost_optimization: 100
      }
    },
    quality_focused: {
      name: 'Quality Focused',
      description: 'Prioritize perfect skill matches and high-quality outcomes',
      weights: {
        priority_level: 85,
        task_fulfillment: 80,
        worker_fairness: 70,
        skill_matching: 100,
        phase_efficiency: 75,
        resource_utilization: 70,
        deadline_compliance: 95,
        cost_optimization: 55
      }
    }
  };

  const [criteriaOrder, setCriteriaOrder] = useState(criteriaItems.map(item => item.id));
  const [weights, setWeights] = useState(() => {
    const defaultWeights: any = {};
    criteriaItems.forEach(item => {
      defaultWeights[item.id] = priorities[item.id] || 50;
    });
    return defaultWeights;
  });

  const handleWeightChange = (criteriaId: string, value: number) => {
    const newWeights = { ...weights, [criteriaId]: value };
    setWeights(newWeights);
    onPrioritiesChange({
      ...priorities,
      ...newWeights,
      criteriaOrder,
      activePreset
    });
  };

  const applyPreset = (presetKey: string) => {
    const preset = presets[presetKey as keyof typeof presets];
    if (preset) {
      setWeights(preset.weights);
      setActivePreset(presetKey);
      onPrioritiesChange({
        ...priorities,
        ...preset.weights,
        criteriaOrder,
        activePreset: presetKey
      });
    }
  };

  const resetToDefaults = () => {
    const defaultWeights: any = {};
    criteriaItems.forEach(item => {
      defaultWeights[item.id] = 50;
    });
    setWeights(defaultWeights);
    setActivePreset('');
    setCriteriaOrder(criteriaItems.map(item => item.id));
    onPrioritiesChange({
      ...defaultWeights,
      criteriaOrder: criteriaItems.map(item => item.id),
      activePreset: ''
    });
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(criteriaOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setCriteriaOrder(items);
    onPrioritiesChange({
      ...priorities,
      criteriaOrder: items
    });
  };

  const getWeightColor = (weight: number) => {
    if (weight >= 80) return 'text-success';
    if (weight >= 60) return 'text-warning';
    return 'text-muted-foreground';
  };

  const getWeightBg = (weight: number) => {
    if (weight >= 80) return 'bg-success/10';
    if (weight >= 60) return 'bg-warning/10';
    return 'bg-muted/10';
  };

  return (
    <div className="space-y-6">
      {/* Preset Profiles */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Priority Presets</h2>
        </div>
        
        <p className="text-muted-foreground mb-4">
          Choose a preset configuration or customize your own priority weights below.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {Object.entries(presets).map(([key, preset]) => (
            <Card 
              key={key}
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                activePreset === key ? 'ring-2 ring-primary bg-primary/5' : 'hover:border-primary/30'
              }`}
              onClick={() => applyPreset(key)}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{preset.name}</h3>
                {activePreset === key && (
                  <Badge variant="default">Active</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{preset.description}</p>
              
              <div className="mt-3 flex flex-wrap gap-1">
                {Object.entries(preset.weights).slice(0, 4).map(([criteria, weight]) => {
                  const item = criteriaItems.find(c => c.id === criteria);
                  return (
                    <Badge key={criteria} variant="outline" className="text-xs">
                      {item?.name.split(' ')[0]}: {weight}%
                    </Badge>
                  );
                })}
                {Object.keys(preset.weights).length > 4 && (
                  <Badge variant="outline" className="text-xs">
                    +{Object.keys(preset.weights).length - 4} more
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
        
        <Button variant="outline" onClick={resetToDefaults} className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset to Defaults
        </Button>
      </Card>

      {/* Weight Configuration */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Priority Weights</h2>
          <Badge variant="outline">
            {criteriaOrder.length} Criteria Configured
          </Badge>
        </div>
        
        <p className="text-muted-foreground mb-6">
          Adjust the relative importance of each criterion. Higher values indicate greater importance.
        </p>
        
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="criteria">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {criteriaOrder.map((criteriaId, index) => {
                  const item = criteriaItems.find(c => c.id === criteriaId);
                  if (!item) return null;
                  
                  const weight = weights[criteriaId] || 50;
                  
                  return (
                    <Draggable key={criteriaId} draggableId={criteriaId} index={index}>
                      {(provided, snapshot) => (
                        <Card 
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`p-4 transition-all ${
                            snapshot.isDragging ? 'shadow-lg rotate-2' : ''
                          } ${getWeightBg(weight)}`}
                        >
                          <div className="flex items-center gap-4">
                            <div 
                              {...provided.dragHandleProps}
                              className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h3 className="font-medium">{item.name}</h3>
                                  <p className="text-sm text-muted-foreground">{item.description}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`text-2xl font-bold ${getWeightColor(weight)}`}>
                                    {weight}%
                                  </span>
                                  <p className="text-xs text-muted-foreground">Weight</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <span className="text-xs text-muted-foreground w-8">Low</span>
                                <Slider
                                  value={[weight]}
                                  onValueChange={([value]) => handleWeightChange(criteriaId, value)}
                                  max={100}
                                  min={0}
                                  step={5}
                                  className="flex-1"
                                />
                                <span className="text-xs text-muted-foreground w-8">High</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h3 className="font-medium mb-2">Configuration Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Total Criteria:</span>
              <span className="ml-2 font-medium">{criteriaOrder.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Average Weight:</span>
              <span className="ml-2 font-medium">
                {Object.values(weights).length > 0 ? Math.round(Object.values(weights).map(Number).reduce((a, b) => a + b, 0) / Object.values(weights).length) : 0}%
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Highest Priority:</span>
              <span className="ml-2 font-medium">
                {criteriaItems.find(c => c.id === Object.entries(weights).reduce((a, b) => Number(weights[a]) > Number(weights[b[0]]) ? a : b[0], ''))?.name?.split(' ')[0] || 'None'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Active Preset:</span>
              <span className="ml-2 font-medium">
                {activePreset ? presets[activePreset as keyof typeof presets].name : 'Custom'}
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};