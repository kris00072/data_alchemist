import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Download, FileText, Settings, Target, CheckCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from "xlsx";

interface ExportPanelProps {
  data: {
    clients: any[];
    workers: any[];
    tasks: any[];
  };
  rules: any[];
  priorities: any;
  validationResults: any[];
}

export const ExportPanel = ({ data, rules, priorities, validationResults }: ExportPanelProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const { toast } = useToast();

  const exportToCSV = (dataArray: any[], filename: string) => {
    if (dataArray.length === 0) return null;
    
    const ws = XLSX.utils.json_to_sheet(dataArray);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, filename.replace('.csv', ''));
    
    const csvData = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvData], { type: 'text/csv' });
    return blob;
  };

  const exportToXLSX = () => {
    const wb = XLSX.utils.book_new();
    
    if (data.clients.length > 0) {
      const ws = XLSX.utils.json_to_sheet(data.clients);
      XLSX.utils.book_append_sheet(wb, ws, 'Clients');
    }
    
    if (data.workers.length > 0) {
      const ws = XLSX.utils.json_to_sheet(data.workers);
      XLSX.utils.book_append_sheet(wb, ws, 'Workers');
    }
    
    if (data.tasks.length > 0) {
      const ws = XLSX.utils.json_to_sheet(data.tasks);
      XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
    }
    
    XLSX.writeFile(wb, 'cleaned_data.xlsx');
  };

  const exportRulesConfig = () => {
    const config = {
      rules: rules.map(rule => ({
        id: rule.id,
        type: rule.type,
        name: rule.name,
        description: rule.description,
        parameters: rule.parameters,
        priority: rule.priority
      })),
      priorities: {
        weights: priorities,
        criteriaOrder: priorities.criteriaOrder || [],
        activePreset: priorities.activePreset || 'custom'
      },
      validation: {
        totalIssues: validationResults.length,
        errors: validationResults.filter(r => r.type === 'error').length,
        warnings: validationResults.filter(r => r.type === 'warning').length,
        lastValidated: new Date().toISOString()
      },
      metadata: {
        generatedAt: new Date().toISOString(),
        dataStats: {
          clients: data.clients.length,
          workers: data.workers.length,
          tasks: data.tasks.length
        },
        totalRules: rules.length,
        version: "1.0"
      }
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rules_config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAll = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Step 1: Export individual CSV files
      setExportProgress(25);
      
      ['clients', 'workers', 'tasks'].forEach((type, index) => {
        const dataArray = data[type as keyof typeof data];
        if (dataArray.length > 0) {
          const blob = exportToCSV(dataArray, `${type}.csv`);
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `cleaned_${type}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }
      });

      // Step 2: Export combined XLSX
      setExportProgress(50);
      await new Promise(resolve => setTimeout(resolve, 500));
      exportToXLSX();

      // Step 3: Export rules config
      setExportProgress(75);
      await new Promise(resolve => setTimeout(resolve, 500));
      exportRulesConfig();

      // Step 4: Complete
      setExportProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      toast({
        title: "Export completed",
        description: "All files have been downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "There was an error during export",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const errorCount = validationResults.filter(r => r.type === 'error').length;
  const warningCount = validationResults.filter(r => r.type === 'warning').length;
  const hasErrors = errorCount > 0;

  const getDataQualityScore = () => {
    const totalRecords = data.clients.length + data.workers.length + data.tasks.length;
    if (totalRecords === 0) return 0;
    
    const issueWeight = errorCount * 2 + warningCount * 1;
    const maxPossibleIssues = totalRecords * 0.5; // Assume max 0.5 issues per record
    const score = Math.max(0, Math.min(100, 100 - (issueWeight / maxPossibleIssues) * 100));
    
    return Math.round(score);
  };

  const qualityScore = getDataQualityScore();

  return (
    <div className="space-y-6">
      {/* Export Readiness Check */}
      <Card className="p-6">
        <h2 className="text-2xl font-semibold mb-4">Export Readiness</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-medium">Data Quality</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Progress value={qualityScore} className="h-2" />
              </div>
              <span className="text-sm font-medium">{qualityScore}%</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {errorCount} errors, {warningCount} warnings
            </p>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-5 w-5 text-primary" />
              <span className="font-medium">Rules Config</span>
            </div>
            <div className="flex items-center gap-2">
              {rules.length > 0 ? (
                <>
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">{rules.length} rules configured</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-sm">No rules configured</span>
                </>
              )}
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="font-medium">Priorities</span>
            </div>
            <div className="flex items-center gap-2">
              {Object.keys(priorities).length > 0 ? (
                <>
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm">Priorities set</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <span className="text-sm">Default priorities</span>
                </>
              )}
            </div>
          </Card>
        </div>
        
        {hasErrors && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg mb-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <span className="font-medium text-destructive">Data has validation errors</span>
            </div>
            <p className="text-sm text-destructive">
              Please fix the {errorCount} error(s) before exporting for production use.
              You can still export for review purposes.
            </p>
          </div>
        )}
      </Card>

      {/* Data Summary */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Export Summary</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{data.clients.length}</div>
            <div className="text-sm text-muted-foreground">Clients</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{data.workers.length}</div>
            <div className="text-sm text-muted-foreground">Workers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{data.tasks.length}</div>
            <div className="text-sm text-muted-foreground">Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{rules.length}</div>
            <div className="text-sm text-muted-foreground">Rules</div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-3">
          <h3 className="font-medium">Export will include:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">CSV</Badge>
              <span className="text-sm">Individual cleaned data files</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">XLSX</Badge>
              <span className="text-sm">Combined Excel workbook</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">JSON</Badge>
              <span className="text-sm">Rules and priority configuration</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">META</Badge>
              <span className="text-sm">Validation report and metadata</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Export Actions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Export Options</h2>
        
        {isExporting && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Download className="h-4 w-4 animate-bounce" />
              <span className="font-medium">Exporting files...</span>
            </div>
            <Progress value={exportProgress} className="w-full" />
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={exportAll}
            disabled={isExporting}
            size="lg"
            className="flex items-center gap-2 h-auto py-4"
          >
            <Download className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Export All Files</div>
              <div className="text-xs opacity-90">CSV + XLSX + Rules Config</div>
            </div>
          </Button>
          
          <Button 
            onClick={exportToXLSX}
            disabled={isExporting}
            variant="outline"
            size="lg"
            className="flex items-center gap-2 h-auto py-4"
          >
            <FileText className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Export Data Only</div>
              <div className="text-xs opacity-90">Combined XLSX file</div>
            </div>
          </Button>
          
          <Button 
            onClick={exportRulesConfig}
            disabled={isExporting}
            variant="outline"
            size="lg"
            className="flex items-center gap-2 h-auto py-4"
          >
            <Settings className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Export Rules Only</div>
              <div className="text-xs opacity-90">JSON configuration</div>
            </div>
          </Button>
          
          <Button 
            disabled={isExporting}
            variant="outline"
            size="lg"
            className="flex items-center gap-2 h-auto py-4"
          >
            <Target className="h-5 w-5" />
            <div className="text-left">
              <div className="font-medium">Generate Report</div>
              <div className="text-xs opacity-90">PDF validation report</div>
            </div>
          </Button>
        </div>
        
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Next Steps:</strong> Use the exported files with your resource allocation system. 
            The rules.json file contains all business logic and priorities for the downstream allocator.
          </p>
        </div>
      </Card>
    </div>
  );
};