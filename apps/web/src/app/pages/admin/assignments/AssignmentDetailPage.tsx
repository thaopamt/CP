import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Icon, PageHeader, StatusBadge } from '@cp/ui';
import { PublishStatus } from '@cp/shared';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useAssignment, useDeleteAssignment } from '../../../api/curriculum.queries';
import { useToast, useConfirm } from '@cp/ui';

const DIFFICULTY_TONE: Record<'EASY' | 'MEDIUM' | 'HARD', 'success' | 'warning' | 'error'> = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'error',
};

export default function AssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useTranslation();

  const { data: assignment, isLoading, isError, error } = useAssignment(id);
  const deleteAssignment = useDeleteAssignment();
  const confirm = useConfirm();

  const handleDelete = async () => {
    const ok = await confirm({
      title: t('common.confirmDelete', 'Confirm'),
      message: 'Are you sure you want to delete this assignment?',
      intent: 'danger'
    });
    if (ok) {
      try {
        if (id) {
          await deleteAssignment.mutateAsync(id);
          toast.success('Assignment deleted successfully');
          navigate('/admin/assignments');
        }
      } catch (e: any) {
        toast.error(e.message || 'Error deleting assignment');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="grid h-full place-items-center">
        <Icon name="progress_activity" size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !assignment) {
    return (
      <div className="p-xl text-center text-on-surface">
        <Icon name="error" size={36} className="mx-auto mb-sm text-error" />
        <p>{(error as Error)?.message || 'Assignment not found'}</p>
        <Button variant="ghost" onClick={() => navigate('/admin/assignments')} className="mt-md">
          Back to List
        </Button>
      </div>
    );
  }

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
              <span className="font-label-sm text-label-sm font-bold text-on-surface">Detail</span>
            </div>
            <div className="flex items-center gap-md">
              <h1 className="font-headline-lg text-headline-lg text-on-surface">{assignment.title}</h1>
              <StatusBadge tone={assignment.status === PublishStatus.PUBLISHED ? 'success' : 'neutral'}>
                {assignment.status}
              </StatusBadge>
            </div>
          </div>
          <div className="flex items-center gap-md">
            <button 
              onClick={handleDelete}
              className="px-md py-sm rounded-lg border border-error text-error hover:bg-error-container transition-colors font-label-sm text-label-sm flex items-center gap-xs"
            >
              <Icon name="delete" size={18} />
              Delete
            </button>
            <Link to={`/admin/assignments/${id}/edit`}>
              <button className="px-md py-sm rounded-lg bg-primary text-on-primary hover:brightness-95 transition-all font-label-sm text-label-sm shadow-sm flex items-center gap-xs">
                <Icon name="edit" size={18} />
                Edit Assignment
              </button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg">
          {/* Left Column (Content & Samples) */}
          <div className="lg:col-span-8 space-y-lg">
            {/* Problem Statement Card */}
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-sm">
              <h3 className="font-student-card-title text-student-card-title text-on-surface mb-md pb-sm border-b border-outline-variant/50">
                Problem Statement
              </h3>
              <div className="prose prose-sm max-w-none text-on-surface">
                {assignment.description ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {assignment.description}
                  </ReactMarkdown>
                ) : (
                  <p className="text-on-surface-variant italic">No description provided.</p>
                )}
              </div>
            </section>

            {/* Test Cases Preview (If coding challenge) */}
            {assignment.codingConfig?.testCases && (
              <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-sm">
                <h3 className="font-student-card-title text-student-card-title text-on-surface mb-md pb-sm border-b border-outline-variant/50">
                  Sample Test Cases
                </h3>
                <div className="space-y-md">
                  {assignment.codingConfig.testCases.filter(t => !t.isHidden).map((tc, idx) => (
                    <div key={idx} className="bg-surface-container-low border border-outline-variant rounded-lg p-md">
                      <div className="flex justify-between items-center mb-sm">
                        <span className="font-label-sm font-bold text-on-surface">Sample {idx + 1}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-xs">
                        <div>
                          <p className="font-label-sm text-xs text-on-surface-variant mb-xs">Input</p>
                          <pre className="bg-surface-container-lowest border border-outline-variant rounded p-sm text-sm font-mono overflow-auto text-on-surface">{tc.input}</pre>
                        </div>
                        <div>
                          <p className="font-label-sm text-xs text-on-surface-variant mb-xs">Output</p>
                          <pre className="bg-surface-container-lowest border border-outline-variant rounded p-sm text-sm font-mono overflow-auto text-on-surface">{tc.output}</pre>
                        </div>
                      </div>
                      {tc.explanation && (
                        <div className="mt-sm pt-sm border-t border-outline-variant/50">
                          <p className="font-label-sm text-xs text-on-surface-variant mb-xs">Explanation</p>
                          <div className="prose prose-sm max-w-none text-on-surface-variant">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {tc.explanation}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {assignment.codingConfig.testCases.filter(t => !t.isHidden).length === 0 && (
                    <p className="text-sm text-on-surface-variant italic">No visible sample test cases.</p>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* Right Column (Metadata & Specs) */}
          <div className="lg:col-span-4 space-y-lg">
            {/* Properties Card */}
            <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-sm">
              <h3 className="font-student-card-title text-student-card-title text-on-surface mb-md flex items-center gap-sm">
                <Icon name="info" className="text-primary" />
                Properties
              </h3>
              
              <div className="space-y-sm">

                {assignment.slug && (
                  <div className="flex justify-between py-xs border-b border-outline-variant/30">
                    <span className="text-sm text-on-surface-variant">Slug</span>
                    <span className="text-sm font-mono text-on-surface">{assignment.slug}</span>
                  </div>
                )}
                {assignment.tags && assignment.tags.length > 0 && (
                  <div className="pt-xs">
                    <span className="text-sm text-on-surface-variant block mb-xs">Tags</span>
                    <div className="flex flex-wrap gap-xs">
                      {assignment.tags.map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center px-sm py-xs bg-secondary-container text-on-secondary-container rounded-md font-label-sm text-[12px]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Execution Limits Card */}
            {assignment.codingConfig && (
              <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-sm">
                <h3 className="font-student-card-title text-student-card-title text-on-surface mb-md flex items-center gap-sm">
                  <Icon name="speed" className="text-primary" />
                  Execution Limits
                </h3>
                
                <div className="grid grid-cols-2 gap-sm">
                  <div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant/50">
                    <span className="block text-xs text-on-surface-variant mb-1">Time Limit</span>
                    <span className="block font-mono text-sm text-on-surface">{assignment.codingConfig.timeLimit || 1.0}s</span>
                  </div>
                  <div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant/50">
                    <span className="block text-xs text-on-surface-variant mb-1">Memory Limit</span>
                    <span className="block font-mono text-sm text-on-surface">{assignment.codingConfig.memoryLimit || 256} MB</span>
                  </div>
                  <div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant/50">
                    <span className="block text-xs text-on-surface-variant mb-1">Output Limit</span>
                    <span className="block font-mono text-sm text-on-surface">{assignment.codingConfig.outputLimit || 10} MB</span>
                  </div>
                  <div className="bg-surface-container-low p-sm rounded-lg border border-outline-variant/50">
                    <span className="block text-xs text-on-surface-variant mb-1">Hidden Tests</span>
                    <span className="block font-mono text-sm text-on-surface">{(assignment.codingConfig.testCases?.filter(t => t.isHidden).length || 0) + (assignment.codingConfig.hiddenTestCount || 0)} files</span>
                  </div>
                </div>
              </section>
            )}

            {/* Advanced Config Card */}
            {assignment.codingConfig && (
              <section className="bg-surface-container-lowest rounded-xl border border-outline-variant p-lg shadow-sm">
                <h3 className="font-student-card-title text-student-card-title text-on-surface mb-md flex items-center gap-sm">
                  <Icon name="settings_applications" className="text-primary" />
                  Advanced Config
                </h3>
                
                <div className="space-y-sm">
                  <div>
                    <span className="block text-xs text-on-surface-variant">Checker Type</span>
                    <p className="text-sm font-medium text-on-surface capitalize">{assignment.codingConfig.checkerType || 'standard'}</p>
                  </div>
                  <div className="pt-sm border-t border-outline-variant/30">
                    <span className="block text-xs text-on-surface-variant mb-xs">Allowed Languages</span>
                    <div className="flex flex-wrap gap-xs">
                      {assignment.codingConfig.allowedLanguages?.map(lang => (
                        <span key={lang} className="text-xs px-2 py-1 bg-surface-container-high rounded text-on-surface-variant font-mono">
                          {lang}
                        </span>
                      ))}
                      {(!assignment.codingConfig.allowedLanguages || assignment.codingConfig.allowedLanguages.length === 0) && (
                        <span className="text-sm text-on-surface-variant italic">All supported</span>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
