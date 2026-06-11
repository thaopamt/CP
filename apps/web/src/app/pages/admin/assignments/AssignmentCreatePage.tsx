import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@cp/ui';
import { useCreateAssignment } from '../../../api/curriculum.queries';
import { assignmentsApi } from '../../../api/curriculum.api';
import { useClassesList } from '../../../api/class.queries';
import { PublishStatus, ICodingTestCase, IHiddenTestcaseFilePair } from '@cp/shared';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import JSZip from 'jszip';
import 'katex/dist/katex.min.css';

async function readTestcaseManifestFromZip(file: File): Promise<IHiddenTestcaseFilePair[]> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const fileMap = new Map<string, { inputFile?: string; outputFile?: string }>();

  for (const [zipPath, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const filename = zipPath.split('/').pop() || '';
    const match =
      filename.match(/^(?:input|test)?(\d+)\.(?:inp|in|txt)$/i) ||
      filename.match(/^(?:output|ans)?(\d+)\.(?:out|ans|txt)$/i);
    if (!match) continue;

    const num = match[1];
    const isInput =
      /\.(inp|in)$/i.test(filename) || /^input/i.test(filename) || /^test.*\.in$/i.test(filename);
    const isOutput =
      /\.(out|ans)$/i.test(filename) || /^output/i.test(filename) || /^ans/i.test(filename);

    if (!fileMap.has(num)) fileMap.set(num, {});
    if (isInput) fileMap.get(num)!.inputFile = filename;
    else if (isOutput) fileMap.get(num)!.outputFile = filename;
  }

  return Array.from(fileMap.entries())
    .sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10))
    .filter(([, value]) => value.inputFile)
    .map(([num, value]) => ({
      inputFile: value.inputFile ?? `${num}.inp`,
      outputFile: value.outputFile ?? `${num}.out`,
    }));
}

