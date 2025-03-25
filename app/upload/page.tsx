"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  FileText,
  Upload,
  AlertCircle,
  CheckCircle2,
  File,
  ArrowRight,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { processPDFUpload } from "@/app/actions/process-pdf-upload";
import { saveExtractedTransactions } from "@/app/actions/save-extracted-transactions";
import type { ExtractedTransaction } from "@/lib/pdf-parser";
import { cn } from "@/lib/utils";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "processing" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [extractedTransactions, setExtractedTransactions] = useState<
    ExtractedTransaction[]
  >([]);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);
  const [activeStep, setActiveStep] = useState<"upload" | "review" | "history">(
    "upload"
  );
  const [isComponentMounted, setIsComponentMounted] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    []
  );

  // Set component mounted flag
  useEffect(() => {
    setIsComponentMounted(true);
    return () => setIsComponentMounted(false);
  }, []);

  // Load accounts, categories and recent uploads
  useEffect(() => {
    if (!isComponentMounted) return;

    const fetchData = async () => {
      try {
        const accountsResponse = await fetch("/api/accounts");
        if (accountsResponse.ok) {
          const accountsList = await accountsResponse.json();
          setAccounts(accountsList);

          if (accountsList.length > 0 && !selectedAccountId) {
            setSelectedAccountId(accountsList[0].id);
          }
        }

        const categoriesResponse = await fetch("/api/categories");
        if (categoriesResponse.ok) {
          const categoriesList = await categoriesResponse.json();
          setCategories(categoriesList);
        }

        const uploadsResponse = await fetch("/api/uploads");
        if (uploadsResponse.ok) {
          const uploads = await uploadsResponse.json();
          setRecentUploads(uploads);
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };

    fetchData();
  }, [isComponentMounted, selectedAccountId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check if file is PDF
      const fileType = selectedFile.name.split(".").pop()?.toLowerCase();
      if (fileType !== "pdf") {
        setErrorMessage("Only PDF files are supported");
        setUploadStatus("error");
        return;
      }

      setFile(selectedFile);
      setUploadStatus("idle");
      setUploadProgress(0);
      setExtractedTransactions([]);
      setErrorMessage("");
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedAccountId) {
      setErrorMessage("Please select a PDF file and an account");
      setUploadStatus("error");
      return;
    }

    setUploadStatus("uploading");
    setErrorMessage("");

    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      if (!isComponentMounted) {
        clearInterval(interval);
        return;
      }

      progress += 10;
      setUploadProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        processPDF();
      }
    }, 200);
  };

  const processPDF = async () => {
    if (!file || !selectedAccountId || !isComponentMounted) return;

    setUploadStatus("processing");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("accountId", selectedAccountId);

      const result = await processPDFUpload(formData);

      if (!isComponentMounted) return;

      if (!result.success) {
        setErrorMessage(result.error || "Error processing PDF file");
        setUploadStatus("error");
        return;
      }

      if (
        result.processedTransactions &&
        result.processedTransactions.length > 0
      ) {
        setExtractedTransactions(result.processedTransactions);
        setUploadStatus("success");
        setActiveStep("review");
      } else {
        setErrorMessage("No transactions found in the PDF file");
        setUploadStatus("error");
      }

      // Refresh recent uploads
      const uploadsResponse = await fetch("/api/uploads");
      if (uploadsResponse.ok) {
        const uploads = await uploadsResponse.json();
        setRecentUploads(uploads);
      }
    } catch (error) {
      console.error("Error processing PDF:", error);
      if (isComponentMounted) {
        setErrorMessage(
          "An error occurred while processing the PDF file. Please try again."
        );
        setUploadStatus("error");
      }
    }
  };

  const handleSaveTransactions = async () => {
    if (!selectedAccountId || extractedTransactions.length === 0) return;

    try {
      const result = await saveExtractedTransactions(
        extractedTransactions,
        selectedAccountId
      );

      if (!result.success) {
        setErrorMessage(result.error || "Error saving transactions");
        return;
      }

      // Reset state
      setFile(null);
      setUploadProgress(0);
      setExtractedTransactions([]);
      setUploadStatus("idle");
      setActiveStep("upload");

      // Show success message
      alert("Transactions saved successfully!");
    } catch (error) {
      console.error("Error saving transactions:", error);
      setErrorMessage(
        "An error occurred while saving transactions. Please try again."
      );
    }
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase();

    if (extension === "pdf") {
      return <FileText className="h-4 w-4" />;
    }

    return <File className="h-4 w-4" />;
  };

  const handleTransactionEdit = (
    index: number,
    field: keyof ExtractedTransaction,
    value: string | number
  ) => {
    setExtractedTransactions((prev) => {
      const newTransactions = [...prev];
      newTransactions[index] = {
        ...newTransactions[index],
        [field]: value,
      };
      return newTransactions;
    });
  };

  const handleEditStart = (index: number) => {
    setEditingIndex(index);
  };

  const handleEditEnd = () => {
    setEditingIndex(null);
  };

  // Render upload step
  const renderUploadStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Upload Credit Card Statement</CardTitle>
        <CardDescription>
          Upload a PDF file containing your credit card statement.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full gap-2">
          <Label htmlFor="account">Account</Label>
          <Select
            value={selectedAccountId}
            onValueChange={setSelectedAccountId}
          >
            <SelectTrigger id="account">
              <SelectValue placeholder="Select an account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid w-full gap-2">
          <Label htmlFor="file">PDF File</Label>
          <div className="flex items-center gap-2">
            <Input
              id="file"
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
            />
            <Button
              onClick={handleUpload}
              disabled={
                !file ||
                !selectedAccountId ||
                uploadStatus === "uploading" ||
                uploadStatus === "processing"
              }
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
          </div>
        </div>

        {uploadStatus === "uploading" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} />
          </div>
        )}

        {uploadStatus === "processing" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processing PDF...</span>
              <span>This may take a minute</span>
            </div>
            <Progress value={100} className="animate-pulse" />
          </div>
        )}

        {uploadStatus === "success" && (
          <Alert className="bg-green-500/10 border-green-500/50">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>
              Your PDF has been processed successfully.
              {extractedTransactions.length > 0
                ? " Please proceed to the Review & Import step to review the transactions."
                : " No transactions were found in the PDF."}
            </AlertDescription>
          </Alert>
        )}

        {uploadStatus === "error" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {errorMessage ||
                "There was an error processing your PDF file. Please try again."}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <div className="text-sm text-muted-foreground">
          <p className="font-medium">Important Notes:</p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Only PDF files are supported
            </li>
            <li>
              Make sure your PDF contains readable text (not scanned images)
            </li>
            <li>
              The system will attempt to categorize your transactions
              automatically
            </li>
            <li>
              You can review and modify the extracted transactions before saving
            </li>
          </ul>
        </div>
      </CardFooter>
    </Card>
  );

  // Render review step
  const renderReviewStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Review Extracted Transactions</CardTitle>
        <CardDescription>
          Review and edit the transactions extracted from your PDF before saving
          them to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {extractedTransactions.length > 0 ? (
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {extractedTransactions.map((transaction, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {editingIndex === index ? (
                          <Input
                            type="date"
                            value={transaction.date}
                            onChange={(e) =>
                              handleTransactionEdit(
                                index,
                                "date",
                                e.target.value
                              )
                            }
                            onBlur={handleEditEnd}
                            className="h-8"
                          />
                        ) : (
                          <span
                            onClick={() => handleEditStart(index)}
                            className="cursor-pointer"
                          >
                            {transaction.date}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingIndex === index ? (
                          <Input
                            value={transaction.description}
                            onChange={(e) =>
                              handleTransactionEdit(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                            onBlur={handleEditEnd}
                            className="h-8"
                          />
                        ) : (
                          <span
                            onClick={() => handleEditStart(index)}
                            className="cursor-pointer"
                          >
                            {transaction.description}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingIndex === index ? (
                          <Select
                            value={transaction.category}
                            onValueChange={(value) =>
                              handleTransactionEdit(index, "category", value)
                            }
                            onOpenChange={(open) => !open && handleEditEnd()}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.name}
                                >
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge
                            variant="outline"
                            className="cursor-pointer"
                            onClick={() => handleEditStart(index)}
                          >
                            {transaction.category}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingIndex === index ? (
                          <Input
                            type="number"
                            value={transaction.amount}
                            onChange={(e) =>
                              handleTransactionEdit(
                                index,
                                "amount",
                                parseFloat(e.target.value)
                              )
                            }
                            onBlur={handleEditEnd}
                            className="h-8 text-right"
                          />
                        ) : (
                          <span
                            onClick={() => handleEditStart(index)}
                            className={cn(
                              "cursor-pointer font-medium",
                              transaction.amount >= 0
                                ? "text-green-500"
                                : "text-red-500"
                            )}
                          >
                            {transaction.amount >= 0 ? "+" : ""}
                            {Math.abs(transaction.amount).toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setExtractedTransactions((prev) =>
                              prev.filter((_, i) => i !== index)
                            );
                          }}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No transactions found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              No transactions could be extracted from the PDF file. Please try a
              different file.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setActiveStep("upload")}>
          Back to Upload
        </Button>
        <Button
          onClick={handleSaveTransactions}
          disabled={extractedTransactions.length === 0}
        >
          Save {extractedTransactions.length} Transactions
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );

  // Render history step
  const renderHistoryStep = () => (
    <Card>
      <CardHeader>
        <CardTitle>Upload History</CardTitle>
        <CardDescription>
          View your previous file uploads and their status.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentUploads.length > 0 ? (
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Transactions</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentUploads.map((upload) => (
                    <TableRow key={upload.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFileIcon(upload.filename)}
                          <span>{upload.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell>{upload.account?.name || "Unknown"}</TableCell>
                      <TableCell>
                        {new Date(upload.uploadDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{upload.transactionCount}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            upload.status === "completed"
                              ? "default"
                              : upload.status === "processing"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {upload.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No upload history</h3>
            <p className="text-sm text-muted-foreground mt-2">
              You haven't uploaded any files yet. Start by uploading a PDF file.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={() => setActiveStep("upload")}>
          Back to Upload
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">
          Upload Credit Card Statement
        </h2>
        <div className="flex gap-2">
          <Button
            variant={activeStep === "upload" ? "default" : "outline"}
            onClick={() => setActiveStep("upload")}
          >
            Upload
          </Button>
          <Button
            variant={activeStep === "review" ? "default" : "outline"}
            onClick={() => setActiveStep("review")}
            disabled={extractedTransactions.length === 0}
          >
            Review
          </Button>
          <Button
            variant={activeStep === "history" ? "default" : "outline"}
            onClick={() => setActiveStep("history")}
          >
            History
          </Button>
        </div>
      </div>

      {activeStep === "upload" && renderUploadStep()}
      {activeStep === "review" && renderReviewStep()}
      {activeStep === "history" && renderHistoryStep()}
    </div>
  );
}
