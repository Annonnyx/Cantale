"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isProd = exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
function required(name, fallback) {
    const v = process.env[name] ?? fallback;
    if (v === undefined) {
        throw new Error(`Variable d'environnement manquante : ${name}`);
    }
    return v;
}
function num(name, def) {
    const v = process.env[name];
    if (!v)
        return def;
    const n = parseInt(v, 10);
    if (isNaN(n))
        throw new Error(`Variable ${name} doit être un entier`);
    return n;
}
function bool(name, def) {
    const v = process.env[name];
    if (!v)
        return def;
    return /^(1|true|yes|on)$/i.test(v);
}
exports.config = {
    port: num("PORT", 3000),
    env: process.env.NODE_ENV ?? "development",
    db: {
        type: required("DB_TYPE", "sqlite"),
        sqlitePath: process.env.SQLITE_PATH ?? path_1.default.resolve(process.cwd(), "../../target/cantale.db"),
        mysql: {
            host: process.env.DB_HOST || process.env.MYSQL_HOST || "localhost",
            port: num("DB_PORT", process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT, 10) : 3306),
            database: process.env.DB_NAME || process.env.MYSQL_DATABASE || "cantale",
            user: process.env.DB_USER || process.env.MYSQL_USER || "cantale",
            password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || "",
        },
    },
    session: {
        secret: required("SESSION_SECRET", "dev_only_change_me_in_production_min_32_chars"),
        cookieDomain: process.env.COOKIE_DOMAIN ?? undefined,
        ttlSeconds: num("SESSION_TTL", 7 * 24 * 3600),
    },
    cors: {
        origins: (process.env.CORS_ORIGINS ?? "http://localhost:5500,http://localhost:8080")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
    },
    linkCode: {
        ttlSeconds: num("LINK_CODE_TTL", 300),
    },
    shop: {
        enabled: bool("SHOP_ENABLED", false),
    },
};
exports.isProd = exports.config.env === "production";
//# sourceMappingURL=config.js.map