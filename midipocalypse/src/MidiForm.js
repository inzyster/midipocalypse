import React, { useState } from 'react';
import * as Midi from 'jsmidgen';

const attachmentName = "test.txt";

export default function MidiForm(props) {
    const [text, setText] = useState('');
    const [dataUrl, setDataUrl] = useState('');

    const handleSubmit = (evt) => {
        evt.preventDefault();
        if (dataUrl) {
            window.URL.revokeObjectURL(dataUrl);
        }
        setDataUrl('');
        if (text) {
            const data = new Blob([text], {
                type: 'text/plain'
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