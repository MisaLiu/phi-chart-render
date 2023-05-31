// Reference: https://github.com/bemusic/bemuse/blob/68e0d5213b56502b3f5812f1d28c8d7075762717/bemuse/src/sampling-master/index.js#L276
export default function unmuteAudio(ctx)
{
    const gain = ctx.createGain();
    const osc = ctx.createOscillator();

    osc.frequency.value = 440;

    osc.start(ctx.currentTime + 0.1);
    osc.stop(ctx.currentTime + 0.1);

    gain.connect(ctx.destination);
    gain.disconnect();

    ctx.resume()
        .catch((e) => {
            console.info('[WAudio] Failed to resume AudioContext', e);
        }
    );
}
