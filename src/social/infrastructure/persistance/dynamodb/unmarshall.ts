import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { UnmarshallError } from 'shared/infrastructure/persistance/dynamodb/error/unmarshallError';
import {
    ScheduledSocialPost,
    ScheduledSocialPostId,
} from 'social/domain/scheduledSocialPost';
import {
    ALL_SOCIAL_PLATFORMS,
    SocialPlatform,
} from 'social/domain/socialPlatform';
import { SocialPostType } from 'social/domain/socialPostType';

const isSocialPlatform = (value: string): value is SocialPlatform =>
    Object.values(SocialPlatform).includes(value as SocialPlatform);

const isSocialPostType = (value: string): value is SocialPostType =>
    Object.values(SocialPostType).includes(value as SocialPostType);

const parseLegacyJobPromo = (
    id: ScheduledSocialPostId,
    date: number,
): ScheduledSocialPost => {
    const [jobPostId, companyId] = id.split('_');

    return {
        id,
        date,
        type: SocialPostType.JobPromo,
        platforms: [...ALL_SOCIAL_PLATFORMS],
        jobPostId: jobPostId as ScheduledSocialPost['jobPostId'],
        companyId: companyId as ScheduledSocialPost['companyId'],
    };
};

export const unmarshall = (
    item: Record<string, AttributeValue>,
): ScheduledSocialPost => {
    try {
        const id = item['id']['S'] as ScheduledSocialPostId;
        const date = parseInt(item['date']['N']);
        const rawType = item['type']?.['S'];

        if (!rawType || !isSocialPostType(rawType)) {
            return parseLegacyJobPromo(id, date);
        }

        const platforms = item['platforms']?.['L']
            ?.map((entry) => entry['S'] ?? '')
            .filter(isSocialPlatform) ?? [...ALL_SOCIAL_PLATFORMS];

        return {
            id,
            date,
            type: rawType,
            platforms:
                platforms.length > 0 ? platforms : [...ALL_SOCIAL_PLATFORMS],
            ...(item['jobPostId']?.['S']
                ? {
                      jobPostId: item['jobPostId'][
                          'S'
                      ] as ScheduledSocialPost['jobPostId'],
                  }
                : {}),
            ...(item['companyId']?.['S']
                ? {
                      companyId: item['companyId'][
                          'S'
                      ] as ScheduledSocialPost['companyId'],
                  }
                : {}),
        };
    } catch (e) {
        throw new UnmarshallError(e.message, 'ScheduledSocialPost', item);
    }
};
