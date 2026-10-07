import { Category, categoryTree } from 'jobPost/domain/jobPost';
import { BlogIndex } from './blogPost';

export const blogCategorySlug = (category: Category): string => {
    for (const group of categoryTree) {
        const found = group.categories.find((item) => item.name === category);
        if (found) return found.slug;
    }

    return 'other';
};

export const blogRotationCategories = (): Category[] =>
    categoryTree.flatMap((group) =>
        group.categories
            .filter((item) => item.name !== Category.Other)
            .map((item) => item.name),
    );

export const nextCategoriesToTry = (index: BlogIndex): Category[] => {
    const rotation = blogRotationCategories();
    if (rotation.length === 0) return [];
    const last = index.lastCategory;
    const start = last ? rotation.indexOf(last) + 1 : 0;
    const offset = start <= 0 ? 0 : start % rotation.length;

    return [...rotation.slice(offset), ...rotation.slice(0, offset)];
};
