'use client';

import { Wrench } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface CategoryItem {
  categoryName: string;
  displayCategoryName: string;
  toolCount: number;
}

interface CategorySidebarProps {
  categories: CategoryItem[];
  totalCount: number;
  isEnglish: boolean;
}

export default function CategorySidebar({ categories, totalCount, isEnglish }: CategorySidebarProps) {
  const [activeCategory, setActiveCategory] = useState<string>('');
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        const sections = document.querySelectorAll('[data-category]');
        let currentCategory = '';
        
        sections.forEach((section) => {
          const rect = section.getBoundingClientRect();
          if (rect.top <= 100 && rect.bottom >= 100) {
            currentCategory = section.getAttribute('data-category') || '';
          }
        });
        
        setActiveCategory(currentCategory);
        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleCategoryClick = (categoryName: string) => {
    setActiveCategory(categoryName);
    
    if (!categoryName) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    const escapedCategory = encodeURIComponent(categoryName);
    const selector = `[data-category="${escapedCategory}"]`;
    
    const element = document.querySelector(selector);
    if (element) {
      const offset = 80;
      const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementTop - offset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="apple-glass-card rounded-xl p-4 sticky top-24">
      <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Wrench className="w-4 h-4" />
        {isEnglish ? 'Categories' : '工具分类'}
      </h2>
      <nav className="space-y-1">
        <button
          onClick={() => handleCategoryClick('')}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors font-medium ${
            activeCategory === '' ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          {isEnglish ? 'All' : '全部'} ({totalCount})
        </button>
        {categories.map((category) => (
          <button
            key={category.categoryName}
            onClick={() => handleCategoryClick(category.categoryName)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeCategory === category.categoryName ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {category.displayCategoryName}
          </button>
        ))}
      </nav>
    </div>
  );
}