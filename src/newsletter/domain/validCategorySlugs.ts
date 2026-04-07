import { categoryTree } from 'jobPost/domain/jobPost';

export const getValidCategorySlugSet = (): Set<string> => {
    const s = new Set<string>();
    for (const group of categoryTree) {
        for (const c of group.categories) {
            s.add(c.slug);
        }
    }
    return s;
};
