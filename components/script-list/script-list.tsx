'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, BookOpen, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
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

export function ScriptList() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
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

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6">
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
            <div className="space-y-3 mb-6">
              {scripts.map((script) => (
                <a
                  key={script.id}
                  href={`/learning/${script.id}`}
                  className="block group"
                >
                  <div className="p-4 rounded-lg border border-gray-100 hover:border-primary/50 hover:bg-primary/5 transition-all">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Game {script.gameId}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Scene {script.scene}
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
                    <ChevronLeft className="h-4 w-4" />
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
