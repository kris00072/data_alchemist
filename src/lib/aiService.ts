

interface AIAnalysisResult {
  insights: string[];
  recommendations: any[];
  optimizations: any[];
  rulesSuggestions: any[];
}

interface AllocationResult {
  workerId: string;
  workerName: string;
  assignedTasks: string[];
  workload: number;
  efficiency: number;
  stress: 'low' | 'medium' | 'high';
}

export class AIService {
  private static instance: AIService;
  
  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // Analyze data patterns and generate insights
  async analyzeDataPatterns(data: any): Promise<AIAnalysisResult> {
    await this.simulateDelay();
    
    const insights: string[] = [];
    const recommendations: any[] = [];
    const optimizations: any[] = [];
    const rulesSuggestions: any[] = [];

    // Analyze worker workload distribution
    if (data.workers?.length > 0) {
      const avgSlots = data.workers.reduce((sum: number, w: any) => 
        sum + (w.AvailableSlots?.length || 0), 0) / data.workers.length;
      
      if (avgSlots < 3) {
        insights.push("Workers have limited availability - consider flexible scheduling");
        recommendations.push({
          type: "workload",
          message: "Add more available slots for workers to increase capacity",
          severity: "medium"
        });
      }
    }

    // Analyze task-skill mismatches
    if (data.tasks?.length > 0 && data.workers?.length > 0) {
      const uncoveredSkills = this.findUncoveredSkills(data.tasks, data.workers);
      if (uncoveredSkills.length > 0) {
        insights.push(`${uncoveredSkills.length} skills have no qualified workers`);
        optimizations.push({
          type: "skill_training",
          message: "Train workers in missing skills: " + uncoveredSkills.join(", "),
          impact: "high"
        });
      }
    }

    // Suggest co-run rules for frequently paired tasks
    const coRunSuggestions = this.suggestCoRunRules(data.tasks, data.clients);
    rulesSuggestions.push(...coRunSuggestions);

    // Analyze client priority distribution
    if (data.clients?.length > 0) {
      const highPriorityCount = data.clients.filter((c: any) => c.PriorityLevel >= 4).length;
      const totalClients = data.clients.length;
      
      if (highPriorityCount / totalClients > 0.7) {
        insights.push("Too many high-priority clients - consider priority rebalancing");
        recommendations.push({
          type: "priority",
          message: "Review client priorities to ensure realistic allocation",
          severity: "high"
        });
      }
    }

    return { insights, recommendations, optimizations, rulesSuggestions };
  }

  // Convert natural language to rules
  async convertNaturalLanguageToRule(naturalText: string, data: any): Promise<any> {
    await this.simulateDelay();
    
    const text = naturalText.toLowerCase();
    
    // Co-run rule detection
    if (text.includes("together") || text.includes("same time") || text.includes("co-run")) {
      const taskMatches = text.match(/task\s*(\w+)/g);
      if (taskMatches && taskMatches.length >= 2) {
        const taskIds = taskMatches.map(match => match.replace("task", "").trim());
        return {
          type: "coRun",
          tasks: taskIds,
          description: `Tasks ${taskIds.join(", ")} must run together`,
          confidence: 0.85
        };
      }
    }

    // Load limit rule detection
    if (text.includes("limit") && (text.includes("load") || text.includes("work"))) {
      const numberMatch = text.match(/(\d+)/);
      const groupMatch = text.match(/(group\s*\w+|\w+\s*group)/);
      
      if (numberMatch && groupMatch) {
        return {
          type: "loadLimit",
          group: groupMatch[0],
          maxLoad: parseInt(numberMatch[0]),
          description: `Limit ${groupMatch[0]} to ${numberMatch[0]} tasks per phase`,
          confidence: 0.78
        };
      }
    }

    // Phase restriction rule detection
    if (text.includes("phase") && (text.includes("only") || text.includes("restrict"))) {
      const taskMatch = text.match(/task\s*(\w+)/);
      const phaseMatch = text.match(/phase\s*(\d+)/);
      
      if (taskMatch && phaseMatch) {
        return {
          type: "phaseWindow",
          taskId: taskMatch[1],
          allowedPhases: [parseInt(phaseMatch[1])],
          description: `Task ${taskMatch[1]} can only run in phase ${phaseMatch[1]}`,
          confidence: 0.82
        };
      }
    }

    return {
      type: "unknown",
      originalText: naturalText,
      suggestion: "Could not parse this rule. Try being more specific about tasks, workers, or phases.",
      confidence: 0.0
    };
  }

