import { PackageOpen } from 'lucide-react';
import ToolCard from './ToolCard';

interface Tool {
  id: string;
  name: string;
  nameEn: string | null;
  desc: string;
  descEn: string | null;
  logoUrl: string;
  category: string;
  categoryEn: string | null;
  url: string | null;
  displayName?: string;
  displayDesc?: string;
}

interface CategoryGroup {
  categoryName: string;
  displayCategoryName: string;
  tools: Tool[];
}

interface CategoryContentProps {
  categories: CategoryGroup[];
  isEnglish: boolean;
  t: (key: string) => string;
}

function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <PackageOpen className="w-12 h-12 text-primary/60" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white border-2 border-gray-100 shadow-sm flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {t('noTools')}
      </h3>
      <p className="text-gray-500 text-center max-w-md">
        {t('noToolsDesc')}
      </p>
    </div>
  );
}

export default function CategoryContent({ categories, isEnglish, t }: CategoryContentProps) {
  return (
    <div className="flex-1 min-w-0">
      {categories.length === 0 ? (
        <EmptyState t={t} />
      ) : (
        <div className="space-y-9 md:space-y-10">
          {categories.map((category) => (
            <div
              key={category.categoryName}
              data-category={encodeURIComponent(category.categoryName)}
              className="scroll-mt-24"
            >
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {category.displayCategoryName}
                </h2>
                <span className="text-sm text-gray-400">
                  ({category.tools.length})
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {category.tools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} isEnglish={isEnglish} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}