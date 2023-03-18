import oggmentedAudioContext from 'oggmented';
import AudioTimer from './timer';
import { number as verifyNum, bool as verifyBool } from '@/verify';



const AudioCtx = window.AudioContext || window.webkitAudioContext;
const GlobalAudioCtx = (new Audio().canPlayType('audio/ogg') == '') ? new oggmentedAudioContext() : new AudioCtx();



class WAudio
{
    constructor(src, loop = false, noTimer = false, volume = 1, speed = 1, onend = undefined)
    {
        this.source = src;
        this.loop = loop;
        this.onend = onend;
        this._noTimer = verifyBool(noTimer, false);
        this._volume = verifyNum(volume, 1);
        this._speed = verifyNum(speed, 1);
        this._gain = GlobalAudioCtx.createGain();
        this._timer = new AudioTimer(this._speed);

        this._gain.gain.value = this._volume;
        this._gain.connect(GlobalAudioCtx.destination);
    }

    static from(src, loop, noTimer = false)
    {
        return new Promise(async (res, rej) =>
        {
            try {
                let track = await GlobalAudioCtx.decodeAudioData(src);
                if (!track) rej('Unsupported source type');
                let audio = new WAudio(track, loop, noTimer);
                res(audio);
            } catch (e) {
                rej(e);
            }
            
            res();
            /*
                )
                .then(track =>
                {
                    // if (!track) rej('Unsupported source type');
                    let audio = new WAudio(track, loop, noTimer);
                    res(audio);
                })
                .catch(e => rej(e));
                */
                /*
            let track;
            if (src instanceof HTMLAudioElement) track = GlobalAudioCtx.createMediaElementSource(src);
            else if (src instanceof ArrayBuffer) track = await ;

            */
        });
    }

    play()
    {
        this._buffer = GlobalAudioCtx.createBufferSource();
        this._buffer.buffer = this.source;
        this._buffer.loop = this.loop;
        this._buffer.connect(this._gain);

        this._timer.speed = this._speed;
        this._gain.gain.value = this._volume;
        this._buffer.playbackRate.value = this._speed;

        this._buffer.start(0, (this._noTimer || this._timer.status === 3 ? 0 : this._timer.time));
        if (!this._noTimer) this._timer.start();

        this._buffer.onended = () =>
        {
            if (!this._noTimer) this._timer.stop();
            if (this.onend instanceof Function) this.onend();
        };
    }

    pause()
    {
        if (!this._noTimer) this._timer.pause();
        if (!this._buffer) return;

        this._buffer.onended = undefined;
        this._buffer.stop();
    }

    stop()
    {
        this.pause();
        if (!this._noTimer) this._timer.stop();
    }

    seek(duration)
    {
        if (this._noTimer) return;

        let playedBeforeSeek = false;

        if (this._timer.status === 3) return;
        if (this._timer.status === 1)
        {
            playedBeforeSeek = true;
            this.pause();
        }

        this._timer.seek(duration);
        if (playedBeforeSeek) this.play();
    }

    get isPaused()
    {
        return this._timer.status === 2;
    }

    get isStoped()
    {
        return this._timer.status === 3;
    }

    get duration()
    {
        return this.source.duration;
    }

    get currentTime()
    {
        return this._timer.time;
    }

    get progress()
    {
        return this._timer.time / this.source.duration;
    }

    get volume()
    {
        return this._volume;
    }

    set volume(value)
    {
        this._volume = verifyNum(value, 1);
        if (this._buffer) this._gain.gain.value = this._volume;
    }

    get speed()
    {
        return this._speed;
    }

    set speed(value)
    {
        this._speed = verifyNum(value, 1);
        this._timer.speed = this._speed;
        if (this._buffer) this._buffer.playbackRate.value = this._speed;
    }
}



window.addEventListener('load', () =>
{
    window.addEventListener('click', ResumeGlobalAudioContext);
    window.addEventListener('touchend', ResumeGlobalAudioContext);
    window.addEventListener('mousemove', ResumeGlobalAudioContext);
    window.addEventListener('scroll', ResumeGlobalAudioContext);
});

async function ResumeGlobalAudioContext()
{
    if (GlobalAudioCtx.state === 'suspended') await GlobalAudioCtx.resume();

    window.removeEventListener('click', ResumeGlobalAudioContext);
    window.removeEventListener('touchend', ResumeGlobalAudioContext);
    window.removeEventListener('mousemove', ResumeGlobalAudioContext);
    window.removeEventListener('scroll', ResumeGlobalAudioContext);
}



export default WAudio;