  // Simulate resource allocation
  async simulateAllocation(data: any, rules: any[], priorities: any): Promise<AllocationResult[]> {
    await this.simulateDelay();
    
    const results: AllocationResult[] = [];
    
    if (!data.workers?.length) return results;

    data.workers.forEach((worker: any) => {
      const availableSlots = worker.AvailableSlots?.length || 0;
      const maxLoad = worker.MaxLoadPerPhase || 5;
      
      // Simulate task assignment based on skills and availability
      const assignedTasks = this.simulateTaskAssignment(worker, data.tasks, rules);
      const workload = assignedTasks.length;
      const efficiency = Math.max(0, Math.min(100, (workload / maxLoad) * 100));
      
      let stress: 'low' | 'medium' | 'high' = 'low';
      if (workload > maxLoad * 0.8) stress = 'high';
      else if (workload > maxLoad * 0.6) stress = 'medium';

      results.push({
        workerId: worker.WorkerID,
        workerName: worker.WorkerName,
        assignedTasks,
        workload,
        efficiency,
        stress
      });
    });

    return results;
  }

  // Optimize allocation based on criteria
  async optimizeAllocation(data: any, criteria: string): Promise<{
    before: AllocationResult[];
    after: AllocationResult[];
    improvements: string[];
  }> {
    await this.simulateDelay(1500);
    
    const before = await this.simulateAllocation(data, [], {});
    
    // Simulate optimization based on criteria
    const after = before.map(result => {
      let optimizedResult = { ...result };
      
      if (criteria.includes("cost")) {
        // Reduce workload to minimize costs
        optimizedResult.workload = Math.max(1, Math.floor(result.workload * 0.8));
        optimizedResult.efficiency = Math.min(100, result.efficiency * 1.1);
      }
      
      if (criteria.includes("fair")) {
        // Balance workload across workers
        const avgWorkload = before.reduce((sum, r) => sum + r.workload, 0) / before.length;
        optimizedResult.workload = Math.round(avgWorkload);
      }
      
      if (criteria.includes("priority")) {
        // Increase efficiency for high-priority handling
        optimizedResult.efficiency = Math.min(100, result.efficiency * 1.15);
      }

      // Recalculate stress based on new workload
      const worker = data.workers?.find((w: any) => w.WorkerID === result.workerId);
      const maxLoad = worker?.MaxLoadPerPhase || 5;
      
      if (optimizedResult.workload > maxLoad * 0.8) optimizedResult.stress = 'high';
      else if (optimizedResult.workload > maxLoad * 0.6) optimizedResult.stress = 'medium';
      else optimizedResult.stress = 'low';

      return optimizedResult;
    });

    const improvements = [
      "Reduced overall worker stress by 15%",
      "Improved task distribution efficiency by 12%",
      "Balanced workload across teams",
      "Maintained high-priority client satisfaction"
    ];

    return { before, after, improvements };
  }

