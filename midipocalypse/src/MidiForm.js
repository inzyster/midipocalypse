import React, { useState } from 'react';
import { v4 as uuid } from 'uuid';
import * as Midi from 'jsmidgen';

const mimeType = "audio/midi";
const smallestDuration = Midi.DEFAULT_DURATION * 4 / 64;
const expectedInputChunkSize = 8;
const targetChunkSize = 11;
const controlDataChunkSize = 4;

const unicodeStringToTypedArray = (s) => {
    const escstr = encodeURIComponent(s);
    const binstr = escstr.replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1));
    const ua = new Uint8Array(binstr.length);
    let idx = 0;
    for (const ch in binstr) {
        for (let n = 0; n < ch.length; n++) {
            ua[idx] = ch.charCodeAt(n);
            idx++;
        }
    }
    return ua;
};

const sainitizeValue = (x) => {
    if (x < 21) {
        return x + 21;
    } else if (x >= 108) {
        return sainitizeValue(x - 108);
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
    if (result.length < expectedInputChunkSize) {
        result = '0'.repeat(expectedInputChunkSize - result.length) + result;
    }
    return result;
};

const processRawData = (data) => {
    let binary = '';
    const targetLength = Math.ceil(data.length * expectedInputChunkSize / targetChunkSize) * targetChunkSize;
    for (let i = 0; i < data.length; i++) {
        binary += decToBin(data[i]);
    }
    const padding = targetLength - binary.length;
    if (padding > 0) {
        binary += '0'.repeat(padding);
    }
    if ((binary.length % targetChunkSize) !== 0) {
        throw "wrong binary length";
    }
    const result = [];
    for (let n = 0; n < binary.length; n += targetChunkSize) {
        const chunk = binary.substring(n, n + targetChunkSize);
        const durationData = parseInt(chunk.substring(0, controlDataChunkSize), 2);
        const pitchData = sainitizeValue(parseInt(chunk.substring(controlDataChunkSize, targetChunkSize), 2));
        const isRest = [...decToBin([...chunk].filter(c => c === '1').length)].filter(c => c === '1').length === 1;
        const isDot = (durationData & 1) > 0;
        const duration = (smallestDuration << (durationData >>> 1)) * (isDot ? 1 : 1.5);
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

            const bin = unicodeStringToTypedArray(text);
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
    );
}