import React, { useState } from 'react';
import { v4 as uuid } from 'uuid';
import * as Midi from 'jsmidgen';

const mimeType = "audio/midi";

function unicodeStringToTypedArray(s) {
    var escstr = encodeURIComponent(s);
    var binstr = escstr.replace(/%([0-9A-F]{2})/g, function (match, p1) {
        return String.fromCharCode('0x' + p1);
    });
    var ua = new Uint8Array(binstr.length);
    Array.prototype.forEach.call(binstr, function (ch, i) {
        ua[i] = ch.charCodeAt(0);
    });
    return ua;
}

const sainitizeValue = (x) => {
    if (x < 32) {
        return x + 32;
    } else if (x >= 127) {
        return sainitizeValue(x - 127);
    }
    return x;
};

class Note {
    constructor(pitch, duration, isRest) {
        this.pitch = pitch;
        this.duration = duration;
        this.isRest = isRest;
    }
}

const decToBin = (x) => {
    let result = (x >>> 0).toString(2);
    if (result.length < 7) {
        result = '0'.repeat(7 - result.length) + result;
    }
    return result;
};

const sixtyForth = 512 / 64;

const processRawData = (data) => {
    let binary = '';
    const targetLength = Math.ceil(data.length * 7 / 12) * 12;
    for (let i = 0; i < data.length; i++) {
        binary += decToBin(data[i]);
    }
    const padding = targetLength - binary.length;
    if (padding > 0) {
        binary += '0'.repeat(padding);
    }
    if ((binary.length % 12) !== 0) {
        throw "wrong binary length";
    }
    const result = [];
    for (let n = 0; n < binary.length; n += 12) {
        //console.log(`binary = ${binary.substring(n, n + 12)}`);
        const durationData = parseInt(binary.substring(n, n + 5), 2);
        //console.log("durationData = ", durationData);
        const pitchData = sainitizeValue(parseInt(binary.substring(n + 5, n + 12), 2)) - 10;
        const isRest = (durationData & 0b00001) > 0;
        const isDot = (durationData & 0b00010) > 0;
        const duration = (sixtyForth << (durationData >>> 2)) * (isDot ? 1 : 1.5);
        //console.log(`isRest = ${isRest}, isDot = ${isDot}, duration = ${duration}`);
        result.push(new Note(pitchData, duration, isRest));
    }
    return result;
};

export default function MidiForm(props) {
    const [text, setText] = useState('');
    const [dataUrl, setDataUrl] = useState('');
    const [error, setError] = useState('');
    const [diagData, setDiagData] = useState('');
    const attachmentName = `${uuid().replace('-', '').substring(0, 8)}.mid`;

    const handleSubmit = (evt) => {
        evt.preventDefault();
        if (dataUrl) {
            window.URL.revokeObjectURL(dataUrl);
        }
        setError('');
        setDataUrl('');
        setDiagData('');
        if (text.length > 0) {
            const file = new Midi.File();
            const track = new Midi.Track();
            file.addTrack(track);
            track.setTempo(120);
            track.setInstrument(0, 0x0);

            const bin = unicodeStringToTypedArray(text).map(sainitizeValue);
            let noteData = [];
            try {
                noteData = processRawData(bin);
            }
            catch (err) {
                setError(err);
                return;
            }

            let lastRestDuration = 0;
            let diag = '';
            for (let n = 0; n < noteData.length; n++) {
                const note = noteData[n];
                diag += `r: ${note.isRest}, d: ${note.duration}, p: ${note.pitch}\n`;
                if (note.isRest) {
                    lastRestDuration += note.duration;
                } else {
                    track.addNote(0, note.pitch, note.duration, lastRestDuration);
                    lastRestDuration = 0;
                }
            }

            const rawDataStr = file.toBytes();
            const rawData = new Uint8Array(rawDataStr.length);
            for (let i = 0, j = rawDataStr.length; i < j; i++) {
                rawData[i] = rawDataStr.charCodeAt(i);
            }

            const data = new Blob([rawData], {
                type: mimeType
            });
            const url = window.URL.createObjectURL(data);
            setDataUrl(url);
            setDiagData(diag);
        }
    };

    return (
        <>
            <form onSubmit={handleSubmit}>
                <textarea value={text} onChange={(evt) => setText(evt.target.value)} rows={15} cols={40}>
                </textarea>
                <button type="submit">Agoń</button>
                {dataUrl &&
                    <a className="App-link" href={dataUrl} download={attachmentName}>Ściągń</a>}
                {error &&
                    <h4 className="error">{error}</h4>}
                {diagData &&
                    <pre className="diag">{diagData}</pre>}
            </form>
        </>
    );
}