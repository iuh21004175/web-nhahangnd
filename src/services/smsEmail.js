const {google} = require('googleapis')

async function sendEmail(auth, to, subject, text) {
    const gmail = google.gmail({version: 'v1', auth});
    
    // Tạo email với encoding UTF-8
    const email = [
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: base64',
        `To: ${to}`,
        `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
        '',
        text
    ].join('\n');

    const raw = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw,
        },
    });
    return res.data;
}

module.exports = sendEmail;