import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@cp/ui';
import { useCreateAssignment } from '../../../api/curriculum.queries';
import { AssignmentType, PublishStatus, ICodingTestCase } from '@cp/shared';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function AssignmentCreatePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const create = useCreateAssignment();

  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [testCaseTab, setTestCaseTab] = useState<'upload' | 'manual'>('upload');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [timeLimit, setTimeLimit] = useState(1.0);
  const [memoryLimit, setMemoryLimit] = useState(256);
  const [outputLimit, setOutputLimit] = useState(10);
  const [checkerType, setCheckerType] = useState<'standard' | 'exact' | 'custom'>('standard');
  const [testCases, setTestCases] = useState<ICodingTestCase[]>([{ input: '', output: '', isHidden: false }]);

  const handlePublish = async () => {
    try {
      await create.mutateAsync({
        title,
        slug: slug || undefined,
        description,
        type: AssignmentType.CODING,
        difficulty,
        subject: 'Programming',
        points: 100,
        status: PublishStatus.PUBLISHED,
        tags,
        codingConfig: {
          timeLimit,
          memoryLimit,
          outputLimit,
          checkerType,
          allowedLanguages: ['C++ 20', 'Java 17', 'Python 3', 'JavaScript'],
          testCases
        }
      });
      toast.success('Assignment published successfully!');
      navigate('/admin/assignments');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e.message || 'Error creating assignment');
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
                    onChange={e => setTitle(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="e.g., Two Sum"
                  />
                </div>
                <div>
                  <label className="block font-label-sm text-label-sm text-on-surface-variant mb-xs">Problem Code (Slug)</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={e => setSlug(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-md py-sm text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    placeholder="e.g., two-sum"
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
                    <label className="block font-label-sm text-xs text-on-surface-variant mb-xs">Explanation (Optional)</label>
                    <input
                      type="text"
                      value={tc.explanation || ''}
                      onChange={(e) => {
                        const newTc = [...testCases];
                        newTc[idx].explanation = e.target.value;
                        setTestCases(newTc);
                      }}
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg px-sm py-1 text-sm focus:outline-none focus:border-primary"
                      placeholder="Explanation for the test case"
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
                <div className="border-2 border-dashed border-outline-variant rounded-lg p-xl flex flex-col items-center justify-center text-center bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-4xl text-outline-variant mb-sm">cloud_upload</span>
                  <p className="font-label-sm text-on-surface mb-xs">Click to upload or drag and drop</p>
                  <p className="text-xs text-on-surface-variant">ZIP file containing .in and .out files</p>
                </div>
              )}
              {testCaseTab === 'manual' && (
                <p className="text-sm text-on-surface-variant">Manual entry form will appear here.</p>
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
