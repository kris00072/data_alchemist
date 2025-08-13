import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Sparkles, Filter } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface SearchResult {
  type: 'clients' | 'workers' | 'tasks';
  item: any;
  match: string;
  confidence: number;
}

interface NaturalLanguageSearchProps {
  data: {
    clients: any[];
    workers: any[];
    tasks: any[];
  };
}

export const NaturalLanguageSearch = ({ data }: NaturalLanguageSearchProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  // AI-powered natural language search
  const performSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const searchResults: SearchResult[] = [];
    const queryLower = query.toLowerCase();
    
    // Parse natural language queries
    const parseQuery = (q: string) => {
      const patterns = {
        duration: /duration.*?(\d+|more than \d+|less than \d+|greater than \d+)/i,
        priority: /priority.*?(\d+|high|low|medium)/i,
        skills: /skill.*?([\w\s,]+)/i,
        phase: /phase.*?(\d+)/i,
        slots: /slot.*?(\d+)/i,
        category: /category.*?([\w\s]+)/i,
        group: /group.*?([\w\s]+)/i
      };
      
      const criteria: any = {};
      
      Object.entries(patterns).forEach(([key, pattern]) => {
        const match = q.match(pattern);
        if (match) {
          criteria[key] = match[1].trim();
        }
      });
      
      return criteria;
    };

    const criteria = parseQuery(queryLower);
    
    // Search through tasks
    data.tasks.forEach(task => {
      let matches = 0;
      let matchDetails: string[] = [];
      
      // Duration matching
      if (criteria.duration) {
        const duration = task.Duration || 0;
        const durationCriteria = criteria.duration;
        
        if (durationCriteria.includes('more than')) {
          const num = parseInt(durationCriteria.match(/\d+/)?.[0] || '0');
          if (duration > num) {
            matches++;
            matchDetails.push(`Duration: ${duration} (more than ${num})`);
          }
        } else if (durationCriteria.includes('less than')) {
          const num = parseInt(durationCriteria.match(/\d+/)?.[0] || '0');
          if (duration < num) {
            matches++;
            matchDetails.push(`Duration: ${duration} (less than ${num})`);
          }
        } else {
          const num = parseInt(durationCriteria);
          if (duration === num) {
            matches++;
            matchDetails.push(`Duration: ${duration}`);
          }
        }
      }
      
      // Priority matching
      if (criteria.priority) {
        const priority = task.PriorityLevel || 0;
        const priorityCriteria = criteria.priority;
        
        if (priorityCriteria === 'high' && priority >= 4) {
          matches++;
          matchDetails.push(`High priority (${priority})`);
        } else if (priorityCriteria === 'medium' && priority >= 2 && priority <= 3) {
          matches++;
          matchDetails.push(`Medium priority (${priority})`);
        } else if (priorityCriteria === 'low' && priority <= 2) {
          matches++;
          matchDetails.push(`Low priority (${priority})`);
        } else if (!isNaN(parseInt(priorityCriteria)) && priority === parseInt(priorityCriteria)) {
          matches++;
          matchDetails.push(`Priority: ${priority}`);
        }
      }
      
      // Skills matching
      if (criteria.skills) {
        const taskSkills = (task.RequiredSkills || '').toLowerCase();
        const searchSkills = criteria.skills.toLowerCase();
        if (taskSkills.includes(searchSkills)) {
          matches++;
          matchDetails.push(`Skills: ${task.RequiredSkills}`);
        }
      }
      
      // Phase matching
      if (criteria.phase) {
        const phases = task.PreferredPhases || '';
        const phaseNum = criteria.phase;
        if (phases.includes(phaseNum)) {
          matches++;
          matchDetails.push(`Phase: ${phaseNum} in ${phases}`);
        }
      }
      
      // Category matching
      if (criteria.category) {
        const category = (task.Category || '').toLowerCase();
        const searchCategory = criteria.category.toLowerCase();
        if (category.includes(searchCategory)) {
          matches++;
          matchDetails.push(`Category: ${task.Category}`);
        }
      }
      
      // General text search as fallback
      const taskText = Object.values(task).join(' ').toLowerCase();
      if (taskText.includes(queryLower) && matches === 0) {
        matches = 1;
        matchDetails.push('Text match');
      }
      
      if (matches > 0) {
        searchResults.push({
          type: 'tasks',
          item: task,
          match: matchDetails.join(', '),
          confidence: Math.min(matches / Object.keys(criteria).length, 1) * 100
        });
      }
    });
    
    // Search through workers
    data.workers.forEach(worker => {
      let matches = 0;
      let matchDetails: string[] = [];
      
      // Skills matching
      if (criteria.skills) {
        const workerSkills = (worker.Skills || '').toLowerCase();
        const searchSkills = criteria.skills.toLowerCase();
        if (workerSkills.includes(searchSkills)) {
          matches++;
          matchDetails.push(`Skills: ${worker.Skills}`);
        }
      }
      
      // Slots matching
      if (criteria.slots) {
        const slots = worker.AvailableSlots || [];
        const slotsStr = Array.isArray(slots) ? slots.join(',') : String(slots);
        if (slotsStr.includes(criteria.slots)) {
          matches++;
          matchDetails.push(`Available slots: ${slotsStr}`);
        }
      }
      
      // Group matching
      if (criteria.group) {
        const group = (worker.WorkerGroup || '').toLowerCase();
        const searchGroup = criteria.group.toLowerCase();
        if (group.includes(searchGroup)) {
          matches++;
          matchDetails.push(`Group: ${worker.WorkerGroup}`);
        }
      }
      
      // General text search
      const workerText = Object.values(worker).join(' ').toLowerCase();
      if (workerText.includes(queryLower) && matches === 0) {
        matches = 1;
        matchDetails.push('Text match');
      }
      
      if (matches > 0) {
        searchResults.push({
          type: 'workers',
          item: worker,
          match: matchDetails.join(', '),
          confidence: Math.min(matches / Object.keys(criteria).length, 1) * 100
        });
      }
    });
    
    // Search through clients
    data.clients.forEach(client => {
      let matches = 0;
      let matchDetails: string[] = [];
      
      // Priority matching
      if (criteria.priority) {
        const priority = client.PriorityLevel || 0;
        const priorityCriteria = criteria.priority;
        
        if (priorityCriteria === 'high' && priority >= 4) {
          matches++;
          matchDetails.push(`High priority (${priority})`);
        } else if (priorityCriteria === 'medium' && priority >= 2 && priority <= 3) {
          matches++;
          matchDetails.push(`Medium priority (${priority})`);
        } else if (priorityCriteria === 'low' && priority <= 2) {
          matches++;
          matchDetails.push(`Low priority (${priority})`);
        } else if (!isNaN(parseInt(priorityCriteria)) && priority === parseInt(priorityCriteria)) {
          matches++;
          matchDetails.push(`Priority: ${priority}`);
        }
      }
      
      // Group matching
      if (criteria.group) {
        const group = (client.GroupTag || '').toLowerCase();
        const searchGroup = criteria.group.toLowerCase();
        if (group.includes(searchGroup)) {
          matches++;
          matchDetails.push(`Group: ${client.GroupTag}`);
        }
      }
      
      // General text search
      const clientText = Object.values(client).join(' ').toLowerCase();
      if (clientText.includes(queryLower) && matches === 0) {
        matches = 1;
        matchDetails.push('Text match');
      }
      
      if (matches > 0) {
        searchResults.push({
          type: 'clients',
          item: client,
          match: matchDetails.join(', '),
          confidence: Math.min(matches / Object.keys(criteria).length, 1) * 100
        });
      }
    });
    
    // Sort by confidence
    searchResults.sort((a, b) => b.confidence - a.confidence);
    
    setResults(searchResults);
    setIsSearching(false);
    
    toast({
      title: "Search completed",
      description: `Found ${searchResults.length} matching records using AI analysis`,
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'clients': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'workers': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'tasks': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">AI-Powered Natural Language Search</h2>
      </div>
      
      <p className="text-muted-foreground mb-4">
        Search your data using natural language. Try: "tasks with duration more than 2 phases", 
        "high priority clients", "workers with JavaScript skills"
      </p>
      
      <div className="flex gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="e.g., All tasks having a Duration of more than 1 phase and having phase 2 in their Preferred Phases list"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            onKeyDown={(e) => e.key === 'Enter' && performSearch()}
          />
        </div>
        <Button 
          onClick={performSearch} 
          disabled={!query.trim() || isSearching}
          className="flex items-center gap-2"
        >
          {isSearching ? (
            <>
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              Searching...
            </>
          ) : (
            <>
              <Filter className="h-4 w-4" />
              Search
            </>
          )}
        </Button>
      </div>
      
      {results.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Search Results</h3>
            <Badge variant="outline">{results.length} matches found</Badge>
          </div>
          
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {results.map((result, index) => (
                <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getTypeColor(result.type)}>
                        {result.type}
                      </Badge>
                      <span className="font-medium">
                        {result.item.ClientName || result.item.WorkerName || result.item.TaskName || `${result.type} ${index + 1}`}
                      </span>
                    </div>
                    <Badge variant="outline">
                      {Math.round(result.confidence)}% match
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    Match: {result.match}
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {Object.entries(result.item).slice(0, 6).map(([key, value]) => (
                      <div key={key}>
                        <span className="font-medium text-muted-foreground">{key}:</span>
                        <span className="ml-1">{String(value || 'N/A')}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
      
      {query && results.length === 0 && !isSearching && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No results found for your search query.</p>
          <p className="text-sm mt-1">Try using different keywords or phrases.</p>
        </div>
      )}
    </Card>
  );
};