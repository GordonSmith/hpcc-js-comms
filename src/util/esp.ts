export function espTime2Seconds(duration) {
    if (!duration) {
        return 0;
    } else if (!isNaN(duration)) {
        return parseFloat(duration);
    }
    //  GH:  <n>ns or <m>ms or <s>s or [<d> days ][<h>:][<m>:]<s>[.<ms>]
    const nsIndex = duration.indexOf("ns");
    if (nsIndex !== -1) {
        return parseFloat(duration.substr(0, nsIndex)) / 1000000000;
    }
    const msIndex = duration.indexOf("ms");
    if (msIndex !== -1) {
        return parseFloat(duration.substr(0, msIndex)) / 1000;
    }
    const sIndex = duration.indexOf("s");
    if (sIndex !== -1 && duration.indexOf("days") === -1) {
        return parseFloat(duration.substr(0, sIndex));
    }

    const dayTimeParts = duration.split(" days ");
    const days = parseFloat(dayTimeParts.length > 1 ? dayTimeParts[0] : 0.0);
    const time = dayTimeParts.length > 1 ? dayTimeParts[1] : dayTimeParts[0];
    let secs = 0.0;
    const timeParts = time.split(":").reverse();
    for (let j = 0; j < timeParts.length; ++j) {
        secs += parseFloat(timeParts[j]) * Math.pow(60, j);
    }
    return (days * 24 * 60 * 60) + secs;
}
