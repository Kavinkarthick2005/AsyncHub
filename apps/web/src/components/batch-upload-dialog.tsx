"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import Papa from "papaparse";

interface BatchUploadDialogProps {
  queueId: string;
  trigger?: React.ReactNode;
}

export function BatchUploadDialog({ queueId, trigger }: BatchUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const [parsedJobs, setParsedJobs] = useState<any[]>([]);
  const [invalidRows, setInvalidRows] = useState<any[]>([]);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setParsedJobs([]);
    setInvalidRows([]);
    setUploadResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) resetState();
    setOpen(newOpen);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const valid: any[] = [];
        const invalid: any[] = [];

        results.data.forEach((row: any, index: number) => {
          try {
            // Basic validation: requires a name or falls back to "Batch Job Row X"
            // Payload should ideally be valid JSON or an object. PapaParse gives object maps.
            const jobName = row.name || `Batch Job Row ${index + 1}`;
            
            // If they provided a raw json payload string, parse it.
            // Otherwise, just use the row object itself as payload.
            let payload = { ...row };
            delete payload.name;
            
            if (row.payload) {
              try {
                 payload = typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload;
              } catch (e) {
                 throw new Error("Payload column must be valid JSON");
              }
            }
            
            valid.push({
              name: jobName,
              payload: payload
            });
          } catch (e: any) {
            invalid.push({ row: index + 1, data: row, error: e.message });
          }
        });

        setParsedJobs(valid);
        setInvalidRows(invalid);
      },
      error: (error) => {
        setError("Failed to parse CSV: " + error.message);
      }
    });
  };

  const handleSubmit = async () => {
    if (parsedJobs.length === 0) return;
    
    setError("");
    setLoading(true);

    try {
      const response = await fetchApi(`/queues/${queueId}/jobs/batch`, {
        method: "POST",
        body: JSON.stringify(parsedJobs),
      });
      
      setUploadResult(response);
      queryClient.invalidateQueries({ queryKey: ["jobs", queueId] });
    } catch (err: any) {
      // For Pydantic validation errors (422), the API returns an array or detailed string.
      // E.g., err.message or err.detail
      let errorMsg = err.message || "Failed to enqueue batch jobs";
      if (err.status === 422) {
          errorMsg = "Validation failed for some rows. Please ensure your CSV columns map correctly to Job schemas.";
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline"><Upload className="mr-2 h-4 w-4" /> Batch Upload</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Batch Upload Jobs</DialogTitle>
          <DialogDescription>
            Upload a CSV file to enqueue multiple jobs at once. The CSV can include a <code>name</code> column, and all other columns will be merged into the job's <code>payload</code>.
          </DialogDescription>
        </DialogHeader>

        {!uploadResult && (
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 border-border">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-3 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-muted-foreground">CSV (MAX. 5000 rows)</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>
            </div>

            {(parsedJobs.length > 0 || invalidRows.length > 0) && (
              <div className="p-4 border rounded-md space-y-3 bg-muted/30">
                <h4 className="font-semibold flex items-center"><FileText className="h-4 w-4 mr-2" /> Validation Preview</h4>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-background rounded p-2 border">
                    <div className="text-2xl font-bold">{parsedJobs.length + invalidRows.length}</div>
                    <div className="text-xs text-muted-foreground">Total Rows</div>
                  </div>
                  <div className="bg-background rounded p-2 border border-emerald-500/20">
                    <div className="text-2xl font-bold text-emerald-500 flex items-center justify-center">
                      <CheckCircle className="h-4 w-4 mr-1" /> {parsedJobs.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Valid</div>
                  </div>
                  <div className={`bg-background rounded p-2 border ${invalidRows.length > 0 ? 'border-destructive/30' : ''}`}>
                    <div className={`text-2xl font-bold flex items-center justify-center ${invalidRows.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {invalidRows.length > 0 ? <XCircle className="h-4 w-4 mr-1" /> : ''} {invalidRows.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Invalid</div>
                  </div>
                </div>
                {invalidRows.length > 0 && (
                  <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                    <strong>Errors found:</strong>
                    <ul className="list-disc pl-4 mt-1">
                      {invalidRows.slice(0, 3).map((r, i) => (
                        <li key={i}>Row {r.row}: {r.error}</li>
                      ))}
                      {invalidRows.length > 3 && <li>...and {invalidRows.length - 3} more.</li>}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {error && <div className="text-sm text-destructive flex items-center"><AlertCircle className="h-4 w-4 mr-2" /> {error}</div>}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading || parsedJobs.length === 0}>
                {loading ? "Uploading..." : `Enqueue ${parsedJobs.length} Jobs`}
              </Button>
            </DialogFooter>
          </div>
        )}

        {uploadResult && (
          <div className="space-y-4 pt-4 text-center">
            <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-semibold">Upload Complete</h3>
            <div className="flex justify-center space-x-8 text-sm">
              <div>
                <div className="text-2xl font-bold">{uploadResult.accepted}</div>
                <div className="text-muted-foreground">Accepted</div>
              </div>
              {uploadResult.failed > 0 && (
                <div>
                  <div className="text-2xl font-bold text-destructive">{uploadResult.failed}</div>
                  <div className="text-muted-foreground">Failed</div>
                </div>
              )}
            </div>
            
            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="text-left bg-muted p-3 rounded text-sm text-destructive max-h-32 overflow-y-auto">
                <p className="font-semibold mb-1">API Errors:</p>
                <ul className="list-disc pl-4">
                  {uploadResult.errors.map((err: string, i: number) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            )}

            <DialogFooter className="mt-4 sm:justify-center">
              <Button onClick={() => setOpen(false)}>Close</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
