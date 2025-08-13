'use client'

import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { DataViewer } from '@/components/DataViewer';
import { ValidationPanel } from '@/components/ValidationPanel';
import { RuleBuilder } from '@/components/RuleBuilder';
import { PriorityConfig } from '@/components/PriorityConfig';
import { ExportPanel } from '@/components/ExportPanel';
import { NaturalLanguageSearch } from '@/components/NaturalLanguageSearch';
import { AIInsightsPanel } from '@/components/AIInsightsPanel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Upload, Search, Settings, Download } from 'lucide-react';

interface DataState {
	clients: any[];
	workers: any[];
	tasks: any[];
}

export default function Page() {
	const [currentStep, setCurrentStep] = useState(0);
	const [data, setData] = useState<DataState>({
		clients: [],
		workers: [],
		tasks: []
	});
	const [validationResults, setValidationResults] = useState<any[]>([]);
	const [rules, setRules] = useState<any[]>([]);
	const [priorities, setPriorities] = useState({});

	const steps = [
		{ id: 0, title: 'Data Ingestion', icon: Upload, description: 'Upload and parse CSV/XLSX files' },
		{ id: 1, title: 'Data Validation', icon: AlertCircle, description: 'Review and fix data issues' },
		{ id: 2, title: 'Rule Configuration', icon: Settings, description: 'Define business rules' },
		{ id: 3, title: 'Priority Setup', icon: Search, description: 'Set allocation priorities' },
		{ id: 4, title: 'Preview & Export', icon: Download, description: 'Optimize and download final results' }
	];

	const handleRuleRecommendation = (rule: any) => {
		const newRule = {
			id: Date.now().toString(),
			type: rule.type,
			name: `AI Suggested: ${rule.reason}`,
			description: rule.reason,
			parameters: rule,
			timestamp: new Date().toISOString(),
			source: 'ai_recommendation'
		};
		setRules(prev => [...prev, newRule]);
	};

	const handleOptimizationSuggestion = (optimization: any) => {
		console.log('Applying optimization:', optimization);
	};

	const isStepComplete = (stepId: number): boolean => {
		switch (stepId) {
			case 0:
				return data.clients.length > 0 || data.workers.length > 0 || data.tasks.length > 0;
			case 1:
				return validationResults.length === 0 || validationResults.every(r => !r.hasErrors);
			case 2:
				return true;
			case 3:
				return true;
			default:
				return false;
		}
	};

	return (
		<div className="min-h-screen bg-background">
			<header className="border-b bg-card shadow-sm">
				<div className="container mx-auto px-4 py-6">
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
								Data Alchemist
							</h1>
							<p className="text-muted-foreground mt-1">AI-Powered Resource Allocation Configurator</p>
						</div>
						<Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
							All Milestones Complete
						</Badge>
					</div>
				</div>
			</header>

			<div className="border-b bg-muted/30">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						{steps.map((step, index) => {
							const Icon = step.icon;
							const isActive = currentStep === step.id;
							const isComplete = isStepComplete(step.id);

							return (
								<div key={step.id} className="flex items-center">
									<Button
										variant={isActive ? 'default' : isComplete ? 'outline' : 'ghost'}
										className={`flex items-center gap-2 ${isActive ? 'shadow-glow' : ''}`}
										onClick={() => setCurrentStep(step.id)}
									>
										{isComplete && !isActive ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
										<span className="hidden sm:inline">{step.title}</span>
									</Button>
									{index < steps.length - 1 && <Separator className="w-8 mx-2" orientation="horizontal" />}
								</div>
							);
						})}
					</div>
				</div>
			</div>

			<main className="container mx-auto px-4 py-8">
				{currentStep === 0 && (
					<div className="space-y-8">
						<Card className="p-6">
							<h2 className="text-2xl font-semibold mb-4">Upload Your Data Files</h2>
							<p className="text-muted-foreground mb-6">
								Upload CSV or XLSX files for clients, workers, and tasks. Our AI will intelligently parse and map your data.
							</p>
							<FileUpload onDataLoaded={setData} />
						</Card>

						{(data.clients.length > 0 || data.workers.length > 0 || data.tasks.length > 0) && (
							<>
								<NaturalLanguageSearch data={data} />
								<DataViewer data={data} onDataChange={setData} />
								<AIInsightsPanel
									data={data}
									onRuleRecommendation={handleRuleRecommendation}
									onOptimizationSuggestion={handleOptimizationSuggestion}
								/>
							</>
						)}
					</div>
				)}

				{currentStep === 1 && (
					<ValidationPanel data={data} onValidationResults={setValidationResults} onDataChange={setData} />
				)}

				{currentStep === 2 && <RuleBuilder data={data} rules={rules} onRulesChange={setRules} />}

				{currentStep === 3 && <PriorityConfig priorities={priorities} onPrioritiesChange={setPriorities} />}

				{currentStep === 4 && (
					<ExportPanel
						data={data}
						rules={rules}
						priorities={priorities}
						validationResults={validationResults}
					/>
				)}
			</main>
		</div>
	);
}


