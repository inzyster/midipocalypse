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

export default function MidiForm(props) {
    const [text, setText] = useState('');
    const [dataUrl, setDataUrl] = useState('');
    const attachmentName = `${uuid().replace('-', '').substring(0, 8)}.mid`;

    const handleSubmit = (evt) => {
        evt.preventDefault();
        if (dataUrl) {
            window.URL.revokeObjectURL(dataUrl);
        }
        setDataUrl('');
        if (text) {
            const file = new Midi.File();
            const track = new Midi.Track();
            file.addTrack(track);
            track.setTempo(120);
            track.setInstrument(0, 0x0);

            const bin = unicodeStringToTypedArray(text).map(sainitizeValue);

            for (let n = 0; n < bin.length; n++) {
                track.addNote(0, bin[n], 32);
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
            </form>
        </>
    );
}