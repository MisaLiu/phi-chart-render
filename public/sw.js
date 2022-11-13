/*
 * @Author: git config user.name && git config user.email
 * @Date: 2022-11-13 15:24:32
 * @LastEditors: git config user.name && git config user.email
 * @LastEditTime: 2022-11-13 16:00:37
 * @FilePath: \phi-chart-render\public\sw.js
 * @Description: 
 * 
 * Copyright (c) 2022 by ${git_name_email}, All Rights Reserved. 
 */
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
            e.waitUntil(cache.add(req));
            return cacheRes;
        }
        else
        {
            const urlReg = /assets|fonts/;
            const res = await fetch(req);

            if (res.ok && urlReg.test(req.url)) e.waitUntil(cache.put(req, res.clone()));
            return res;
        }
    })());
});