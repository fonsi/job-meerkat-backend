import { createRequire } from 'module';
import { join } from 'path';

const nodeRequire = createRequire(__filename);

type ResvgOptions = {
    font?: { loadSystemFonts: boolean };
    fitTo?: { mode: 'width'; value: number };
};

type ResvgInstance = { render: () => { asPng: () => Uint8Array } };

type ResvgConstructor = new (
    svg: string,
    options?: ResvgOptions,
) => ResvgInstance;

type NativeResvg = new (svg: string, options?: string) => ResvgInstance;

// The .node addon takes options as a JSON string. @resvg/resvg-js does this in index.js.
const wrapNativeResvg = (Native: NativeResvg): ResvgConstructor =>
    class Resvg {
        private readonly inner: ResvgInstance;

        constructor(svg: string, options?: ResvgOptions) {
            this.inner = new Native(
                svg,
                options ? JSON.stringify(options) : undefined,
            );
        }

        render() {
            return this.inner.render();
        }
    };

const loadBinding = (): ResvgConstructor => {
    if (process.platform === 'linux') {
        const native = nodeRequire(
            join(
                process.cwd(),
                'src/jobPost/infrastructure/og/native/resvgjs.linux-x64-gnu.node',
            ),
        ) as { Resvg: NativeResvg };

        return wrapNativeResvg(native.Resvg);
    }

    return (
        nodeRequire(['@resvg', 'resvg-js'].join('/')) as {
            Resvg: ResvgConstructor;
        }
    ).Resvg;
};

export const loadResvg = () => loadBinding();
