import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit2, Save, X } from "lucide-react";

interface DataViewerProps {
  data: {
    clients: any[];
    workers: any[];
    tasks: any[];
  };
  onDataChange: (data: any) => void;
}

interface EditCell {
  type: 'clients' | 'workers' | 'tasks';
  rowIndex: number;
  field: string;
  value: string;
}

export const DataViewer = ({ data, onDataChange }: DataViewerProps) => {
  const [editingCell, setEditingCell] = useState<EditCell | null>(null);

  const handleCellClick = (type: 'clients' | 'workers' | 'tasks', rowIndex: number, field: string, value: any) => {
    setEditingCell({
      type,
      rowIndex,
      field,
      value: String(value || '')
    });
  };

  const handleSave = () => {
    if (!editingCell) return;

    const newData = { ...data };
    const updatedArray = [...newData[editingCell.type]];
    updatedArray[editingCell.rowIndex] = {
      ...updatedArray[editingCell.rowIndex],
      [editingCell.field]: editingCell.value
    };
    newData[editingCell.type] = updatedArray;

    onDataChange(newData);
    setEditingCell(null);
  };

  const handleCancel = () => {
    setEditingCell(null);
  };

  const renderEditableCell = (type: 'clients' | 'workers' | 'tasks', rowIndex: number, field: string, value: any) => {
    const isEditing = editingCell?.type === type && 
                      editingCell?.rowIndex === rowIndex && 
                      editingCell?.field === field;

    if (isEditing) {
      return (
        <div className="flex items-center gap-2 min-w-[200px]">
          <Input
            value={editingCell.value}
            onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
            className="h-8"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
          />
          <Button size="sm" variant="outline" onClick={handleSave}>
            <Save className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[32px]"
        onClick={() => handleCellClick(type, rowIndex, field, value)}
      >
        <span className="flex-1">{String(value || '')}</span>
        <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50" />
      </div>
    );
  };

  const renderTable = (type: 'clients' | 'workers' | 'tasks', items: any[]) => {
    if (!items.length) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No {type} data uploaded yet
        </div>
      );
    }

    const headers = Object.keys(items[0]);

    return (
      <ScrollArea className="h-[600px]">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header} className="min-w-[150px]">
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, rowIndex) => (
              <TableRow key={rowIndex} className="group">
                {headers.map((header) => (
                  <TableCell key={header} className="p-2">
                    {renderEditableCell(type, rowIndex, header, item[header])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Data Overview</h2>
        <div className="flex gap-2">
          <Badge variant="outline">
            {data.clients.length} Clients
          </Badge>
          <Badge variant="outline">
            {data.workers.length} Workers
          </Badge>
          <Badge variant="outline">
            {data.tasks.length} Tasks
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="clients" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clients">
            Clients ({data.clients.length})
          </TabsTrigger>
          <TabsTrigger value="workers">
            Workers ({data.workers.length})
          </TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks ({data.tasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="mt-4">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Client Data</h3>
            {renderTable('clients', data.clients)}
          </Card>
        </TabsContent>

        <TabsContent value="workers" className="mt-4">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Worker Data</h3>
            {renderTable('workers', data.workers)}
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Task Data</h3>
            {renderTable('tasks', data.tasks)}
          </Card>
        </TabsContent>
      </Tabs>
    </Card>
  );
};