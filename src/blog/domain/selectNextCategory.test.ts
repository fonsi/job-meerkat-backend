import { Category } from 'jobPost/domain/jobPost';
import {
    blogCategorySlug,
    blogRotationCategories,
    nextCategoriesToTry,
} from './selectNextCategory';

describe('blogCategorySlug', () => {
    it('maps a category to its public slug', () => {
        expect(blogCategorySlug(Category.Backend)).toBe('backend');
        expect(blogCategorySlug(Category.MachineLearning)).toBe(
            'machine-learning',
        );
    });
});

describe('nextCategoriesToTry', () => {
    it('starts after the last published category and wraps', () => {
        const rotation = blogRotationCategories();
        const last = rotation[0];
        const next = nextCategoriesToTry({ posts: [], lastCategory: last });

        expect(next[0]).toBe(rotation[1]);
        expect(next[next.length - 1]).toBe(last);
        expect(next).not.toContain(Category.Other);
    });

    it('starts at the first category when none have run', () => {
        const rotation = blogRotationCategories();
        expect(nextCategoriesToTry({ posts: [] })[0]).toBe(rotation[0]);
    });
});
