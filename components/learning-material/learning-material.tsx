'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface VocabularyEntry {
  word: string;
  reading: string;
  pitch?: string;
  partOfSpeech: string;
  verbForms?: string;
  meaning: string;
  context: string;
}

interface GrammarPoint {
  name: string;
  form: string;
  usage: string;
  function: string;
  commonConfusion?: string;
  speechNote?: string;
}

interface Translation {
  literal: string;
  natural: string;
  original: string;
  kana: string;
}

interface LearningMaterialContent {
  originalText: string;
  vocabulary: VocabularyEntry[];
  grammar: GrammarPoint[];
  translation: Translation;
}

interface Script {
  id: string;
  gameId: number;
  scene: string;
  row: number;
  characterName: string;
  japaneseText: string;
  englishText: string;
  createdAt: string;
  updatedAt: string;
}

interface LearningMaterial {
  id: string;
  scriptId: string;
  content: LearningMaterialContent;
  generatedAt: string;
  generatedBy: string;
  status: string;
  script: Script;
}

export function LearningMaterialView({ scriptId }: { scriptId: string }) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [learningMaterial, setLearningMaterial] = useState<LearningMaterial | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchLearningMaterial = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/learning/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch learning material');
      }

      if (data.learningMaterial) {
        setLearningMaterial(data.learningMaterial);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load learning material');
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchLearningMaterial();
  }, [scriptId]);

  const handleRegenerate = () => {
    setGenerating(true);
    fetchLearningMaterial();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              {generating ? '学習資料を生成中...' : '学習資料を読み込み中...'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center max-w-md">
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={fetchLearningMaterial}>再試行</Button>
              <Button variant="outline" onClick={handleRegenerate} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    生成する
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!learningMaterial) {
    return null;
  }

  const content = learningMaterial.content;
  const script = learningMaterial.script;

  if (!script) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-16">
          <p className="text-red-600">Script information not available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => window.location.href = '/script'}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              戻る
            </Button>
            <Badge variant="secondary">Game {script.gameId}</Badge>
            <Badge variant="outline">Scene {script.scene}</Badge>
          </div>
          <CardTitle className="font-japanese">{script.characterName}</CardTitle>
          <CardDescription className="font-japanese text-base">
            {script.japaneseText}
          </CardDescription>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>生成日時: {new Date(learningMaterial.generatedAt).toLocaleString('ja-JP')}</span>
            <span>{learningMaterial.generatedBy}</span>
          </div>
        </CardHeader>
      </Card>

      {/* 第一部分 — 核心词汇 & 短语解析 */}
      <Card>
        <CardHeader>
          <CardTitle>第一部分 — 核心词汇 & 短语解析（结合剧情语境）</CardTitle>
        </CardHeader>
        <CardContent>
          {content.vocabulary.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              此句没有需要特别解析的词汇
            </p>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[150px]">单词 / 短语</TableHead>
                      <TableHead className="w-[150px]">读音</TableHead>
                      <TableHead className="w-[100px]">词性</TableHead>
                      <TableHead className="w-[200px]">释义</TableHead>
                      <TableHead>语境说明</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {content.vocabulary.map((vocab, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium font-japanese">{vocab.word}</TableCell>
                        <TableCell>
                          <div className="font-japanese">
                            {vocab.reading}
                            {vocab.pitch && (
                              <Badge variant="outline" className="ml-2 text-xs">
                                {vocab.pitch}
                              </Badge>
                            )}
                          </div>
                          {vocab.verbForms && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {vocab.verbForms}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{vocab.partOfSpeech}</TableCell>
                        <TableCell>{vocab.meaning}</TableCell>
                        <TableCell className="text-sm">{vocab.context}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-4">
                {content.vocabulary.map((vocab, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold font-japanese text-lg">{vocab.word}</div>
                        <div className="font-japanese text-base text-muted-foreground mt-1">
                          {vocab.reading}
                          {vocab.pitch && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {vocab.pitch}
                            </Badge>
                          )}
                        </div>
                        {vocab.verbForms && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {vocab.verbForms}
                          </div>
                        )}
                      </div>
                      <Badge variant="secondary">{vocab.partOfSpeech}</Badge>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">释义</div>
                      <div className="text-sm">{vocab.meaning}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">语境说明</div>
                      <div className="text-sm bg-muted/50 p-3 rounded-md">{vocab.context}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 第二部分 — 语法要点拆解 */}
      <Card>
        <CardHeader>
          <CardTitle>第二部分 — 语法要点拆解（结合原文）</CardTitle>
        </CardHeader>
        <CardContent>
          {content.grammar.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              此句没有需要特别解析的语法点
            </p>
          ) : (
            <div className="space-y-6">
              {content.grammar.map((grammar, index) => (
                <div key={index} className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-lg mb-2">
                    <span className="text-muted-foreground">语法点名称：</span>
                    {grammar.name}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">形式与构成：</span>
                      <span className="text-muted-foreground">{grammar.form}</span>
                    </div>
                    <div>
                      <span className="font-medium">本句中的具体使用方式：</span>
                      <span className="text-muted-foreground font-japanese">{grammar.usage}</span>
                    </div>
                    <div>
                      <span className="font-medium">功能与语感：</span>
                      <span className="text-muted-foreground">{grammar.function}</span>
                    </div>
                    {grammar.commonConfusion && (
                      <div>
                        <span className="font-medium">常见混淆点对比：</span>
                        <span className="text-muted-foreground">{grammar.commonConfusion}</span>
                      </div>
                    )}
                    {grammar.speechNote && (
                      <div className="bg-muted/50 p-3 rounded-md">
                        <span className="font-medium">口语说明：</span>
                        <span className="text-muted-foreground">{grammar.speechNote}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 第三部分 — 整句翻译 */}
      <Card>
        <CardHeader>
          <CardTitle>第三部分 — 整句翻译（含整句假名读音）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">1. 直译</h4>
              <p className="text-sm bg-muted/50 p-3 rounded-md">{content.translation.literal}</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">2. 自然中文翻译</h4>
              <p className="text-sm bg-muted/50 p-3 rounded-md">{content.translation.natural}</p>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">3. 原文</h4>
            <p className="font-japanese text-lg bg-muted/50 p-3 rounded-md">{content.translation.original}</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">4. 整句假名读音</h4>
            <p className="font-japanese text-base bg-muted/50 p-3 rounded-md leading-relaxed">
              {content.translation.kana}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 justify-center">
        <Button variant="outline" onClick={handleRegenerate} disabled={generating}>
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              再生成中
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              再生成
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
