"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./lib/config");
const ShopeeCrawler_1 = require("./lib/crawlers/ShopeeCrawler");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // THÊM CÁC FLAG CẦN THIẾT
        const opt = {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-accelerated-2d-canvas'
            ]
        };
        const crawlers = [
            new ShopeeCrawler_1.ShopeeCrawler(opt, {}, (0, config_1.getCookies)())
        ];
        yield Promise.all(crawlers.map(cr => cr.run()));
    });
}
(() => main())();
