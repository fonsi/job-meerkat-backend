import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { loadLocalAwsEnv } from '../src/shared/infrastructure/env/loadLocalAwsEnv';

const src = resolve(__dirname, '../src');

const adminApi = (): Plugin => ({
    name: 'admin-api',
    configureServer(server) {
        loadLocalAwsEnv();
        server.middlewares.use(async (req, res, next) => {
            if (!req.url?.startsWith('/api/')) {
                next();
                return;
            }
            try {
                const { handleAdminApi } = await server.ssrLoadModule(
                    resolve(
                        src,
                        'company/infrastructure/admin/handleAdminApi.ts',
                    ),
                );
                await handleAdminApi(req, res);
            } catch (error) {
                next(error);
            }
        });
    },
});

export default defineConfig({
    root: resolve(__dirname),
    plugins: [react(), adminApi()],
    resolve: {
        alias: {
            company: resolve(src, 'company'),
            jobPost: resolve(src, 'jobPost'),
            report: resolve(src, 'report'),
            social: resolve(src, 'social'),
            shared: resolve(src, 'shared'),
            magicLink: resolve(src, 'magicLink'),
            newsletter: resolve(src, 'newsletter'),
        },
    },
    ssr: {
        external: [
            'sharp',
            'playwright',
            '@aws-sdk/client-s3',
            '@aws-sdk/client-dynamodb',
            '@resvg/resvg-js',
        ],
    },
    optimizeDeps: {
        exclude: ['sharp', 'playwright', '@resvg/resvg-js'],
    },
    server: {
        port: 5173,
        strictPort: true,
    },
});
