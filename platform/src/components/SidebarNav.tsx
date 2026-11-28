'use client';

import { Link2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ExternalTool {
  id: string;
  title: string;
  titleEn: string | null;
  description: string;
  descriptionEn: string | null;
  url: string;
  iconUrl?: string;
  category: string;
  categoryEn: string | null;
  status: number;
  sortOrder: number;
}

interface SidebarNavProps {
  categories: string[];
  tools: ExternalTool[];
  isEnglish: boolean;
}

export function SidebarNav({ categories, tools, isEnglish }: SidebarNavProps) {
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
  }, []);

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    
    if (!category) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    const escapedCategory = encodeURIComponent(category);
    const selector = `[data-category="${escapedCategory}"]`;
    
    const element = document.querySelector(selector);
    if (element) {
      const offset = 80;
      const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementTop - offset,
        behavior: 'smooth'
      });
    } else {
    }
  };

  return (
    <div className="apple-glass-card rounded-xl p-4 sticky top-24">
      <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Link2 className="w-4 h-4" />
        {isEnglish ? 'Categories' : '链接导航'}
      </h2>
      <nav className="space-y-1">
        <button
          onClick={() => handleCategoryClick('')}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors font-medium ${
            activeCategory === '' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          {isEnglish ? 'All' : '全部'} ({tools.length})
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeCategory === category ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {category}
          </button>
        ))}
      </nav>
    </div>
  );
}