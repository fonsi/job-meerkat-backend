export enum SocialPlatform {
    Threads = 'threads',
    Bluesky = 'bluesky',
    X = 'x',
}

export const ALL_SOCIAL_PLATFORMS: SocialPlatform[] = [
    SocialPlatform.Threads,
    SocialPlatform.Bluesky,
    SocialPlatform.X,
];

export const SOCIAL_PLATFORMS_WITHOUT_X: SocialPlatform[] = [
    SocialPlatform.Threads,
    SocialPlatform.Bluesky,
];
