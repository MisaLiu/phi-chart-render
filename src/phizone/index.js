import { text as verifyText } from '@/verify';
import { loadChartFiles } from '../index';

const doms = {
    linkInput: document.querySelector('input#phizone-chart-link'),
    chartDownload: document.querySelector('button#phizone-download-chart'),
    downloadProgress: document.querySelector('div#phizone-download-progress')
};

const PhiZoneLinkReg = /^https:\/\/[\d\w]+\.phi\.zone\/charts\/(\d+)/;

doms.linkInput.addEventListener('keydown', (e) =>
{
    if (e.key === 'Enter') doms.chartDownload.dispatchEvent(new Event('click'));
});

doms.chartDownload.addEventListener('click', () =>
{
    let downloadId = doms.linkInput.value;

    if (!downloadId || downloadId == '')
    {
        alert('Please enter a chart link/ID!');
        doms.linkInput.focus();
        return;
    }

    if (PhiZoneLinkReg.test(downloadId))
    {
        downloadId = parseInt(PhiZoneLinkReg.exec(downloadId)[1]);
    }
    else downloadId = parseInt(downloadId);

    if (isNaN(downloadId) || downloadId <= 0)
    {
        alert('Please enter a valid chart link/ID!');
        doms.linkInput.focus();
        return;
    }

    doms.downloadProgress.innerText = 'Getting chart info...';

    fetch('https://api.phi.zone/charts/' + downloadId + '/?query_song=1&query_owner=1')
        .then(res => res.json())
        .then(res =>
        {
            let resUrls = {};
            let infos = {};

            if (res.id !== downloadId)
            {
                doms.downloadProgress.innerText = 'Cannot get chart info: ' + res.detail;
                return;
            }
            
            if (!verifyText(res.chart, null) || !res.song || !verifyText(res.song.illustration, null) || !verifyText(res.song.song, null))
            {
                doms.downloadProgress.innerText = 'Cannot get chart info: server didn\'t provide any link';
                return;
            }

            resUrls = {
                chart: res.chart,
                song: res.song.song,
                illustration: res.song.illustration
            };

            infos = {
                name      : res.song.name,
                artist    : res.song.composer,
                author    : res.charter.replace(/\[PZUser:\d+:(.+)\]/, '\$1'),
                bgAuthor  : res.song.illustrator,
                difficult : 'Lv.' + res.level + ' ' + Math.floor(res.difficulty)
            };

            downloadFiles(resUrls, infos);
        }
    );
});


async function downloadFiles(urls, infos)
{
    let fileName = {
        chart: urls.chart.split('/'),
        song: urls.song.split('/'),
        bg: urls.illustration.split('/')
    };

    fileName.chart = decodeURIComponent(fileName.chart[fileName.chart.length - 1]);
    fileName.song = decodeURIComponent(fileName.song[fileName.song.length - 1]);
    fileName.bg = decodeURIComponent(fileName.bg[fileName.bg.length - 1]);

    let settingsFile = `Name: ${infos.name}\r\n` +
        `Level: ${infos.difficult}\r\n` +
        `Charter: ${infos.author}\r\n` +
        `Chart: ${fileName.chart}\r\n` +
        `Song: ${fileName.song}\r\n` +
        `Picture: ${fileName.bg}`;

    let chart = await downloadFile(urls.chart, (progress) => { doms.downloadProgress.innerText = 'Downloading chart (' + Math.floor(progress * 100) + '%)'; });
    let song = await downloadFile(urls.song, (progress) => { doms.downloadProgress.innerText = 'Downloading song (' + Math.floor(progress * 100) + '%)'; });
    let bg = await downloadFile(urls.illustration, (progress) => { doms.downloadProgress.innerText = 'Downloading bg (' + Math.floor(progress * 100) + '%)'; });

    doms.downloadProgress.innerText = 'All files are downloaded, head to \'File\' to select chart.';

    loadChartFiles([
        new File([chart], fileName.chart, { type: chart.type, lastModified: Date.now() }),
        new File([song], fileName.song, { type: song.type, lastModified: Date.now() }),
        new File([bg], fileName.bg, { type: bg.type, lastModified: Date.now() }),
        new File([new Blob([settingsFile])], 'Settings.txt', { type: 'text/plain', lastModified: Date.now() })
    ]);

    function downloadFile(url, onProgressChange)
    {
        return new Promise((res, rej) =>
        {
            let xhr = new XMLHttpRequest();

            xhr.responseType = 'blob';

            xhr.onreadystatechange = () =>
            {
                if (xhr.readyState === 4)
                {
                    if (xhr.status === 200)
                    {
                        res(xhr.response);
                    }
                }
            };

            xhr.onprogress = (e) =>
            {
                if (typeof onProgressChange === 'function')
                {
                    onProgressChange(e.loaded / e.total);
                }
            };

            xhr.onerror = (e) => { rej(e) };

            xhr.open('GET', url);
            xhr.send();
        });
    }
}