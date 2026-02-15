'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface UploadResult {
  success: boolean;
  message?: string;
  stats?: {
    totalRows: number;
    validRows: number;
    errorRows: number;
    inserted: number;
    skipped: number;
  };
  error?: string;
}

export function CsvUpload() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      setFile(droppedFile);
      setResult(null);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/csv/upload', {
        method: 'POST',
        body: formData,
      });

      const data = (await response.json()) as UploadResult;

      if (response.ok && data.success) {
        setResult(data);
        setFile(null);
      } else {
        setResult({
          success: false,
          error: data.error || 'Upload failed',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClearFile = () => {
    setFile(null);
    setResult(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSVファイルアップロード</CardTitle>
        <CardDescription>
          ゲーム台詞のCSVファイルをアップロードして学習データを作成します
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            dragActive
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50',
            file ? 'border-primary/50 bg-primary/5' : ''
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!file ? (
            <>
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                CSVファイルをドラッグ＆ドロップするか、
                <br />
                クリックして選択してください
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <label htmlFor="file-input">
                <Button variant="outline" asChild>
                  <span>ファイルを選択</span>
                </Button>
              </label>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearFile}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {file && (
          <div className="mt-4 flex justify-end">
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  アップロード中...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  アップロード
                </>
              )}
            </Button>
          </div>
        )}

        {result && (
          <div
            className={cn(
              'mt-4 p-4 rounded-lg border',
              result.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            )}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm">
                  {result.success
                    ? result.message || 'アップロード成功'
                    : result.error || 'アップロード失敗'}
                </p>
                {result.success && result.stats && (
                  <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div>
                      <p className="text-xs text-muted-foreground">総行数</p>
                      <p className="text-lg font-semibold text-green-700">
                        {result.stats.totalRows}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">有効行</p>
                      <p className="text-lg font-semibold text-blue-700">
                        {result.stats.validRows}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">エラー行</p>
                      <p className="text-lg font-semibold text-red-700">
                        {result.stats.errorRows}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">挿入</p>
                      <p className="text-lg font-semibold text-purple-700">
                        {result.stats.inserted}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setResult(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
