import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from "lucide-react";
import * as XLSX from "xlsx";
import Papa from "papaparse";

interface FileUploadProps {
  onDataLoaded: (data: { clients: any[], workers: any[], tasks: any[] }) => void;
}

interface ParsedFile {
  name: string;
  type: 'clients' | 'workers' | 'tasks' | 'unknown';
  data: any[];
  status: 'pending' | 'success' | 'error';
  error?: string;
}

export const FileUpload = ({ onDataLoaded }: FileUploadProps) => {
  const [files, setFiles] = useState<ParsedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // AI-powered file type detection
  const detectFileType = (fileName: string, headers: string[]): 'clients' | 'workers' | 'tasks' | 'unknown' => {
    const name = fileName.toLowerCase();
    const headerSet = new Set(headers.map(h => h.toLowerCase()));
    
    // Check filename first
    if (name.includes('client')) return 'clients';
    if (name.includes('worker') || name.includes('employee')) return 'workers';
    if (name.includes('task') || name.includes('job')) return 'tasks';
    
    // AI-like header analysis
    const clientHeaders = ['clientid', 'client_id', 'clientname', 'client_name', 'prioritylevel', 'requestedtaskids'];
    const workerHeaders = ['workerid', 'worker_id', 'workername', 'worker_name', 'skills', 'availableslots'];
    const taskHeaders = ['taskid', 'task_id', 'taskname', 'task_name', 'duration', 'requiredskills'];
    
    const clientScore = clientHeaders.filter(h => headerSet.has(h)).length;
    const workerScore = workerHeaders.filter(h => headerSet.has(h)).length;
    const taskScore = taskHeaders.filter(h => headerSet.has(h)).length;
    
    const maxScore = Math.max(clientScore, workerScore, taskScore);
    if (maxScore === 0) return 'unknown';
    
    if (clientScore === maxScore) return 'clients';
    if (workerScore === maxScore) return 'workers';
    if (taskScore === maxScore) return 'tasks';
    
    return 'unknown';
  };

  // Smart column mapping
  const mapColumns = (data: any[], type: string) => {
    if (!data.length) return data;
    
    const columnMappings: Record<string, Record<string, string[]>> = {
      clients: {
        'ClientID': ['clientid', 'client_id', 'id'],
        'ClientName': ['clientname', 'client_name', 'name'],
        'PriorityLevel': ['prioritylevel', 'priority_level', 'priority'],
        'RequestedTaskIDs': ['requestedtaskids', 'requested_task_ids', 'tasks'],
        'GroupTag': ['grouptag', 'group_tag', 'group'],
        'AttributesJSON': ['attributesjson', 'attributes_json', 'attributes', 'metadata']
      },
      workers: {
        'WorkerID': ['workerid', 'worker_id', 'id'],
        'WorkerName': ['workername', 'worker_name', 'name'],
        'Skills': ['skills', 'skill_set', 'capabilities'],
        'AvailableSlots': ['availableslots', 'available_slots', 'slots'],
        'MaxLoadPerPhase': ['maxloadperphase', 'max_load_per_phase', 'max_load'],
        'WorkerGroup': ['workergroup', 'worker_group', 'group'],
        'QualificationLevel': ['qualificationlevel', 'qualification_level', 'level']
      },
      tasks: {
        'TaskID': ['taskid', 'task_id', 'id'],
        'TaskName': ['taskname', 'task_name', 'name'],
        'Category': ['category', 'type'],
        'Duration': ['duration', 'time_required'],
        'RequiredSkills': ['requiredskills', 'required_skills', 'skills'],
        'PreferredPhases': ['preferredphases', 'preferred_phases', 'phases'],
        'MaxConcurrent': ['maxconcurrent', 'max_concurrent', 'concurrent']
      }
    };

    const mappings = columnMappings[type];
    if (!mappings) return data;

    const headers = Object.keys(data[0]).map(h => h.toLowerCase());
    const newMapping: Record<string, string> = {};

    Object.entries(mappings).forEach(([standardKey, variants]) => {
      const found = variants.find(variant => headers.includes(variant));
      if (found) {
        const originalKey = Object.keys(data[0]).find(k => k.toLowerCase() === found);
        if (originalKey) newMapping[originalKey] = standardKey;
      }
    });

    return data.map(row => {
      const newRow: any = {};
      Object.entries(row).forEach(([key, value]) => {
        const mappedKey = newMapping[key] || key;
        newRow[mappedKey] = value;
      });
      return newRow;
    });
  };

  const parseFile = async (file: File): Promise<ParsedFile> => {
    return new Promise((resolve) => {
      const fileName = file.name;
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
      
      if (isExcel) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            
            if (jsonData.length === 0) {
              resolve({
                name: fileName,
                type: 'unknown',
                data: [],
                status: 'error',
                error: 'Empty file'
              });
              return;
            }
            
            const headers = Object.keys(jsonData[0] as any);
            const fileType = detectFileType(fileName, headers);
            const mappedData = mapColumns(jsonData, fileType);
            
            resolve({
              name: fileName,
              type: fileType,
              data: mappedData,
              status: 'success'
            });
          } catch (error) {
            resolve({
              name: fileName,
              type: 'unknown',
              data: [],
              status: 'error',
              error: error instanceof Error ? error.message : 'Failed to parse Excel file'
            });
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              resolve({
                name: fileName,
                type: 'unknown',
                data: [],
                status: 'error',
                error: results.errors[0].message
              });
              return;
            }
            
            const headers = results.meta.fields || [];
            const fileType = detectFileType(fileName, headers);
            const mappedData = mapColumns(results.data, fileType);
            
            resolve({
              name: fileName,
              type: fileType,
              data: mappedData,
              status: 'success'
            });
          },
          error: (error) => {
            resolve({
              name: fileName,
              type: 'unknown',
              data: [],
              status: 'error',
              error: error.message
            });
          }
        });
      }
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    setProgress(0);
    
    const totalFiles = acceptedFiles.length;
    const newFiles: ParsedFile[] = [];
    
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      setProgress((i / totalFiles) * 100);
      
      const parsedFile = await parseFile(file);
      newFiles.push(parsedFile);
    }
    
    setProgress(100);
    setFiles(prev => [...prev, ...newFiles]);
    
    // Auto-organize data by type
    const organizedData = {
      clients: [] as any[],
      workers: [] as any[],
      tasks: [] as any[]
    };
    
    [...files, ...newFiles].forEach(file => {
      if (file.status === 'success' && file.type !== 'unknown') {
        organizedData[file.type].push(...file.data);
      }
    });
    
    onDataLoaded(organizedData);
    
    setUploading(false);
    
    const successCount = newFiles.filter(f => f.status === 'success').length;
    const errorCount = newFiles.filter(f => f.status === 'error').length;
    
    if (successCount > 0) {
      toast({
        title: "Files processed successfully",
        description: `${successCount} file(s) parsed and mapped using AI`,
      });
    }
    
    if (errorCount > 0) {
      toast({
        title: "Some files failed to process",
        description: `${errorCount} file(s) had errors`,
        variant: "destructive"
      });
    }
  }, [files, onDataLoaded, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    
    // Reorganize data
    const organizedData = {
      clients: [] as any[],
      workers: [] as any[],
      tasks: [] as any[]
    };
    
    newFiles.forEach(file => {
      if (file.status === 'success' && file.type !== 'unknown') {
        organizedData[file.type].push(...file.data);
      }
    });
    
    onDataLoaded(organizedData);
  };

  return (
    <div className="space-y-6">
      <Card
        {...getRootProps()}
        className={`p-8 border-2 border-dashed transition-all duration-200 cursor-pointer hover:border-primary/50 hover:bg-primary/5 ${
          isDragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
          <h3 className="text-lg font-semibold mb-2">
            {isDragActive ? 'Drop files here' : 'Upload CSV or XLSX files'}
          </h3>
          <p className="text-muted-foreground mb-4">
            Drag and drop your files here, or click to select files
          </p>
          <p className="text-sm text-muted-foreground">
            Supports: clients.csv, workers.csv, tasks.csv (or .xlsx)
          </p>
        </div>
      </Card>

      {uploading && (
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-2">
            <FileSpreadsheet className="h-5 w-5 text-primary animate-pulse" />
            <span className="font-medium">Processing files with AI...</span>
          </div>
          <Progress value={progress} className="w-full" />
        </Card>
      )}

      {files.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Processed Files</h3>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {file.status === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium">{file.name}</p>
                    {file.status === 'success' ? (
                      <p className="text-sm text-muted-foreground">
                        {file.data.length} records • Detected as: {file.type}
                      </p>
                    ) : (
                      <p className="text-sm text-destructive">{file.error}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={file.type === 'unknown' ? 'destructive' : 'secondary'}>
                    {file.type}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};