'use client';

import { useState, useEffect } from 'react';
import { Search, BookOpen, Loader2, ChevronDown, ChevronRight, FileText } from 'lucide-react';
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
  scripts: Script[];
  totalScripts: number;
  learnedScripts: number;
}

export function ScriptList() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 0,
  });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchScripts = async (page: number = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      const response = await fetch(`/api/script?${params.toString()}`);
      const data: ApiResponse = await response.json();

      if (data.success) {
        setScripts(data.scripts);
        setPagination(data.pagination);
        // Auto-expand all files when searching
        if (debouncedSearch && data.scripts.length > 0) {
          const uniqueFileNames = Array.from(new Set(data.scripts.map(s => s.fileName)));
          setExpandedFiles(new Set(uniqueFileNames));
        }
      }
    } catch (error) {
      console.error('Error fetching scripts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScripts(1);
  }, [debouncedSearch]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchScripts(newPage);
    }
  };

  const toggleFile = (fileName: string) => {
    setExpandedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileName)) {
        newSet.delete(fileName);
      } else {
        newSet.add(fileName);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const uniqueFileNames = Array.from(new Set(scripts.map(s => s.fileName)));
    setExpandedFiles(new Set(uniqueFileNames));
  };

  const collapseAll = () => {
    setExpandedFiles(new Set());
  };

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Group scripts by fileName
  const groupedScripts = scripts.reduce<Record<string, FileGroup>>((acc, script) => {
    if (!acc[script.fileName]) {
      acc[script.fileName] = {
        fileName: script.fileName,
        scripts: [],
        totalScripts: 0,
        learnedScripts: 0,
      };
    }
    acc[script.fileName].scripts.push(script);
    acc[script.fileName].totalScripts++;
    if (script.hasLearningMaterial) {
      acc[script.fileName].learnedScripts++;
    }
    return acc;
  }, {});

  const fileGroups = Object.values(groupedScripts);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="台詞、キャラクター名、ファイル名で検索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : scripts.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {search
                ? '検索結果が見つかりませんでした'
                : '台詞がまだ登録されていません'}
            </p>
          </div>
        ) : (
          <>
            {fileGroups.length > 1 && !search && (
              <div className="flex gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={expandAll}>
                  すべて展開
                </Button>
                <Button variant="outline" size="sm" onClick={collapseAll}>
                  すべて折りたたむ
                </Button>
              </div>
            )}

            <div className="space-y-4 mb-6">
              {fileGroups.map((group) => {
                const isExpanded = expandedFiles.has(group.fileName);
                return (
                  <div key={group.fileName} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleFile(group.fileName)}
                      className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{group.fileName}</span>
                        <Badge variant="secondary" className="text-xs">
                          {group.totalScripts}件
                        </Badge>
                        {group.learnedScripts > 0 && (
                          <Badge variant="success" className="text-xs">
                            {group.learnedScripts}学習済
                          </Badge>
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="divide-y divide-gray-100">
                        {group.scripts.map((script) => (
                          <a
                            key={script.id}
                            href={`/learning/${script.id}`}
                            className="block group hover:bg-primary/5 transition-colors"
                          >
                            <div className="p-4">
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
                    )}
                  </div>
                );
              })}
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
                    <ChevronRight className="h-4 w-4 rotate-180" />
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
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
