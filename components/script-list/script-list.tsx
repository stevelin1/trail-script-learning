'use client';

import { useState, useEffect } from 'react';
import { Search, BookOpen, Loader2, FileText, FolderOpen, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Script {
  id: string;
  gameId: number;
  scene: string;
  row: number;
  characterName: string;
  japaneseText: string;
  englishText: string;
  fileName: string;
  hasLearningMaterial: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse {
  success: boolean;
  scripts: Script[];
  pagination: Pagination;
}

interface FileGroup {
  fileName: string;
  totalScripts: number;
  learnedScripts: number;
}

interface FilesResponse {
  success: boolean;
  files: FileGroup[];
}

type LearnStatus = 'all' | 'learned' | 'unlearned';

const learnStatusOptions = [
  { value: 'all' as const, label: 'すべて', icon: null },
  { value: 'learned' as const, label: '学習済み', icon: CheckCircle2 },
  { value: 'unlearned' as const, label: '未学習', icon: Circle },
];

export function ScriptList() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [files, setFiles] = useState<FileGroup[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [learnStatus, setLearnStatus] = useState<LearnStatus>('all');
  const [loading, setLoading] = useState(true);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchFiles = async () => {
    setLoadingFiles(true);
    try {
      const timestamp = Date.now();
      console.log('[ScriptList] fetchFiles called at:', timestamp);
      const response = await fetch('/api/files?t=' + timestamp);
      const data: FilesResponse = await response.json();

      console.log('[ScriptList] fetchFiles response:', {
        timestamp: (data as any)._timestamp,
        processingTime: (data as any)._processingTime,
        files: data.files.map(f => ({
          fileName: f.fileName,
          totalScripts: f.totalScripts,
          learnedScripts: f.learnedScripts,
        })),
      });

      if (data.success) {
        setFiles(data.files);
        // Auto-select first file if none selected
        if (data.files.length > 0 && !selectedFile) {
          setSelectedFile(data.files[0].fileName);
        }
      }
    } catch (error) {
      console.error('[ScriptList] Error fetching files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const fetchScripts = async (page: number = 1) => {
    if (!selectedFile) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        fileName: selectedFile,
      });

      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      // Filter by learn status
      if (learnStatus === 'learned') {
        params.append('hasLearningMaterial', 'true');
      } else if (learnStatus === 'unlearned') {
        params.append('hasLearningMaterial', 'false');
      }

      const response = await fetch(`/api/script?${params.toString()}`);
      const data: ApiResponse = await response.json();

      if (data.success) {
        setScripts(data.scripts);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching scripts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const shouldRefresh = sessionStorage.getItem('learning-just-completed') === 'true';
    console.log('[ScriptList] Initial mount, shouldRefresh:', shouldRefresh);

    fetchFiles().then(() => {
      if (shouldRefresh) {
        sessionStorage.removeItem('learning-just-completed');
        console.log('[ScriptList] Cleared learning-just-completed flag');
      }
    });
  }, []);

  // Refresh files list when page becomes visible (e.g., user returns from learning page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && files.length > 0) {
        fetchFiles();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [files.length]);

  useEffect(() => {
    if (selectedFile) {
      fetchScripts(1);
    }
  }, [selectedFile, learnStatus, debouncedSearch]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchScripts(newPage);
    }
  };

  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
    setLearnStatus('all');
    setSearch('');
    setDebouncedSearch('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const selectedFileData = files.find(f => f.fileName === selectedFile);

  return (
    <Card>
      <CardContent className="p-6">
        {/* File Selector */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            ファイルを選択
          </h3>
          {loadingFiles ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">ファイルがまだアップロードされていません</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {files.map((file) => (
                <button
                  key={file.fileName}
                  onClick={() => handleFileSelect(file.fileName)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedFile === file.fileName
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium truncate flex-1">
                      {file.fileName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {file.totalScripts}件
                    </Badge>
                    {file.learnedScripts > 0 && (
                      <Badge variant="success" className="text-xs">
                        {file.learnedScripts}学習済
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Scripts List */}
        {selectedFile && selectedFileData && (
          <>
            {/* File Info Bar */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{selectedFile}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {selectedFileData.totalScripts}件
                </Badge>
                {selectedFileData.learnedScripts > 0 && (
                  <Badge variant="success" className="text-xs">
                    {selectedFileData.learnedScripts}学習済
                  </Badge>
                )}
              </div>
            </div>

            {/* Learn Status Filter */}
            <div className="mb-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-600">学習状況:</span>
              <div className="flex gap-2">
                {learnStatusOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.value}
                      variant={learnStatus === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLearnStatus(option.value)}
                    >
                      {Icon && <Icon className="h-4 w-4 mr-2" />}
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="台詞、キャラクター名で検索..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Scripts */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : scripts.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {search || learnStatus !== 'all'
                    ? '検索結果が見つかりませんでした'
                    : '台詞がまだ登録されていません'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-6">
                  {scripts.map((script) => (
                    <a
                      key={script.id}
                      href={`/learning/${script.id}`}
                      className="block group"
                    >
                      <div className="p-4 rounded-lg border border-gray-100 hover:border-primary/50 hover:bg-primary/5 transition-all">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Scene {script.scene}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              Game {script.gameId}
                            </Badge>
                            {script.hasLearningMaterial && (
                              <Badge variant="success" className="text-xs">
                                学習済
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            #{script.row}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-1 font-japanese">
                          {script.characterName}
                        </p>
                        <p className="text-sm text-gray-600 mb-2 font-japanese line-clamp-2">
                          {truncateText(script.japaneseText)}
                        </p>
                        <p className="text-xs text-gray-400 line-clamp-2">
                          {truncateText(script.englishText)}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>

                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {pagination.total}件中 {(pagination.page - 1) * pagination.limit + 1}-
                      {Math.min(pagination.page * pagination.limit, pagination.total)}件を表示
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                      >
                        <span>前へ</span>
                      </Button>
                      <span className="text-sm px-3">
                        {pagination.page} / {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        <span>次へ</span>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
