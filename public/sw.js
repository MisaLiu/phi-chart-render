/*
 * @Author: git config user.name && git config user.email
 * @Date: 2022-11-13 15:24:32
 * @LastEditors: git config user.name && git config user.email
 * @LastEditTime: 2022-11-13 18:07:16
 * @FilePath: \phi-chart-render\public\sw.js
 * @Description: 
 * 
 * Copyright (c) 2022 by ${git_name_email}, All Rights Reserved. 
 */
const ASSETS_VERSION = '0.1';

self.addEventListener('install', () =>
{
    console.log('[Service Worker] Hello world!');
});

self.addEventListener('fetch', (e) =>
{
    if (e.request.method != 'GET') return;

    const req = e.request;
    e.respondWith((async () =>
    {
        const cache = await caches.open(ASSETS_VERSION);
        const cacheRes = await cache.match(req);

        if (cacheRes)
        {
            console.log('[Service Worker] Fetching cache: ' + req.url);
            e.waitUntil(cache.add(req));
            return cacheRes;
        }
        else
        {
            const urlReg = /index\.html|.+\.css|script\.js|assets|fonts/;
            let res;

            try {
                res = await fetch(req);
            }
            catch (e)
            {
                console.warn(e);
                res = null;
            }

            console.log('[Service Worker] Getting resource: ' + req.url);
            if (res && res.ok && urlReg.test(req.url)) e.waitUntil(cache.put(req, res.clone()));
            return res;
        }
    })());
});