export default function AssignmentCreatePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const create = useCreateAssignment();
  const { data: classesData } = useClassesList({ page: 1, limit: 100 });
  const classes = classesData?.items || [];
  const implicitClassIds: string[] = [];
  const [classIds, setClassIds] = useState<string[]>([]);
  const [classSearchText, setClassSearchText] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredClasses = useMemo(() => {
    const q = classSearchText.toLowerCase();
    if (!q) return classes;
    return classes.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
  }, [classes, classSearchText]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [testCaseTab, setTestCaseTab] = useState<'upload' | 'manual'>('upload');
  const zipInputRef = useRef<HTMLInputElement>(null);
  // The hidden grading test cases are uploaded to the server as a ZIP after the
  // assignment is created — they are stored on disk, not in the DB. We stage the
  // file here and upload it on publish.
  const [hiddenZipFile, setHiddenZipFile] = useState<File | null>(null);
  const [hiddenTestcaseFiles, setHiddenTestcaseFiles] = useState<IHiddenTestcaseFilePair[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const stageZipFile = useCallback(async (file: File) => {
    if (!(file.name.endsWith('.zip') || file.type === 'application/zip')) {
      toast.error('Please choose a .zip file');
      return;
    }
    try {
      const testcases = await readTestcaseManifestFromZip(file);
      setHiddenZipFile(file);
      setHiddenTestcaseFiles(testcases);
      toast.success(`"${file.name}" ready with ${testcases.length} hidden grading test case${testcases.length === 1 ? '' : 's'}`);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to read ZIP file');
    }
  }, [toast]);

  const handleZipDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void stageZipFile(file);
  }, [stageZipFile]);

  const handleZipSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void stageZipFile(file);
    e.target.value = ''; // reset so same file can be re-selected
  }, [stageZipFile]);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugAutoMode, setSlugAutoMode] = useState(true);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (slugAutoMode) {
      setSlug(slugify(value));
    }
  };
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [timeLimit, setTimeLimit] = useState(1.0);
  const [memoryLimit, setMemoryLimit] = useState(256);
  const [outputLimit, setOutputLimit] = useState(10);
  const [checkerType, setCheckerType] = useState<'standard' | 'exact' | 'custom'>('standard');
  const [allowViewHiddenTestCases, setAllowViewHiddenTestCases] = useState(false);
  const [ioMode, setIoMode] = useState<'stdio' | 'file'>('stdio');
  const [inputFileName, setInputFileName] = useState('');
  const [outputFileName, setOutputFileName] = useState('');
  const [testCases, setTestCases] = useState<ICodingTestCase[]>([{ input: '', output: '', isHidden: false }]);

  const handlePublish = async () => {
    try {
      setUploading(true);
      const created = await create.mutateAsync({
        title,
        slug: slug || undefined,
        description,
        difficulty,
        points: 100,
        status: PublishStatus.PUBLISHED,
        classIds: classIds.length > 0 ? classIds : null,
        tags,
        codingConfig: {
          timeLimit,
          memoryLimit,
          outputLimit,
          checkerType,
          allowViewHiddenTestCases,
          allowedLanguages: ['C++ 20', 'Java 17', 'Python 3', 'JavaScript'],
          testCases,
          ioMode,
          ...(ioMode === 'file' ? { inputFileName, outputFileName } : {}),
        }
      });

      // Upload the hidden grading test cases (stored on disk) if provided.
      if (hiddenZipFile && created?.id) {
        const { hiddenTestCount, testcases } = await assignmentsApi.uploadTestcases(created.id, hiddenZipFile);
        setHiddenTestcaseFiles(testcases);
        toast.success(`Uploaded ${hiddenTestCount} hidden grading test case${hiddenTestCount === 1 ? '' : 's'}`);
      }

      toast.success('Assignment published successfully!');
      navigate('/admin/assignments');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e.message || 'Error creating assignment');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background p-lg lg:p-xl">
      <div className="max-w-[1200px] mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-xl">
          <div>
            <div className="flex items-center gap-sm mb-xs">
              <Link to="/admin/assignments" className="font-label-sm text-label-sm text-on-surface-variant hover:text-primary transition-colors">
                Assignments
              </Link>
              <span className="material-symbols-outlined text-outline-variant text-sm">chevron_right</span>
              <span className="font-label-sm text-label-sm font-bold text-on-surface">Create New</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs">Create New Problem</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">Configure settings and content for a competitive programming style problem.</p>
          </div>
          <div className="flex items-center gap-md">
            <button className="px-md py-sm rounded-lg border border-outline text-on-surface-variant hover:bg-surface-container-highest transition-colors font-label-sm text-label-sm">
              Save Draft
            </button>
            <button
              onClick={handlePublish}
              className="px-md py-sm rounded-lg bg-primary text-on-primary hover:brightness-95 transition-all font-label-sm text-label-sm shadow-sm flex items-center gap-xs"
            >
              <span className="material-symbols-outlined text-sm">publish</span>
              Publish Problem
            </button>
          </div>
        </div>

        {/* Form Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
          {/* Left Column (Main Config & Editor) */}
          <div className="lg:col-span-8 space-y-lg">
            {/* General Info Card */}
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-sm">
              <h3 className="font-student-card-title text-student-card-title text-on-surface mb-md pb-sm border-b border-outline-variant/50">
                General Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md mb-md">
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">Problem Title <span className="text-error">*</span></label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => handleTitleChange(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="e.g., Two Sum"
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">
                    Problem Code (Slug)
                    <button
                      type="button"
                      onClick={() => {
                        const next = !slugAutoMode;
                        setSlugAutoMode(next);
                        if (next) setSlug(slugify(title));
                      }}
                      className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
                        slugAutoMode
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-surface-container-low text-on-surface-variant border-outline-variant'
                      }`}
                      title={slugAutoMode ? 'Click to edit manually' : 'Click to auto-generate'}
                    >
                      {slugAutoMode ? '\uD83D\uDD17 Auto' : '\u270F\uFE0F Manual'}
                    </button>
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => {
                      setSlug(e.target.value);
                      setSlugAutoMode(false);
                    }}
                    className={`w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary ${slugAutoMode ? 'text-on-surface-variant' : ''}`}
                    placeholder="e.g., two-sum"
                    readOnly={slugAutoMode}
                  />
                </div>
              </div>
            </section>

            {/* Problem Statement Editor Card */}
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-md py-sm">
                <div className="flex gap-sm">
                  <button
                    onClick={() => setActiveTab('write')}
                    className={`px-md py-sm rounded-t-lg border-b-0 font-label-sm text-label-sm flex items-center gap-xs relative z-10 translate-y-[1px] ${
                      activeTab === 'write'
                        ? 'bg-surface-container-lowest border border-outline-variant text-primary'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">edit_document</span>
                    Write (Markdown)
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-md py-sm rounded-t-lg border-b-0 font-label-sm text-label-sm flex items-center gap-xs relative z-10 translate-y-[1px] ${
                      activeTab === 'preview'
                        ? 'bg-surface-container-lowest border border-outline-variant text-primary'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    Preview
                  </button>
                </div>
                <div className="flex items-center gap-xs text-on-surface-variant">
                  <button className="p-xs hover:bg-surface-variant rounded"><span className="material-symbols-outlined text-sm">format_bold</span></button>
                  <button className="p-xs hover:bg-surface-variant rounded"><span className="material-symbols-outlined text-sm">format_italic</span></button>
                  <button className="p-xs hover:bg-surface-variant rounded"><span className="material-symbols-outlined text-sm">code</span></button>
                  <button className="p-xs hover:bg-surface-variant rounded"><span className="material-symbols-outlined text-sm">functions</span></button>
                </div>
              </div>

              <div className="flex-1 p-md bg-surface-container-lowest">
                {activeTab === 'write' ? (
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full h-full min-h-[300px] resize-y border-0 focus:ring-0 text-body-md font-mono text-on-surface bg-transparent"
                    placeholder="Write problem statement here...&#10;&#10;## Problem Statement&#10;Given an array of integers...&#10;&#10;## Input Format&#10;The first line contains N...&#10;&#10;## Output Format&#10;Print a single integer...&#10;&#10;## Constraints&#10;- $1 \le N \le 10^5$"
                  ></textarea>
                ) : (
                  <div className="prose prose-sm max-w-none text-on-surface">
                    {description ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {description}
                      </ReactMarkdown>
                    ) : (
                      <p className="text-on-surface-variant italic">Preview will appear here...</p>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Test Cases Card */}
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-sm">
              <h3 className="font-student-card-title text-student-card-title text-on-surface mb-md pb-sm border-b border-outline-variant/50">
                Sample Test Cases
              </h3>
              <p className="text-body-md text-on-surface-variant mb-md">These test cases will be visible to students in the problem description.</p>
              
              {testCases.map((tc, idx) => (
                <div key={idx} className="bg-surface-container-low border border-outline-variant rounded-lg p-md mb-md relative">
                  <div className="flex justify-between items-center mb-sm">
                    <span className="font-label-sm font-bold text-on-surface">Sample {idx + 1}</span>
                    <button
                      onClick={() => setTestCases(testCases.filter((_, i) => i !== idx))}
                      className="text-error hover:bg-error-container p-1 rounded transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-sm">
                    <div>
                      <label className="block font-label-sm text-xs text-on-surface-variant mb-xs">Input</label>
                      <textarea
                        value={tc.input}
                        onChange={(e) => {
                          const newTc = [...testCases];
                          newTc[idx].input = e.target.value;
                          setTestCases(newTc);
                        }}
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-sm text-sm font-mono focus:outline-none focus:border-primary h-24"
                      />
                    </div>
                    <div>
                      <label className="block font-label-sm text-xs text-on-surface-variant mb-xs">Output</label>
                      <textarea
                        value={tc.output}
                        onChange={(e) => {
                          const newTc = [...testCases];
                          newTc[idx].output = e.target.value;
                          setTestCases(newTc);
                        }}
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-sm text-sm font-mono focus:outline-none focus:border-primary h-24"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-label-sm text-xs text-on-surface-variant mb-xs">Explanation (Optional · Markdown supported)</label>
                    <textarea
                      value={tc.explanation || ''}
                      onChange={(e) => {
                        const newTc = [...testCases];
                        newTc[idx].explanation = e.target.value;
                        setTestCases(newTc);
                      }}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg p-sm text-sm font-mono focus:outline-none focus:border-primary h-20 resize-y"
                      placeholder="Supports **bold**, *italic*, `code`, math $x^2$, etc."
                    />
                  </div>
                  <div className="mt-sm flex items-center gap-xs">
                    <input
                      type="checkbox"
                      checked={tc.isHidden || false}
                      onChange={(e) => {
                        const newTc = [...testCases];
                        newTc[idx].isHidden = e.target.checked;
                        setTestCases(newTc);
                      }}
                      className="rounded text-primary focus:ring-primary border-outline-variant"
                    />
                    <label className="text-sm text-on-surface">Is Hidden Test Case?</label>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setTestCases([...testCases, { input: '', output: '', isHidden: false }])}
                className="w-full py-sm border border-dashed border-primary text-primary rounded-lg hover:bg-primary-container/20 transition-colors font-label-sm flex items-center justify-center gap-xs"
              >
                <span className="material-symbols-outlined text-sm">add</span> Add Sample Test
              </button>
            </section>

            {/* Hidden Test Cases (Grading) */}
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-sm">
              <h3 className="font-student-card-title text-student-card-title text-on-surface mb-md pb-sm border-b border-outline-variant/50">
                Grading Test Cases (Hidden)
              </h3>
              
              <div className="flex gap-sm mb-md">
                <button
                  onClick={() => setTestCaseTab('upload')}
                  className={`px-sm py-1 rounded-full font-label-sm text-xs border ${testCaseTab === 'upload' ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant'}`}
                >
                  Upload ZIP
                </button>
                <button
                  onClick={() => setTestCaseTab('manual')}
                  className={`px-sm py-1 rounded-full font-label-sm text-xs border ${testCaseTab === 'manual' ? 'bg-primary text-on-primary border-primary' : 'border-outline-variant text-on-surface-variant'}`}
                >
                  Manual Entry
                </button>
              </div>

              {testCaseTab === 'upload' && (
                <div>
                  {/* Hidden file input */}
                  <input
                    ref={zipInputRef}
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={handleZipSelect}
                  />

                  {/* Drop zone */}
                  <div
                    onClick={() => zipInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleZipDrop}
                    className={`border-2 border-dashed rounded-lg p-xl flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
                      dragOver
                        ? 'border-primary bg-primary-container/20'
                        : 'border-outline-variant bg-surface-container-low hover:bg-surface-container'
                    }`}
                  >
                    {uploading ? (
                      <>
                        <span className="material-symbols-outlined text-4xl text-primary mb-sm animate-spin">progress_activity</span>
                        <p className="font-label-sm text-on-surface">Uploading test cases...</p>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-4xl text-outline-variant mb-sm">cloud_upload</span>
                        <p className="font-label-sm text-on-surface mb-xs">Click to upload or drag and drop</p>
                        <p className="text-xs text-on-surface-variant">ZIP containing paired files: <code className="bg-surface-variant px-1 rounded">1.inp/1.out</code>, <code className="bg-surface-variant px-1 rounded">1.in/1.out</code>, or <code className="bg-surface-variant px-1 rounded">input1.txt/output1.txt</code></p>
                        <p className="text-xs text-on-surface-variant mt-xs">Stored on the server (not the database); uploaded when you publish.</p>
                      </>
                    )}
                  </div>

                  {/* Staged file summary */}
                  {hiddenZipFile && (
                    <div className="mt-md p-md bg-primary-container/10 border border-primary/20 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-sm min-w-0">
                        <span className="material-symbols-outlined text-primary text-lg">folder_zip</span>
                        <span className="font-label-sm text-on-surface font-bold truncate">{hiddenZipFile.name}</span>
                        <span className="text-xs text-on-surface-variant shrink-0">({(hiddenZipFile.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setHiddenZipFile(null);
                          setHiddenTestcaseFiles([]);
                        }}
                        className="text-error hover:bg-error-container p-1 rounded transition-colors text-xs flex items-center gap-1 shrink-0"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        Remove
                      </button>
                    </div>
                  )}

                  {hiddenTestcaseFiles.length > 0 && (
                    <div className="mt-md overflow-hidden rounded-lg border border-outline-variant bg-surface-container-lowest">
                      <div className="flex items-center justify-between gap-sm border-b border-outline-variant px-md py-sm">
                        <span className="font-label-sm text-on-surface font-bold">
                          {hiddenTestcaseFiles.length} testcase{hiddenTestcaseFiles.length === 1 ? '' : 's'}
                        </span>
                        <span className="text-xs text-on-surface-variant">Preview from ZIP</span>
                      </div>
                      <div className="max-h-64 overflow-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-surface-container-low text-on-surface-variant">
                            <tr>
                              <th className="px-md py-sm text-left font-label-sm">Input</th>
                              <th className="px-md py-sm text-left font-label-sm">Output</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-outline-variant/60">
                            {hiddenTestcaseFiles.map((tc, idx) => (
                              <tr key={`${tc.inputFile}-${idx}`}>
                                <td className="px-md py-sm font-mono text-xs text-on-surface">{tc.inputFile}</td>
                                <td className="px-md py-sm font-mono text-xs text-on-surface">{tc.outputFile || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {testCaseTab === 'manual' && (
                <p className="text-sm text-on-surface-variant">Use the Sample Test Cases section above to add test cases manually.</p>
              )}
            </section>
          </div>

          {/* Right Column (Settings) */}
          <div className="lg:col-span-4 space-y-lg">
            {/* Metadata Card */}
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-sm">
              <h3 className="font-student-card-title text-student-card-title text-on-surface mb-md flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">sell</span>
                Classification
              </h3>

              <div className="mb-md relative" ref={dropdownRef}>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">Visibility (Classes)</label>
                <p className="text-[12px] text-on-surface-variant mb-xs">Select classes to restrict this assignment. Leave empty for global visibility.</p>

                {/* Dropdown Trigger */}
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-sm focus:outline-none focus:border-primary transition-colors text-left"
                >
                  <span className={classIds.length > 0 ? 'text-on-surface' : 'text-on-surface-variant'}>
                    {classIds.length === 0 
                      ? 'Global Visibility (All Classes)' 
                      : `${classIds.length} class${classIds.length > 1 ? 'es' : ''} selected`}
                  </span>
                  <span className="material-symbols-outlined text-outline-variant text-lg">
                    {isDropdownOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg flex flex-col max-h-[300px] overflow-hidden">
                    {/* Search Bar */}
                    <div className="p-2 border-b border-outline-variant bg-surface-container-low sticky top-0 z-10">
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[18px]">search</span>
                        <input
                          type="text"
                          placeholder="Search classes..."
                          value={classSearchText}
                          onChange={(e) => setClassSearchText(e.target.value)}
                          className="w-full bg-surface-container-lowest border border-outline-variant rounded-md pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:border-primary transition-colors"
                        />
                      </div>
                    </div>

                    {/* List */}
                    <div className="overflow-y-auto divide-y divide-outline-variant">
                      {classes.length === 0 && (
                        <div className="p-4 text-center text-sm text-on-surface-variant flex flex-col items-center gap-1">
                          <span className="material-symbols-outlined text-outline text-2xl">inbox</span>
                          No classes available
                        </div>
                      )}
                      {filteredClasses.map(c => {
                          const isImplicit = implicitClassIds.includes(c.id);
                          return (
                            <label 
                              key={c.id} 
                              className={`flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-surface-container-low ${classIds.includes(c.id) || isImplicit ? 'bg-primary-container/10' : ''} ${isImplicit ? 'opacity-70' : ''}`}
                            >
                              <div className="pt-0.5">
                                <input 
                                  type="checkbox" 
                                  checked={classIds.includes(c.id) || isImplicit}
                                  disabled={isImplicit}
                                  onChange={(e) => {
                                    if (e.target.checked) setClassIds([...classIds, c.id]);
                                    else setClassIds(classIds.filter(id => id !== c.id));
                                  }}
                                  className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary focus:ring-offset-surface-container-lowest cursor-pointer disabled:cursor-not-allowed"
                                />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-on-surface leading-tight flex items-center gap-2">
                                  {c.name}
                                  {isImplicit && (
                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                                      Via Course
                                    </span>
                                  )}
                                </span>
                                <span className="text-[11px] text-on-surface-variant mt-0.5">{c.code}</span>
                              </div>
                            </label>
                          );
                        })}
                      {classes.length > 0 && filteredClasses.length === 0 && (
                        <div className="p-4 text-center text-sm text-on-surface-variant">
                          No matching classes found.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-md">
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value as any)} className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:border-primary appearance-none">
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
              
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">Tags</label>
                <div className="flex flex-wrap gap-xs mb-sm">
                  {tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-xs px-sm py-xs bg-secondary-container text-on-secondary-container rounded-md font-label-sm text-[12px]">
                      {tag}
                      <span className="material-symbols-outlined text-[14px] cursor-pointer hover:text-error" onClick={() => setTags(tags.filter((_, i) => i !== idx))}>close</span>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault();
                      setTags([...tags, tagInput.trim()]);
                      setTagInput('');
                    }
                  }}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-sm focus:outline-none focus:border-primary"
                  placeholder="Add tags and press Enter..."
                />
              </div>
            </section>

            {/* Technical Limits Card */}
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-sm">
              <h3 className="font-student-card-title text-student-card-title text-on-surface mb-md flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">speed</span>
                Execution Limits
              </h3>
              
              <div className="space-y-md">
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">Time Limit (seconds)</label>
                  <div className="relative">
                    <input type="number" step="0.1" value={timeLimit} onChange={e => setTimeLimit(parseFloat(e.target.value) || 0)} className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-md pr-xl py-sm text-body-md focus:outline-none focus:border-primary" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant font-label-sm text-xs">s</span>
                  </div>
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">Memory Limit (MB)</label>
                  <div className="relative">
                    <input type="number" value={memoryLimit} onChange={e => setMemoryLimit(parseInt(e.target.value) || 0)} className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-md pr-xl py-sm text-body-md focus:outline-none focus:border-primary" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant font-label-sm text-xs">MB</span>
                  </div>
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">Output Limit (MB)</label>
                  <div className="relative">
                    <input type="number" value={outputLimit} onChange={e => setOutputLimit(parseInt(e.target.value) || 0)} className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-md pr-xl py-sm text-body-md focus:outline-none focus:border-primary" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-outline-variant font-label-sm text-xs">MB</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Advanced Configuration */}
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-sm">
              <h3 className="font-student-card-title text-student-card-title text-on-surface mb-md flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary">settings_applications</span>
                Advanced
              </h3>
              
              <div className="mb-md">
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">Checker Type</label>
                <select value={checkerType} onChange={e => setCheckerType(e.target.value as any)} className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-sm focus:outline-none focus:border-primary appearance-none">
                  <option value="standard">Standard Token Match</option>
                  <option value="exact">Exact Match</option>
                  <option value="custom">Custom Checker (C++)</option>
                </select>
                <p className="text-xs text-on-surface-variant mt-1">Use standard token match for most problems.</p>
              </div>

              {/* I/O Mode */}
              <div className="mb-md pt-md border-t border-outline-variant">
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">I/O Mode</label>
                <div className="flex gap-md mt-sm">
                  <label className="flex items-center gap-xs cursor-pointer">
                    <input type="radio" name="ioMode" checked={ioMode === 'stdio'} onChange={() => setIoMode('stdio')} className="text-primary focus:ring-primary border-outline-variant" />
                    <span className="text-sm text-on-surface">stdin / stdout</span>
                  </label>
                  <label className="flex items-center gap-xs cursor-pointer">
                    <input type="radio" name="ioMode" checked={ioMode === 'file'} onChange={() => setIoMode('file')} className="text-primary focus:ring-primary border-outline-variant" />
                    <span className="text-sm text-on-surface">File I/O (freopen)</span>
                  </label>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  {ioMode === 'stdio'
                    ? 'Programs read from stdin and write to stdout.'
                    : 'Programs read/write from named files (e.g. freopen).'}
                </p>

                {ioMode === 'file' && (
                  <div className="mt-sm grid grid-cols-2 gap-sm">
                    <div>
                      <label className="block text-xs text-on-surface-variant mb-1">Input File Name</label>
                      <input
                        type="text"
                        value={inputFileName}
                        onChange={e => setInputFileName(e.target.value.toUpperCase())}
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-xs text-sm font-mono focus:outline-none focus:border-primary"
                        placeholder="e.g. SUMAB.INP"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-on-surface-variant mb-1">Output File Name</label>
                      <input
                        type="text"
                        value={outputFileName}
                        onChange={e => setOutputFileName(e.target.value.toUpperCase())}
                        className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-xs text-sm font-mono focus:outline-none focus:border-primary"
                        placeholder="e.g. SUMAB.OUT"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">Allowed Languages</label>
                <div className="space-y-xs">
                  {['C++ 20', 'Java 17', 'Python 3', 'JavaScript'].map(lang => (
                    <label key={lang} className="flex items-center gap-sm">
                      <input type="checkbox" defaultChecked className="rounded text-primary focus:ring-primary border-outline-variant" />
                      <span className="text-sm text-on-surface">{lang}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* View hidden testcases option */}
              <div className="mt-md pt-md border-t border-outline-variant">
                <label className="flex items-center gap-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowViewHiddenTestCases}
                    onChange={(e) => setAllowViewHiddenTestCases(e.target.checked)}
                    className="w-4 h-4 text-primary bg-surface-container border-outline-variant rounded focus:ring-primary focus:ring-2"
                  />
                  <div>
                    <span className="block text-sm font-medium text-on-surface">Allow Viewing Hidden Test Cases</span>
                    <span className="block text-xs text-on-surface-variant mt-0.5">Students can view inputs/outputs of hidden cases after submitting code</span>
                  </div>
                </label>
              </div>

              <div className="mt-md pt-md border-t border-outline-variant">
                <button className="w-full px-md py-sm rounded-lg bg-surface-container-low text-primary hover:bg-primary-container hover:text-on-primary-container transition-colors font-label-sm text-sm flex items-center justify-center gap-xs">
                  <span className="material-symbols-outlined text-sm">code_blocks</span>
                  Setup Boilerplate Code
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
