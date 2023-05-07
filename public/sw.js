/*
 * @Author: git config user.name && git config user.email
 * @Date: 2022-11-13 15:24:32
 * @LastEditors: git config user.name && git config user.email
 * @LastEditTime: 2022-11-19 19:39:34
 * @FilePath: \phi-chart-render\public\sw.js
 * @Description: 
 * 
 * Copyright (c) 2022 by ${git_name_email}, All Rights Reserved. 
 */
const ASSETS_VERSION = '0.3';
const GITHUB_CURRENT_GIT_HASH = `{{CURRENT_HASH}}`;

self.addEventListener('install', (e) =>
{
    self.skipWaiting();
    console.log('[Service Worker] Hello world!');
});

self.addEventListener('activate', (e) =>
{
    e.waitUntil(
        Promise.all([
            self.clients.claim(),

            caches.keys()
                .then((cacheList) =>
                {
                    return Promise.all(
                        cacheList.map((cacheName) =>
                        {
                            if (cacheName !== ASSETS_VERSION && cacheName !== GITHUB_CURRENT_GIT_HASH)
                            {
                                return caches.delete(cacheName);
                            }
                        }
                    ));
                }
            )
        ])
    );
});

self.addEventListener('fetch', (e) =>
{
    if (e.request.method != 'GET') return;
    if (!(/phi-chart-render\/?$|index\.html|\.css|script\-[v0-9a-z\-\.]+\.js|assets|fonts/.test(e.request.url))) return;

    let req = e.request;
    let resVersion = (/phi-chart-render\/?$|index\.html|\.css|script\-[v0-9a-z\-\.]+\.js/.test(e.request.url)) ? GITHUB_CURRENT_GIT_HASH : ASSETS_VERSION;

    e.respondWith(
        caches.match(e.request)
            .then((res) =>
            {
                if (res && !(/phi-chart-render\/?$|index\.html|\.css|script\-[v0-9a-z\-\.]+\.js/.test(e.request.url)))
                {
                    console.log('[Service Worker] Fetching cache: ' + req.url);
                    return res;
                }

                const httpReq = e.request.clone();
                return (
                    fetch(httpReq)
                        .then((httpRes) =>
                        {
                            console.log('[Service Worker] Getting resource: ' + req.url);
                            
                            if (!httpRes || httpRes.status !== 200)
                            {
                                return (res ? res : httpRes);
                            }

                            var resClone = httpRes.clone();
                            caches.open(resVersion).then((cache) =>
                            {
                                cache.put(req, resClone);
                            });

                            return httpRes;
                        })
                        .catch((e) =>
                        {
                            console.error(e);
                            return res;
                        }
                    )
                );
            }
        )
    );
});