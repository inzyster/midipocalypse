import React, { useState } from 'react';
import { v4 as uuid } from 'uuid';
import * as Midi from 'jsmidgen';

const mimeType = "audio/midi";

export default function MidiForm(props) {
    const [text, setText] = useState('');
    const [dataUrl, setDataUrl] = useState('');
    const attachmentName = `${uuid()}.mid`;

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
            track.addNote(0, 'c4', 128);
            track.addNote(0, 'd4', 128);
            track.addNote(0, 'e4', 128);

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