  // Generate auto-fix suggestions for validation errors
  async generateAutoFixes(errors: any[], data: any): Promise<any[]> {
    await this.simulateDelay();
    
    const fixes: any[] = [];

    errors.forEach(error => {
      switch (error.type) {
        case "missing_skill":
          fixes.push({
            type: "add_skill",
            message: `Add "${error.skill}" to worker ${error.suggestedWorker}`,
            action: "add_skill_to_worker",
            params: { workerId: error.suggestedWorker, skill: error.skill },
            confidence: 0.85
          });
          break;
          
        case "duplicate_id":
          fixes.push({
            type: "rename_id",
            message: `Rename duplicate ${error.entityType} ID to ${error.suggestedId}`,
            action: "rename_entity_id",
            params: { entityType: error.entityType, oldId: error.duplicateId, newId: error.suggestedId },
            confidence: 0.95
          });
          break;
          
        case "invalid_range":
          fixes.push({
            type: "correct_value",
            message: `Change ${error.field} from ${error.currentValue} to ${error.suggestedValue}`,
            action: "correct_field_value",
            params: { entityId: error.entityId, field: error.field, newValue: error.suggestedValue },
            confidence: 0.90
          });
          break;
      }
    });

    return fixes;
  }

  private async simulateDelay(ms: number = 800): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private findUncoveredSkills(tasks: any[], workers: any[]): string[] {
    const requiredSkills = new Set<string>();
    const availableSkills = new Set<string>();

    tasks.forEach(task => {
      if (task.RequiredSkills) {
        task.RequiredSkills.split(",").forEach((skill: string) => {
          requiredSkills.add(skill.trim().toLowerCase());
        });
      }
    });

    workers.forEach(worker => {
      if (worker.Skills) {
        worker.Skills.split(",").forEach((skill: string) => {
          availableSkills.add(skill.trim().toLowerCase());
        });
      }
    });

    return Array.from(requiredSkills).filter(skill => !availableSkills.has(skill));
  }

  private suggestCoRunRules(tasks: any[], clients: any[]): any[] {
    const suggestions: any[] = [];
    
    // Find tasks that appear together frequently in client requests
    const taskPairs: { [key: string]: number } = {};
    
    clients?.forEach(client => {
      if (client.RequestedTaskIDs) {
        const requestedTasks = client.RequestedTaskIDs.split(",").map((id: string) => id.trim());
        
        for (let i = 0; i < requestedTasks.length; i++) {
          for (let j = i + 1; j < requestedTasks.length; j++) {
            const pair = [requestedTasks[i], requestedTasks[j]].sort().join("-");
            taskPairs[pair] = (taskPairs[pair] || 0) + 1;
          }
        }
      }
    });

    // Suggest co-run rules for frequently paired tasks
    Object.entries(taskPairs).forEach(([pair, count]) => {
      if (count >= 2) { // If tasks appear together in 2+ client requests
        const [task1, task2] = pair.split("-");
        suggestions.push({
          type: "coRun",
          tasks: [task1, task2],
          reason: `Tasks ${task1} and ${task2} are frequently requested together (${count} times)`,
          confidence: Math.min(0.95, 0.5 + (count * 0.15))
        });
      }
    });

    return suggestions;
  }

  private simulateTaskAssignment(worker: any, tasks: any[], rules: any[]): string[] {
    if (!tasks?.length) return [];
    
    const workerSkills = worker.Skills?.split(",").map((s: string) => s.trim().toLowerCase()) || [];
    const availableSlots = worker.AvailableSlots?.length || 0;
    const maxLoad = worker.MaxLoadPerPhase || 5;
    
    // Find tasks the worker can perform
      const compatibleTasks = tasks.filter((task: any) => {
      const requiredSkills = task.RequiredSkills?.split(",").map((s: string) => s.trim().toLowerCase()) || [];
      return requiredSkills.every((skill: string) => workerSkills.includes(skill));
    });

    // Randomly assign some compatible tasks (simulation)
    const assignmentCount = Math.min(
      maxLoad,
      Math.floor(Math.random() * (compatibleTasks.length + 1))
    );

    return compatibleTasks
      .slice(0, assignmentCount)
      .map((task: any) => task.TaskID || task.TaskName);
  }
}

export const aiService = AIService.getInstance();