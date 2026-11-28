'use client';

interface MobileCategorySelectorProps {
  categories: string[];
  isEnglish: boolean;
}

export default function MobileCategorySelector({ categories, isEnglish }: MobileCategorySelectorProps) {
  const handleCategoryClick = (category: string) => {
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
    }
  };

  return (
    <div className="apple-glass rounded-2xl p-3.5">
      <div className="flex flex-nowrap items-center gap-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleCategoryClick('')}
          className="shrink-0 whitespace-nowrap px-3.5 py-1.5 bg-zinc-900 text-white text-[13px] font-medium rounded-full hover:bg-zinc-800 transition-colors"
        >
          {isEnglish ? 'All' : '全部'}
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryClick(category)}
            className="shrink-0 whitespace-nowrap px-3.5 py-1.5 bg-zinc-100/90 text-zinc-700 text-[13px] font-medium rounded-full hover:bg-zinc-200/80 transition-colors"
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
}
