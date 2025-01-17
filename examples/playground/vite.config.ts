// (C) 2019-2024 GoodData Corporation
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";
import path from "path";

const packagesWithoutStyles = [
    "@gooddata/sdk-model",
    "@gooddata/sdk-backend-base",
    "@gooddata/sdk-backend-spi",
    "@gooddata/sdk-backend-tiger",
    "@gooddata/sdk-ui-loaders",
    "@gooddata/sdk-ui-theme-provider",
    "@gooddata/sdk-embedding",
];

const packagesWithStyles = [
    "@gooddata/sdk-ui-dashboard",
    "@gooddata/sdk-ui-ext",
    "@gooddata/sdk-ui",
    "@gooddata/sdk-ui-charts",
    "@gooddata/sdk-ui-filters",
    "@gooddata/sdk-ui-geo",
    "@gooddata/sdk-ui-pivot",
    "@gooddata/sdk-ui-semantic-search",
    "@gooddata/sdk-ui-kit",
    "@gooddata/sdk-ui-vis-commons",
];

function makePackageSourceAlias(packageName: string) {
    return {
        find: packageName,
        replacement: path.resolve(__dirname, `./../../libs/${packageName.split("/")[1]}/src`),
    };
}

function makePackageStylesAlias(packageName: string) {
    return {
        find: `${packageName}/styles`,
        replacement: path.resolve(__dirname, `./../../libs/${packageName.split("/")[1]}/styles`),
    };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const backendUrl = env.VITE_BACKEND_URL ?? "https://staging.dev-latest.stg11.panther.intgdc.com";

    return {
        plugins: [react(), mkcert()],
        optimizeDeps: {
            exclude: [...packagesWithoutStyles, ...packagesWithStyles],
        },
        resolve: {
            alias: [
                // This is required to make fonts work
                {
                    find: "~@gooddata/sdk-ui-kit/styles",
                    replacement: path.resolve(__dirname, "./../../libs/sdk-ui-kit/styles"),
                },
                {
                    find: "~@gooddata/sdk-ui-dashboard/esm/assets",
                    replacement: path.resolve(__dirname, "./../../libs/sdk-ui-dashboard/src/assets"),
                },
                ...packagesWithoutStyles.map(makePackageSourceAlias),
                ...packagesWithStyles.flatMap((pkg) => [
                    makePackageStylesAlias(pkg),
                    makePackageSourceAlias(pkg),
                ]),
            ],
        },
        server: {
            port: 8999,
            fs: {
                strict: false,
            },
            proxy: {
                "/api": {
                    changeOrigin: true,
                    cookieDomainRewrite: "localhost",
                    secure: false,
                    target: backendUrl,
                    headers: {
                        host: backendUrl,
                        // origin: null,
                    },
                    configure: (proxy) => {
                        proxy.on("proxyReq", (proxyReq) => {
                            // changeOrigin: true does not work well for POST requests, so remove origin like this to be safe
                            proxyReq.removeHeader("origin");
                            proxyReq.setHeader("accept-encoding", "identity");
                        });
                    },
                },
            },
        },
    };
});
